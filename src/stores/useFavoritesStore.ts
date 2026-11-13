import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

interface FavoritesState {
  favorites: string[]; // List of restaurant IDs
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (restaurantId: string) => Promise<boolean>;
  isFavorite: (restaurantId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  loadFavorites: async () => {
    if (!supabase) return;
    const user = useAuthStore.getState().user;
    const profileId = user?.id || 'user_demo_customer_1';

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('profile_id', profileId);

      if (!error && data) {
        set({ favorites: data.map((row) => row.restaurant_id), isLoading: false });
        return;
      }
    } catch (err) {
      console.warn('Failed to load favorites directly from database:', err);
    }
    set({ isLoading: false });
  },

  toggleFavorite: async (restaurantId: string) => {
    const user = useAuthStore.getState().user;
    const profileId = user?.id || 'user_demo_customer_1';
    const currentFavorites = get().favorites;
    const isCurrentlyFav = currentFavorites.includes(restaurantId);

    // Optimistically update in memory
    const updated = isCurrentlyFav
      ? currentFavorites.filter((id) => id !== restaurantId)
      : [...currentFavorites, restaurantId];

    set({ favorites: updated });

    // Direct Database Synchronization
    if (supabase) {
      try {
        // Ensure profile exists in database
        if (user) {
          await supabase.from('profiles').upsert(
            {
              id: profileId,
              email: user.email || `${profileId}@khana.app`,
              full_name: user.name || 'Gourmet Foodie',
              phone: user.phone || '+91 98765 43210',
              role: user.role || 'customer',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        if (isCurrentlyFav) {
          // Remove from database
          await supabase
            .from('favorites')
            .delete()
            .eq('profile_id', profileId)
            .eq('restaurant_id', restaurantId);
        } else {
          // Insert into database
          await supabase.from('favorites').insert({
            id: Crypto.randomUUID(),
            profile_id: profileId,
            restaurant_id: restaurantId,
          });
        }
      } catch (err) {
        console.warn('Failed to sync favorite with Supabase database:', err);
      }
    }

    return !isCurrentlyFav;
  },

  isFavorite: (restaurantId: string) => {
    return get().favorites.includes(restaurantId);
  },
}));
