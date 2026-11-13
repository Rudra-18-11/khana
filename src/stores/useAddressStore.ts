import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Address } from '../types';
import { MOCK_SAVED_ADDRESSES } from '../services/mockData';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

interface AddressState {
  addresses: Address[];
  selectedAddress: Address;
  isLoading: boolean;
  loadAddresses: () => Promise<void>;
  selectAddress: (address: Address) => void;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
}

function mapDbAddress(row: any): Address {
  return {
    id: row.id,
    label: (row.label as any) || 'Home',
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 || '',
    landmark: row.landmark || '',
    city: row.city || 'Bengaluru',
    state: row.state || 'Karnataka',
    pincode: row.pincode || '560001',
    latitude: Number(row.latitude || 12.9716),
    longitude: Number(row.longitude || 77.5946),
    isDefault: Boolean(row.is_default),
  };
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: MOCK_SAVED_ADDRESSES,
  selectedAddress: MOCK_SAVED_ADDRESSES[0],
  isLoading: false,

  loadAddresses: async () => {
    if (!supabase) return;

    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      let query = supabase.from('addresses').select('*').order('created_at', { ascending: false });

      if (user?.id && !user.id.startsWith('guest_')) {
        query = query.eq('profile_id', user.id);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbAddress);
        const defaultAddr = mapped.find((a) => a.isDefault) || mapped[0];
        set({
          addresses: mapped,
          selectedAddress: defaultAddr,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.warn('Failed to load addresses from Supabase database:', e);
    }
    set({ isLoading: false });
  },

  selectAddress: async (address: Address) => {
    set({ selectedAddress: address });

    if (supabase && address.id) {
      try {
        const user = useAuthStore.getState().user;
        const profileId = user?.id || 'user_demo_customer_1';

        // Set is_default = false on all user addresses
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('profile_id', profileId);

        // Set is_default = true on this chosen address
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', address.id);
      } catch (e) {
        console.warn('Failed to update default address in database:', e);
      }
    }
  },

  addAddress: async (addrData) => {
    const addressId = Crypto.randomUUID();
    const user = useAuthStore.getState().user;
    const profileId = user?.id || 'user_demo_customer_1';

    const newAddress: Address = {
      ...addrData,
      id: addressId,
    };

    // Direct Database Insert
    if (supabase) {
      try {
        // Ensure profile exists first
        if (user && !user.id.startsWith('guest_')) {
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              email: user.email,
              full_name: user.name,
              phone: user.phone,
              role: user.role || 'customer',
            },
            { onConflict: 'id' }
          );
        }

        const { error } = await supabase.from('addresses').insert({
          id: addressId,
          profile_id: profileId,
          label: addrData.label,
          address_line1: addrData.addressLine1,
          address_line2: addrData.addressLine2 || null,
          landmark: addrData.landmark || null,
          city: addrData.city,
          state: addrData.state,
          pincode: addrData.pincode,
          latitude: addrData.latitude,
          longitude: addrData.longitude,
          is_default: Boolean(addrData.isDefault),
        });

        if (error) {
          console.warn('Direct database address insert error:', error);
        }
      } catch (err) {
        console.warn('Failed to insert address directly to database:', err);
      }
    }

    const updated = [newAddress, ...get().addresses];
    set({ addresses: updated, selectedAddress: newAddress });

    return newAddress;
  },

  deleteAddress: async (id: string) => {
    if (supabase) {
      try {
        await supabase.from('addresses').delete().eq('id', id);
      } catch (err) {
        console.warn('Direct database address delete error:', err);
      }
    }

    const updated = get().addresses.filter((a) => a.id !== id);
    const selected = get().selectedAddress;
    const newSelected = selected.id === id ? updated[0] || MOCK_SAVED_ADDRESSES[0] : selected;

    set({ addresses: updated, selectedAddress: newSelected });
  },
}));
