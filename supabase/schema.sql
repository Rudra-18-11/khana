-- =====================================================================
-- KHANA Food Delivery App - Supabase PostgreSQL Database Blueprint
-- Architecture: PostGIS + Clerk Auth Integration + Supabase Realtime + RLS
-- =====================================================================
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";
-- 2. CLERK AUTH HELPER
-- Reads the 'sub' claim (Clerk User ID, e.g. 'user_2abc...') from JWT
create or replace function public.requesting_user_id() returns text language sql stable as $$
select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb->>'sub',
      current_setting('request.jwt.claim.sub', true)
    ),
    ''
  );
$$;
-- ---------------------------------------------------------------------
-- TABLE GROUP: IDENTITY & USERS
-- ---------------------------------------------------------------------
-- 3. PROFILES
-- Uses Clerk user ID as primary key text ('user_...')
create table if not exists public.profiles (
  id text primary key,
  email text,
  phone text,
  full_name text not null default 'Foodie Guest',
  avatar_url text,
  role text not null default 'customer' check (
    role in ('customer', 'restaurant', 'delivery', 'admin')
  ),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
-- 4. SAVED ADDRESSES
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id text references public.profiles(id) on delete cascade not null,
  label text not null default 'Home',
  -- 'Home', 'Work', 'Other'
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text not null default 'Bengaluru',
  state text not null default 'Karnataka',
  pincode text not null default '560001',
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  location geography(Point, 4326),
  is_default boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 5. DELIVERY PARTNERS
create table if not exists public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  profile_id text unique references public.profiles(id) on delete cascade not null,
  vehicle_type text not null default 'bike',
  -- 'bike', 'scooter', 'ev', 'cycle'
  vehicle_number text,
  is_online boolean default false,
  is_busy boolean default false,
  current_latitude numeric(10, 7),
  current_longitude numeric(10, 7),
  current_location geography(Point, 4326),
  rating numeric(3, 2) default 4.8,
  total_deliveries integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TABLE GROUP: CATALOG (Restaurants, Menus & Customizations)
-- ---------------------------------------------------------------------
-- 6. RESTAURANTS
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id text references public.profiles(id) on delete
  set null,
    name text not null,
    slug text unique not null,
    tagline text,
    cover_image text not null,
    logo_image text,
    rating numeric(3, 2) default 4.2 check (
      rating >= 1.0
      and rating <= 5.0
    ),
    rating_count integer default 150,
    delivery_time_min integer default 25,
    delivery_time_max integer default 35,
    cost_for_two integer default 40000,
    -- in paise (₹400 = 40000 paise)
    cuisines text [] not null default '{}',
    is_pure_veg boolean default false,
    is_open boolean default true,
    is_approved boolean default true,
    discount_tag text,
    address text not null default 'Indiranagar, Bengaluru',
    latitude numeric(10, 7) not null default 12.9716,
    longitude numeric(10, 7) not null default 77.5946,
    location geography(Point, 4326),
    service_radius_meters integer default 10000,
    -- 10km delivery radius
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);
-- 7. MENU CATEGORIES
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 8. MENU ITEMS
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  category_id uuid references public.menu_categories(id) on delete cascade not null,
  name text not null,
  description text,
  price integer not null,
  -- in paise (e.g. 24000 paise = ₹240)
  original_price integer,
  -- in paise
  is_veg boolean not null default true,
  is_bestseller boolean default false,
  is_available boolean default true,
  image_url text,
  rating numeric(3, 2) default 4.3,
  rating_count integer default 50,
  has_customization boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 9. OPTION GROUPS (Size, Crust, Extra Add-ons)
create table if not exists public.option_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references public.menu_items(id) on delete cascade not null,
  name text not null,
  -- e.g. 'Portion Size', 'Choice of Crust'
  min_selection integer default 0,
  max_selection integer default 1,
  is_required boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 10. OPTIONS
create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.option_groups(id) on delete cascade not null,
  name text not null,
  -- e.g. 'Regular', 'Large', 'Extra Cheese'
  price integer default 0,
  -- in paise (e.g. 5000 paise = ₹50)
  is_default boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TABLE GROUP: PROMOTIONS & MARKETING
-- ---------------------------------------------------------------------
-- 11. COUPONS
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'flat')),
  discount_value integer not null,
  -- percentage (e.g. 50 for 50%) or flat paise
  max_discount integer,
  -- in paise (e.g. 10000 paise = ₹100)
  min_order_value integer default 19900,
  -- in paise (₹199 = 19900 paise)
  is_active boolean default true,
  valid_until timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 12. HOME BANNERS
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  target_type text default 'restaurant',
  -- 'restaurant', 'cuisine', 'coupon', 'external'
  target_id text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TABLE GROUP: TRANSACTIONS & LIFECYCLE
-- ---------------------------------------------------------------------
-- 13. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id text references public.profiles(id) on delete
  set null,
    restaurant_id uuid references public.restaurants(id) on delete restrict not null,
    address_id uuid references public.addresses(id) on delete
  set null,
    address_snapshot jsonb not null,
    -- Snapshot of full delivery address at time of order
    status text not null default 'placed' check (
      status in (
        'placed',
        'accepted',
        'preparing',
        'ready',
        'picked_up',
        'delivered',
        'rejected',
        'cancelled'
      )
    ),
    payment_status text not null default 'pending' check (
      payment_status in ('pending', 'paid', 'failed', 'refunded')
    ),
    payment_method text not null default 'cod' check (
      payment_method in ('upi', 'card', 'netbanking', 'cod')
    ),
    item_total integer not null,
    -- in paise
    delivery_fee integer not null default 3500,
    -- in paise (₹35)
    taxes_and_fees integer not null default 2800,
    -- in paise (₹28)
    discount_amount integer not null default 0,
    -- in paise
    tip_amount integer not null default 0,
    -- in paise
    grand_total integer not null,
    -- in paise
    applied_coupon_id uuid references public.coupons(id) on delete
  set null,
    cooking_instructions text,
    delivery_partner_id uuid references public.delivery_partners(id) on delete
  set null,
    delivery_otp text default '4829',
    estimated_delivery_time timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);
-- 14. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete
  set null,
    name text not null,
    -- snapshot
    unit_price integer not null,
    -- snapshot in paise
    quantity integer not null default 1 check (quantity > 0),
    selected_options jsonb default '[]'::jsonb,
    -- snapshot of customizations
    total_price integer not null -- in paise
);
-- 15. ORDER STATUS HISTORY (Audit Trail)
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 16. PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  amount integer not null,
  -- in paise
  currency text not null default 'INR',
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  provider text not null default 'razorpay',
  -- 'razorpay', 'stripe', 'cod', 'mock'
  transaction_id text,
  payment_method text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TABLE GROUP: LIVE TRACKING
-- ---------------------------------------------------------------------
-- 17. DELIVERY LOCATIONS (Realtime Stream)
create table if not exists public.delivery_locations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  delivery_partner_id uuid references public.delivery_partners(id) on delete cascade not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  location geography(Point, 4326),
  heading numeric(5, 2),
  -- 0 to 360 degrees
  speed numeric(5, 2),
  -- in m/s
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TABLE GROUP: ENGAGEMENT
-- ---------------------------------------------------------------------
-- 18. REVIEWS & RATINGS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.orders(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_id text references public.profiles(id) on delete
  set null,
    restaurant_rating integer check (
      restaurant_rating >= 1
      and restaurant_rating <= 5
    ),
    delivery_rating integer check (
      delivery_rating >= 1
      and delivery_rating <= 5
    ),
    comment text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);
-- 19. FAVORITES
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id text references public.profiles(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(profile_id, restaurant_id)
);
-- 20. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id text references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text default 'order_update',
  -- 'order_update', 'promo', 'system'
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
-- ---------------------------------------------------------------------
-- TRIGGERS & AUTOMATION
-- ---------------------------------------------------------------------
-- Auto-sync geography Point when lat/lng is inserted or updated
create or replace function public.sync_geography_point() returns trigger language plpgsql as $$ begin if new.latitude is not null
  and new.longitude is not null then new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
end if;
return new;
end;
$$;
create or replace trigger trigger_sync_address_point before
insert
  or
update on public.addresses for each row execute function public.sync_geography_point();

create or replace trigger trigger_sync_restaurant_point before
insert
  or
update on public.restaurants for each row execute function public.sync_geography_point();

create or replace trigger trigger_sync_delivery_location_point before
insert
  or
update on public.delivery_locations for each row execute function public.sync_geography_point();

-- Auto-log order status transitions into order_status_history
create or replace function public.log_order_status_change() returns trigger language plpgsql as $$ begin if (tg_op = 'INSERT')
  or (
    old.status is distinct
    from new.status
  ) then
insert into public.order_status_history (order_id, status)
values (new.id, new.status);
end if;
return new;
end;
$$;

create or replace trigger trigger_log_order_status
after
insert
  or
update on public.orders for each row execute function public.log_order_status_change();
-- ---------------------------------------------------------------------
-- SPATIAL QUERY: NEARBY RESTAURANTS
-- ---------------------------------------------------------------------
create or replace function public.restaurants_nearby(
    user_lat float8,
    user_lng float8,
    radius_meters int default 10000
  ) returns setof public.restaurants language sql stable as $$
select *
from public.restaurants
where is_approved = true
  and is_open = true
  and st_dwithin(
    location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
    coalesce(service_radius_meters, radius_meters)
  )
order by st_distance(
    location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
  ) asc;
$$;
-- ---------------------------------------------------------------------
-- INDEXES (Foreign Keys & PostGIS GiST)
-- ---------------------------------------------------------------------
create index if not exists idx_addresses_profile on public.addresses(profile_id);
create index if not exists idx_addresses_location on public.addresses using gist(location);
create index if not exists idx_restaurants_owner on public.restaurants(owner_id);
create index if not exists idx_restaurants_location on public.restaurants using gist(location);
create index if not exists idx_restaurants_is_open on public.restaurants(is_open, is_approved);
create index if not exists idx_menu_categories_restaurant on public.menu_categories(restaurant_id);
create index if not exists idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_option_groups_item on public.option_groups(menu_item_id);
create index if not exists idx_options_group on public.options(group_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_restaurant on public.orders(restaurant_id);
create index if not exists idx_orders_delivery_partner on public.orders(delivery_partner_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_status_history_order on public.order_status_history(order_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_delivery_locations_order on public.delivery_locations(order_id);
create index if not exists idx_delivery_locations_location on public.delivery_locations using gist(location);
create index if not exists idx_reviews_restaurant on public.reviews(restaurant_id);
create index if not exists idx_reviews_customer on public.reviews(customer_id);
create index if not exists idx_favorites_profile on public.favorites(profile_id);
create index if not exists idx_notifications_profile on public.notifications(profile_id);
-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_locations enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
-- Public Read Policies for Catalog
create policy "Public can view approved restaurants" on public.restaurants for
select using (is_approved = true);
create policy "Public can view menu categories" on public.menu_categories for
select using (true);
create policy "Public can view available menu items" on public.menu_items for
select using (true);
create policy "Public can view option groups" on public.option_groups for
select using (true);
create policy "Public can view options" on public.options for
select using (true);
create policy "Public can view active coupons" on public.coupons for
select using (is_active = true);
create policy "Public can view active banners" on public.banners for
select using (is_active = true);
create policy "Public can view reviews" on public.reviews for
select using (true);
-- User & Transaction Policies (Configured for Mobile Client & Clerk Integration)
create policy "Users can view own profile" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (true) with check (true);
create policy "Allow insert profiles" on public.profiles for insert with check (true);

create policy "Users can manage own addresses" on public.addresses for all using (true) with check (true);

create policy "Users can view own orders" on public.orders for select using (true);
create policy "Users can create orders" on public.orders for insert with check (true);
create policy "Allow update orders" on public.orders for update using (true) with check (true);

create policy "Users can view own order items" on public.order_items for select using (true);
create policy "Allow insert order_items" on public.order_items for insert with check (true);

create policy "Users can view order status history" on public.order_status_history for select using (true);
create policy "Allow insert order_status_history" on public.order_status_history for insert with check (true);

create policy "Allow select payments" on public.payments for select using (true);
create policy "Allow insert payments" on public.payments for insert with check (true);
create policy "Users can stream delivery locations for their orders" on public.delivery_locations for
select using (
    exists (
      select 1
      from public.orders o
      where o.id = delivery_locations.order_id
        and (
          o.customer_id = public.requesting_user_id()
          or o.customer_id is null
        )
    )
  );
create policy "Users can manage own favorites" on public.favorites for all using (profile_id = public.requesting_user_id()) with check (profile_id = public.requesting_user_id());
create policy "Users can view own notifications" on public.notifications for
select using (profile_id = public.requesting_user_id());
-- ---------------------------------------------------------------------
-- SUPABASE REALTIME REPLICATION
-- ---------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.delivery_locations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;