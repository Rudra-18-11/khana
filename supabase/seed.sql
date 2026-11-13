-- =====================================================================
-- KHANA Food Delivery App - Initial Seed Data (in Paise)
-- =====================================================================

-- 1. SEED PROFILES (Clerk User ID format: 'user_...')
insert into public.profiles (id, email, phone, full_name, avatar_url, role) values
('user_demo_customer_1', 'aarav.sharma@example.com', '+919876543210', 'Aarav Sharma', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80', 'customer'),
('user_demo_partner_1', 'rajesh.kumar@example.com', '+919876543220', 'Rajesh Kumar', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80', 'delivery'),
('user_demo_owner_1', 'owner@biryanikilo.com', '+919876543230', 'Kilo Biryani Partner', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&q=80', 'restaurant')
on conflict (id) do nothing;

-- 2. SEED HOME BANNERS
insert into public.banners (id, title, subtitle, image_url, target_type, sort_order, is_active) values
('b1000000-0000-0000-0000-000000000001', 'FLAT 50% OFF', 'Royal Nawabi Feast with Code WELCOME50', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 'coupon', 1, true),
('b1000000-0000-0000-0000-000000000002', 'Weekend Biryani Festival', 'Dum-cooked handi biryanis delivered piping hot in 30 mins', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', 'restaurant', 2, true),
('b1000000-0000-0000-0000-000000000003', 'Late Night Cravings', 'Pizzas & Burgers with zero delivery fee after 11 PM', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', 'restaurant', 3, true)
on conflict (id) do nothing;

-- 3. SEED RESTAURANTS (cost_for_two in paise: e.g. 45000 paise = ₹450)
insert into public.restaurants (
  id, name, slug, tagline, cover_image, logo_image, rating, rating_count,
  delivery_time_min, delivery_time_max, cost_for_two, cuisines, is_pure_veg,
  is_open, is_approved, discount_tag, address, latitude, longitude, service_radius_meters
) values
(
  '11111111-1111-1111-1111-111111111111',
  'Biryani by Kilo',
  'biryani-by-kilo',
  'Authentic Dum-Cooked Handi Biryanis & Kebabs',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=200&q=80',
  4.5, 480, 30, 40, 45000,
  array['Biryani', 'Mughlai', 'North Indian', 'Kebabs'],
  false, true, true, 'FLAT 50% OFF up to ₹100',
  '100 Feet Rd, Indiranagar, Bengaluru', 12.9784, 77.6408, 12000
),
(
  '22222222-2222-2222-2222-222222222222',
  'Domino''s Pizza',
  'dominos-pizza',
  'Hot, Fresh & Cheesy Pizzas Delivered in 30 Mins',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=200&q=80',
  4.3, 1250, 20, 30, 35000,
  array['Pizza', 'Italian', 'Fast Food', 'Desserts'],
  false, true, true, 'EVERYDAY VALUE FROM ₹99',
  'CMH Road, Indiranagar, Bengaluru', 12.9790, 77.6380, 10000
),
(
  '33333333-3333-3333-3333-333333333333',
  'Burger King',
  'burger-king',
  'Flame-Grilled Whoppers & Crispy Fries',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&q=80',
  4.1, 890, 25, 35, 30000,
  array['Burgers', 'American', 'Fast Food', 'Beverages'],
  false, true, true, 'MEALS STARTING @ ₹149',
  'Koramangala 5th Block, Bengaluru', 12.9352, 77.6245, 10000
),
(
  '44444444-4444-4444-4444-444444444444',
  'Haldiram''s Sweets & Restaurant',
  'haldirams-sweets',
  'Pure Veg Traditional Indian Chaat, Meals & Sweets',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=200&q=80',
  4.4, 620, 20, 30, 25000,
  array['North Indian', 'Chaat', 'Pure Veg', 'Sweets'],
  true, true, true, '20% OFF ON ALL THALIS',
  'MG Road, Bengaluru', 12.9756, 77.6066, 15000
),
(
  '55555555-5555-5555-5555-555555555555',
  'The Belgian Waffle Co.',
  'belgian-waffle-co',
  'Freshly Baked Crispy Warm Waffles & Shakes',
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
  'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=200&q=80',
  4.6, 940, 15, 25, 20000,
  array['Desserts', 'Waffles', 'Bakery', 'Ice Cream'],
  true, true, true, 'BUY 2 GET 1 FREE',
  '12th Main, HAL 2nd Stage, Bengaluru', 12.9698, 77.6499, 8000
),
(
  '66666666-6666-6666-6666-666666666666',
  'Chai Point',
  'chai-point',
  'Freshly Brewed Masala Chai, Filter Coffee & Snacks',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
  4.2, 510, 15, 20, 15000,
  array['Chai', 'Beverages', 'Fast Food', 'Snacks'],
  true, true, true, 'FREE SAMOSA ON ₹149',
  'Prestige Tech Park, Marathahalli, Bengaluru', 12.9372, 77.6912, 10000
)
on conflict (id) do nothing;

-- 4. SEED MENU CATEGORIES
insert into public.menu_categories (id, restaurant_id, name, description, sort_order) values
('c1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Royal Handi Biryani', 'Slow cooked in earthen clay handis over charcoal flame', 1),
('c1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Kebabs & Starters', 'Charcoal-grilled juicy appetizers served with mint chutney', 2),
('c2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Veg Pizzas', 'Signature crusts with San Marzano tomato sauce & 100% mozzarella', 1),
('c2000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Sides & Desserts', 'Garlic breads, dips and chocolate lava cake', 2),
('c3000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Whopper Specials', 'Our signature flame-grilled whopper burgers with crispy sesame buns', 1),
('c4000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Street Food & Chaat', 'Crispy, tangy and authentic Chandni Chowk style street delicacies', 1),
('c5000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Bestseller Waffles', 'Warm, freshly baked waff-wiches with premium European fillings', 1),
('c6000000-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'Hot Chai & Bun Maska', 'Freshly brewed herbal chais with soft warm maska buns', 1)
on conflict (id) do nothing;

-- 5. SEED MENU ITEMS (prices in paise: e.g. 38000 = ₹380, 24000 = ₹240)
insert into public.menu_items (
  id, restaurant_id, category_id, name, description, price, original_price,
  is_veg, is_bestseller, is_available, image_url, rating, rating_count, has_customization
) values
(
  'd1000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'c1000000-0000-0000-0000-000000000001',
  'Hyderabadi Dum Chicken Biryani',
  'Tender chicken marinated in royal spices, layered with aged basmati rice, sealed with dough & slow cooked.',
  38000, 44000, false, true, true,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
  4.7, 240, true
),
(
  'd1000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'c1000000-0000-0000-0000-000000000001',
  'Lucknowi Veg Dum Biryani',
  'Garden fresh vegetables & paneer cubes slow cooked with saffron, rose water and aromatic kewra.',
  31000, 36000, true, true, true,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&q=80',
  4.5, 180, true
),
(
  'd1000000-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'c1000000-0000-0000-0000-000000000002',
  'Galouti Kebab (4 Pcs)',
  'Melt-in-the-mouth kebabs infused with 16 royal spices, served with Mughlai paratha and onion rings.',
  29000, 34000, false, false, true,
  'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&q=80',
  4.6, 95, false
),
(
  'd2000000-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'c2000000-0000-0000-0000-000000000001',
  'Peppy Paneer Pizza',
  'Chunky paneer, crisp capsicum and spicy red paprika over gooey mozzarella cheese.',
  27900, 32900, true, true, true,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
  4.4, 380, true
),
(
  'd2000000-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'c2000000-0000-0000-0000-000000000001',
  'Farmhouse Classic Pizza',
  'Delightful combo of onion, crisp capsicum, grilled mushroom and fresh juicy tomato.',
  25900, 29900, true, false, true,
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
  4.3, 210, true
),
(
  'd2000000-0000-0000-0000-000000000003',
  '22222222-2222-2222-2222-222222222222',
  'c2000000-0000-0000-0000-000000000002',
  'Stuffed Garlic Bread',
  'Freshly baked garlic breadsticks filled with molten mozzarella, sweet corn & jalapenos.',
  14900, 17900, true, true, true,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&q=80',
  4.6, 520, false
),
(
  'd3000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'c3000000-0000-0000-0000-000000000001',
  'Crispy Veg Whopper Double',
  'Two crispy veg patties with juicy tomatoes, fresh lettuce, creamy mayo on a toasted sesame bun.',
  19900, 24900, true, true, true,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
  4.3, 310, true
),
(
  'd3000000-0000-0000-0000-000000000002',
  '33333333-3333-3333-3333-333333333333',
  'c3000000-0000-0000-0000-000000000001',
  'Chicken Whopper Deluxe',
  'Signature flame-grilled chicken patty topped with fresh lettuce, sliced onions & creamy sauce.',
  22900, 27900, false, true, true,
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
  4.4, 420, true
),
(
  'd4000000-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  'c4000000-0000-0000-0000-000000000001',
  'Dahi Bhalla Papdi Chaat',
  'Fluffy urad dal bhallas with crisp papdis, sweet yoghurt, tamarind saunth & mint chutney.',
  12000, 15000, true, true, true,
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
  4.7, 340, false
),
(
  'd5000000-0000-0000-0000-000000000001',
  '55555555-5555-5555-5555-555555555555',
  'c5000000-0000-0000-0000-000000000001',
  'Belgian Chocolate Overload Waffle',
  'Crispy warm waffle smothered with both rich dark and melted milk chocolate ganache.',
  18000, 22000, true, true, true,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&q=80',
  4.8, 620, true
),
(
  'd6000000-0000-0000-0000-000000000001',
  '66666666-6666-6666-6666-666666666666',
  'c6000000-0000-0000-0000-000000000001',
  'Ginger Cardamom Dum Chai Flask (500ml)',
  'Immunity-boosting adrak elaichi chai brewed fresh with full cream milk, serves 4-5 cups.',
  16000, 19900, true, true, true,
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
  4.6, 290, false
)
on conflict (id) do nothing;

-- 6. SEED OPTION GROUPS (Customizations)
insert into public.option_groups (id, menu_item_id, name, min_selection, max_selection, is_required) values
('e0100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Portion Size', 1, 1, true),
('e0100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Extra Add-ons', 0, 2, false),
('e0100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Portion Size', 1, 1, true),
('e0100000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Extra Add-ons', 0, 2, false),
('e0200000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Choose Crust', 1, 1, true),
('e0200000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'Extra Cheese', 0, 1, false),
('e0200000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000002', 'Choose Crust', 1, 1, true),
('e0200000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', 'Extra Toppings', 0, 2, false),
('e0300000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Make it a Meal', 1, 1, true),
('e0300000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000001', 'Add Extra Cheese', 0, 1, false),
('e0300000-0000-0000-0000-000000000003', 'd3000000-0000-0000-0000-000000000002', 'Make it a Meal', 1, 1, true),
('e0300000-0000-0000-0000-000000000004', 'd3000000-0000-0000-0000-000000000002', 'Add-ons', 0, 2, false),
('e0500000-0000-0000-0000-000000000001', 'd5000000-0000-0000-0000-000000000001', 'Waffle Base', 1, 1, true),
('e0500000-0000-0000-0000-000000000002', 'd5000000-0000-0000-0000-000000000001', 'Ice Cream Scoop', 0, 1, false)
on conflict (id) do nothing;

-- 7. SEED OPTIONS (prices in paise: e.g. 12000 = ₹120, 5000 = ₹50)
insert into public.options (id, group_id, name, price, is_default) values
-- Biryani Portion sizes
('e1100000-0000-0000-0000-000000000001', 'e0100000-0000-0000-0000-000000000001', 'Regular (Serves 1-2, 500g)', 0, true),
('e1100000-0000-0000-0000-000000000002', 'e0100000-0000-0000-0000-000000000001', 'Large Handi (Serves 2-3, 1kg)', 28000, false),
-- Biryani Add-ons
('e1100000-0000-0000-0000-000000000003', 'e0100000-0000-0000-0000-000000000002', 'Extra Boondi Raita', 4500, false),
('e1100000-0000-0000-0000-000000000004', 'e0100000-0000-0000-0000-000000000002', 'Mirchi Ka Salan', 5000, false),
-- Veg Biryani Portion
('e1100000-0000-0000-0000-000000000005', 'e0100000-0000-0000-0000-000000000003', 'Regular (500g)', 0, true),
('e1100000-0000-0000-0000-000000000006', 'e0100000-0000-0000-0000-000000000003', 'Large Handi (1kg)', 24000, false),
-- Veg Biryani Add-ons
('e1100000-0000-0000-0000-000000000007', 'e0100000-0000-0000-0000-000000000004', 'Extra Mirchi Salan', 4000, false),
('e1100000-0000-0000-0000-000000000008', 'e0100000-0000-0000-0000-000000000004', 'Gulab Jamun (2 Pcs)', 6000, false),
-- Pizza Crusts
('e1200000-0000-0000-0000-000000000001', 'e0200000-0000-0000-0000-000000000001', 'Classic Hand Tossed', 0, true),
('e1200000-0000-0000-0000-000000000002', 'e0200000-0000-0000-0000-000000000001', 'Cheese Burst Crust', 9900, false),
('e1200000-0000-0000-0000-000000000003', 'e0200000-0000-0000-0000-000000000001', 'Fresh Pan Crust', 5000, false),
-- Pizza Extra Cheese
('e1200000-0000-0000-0000-000000000004', 'e0200000-0000-0000-0000-000000000002', 'Extra Mozzarella Topping', 7500, false),
-- Farmhouse Pizza Crust
('e1200000-0000-0000-0000-000000000005', 'e0200000-0000-0000-0000-000000000003', 'Classic Hand Tossed', 0, true),
('e1200000-0000-0000-0000-000000000006', 'e0200000-0000-0000-0000-000000000003', 'Cheese Burst Crust', 9900, false),
-- Farmhouse Pizza Toppings
('e1200000-0000-0000-0000-000000000007', 'e0200000-0000-0000-0000-000000000004', 'Extra Grilled Mushrooms', 4500, false),
('e1200000-0000-0000-0000-000000000008', 'e0200000-0000-0000-0000-000000000004', 'Spicy Red Paprika', 3500, false),
-- Veg Whopper Meal
('e1300000-0000-0000-0000-000000000001', 'e0300000-0000-0000-0000-000000000001', 'A la Carte (Burger Only)', 0, true),
('e1300000-0000-0000-0000-000000000002', 'e0300000-0000-0000-0000-000000000001', 'Make it a Combo (Medium Fries + Pepsi)', 11900, false),
('e1300000-0000-0000-0000-000000000003', 'e0300000-0000-0000-0000-000000000002', 'Cheese Slice', 3000, false),
-- Chicken Whopper Meal
('e1300000-0000-0000-0000-000000000004', 'e0300000-0000-0000-0000-000000000003', 'A la Carte (Burger Only)', 0, true),
('e1300000-0000-0000-0000-000000000005', 'e0300000-0000-0000-0000-000000000003', 'King Combo (King Fries + Pepsi)', 13900, false),
('e1300000-0000-0000-0000-000000000006', 'e0300000-0000-0000-0000-000000000004', 'Add Crispy Bacon', 6000, false),
('e1300000-0000-0000-0000-000000000007', 'e0300000-0000-0000-0000-000000000004', 'Extra Flame-Grilled Patty', 9900, false),
-- Waffle Base & Ice Cream
('e1500000-0000-0000-0000-000000000001', 'e0500000-0000-0000-0000-000000000001', 'Classic Crispy Waffle', 0, true),
('e1500000-0000-0000-0000-000000000002', 'e0500000-0000-0000-0000-000000000001', 'Dark Chocolate Infused Waffle', 2500, false),
('e1500000-0000-0000-0000-000000000003', 'e0500000-0000-0000-0000-000000000002', 'French Vanilla Ice Cream Scoop', 4500, false),
('e1500000-0000-0000-0000-000000000004', 'e0500000-0000-0000-0000-000000000002', 'Belgian Dark Choco Ice Cream Scoop', 5500, false)
on conflict (id) do nothing;

-- 8. SEED PROMO COUPONS (prices in paise: e.g. min_order_value 19900 = ₹199)
insert into public.coupons (
  id, code, title, description, discount_type, discount_value, max_discount, min_order_value, is_active
) values
(
  'c0100000-0000-0000-0000-000000000001',
  'WELCOME50',
  '50% OFF First Order',
  'Get flat 50% discount up to ₹100 on your first royal feast',
  'percentage', 50, 10000, 19900, true
),
(
  'c0100000-0000-0000-0000-000000000002',
  'FEAST120',
  'Flat ₹120 Discount',
  'Save flat ₹120 on party orders above ₹499',
  'flat', 12000, null, 49900, true
),
(
  'c0100000-0000-0000-0000-000000000003',
  'KHANA20',
  '20% OFF Everything',
  'Enjoy 20% off on all restaurants up to ₹150',
  'percentage', 20, 15000, 29900, true
),
(
  'c0100000-0000-0000-0000-000000000004',
  'FREEDEL',
  'Free Express Delivery',
  'Zero delivery fee on orders above ₹149',
  'flat', 3500, null, 14900, true
)
on conflict (id) do nothing;

-- 10. SEED SAVED ADDRESSES
insert into public.addresses (id, profile_id, label, address_line1, address_line2, landmark, city, state, pincode, latitude, longitude, is_default) values
('a1000000-0000-0000-0000-000000000001', 'user_demo_customer_1', 'Home', 'Flat 402, Royal Palms, 12th Main', 'HAL 2nd Stage, Indiranagar', 'Near Sony Signal', 'Bengaluru', 'Karnataka', '560038', 12.9716, 77.6412, true),
('a1000000-0000-0000-0000-000000000002', 'user_demo_customer_1', 'Work', 'WeWork Galaxy, 43 Residency Rd', 'Shanthala Nagar, Ashok Nagar', 'Opp Garuda Mall', 'Bengaluru', 'Karnataka', '560025', 12.9723, 77.6080, false)
on conflict (id) do nothing;

-- 11. SEED DELIVERY PARTNERS
insert into public.delivery_partners (id, profile_id, vehicle_type, vehicle_number, is_online, is_busy, current_latitude, current_longitude, rating, total_deliveries) values
('de100000-0000-0000-0000-000000000001', 'user_demo_partner_1', 'bike', 'KA-01-EQ-9876', true, false, 12.9750, 77.6350, 4.88, 342)
on conflict (id) do nothing;

-- 12. SEED ORDERS
insert into public.orders (
  id, order_number, customer_id, restaurant_id, address_id, address_snapshot,
  status, payment_status, payment_method, item_total, delivery_fee, taxes_and_fees,
  discount_amount, tip_amount, grand_total, applied_coupon_id, cooking_instructions,
  delivery_partner_id, delivery_otp, estimated_delivery_time
) values
(
  'ed100000-0000-0000-0000-000000000001',
  'KHN-82941',
  'user_demo_customer_1',
  '11111111-1111-1111-1111-111111111111',
  'a1000000-0000-0000-0000-000000000001',
  '{"label": "Home", "addressLine1": "Flat 402, Royal Palms, 12th Main", "city": "Bengaluru", "pincode": "560038"}'::jsonb,
  'delivered',
  'paid',
  'upi',
  38000, 3500, 2800, 10000, 2000, 36300,
  'c0100000-0000-0000-0000-000000000001',
  'Please send extra mint chutney & spicy raita',
  'de100000-0000-0000-0000-000000000001',
  '4829',
  timezone('utc'::text, now())
)
on conflict (id) do nothing;

-- 13. SEED ORDER ITEMS
insert into public.order_items (id, order_id, menu_item_id, name, unit_price, quantity, selected_options, total_price) values
('ef100000-0000-0000-0000-000000000001', 'ed100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Hyderabadi Dum Chicken Biryani', 38000, 1, '[{"groupName": "Portion Size", "choiceName": "Regular (Serves 1-2, 500g)", "additionalPrice": 0}]'::jsonb, 38000)
on conflict (id) do nothing;

-- 14. SEED ORDER STATUS HISTORY (Additional milestone entries)
insert into public.order_status_history (id, order_id, status, notes) values
('ea100000-0000-0000-0000-000000000001', 'ed100000-0000-0000-0000-000000000001', 'preparing', 'Chef began slow handi preparation'),
('ea100000-0000-0000-0000-000000000002', 'ed100000-0000-0000-0000-000000000001', 'picked_up', 'Rider Rajesh Kumar picked up order'),
('ea100000-0000-0000-0000-000000000003', 'ed100000-0000-0000-0000-000000000001', 'delivered', 'Order verified via OTP 4829')
on conflict (id) do nothing;

-- 15. SEED PAYMENTS
insert into public.payments (id, order_id, amount, currency, status, provider, transaction_id, payment_method, payload) values
('fa100000-0000-0000-0000-000000000001', 'ed100000-0000-0000-0000-000000000001', 36300, 'INR', 'completed', 'razorpay', 'pay_Khn82941Sample', 'upi', '{"vpa": "aarav@okhdfcbank"}'::jsonb)
on conflict (id) do nothing;

-- 16. SEED DELIVERY LOCATIONS (Tracking coordinate)
insert into public.delivery_locations (id, order_id, delivery_partner_id, latitude, longitude, heading, speed) values
('da100000-0000-0000-0000-000000000001', 'ed100000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000001', 12.9750, 77.6350, 90.0, 7.5)
on conflict (id) do nothing;

-- 17. SEED REVIEWS
insert into public.reviews (id, order_id, restaurant_id, customer_id, restaurant_rating, delivery_rating, comment) values
('fb100000-0000-0000-0000-000000000001', 'ed100000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'user_demo_customer_1', 5, 5, 'Authentic royal taste! Arrived steaming hot with genuine charcoal handi aroma.')
on conflict (id) do nothing;

-- 18. SEED FAVORITES
insert into public.favorites (id, profile_id, restaurant_id) values
('fc100000-0000-0000-0000-000000000001', 'user_demo_customer_1', '11111111-1111-1111-1111-111111111111'),
('fc100000-0000-0000-0000-000000000002', 'user_demo_customer_1', '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- 19. SEED NOTIFICATIONS
insert into public.notifications (id, profile_id, title, body, type, is_read) values
('fd100000-0000-0000-0000-000000000001', 'user_demo_customer_1', 'Order Delivered! 🎉', 'Your Biryani by Kilo feast has arrived. Bon appetit!', 'order_update', false)
on conflict (id) do nothing;
