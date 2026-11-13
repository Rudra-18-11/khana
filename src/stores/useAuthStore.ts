import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../services/supabase';

async function upsertProfileToDatabase(user: UserProfile): Promise<UserProfile> {
  if (!supabase || !user.id) return user;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ? user.email.trim().toLowerCase() : null,
          full_name: user.name?.trim() || 'Foodie Member',
          phone: user.phone || null,
          avatar_url: user.avatarUrl || null,
          role: user.role || 'customer',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        name: data.full_name,
        email: data.email || user.email,
        phone: data.phone || user.phone,
        avatarUrl: data.avatar_url || user.avatarUrl,
        role: data.role as UserRole,
      };
    }
  } catch (err) {
    console.warn('Direct database profile upsert warning:', err);
  }

  return user;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole;
  isLoaded: boolean;

  loadAuth: () => Promise<void>;
  loginAsGuest: () => Promise<UserProfile>;
  setUser: (user: UserProfile) => void;
  syncProfileDirect: (user: UserProfile) => Promise<UserProfile>;
  setRole: (role: UserRole) => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  syncCurrentProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  role: 'customer',
  isLoaded: false,

  loadAuth: async () => {
    // If a user is already loaded in memory, sync directly with database
    const currentUser = get().user;
    if (currentUser && supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (data) {
          set({
            user: {
              id: data.id,
              name: data.full_name,
              email: data.email || currentUser.email,
              phone: data.phone || currentUser.phone,
              avatarUrl: data.avatar_url || currentUser.avatarUrl,
              role: data.role as UserRole,
            },
            role: data.role as UserRole,
            isAuthenticated: true,
            isLoaded: true,
          });
          return;
        }
      } catch (err) {
        console.warn('Failed to load profile directly from database:', err);
      }
    }
    set({ isLoaded: true });
  },

  loginAsGuest: async () => {
    const guestId = 'guest_' + Date.now();
    const guestUser: UserProfile = {
      id: guestId,
      name: 'Gourmet Guest',
      email: `${guestId}@khana.app`,
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      role: 'customer',
    };

    set({
      user: guestUser,
      isAuthenticated: true,
      role: 'customer',
      isLoaded: true,
    });

    // Directly register guest user in database so orders and foreign keys succeed
    if (supabase) {
      await upsertProfileToDatabase(guestUser);
    }

    return guestUser;
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, role: user.role, isLoaded: true });
    // Directly sync to database
    upsertProfileToDatabase(user).catch(console.warn);
  },

  syncProfileDirect: async (user: UserProfile) => {
    if (!user.id) {
      set({ user, isAuthenticated: true, role: user.role || 'customer', isLoaded: true });
      return user;
    }

    if (supabase) {
      try {
        // 1. Check if user already exists in Supabase by id or email
        let query = supabase.from('profiles').select('*');
        if (user.id) {
          query = query.eq('id', user.id);
        } else if (user.email) {
          query = query.eq('email', user.email.toLowerCase().trim());
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          const liveUser: UserProfile = {
            id: existing.id,
            name: existing.full_name || user.name,
            email: existing.email || user.email,
            phone: existing.phone || user.phone,
            avatarUrl: existing.avatar_url || user.avatarUrl,
            role: (existing.role as UserRole) || user.role || 'customer',
          };
          set({ user: liveUser, isAuthenticated: true, role: liveUser.role, isLoaded: true });
          return liveUser;
        }

        // 2. Direct insert new profile into Supabase
        const dbSyncedUser = await upsertProfileToDatabase(user);
        set({ user: dbSyncedUser, isAuthenticated: true, role: dbSyncedUser.role, isLoaded: true });
        return dbSyncedUser;
      } catch (e) {
        console.warn('Direct database sync failed, using input user:', e);
      }
    }

    set({ user, isAuthenticated: true, role: user.role || 'customer', isLoaded: true });
    return user;
  },

  setRole: async (role: UserRole) => {
    const currentUser = get().user;
    if (!currentUser) {
      set({ role });
      return;
    }

    const updatedUser: UserProfile = { ...currentUser, role };
    set({ role, user: updatedUser });

    if (supabase && currentUser.id) {
      try {
        await supabase
          .from('profiles')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Failed to update role directly in database:', err);
      }
    }
  },

  updateProfile: async (updated: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: UserProfile = { ...currentUser, ...updated };
    set({ user: updatedUser, role: updatedUser.role });

    if (supabase && currentUser.id) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updated.name) payload.full_name = updated.name;
        if (updated.email) payload.email = updated.email.trim().toLowerCase();
        if (updated.phone) payload.phone = updated.phone;
        if (updated.avatarUrl !== undefined) payload.avatar_url = updated.avatarUrl;
        if (updated.role) payload.role = updated.role;

        await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      } catch (err) {
        console.warn('Failed to update profile directly in database:', err);
      }
    }
  },

  syncCurrentProfile: async () => {
    const currentUser = get().user;
    if (currentUser && supabase) {
      await upsertProfileToDatabase(currentUser);
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, role: 'customer' });
  },
}));
