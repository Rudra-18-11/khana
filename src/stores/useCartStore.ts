import { create } from 'zustand';
import { CartItem, CartItemOption, MenuItem, Restaurant, Coupon } from '../types';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

export interface CartRestaurantInfo {
  id: string;
  name: string;
  address: string;
  image: string;
}

export interface ConflictPendingItem {
  restaurant: CartRestaurantInfo;
  menuItem: MenuItem;
  selectedOptions?: CartItemOption[];
}

interface CartState {
  items: CartItem[];
  restaurant: CartRestaurantInfo | null;
  appliedCoupon: Coupon | null;
  cookingInstructions: string;
  tipAmount: number;
  conflictPendingItem: ConflictPendingItem | null;

  // Actions
  addItem: (
    restaurant: CartRestaurantInfo,
    menuItem: MenuItem,
    selectedOptions?: CartItemOption[]
  ) => { success: boolean; conflict?: boolean };
  resolveConflictAndAdd: () => void;
  clearConflict: () => void;
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  setCookingInstructions: (note: string) => void;
  applyCoupon: (coupon: Coupon) => { success: boolean; message: string };
  removeCoupon: () => void;
  setTip: (tip: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;

  // Calculated Getters
  getItemCount: () => number;
  getItemTotal: () => number;
  getDeliveryFee: () => number;
  getTaxesAndFees: () => number;
  getDiscountAmount: () => number;
  getGrandTotal: () => number;
  getItemQuantityInCart: (menuItemId: string) => number;
}

async function syncCartToDatabase(
  items: CartItem[],
  restaurant: CartRestaurantInfo | null,
  appliedCoupon: Coupon | null,
  cookingInstructions: string,
  tipAmount: number
) {
  if (!supabase) return;
  const user = useAuthStore.getState().user;
  const cartOwnerId = user?.id || 'guest_cart';

  try {
    await supabase.from('carts').upsert(
      {
        id: cartOwnerId,
        items,
        restaurant,
        applied_coupon: appliedCoupon,
        cooking_instructions: cookingInstructions,
        tip_amount: tipAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Failed to sync cart directly to Supabase:', err);
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurant: null,
  appliedCoupon: null,
  cookingInstructions: '',
  tipAmount: 0,
  conflictPendingItem: null,

  loadCart: async () => {
    if (!supabase) return;
    const user = useAuthStore.getState().user;
    const cartOwnerId = user?.id || 'guest_cart';

    try {
      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartOwnerId)
        .maybeSingle();

      if (!error && data) {
        set({
          items: data.items || [],
          restaurant: data.restaurant || null,
          appliedCoupon: data.applied_coupon || null,
          cookingInstructions: data.cooking_instructions || '',
          tipAmount: data.tip_amount || 0,
        });
      }
    } catch (e) {
      console.warn('Failed to load cart directly from database:', e);
    }
  },

  addItem: (restaurant, menuItem, selectedOptions = []) => {
    const currentRestaurant = get().restaurant;
    const currentItems = get().items;

    // Check for restaurant conflict
    if (currentRestaurant && currentRestaurant.id !== restaurant.id && currentItems.length > 0) {
      set({ conflictPendingItem: { restaurant, menuItem, selectedOptions } });
      return { success: false, conflict: true };
    }

    // Build unique identifier based on item id and options
    const optionsKey = selectedOptions
      .map((o) => `${o.groupId}:${o.choiceId}`)
      .sort()
      .join('|');
    const cartItemId = `${menuItem.id}__${optionsKey}`;

    const additionalSum = selectedOptions.reduce((acc, curr) => acc + curr.additionalPrice, 0);
    const unitPrice = menuItem.price + additionalSum;

    const existingIndex = currentItems.findIndex((it) => it.cartItemId === cartItemId);
    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = currentItems.map((item, index) => {
        if (index === existingIndex) {
          const qty = item.quantity + 1;
          return {
            ...item,
            quantity: qty,
            totalPrice: qty * item.unitPrice,
          };
        }
        return item;
      });
    } else {
      const newItem: CartItem = {
        cartItemId,
        menuItem,
        quantity: 1,
        selectedOptions,
        unitPrice,
        totalPrice: unitPrice,
      };
      updatedItems = [...currentItems, newItem];
    }

    set({
      restaurant,
      items: updatedItems,
      conflictPendingItem: null,
    });

    syncCartToDatabase(
      updatedItems,
      restaurant,
      get().appliedCoupon,
      get().cookingInstructions,
      get().tipAmount
    );
    return { success: true };
  },

  resolveConflictAndAdd: () => {
    const pending = get().conflictPendingItem;
    if (!pending) return;

    const { restaurant, menuItem, selectedOptions = [] } = pending;
    const optionsKey = selectedOptions
      .map((o) => `${o.groupId}:${o.choiceId}`)
      .sort()
      .join('|');
    const cartItemId = `${menuItem.id}__${optionsKey}`;
    const additionalSum = selectedOptions.reduce((acc, curr) => acc + curr.additionalPrice, 0);
    const unitPrice = menuItem.price + additionalSum;

    const newItem: CartItem = {
      cartItemId,
      menuItem,
      quantity: 1,
      selectedOptions,
      unitPrice,
      totalPrice: unitPrice,
    };

    set({
      items: [newItem],
      restaurant,
      appliedCoupon: null,
      conflictPendingItem: null,
      cookingInstructions: '',
      tipAmount: 0,
    });

    syncCartToDatabase([newItem], restaurant, null, '', 0);
  },

  clearConflict: () => set({ conflictPendingItem: null }),

  incrementItem: (cartItemId: string) => {
    const updated = get().items.map((item) => {
      if (item.cartItemId === cartItemId) {
        const quantity = item.quantity + 1;
        return { ...item, quantity, totalPrice: quantity * item.unitPrice };
      }
      return item;
    });

    set({ items: updated });
    syncCartToDatabase(
      updated,
      get().restaurant,
      get().appliedCoupon,
      get().cookingInstructions,
      get().tipAmount
    );
  },

  decrementItem: (cartItemId: string) => {
    const existing = get().items.find((i) => i.cartItemId === cartItemId);
    if (!existing) return;

    let updated: CartItem[];
    if (existing.quantity <= 1) {
      updated = get().items.filter((i) => i.cartItemId !== cartItemId);
    } else {
      updated = get().items.map((item) => {
        if (item.cartItemId === cartItemId) {
          const quantity = item.quantity - 1;
          return { ...item, quantity, totalPrice: quantity * item.unitPrice };
        }
        return item;
      });
    }

    const restaurant = updated.length === 0 ? null : get().restaurant;
    const appliedCoupon = updated.length === 0 ? null : get().appliedCoupon;

    set({ items: updated, restaurant, appliedCoupon });
    syncCartToDatabase(
      updated,
      restaurant,
      appliedCoupon,
      get().cookingInstructions,
      get().tipAmount
    );
  },

  removeItem: (cartItemId: string) => {
    const updated = get().items.filter((i) => i.cartItemId !== cartItemId);
    const restaurant = updated.length === 0 ? null : get().restaurant;
    const appliedCoupon = updated.length === 0 ? null : get().appliedCoupon;

    set({ items: updated, restaurant, appliedCoupon });
    syncCartToDatabase(
      updated,
      restaurant,
      appliedCoupon,
      get().cookingInstructions,
      get().tipAmount
    );
  },

  setCookingInstructions: (cookingInstructions: string) => {
    set({ cookingInstructions });
    syncCartToDatabase(
      get().items,
      get().restaurant,
      get().appliedCoupon,
      cookingInstructions,
      get().tipAmount
    );
  },

  applyCoupon: (coupon: Coupon) => {
    const itemTotal = get().getItemTotal();
    if (itemTotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Min order value for ${coupon.code} is ₹${coupon.minOrderValue}`,
      };
    }

    set({ appliedCoupon: coupon });
    syncCartToDatabase(
      get().items,
      get().restaurant,
      coupon,
      get().cookingInstructions,
      get().tipAmount
    );
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  },

  removeCoupon: () => {
    set({ appliedCoupon: null });
    syncCartToDatabase(
      get().items,
      get().restaurant,
      null,
      get().cookingInstructions,
      get().tipAmount
    );
  },

  setTip: (tipAmount: number) => {
    set({ tipAmount });
    syncCartToDatabase(
      get().items,
      get().restaurant,
      get().appliedCoupon,
      get().cookingInstructions,
      tipAmount
    );
  },

  clearCart: () => {
    set({
      items: [],
      restaurant: null,
      appliedCoupon: null,
      cookingInstructions: '',
      tipAmount: 0,
      conflictPendingItem: null,
    });
    syncCartToDatabase([], null, null, '', 0);
  },

  getItemCount: () => {
    return get().items.reduce((acc, curr) => acc + curr.quantity, 0);
  },

  getItemTotal: () => {
    return get().items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  },

  getDeliveryFee: () => {
    const itemTotal = get().getItemTotal();
    if (itemTotal === 0) return 0;
    const coupon = get().appliedCoupon;
    if (coupon?.code === 'FREEDEL') return 0;
    if (itemTotal >= 299) return 0; // free delivery above 299
    return 35;
  },

  getTaxesAndFees: () => {
    const itemTotal = get().getItemTotal();
    if (itemTotal === 0) return 0;
    // 5% GST + ₹5 platform fee
    return Math.round(itemTotal * 0.05 + 5);
  },

  getDiscountAmount: () => {
    const itemTotal = get().getItemTotal();
    const coupon = get().appliedCoupon;
    if (!coupon || itemTotal < coupon.minOrderValue) return 0;

    if (coupon.code === 'FREEDEL') return 35;

    if (coupon.discountType === 'flat') {
      return Math.min(coupon.discountValue, itemTotal);
    } else {
      const calculated = Math.round((itemTotal * coupon.discountValue) / 100);
      return coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
    }
  },

  getGrandTotal: () => {
    const itemTotal = get().getItemTotal();
    if (itemTotal === 0) return 0;

    const deliveryFee = get().getDeliveryFee();
    const taxesAndFees = get().getTaxesAndFees();
    const discount = get().getDiscountAmount();
    const tip = get().tipAmount;

    return Math.max(0, itemTotal + deliveryFee + taxesAndFees + tip - discount);
  },

  getItemQuantityInCart: (menuItemId: string) => {
    return get().items
      .filter((i) => i.menuItem.id === menuItemId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  },
}));
