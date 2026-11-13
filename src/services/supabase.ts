import { createClient } from '@supabase/supabase-js';
import { MOCK_RESTAURANTS, MOCK_COUPONS } from './mockData';
import { Restaurant, Coupon } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helpers to convert integer paise to display rupees when needed
function paiseToRupees(val: any, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  const num = Number(val);
  if (num >= 500) {
    return Math.round(num / 100);
  }
  return num;
}

function mapSupabaseRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    coverImage: row.cover_image || row.coverImage,
    logoImage: row.logo_image || row.logoImage,
    rating: Number(row.rating),
    ratingCount: Number(row.rating_count || row.ratingCount || 0),
    deliveryTimeMin: Number(row.delivery_time_min || row.deliveryTimeMin || 20),
    deliveryTimeMax: Number(row.delivery_time_max || row.deliveryTimeMax || 30),
    costForTwo: paiseToRupees(row.cost_for_two, 400),
    cuisines: row.cuisines || [],
    isPureVeg: Boolean(row.is_pure_veg ?? row.isPureVeg),
    isOpen: Boolean(row.is_open ?? row.isOpen ?? true),
    discountTag: row.discount_tag || row.discountTag,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    categories: (row.categories || []).map((cat: any) => ({
      id: cat.id,
      restaurantId: cat.restaurant_id || cat.restaurantId || row.id,
      name: cat.name,
      items: (cat.items || []).map((item: any) => ({
        id: item.id,
        restaurantId: item.restaurant_id || item.restaurantId || row.id,
        categoryId: item.category_id || item.categoryId || cat.id,
        name: item.name,
        description: item.description,
        price: paiseToRupees(item.price, 250),
        originalPrice: item.original_price ? paiseToRupees(item.original_price) : undefined,
        isVeg: Boolean(item.is_veg ?? item.isVeg),
        isBestseller: Boolean(item.is_bestseller ?? item.isBestseller),
        isAvailable: Boolean(item.is_available ?? item.isAvailable ?? true),
        imageUrl: item.image_url || item.imageUrl,
        rating: item.rating ? Number(item.rating) : 4.3,
        ratingCount: item.rating_count ? Number(item.rating_count) : 50,
        hasCustomization: Boolean(
          (item.has_customization ?? item.hasCustomization) &&
          item.option_groups &&
          item.option_groups.length > 0
        ),
        optionGroups: (item.option_groups || []).map((og: any) => ({
          id: og.id,
          groupName: og.name || og.groupName || 'Option',
          minSelection: Number(og.min_selection ?? og.minSelection ?? (og.is_required ? 1 : 0)),
          maxSelection: Number(og.max_selection ?? og.maxSelection ?? 1),
          isRequired: Boolean(og.is_required ?? og.isRequired),
          choices: (og.options || og.choices || []).map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            additionalPrice: paiseToRupees(opt.price ?? opt.additionalPrice, 0),
          })),
        })),
      })),
    })),
  };
}

function mapSupabaseCoupon(row: any): Coupon {
  const isFlat = (row.discount_type || row.discountType) === 'flat';
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    discountType: isFlat ? 'flat' : 'percentage',
    discountValue: isFlat ? paiseToRupees(row.discount_value, 50) : Number(row.discount_value),
    maxDiscount: row.max_discount ? paiseToRupees(row.max_discount) : undefined,
    minOrderValue: paiseToRupees(row.min_order_value, 199),
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

// Unified Data Access API
export async function fetchRestaurants(): Promise<Restaurant[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          categories:menu_categories(
            id,
            name,
            items:menu_items(
              *,
              option_groups(
                *,
                options(*)
              )
            )
          )
        `)
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseRestaurant);
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to mock data:', err);
    }
  }

  // Local Seed Fallback
  return MOCK_RESTAURANTS;
}

export async function fetchRestaurantById(id: string): Promise<Restaurant | undefined> {
  const all = await fetchRestaurants();
  return all.find((r) => r.id === id);
}

export async function fetchNearbyRestaurants(
  userLat: number,
  userLng: number,
  radiusMeters = 10000
): Promise<Restaurant[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('restaurants_nearby', {
        user_lat: userLat,
        user_lng: userLng,
        radius_meters: radiusMeters,
      });

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseRestaurant);
      }
    } catch (err) {
      console.warn('Supabase nearby query failed, falling back to all restaurants:', err);
    }
  }

  return fetchRestaurants();
}

export async function fetchCoupons(): Promise<Coupon[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseCoupon);
      }
    } catch (err) {
      console.warn('Supabase coupons query failed, falling back to mock data:', err);
    }
  }

  return MOCK_COUPONS;
}

export async function fetchBanners(): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase banners query failed:', err);
    }
  }

  return [];
}
