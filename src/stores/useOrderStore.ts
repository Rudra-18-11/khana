import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Order, OrderStatus, PaymentMethod, Address, CartItem, OrderItem } from '../types';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

const RESTAURANT_ID_MAP: Record<string, string> = {
  'rest-1': '11111111-1111-1111-1111-111111111111',
  'rest-2': '22222222-2222-2222-2222-222222222222',
  'rest-3': '33333333-3333-3333-3333-333333333333',
  'rest-4': '44444444-4444-4444-4444-444444444444',
  'rest-5': '55555555-5555-5555-5555-555555555555',
  'rest-6': '66666666-6666-6666-6666-666666666666',
};

interface CreateOrderInput {
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantImage: string;
  items: CartItem[];
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  itemTotal: number;
  deliveryFee: number;
  taxesAndFees: number;
  discountAmount: number;
  tipAmount: number;
  grandTotal: number;
  appliedCoupon?: string;
  cookingInstructions?: string;
}

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  isLoading: boolean;

  loadOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  advanceOrderStatus: (orderId: string) => Promise<void>;
  rateOrder: (
    orderId: string,
    restaurantRating: number,
    deliveryRating: number,
    comment?: string
  ) => Promise<void>;
  setActiveOrder: (order: Order | null) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const ORDER_LIFECYCLE: OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,
  isLoading: false,

  loadOrders: async () => {
    if (!supabase) return;
    set({ isLoading: true });

    try {
      const user = useAuthStore.getState().user;
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          restaurant:restaurants(id, name, address, cover_image)
        `)
        .order('created_at', { ascending: false });

      if (user?.id) {
        query = query.eq('customer_id', user.id);
      }

      const { data: dbOrders, error } = await query;

      if (!error && dbOrders) {
        const mappedOrders: Order[] = dbOrders.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          restaurantId: row.restaurant_id,
          restaurantName: row.restaurant?.name || 'KHANA Kitchen',
          restaurantAddress: row.restaurant?.address || row.address_snapshot?.addressLine1 || '',
          restaurantImage:
            row.restaurant?.cover_image ||
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
          items: (row.items || []).map((it: any) => ({
            id: it.id,
            menuItemId: it.menu_item_id || it.id,
            name: it.name,
            price: Math.round((it.unit_price || 0) / 100),
            quantity: it.quantity,
            isVeg: true,
            selectedOptions: it.selected_options || [],
            totalPrice: Math.round((it.total_price || 0) / 100),
          })),
          deliveryAddress: row.address_snapshot || {
            id: 'addr-default',
            label: 'Home',
            addressLine1: 'Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            latitude: 12.9716,
            longitude: 77.5946,
          },
          status: row.status as OrderStatus,
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          itemTotal: Math.round((row.item_total || 0) / 100),
          deliveryFee: Math.round((row.delivery_fee || 0) / 100),
          taxesAndFees: Math.round((row.taxes_and_fees || 0) / 100),
          discountAmount: Math.round((row.discount_amount || 0) / 100),
          tipAmount: Math.round((row.tip_amount || 0) / 100),
          grandTotal: Math.round((row.grand_total || 0) / 100),
          cookingInstructions: row.cooking_instructions || '',
          deliveryOtp: row.delivery_otp || '4829',
          estimatedDeliveryMinutes: 30,
          placedAt: row.created_at,
          rider: {
            id: 'rider-01',
            name: 'Ramesh Kumar',
            phone: '+91 98450 12345',
            rating: 4.8,
            vehicleNumber: 'KA 03 EN 4829',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
            currentLat: 12.9716,
            currentLng: 77.6412,
          },
        }));

        set({
          orders: mappedOrders,
          activeOrder:
            mappedOrders.find((o) => !['delivered', 'cancelled', 'rejected'].includes(o.status)) ||
            null,
          isLoading: false,
        });
        return;
      }
    } catch (dbErr) {
      console.warn('Direct database order loading error:', dbErr);
    }

    set({ isLoading: false });
  },

  createOrder: async (input: CreateOrderInput) => {
    const orderUuid = Crypto.randomUUID();
    const orderNumber = `KHN-${Math.floor(100000 + Math.random() * 900000)}`;
    const deliveryOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const user = useAuthStore.getState().user;
    const customerId = user?.id || 'user_demo_customer_1';

    // Map restaurant ID to valid Supabase UUID if mock ID
    const validRestaurantId = RESTAURANT_ID_MAP[input.restaurantId] || input.restaurantId;

    // 1. Direct Supabase Database Insert
    if (supabase) {
      try {
        // A. Ensure customer profile exists in Supabase
        await supabase.from('profiles').upsert(
          {
            id: customerId,
            email: user?.email || `${customerId}@khana.app`,
            full_name: user?.name || 'KHANA Foodie',
            phone: user?.phone || '+91 98765 43210',
            role: user?.role || 'customer',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        // B. Insert Order Header directly into Supabase (integer paise)
        const { error: ordErr } = await supabase.from('orders').insert({
          id: orderUuid,
          order_number: orderNumber,
          customer_id: customerId,
          restaurant_id: validRestaurantId,
          address_snapshot: input.deliveryAddress,
          status: 'placed',
          payment_status: input.paymentMethod === 'cod' ? 'pending' : 'paid',
          payment_method: input.paymentMethod,
          item_total: Math.round(input.itemTotal * 100),
          delivery_fee: Math.round(input.deliveryFee * 100),
          taxes_and_fees: Math.round(input.taxesAndFees * 100),
          discount_amount: Math.round(input.discountAmount * 100),
          tip_amount: Math.round(input.tipAmount * 100),
          grand_total: Math.round(input.grandTotal * 100),
          cooking_instructions: input.cookingInstructions || null,
          delivery_otp: deliveryOtp,
        });

        if (ordErr) {
          console.warn('Direct Supabase order insert error:', ordErr);
        } else {
          // C. Insert Order Line Items directly
          const itemsPayload = input.items.map((it) => ({
            id: Crypto.randomUUID(),
            order_id: orderUuid,
            menu_item_id:
              it.menuItem.id.includes('-') && it.menuItem.id.length === 36 ? it.menuItem.id : null,
            name: it.menuItem.name,
            unit_price: Math.round(it.unitPrice * 100),
            quantity: it.quantity,
            selected_options: it.selectedOptions || [],
            total_price: Math.round(it.totalPrice * 100),
          }));

          const { error: itemErr } = await supabase.from('order_items').insert(itemsPayload);
          if (itemErr) {
            console.warn('Direct Supabase order items error:', itemErr);
          }

          // D. Insert Payment directly into database
          const { error: payErr } = await supabase.from('payments').insert({
            id: Crypto.randomUUID(),
            order_id: orderUuid,
            amount: Math.round(input.grandTotal * 100),
            currency: 'INR',
            status: input.paymentMethod === 'cod' ? 'pending' : 'paid',
            provider: input.paymentMethod === 'cod' ? 'cod' : 'razorpay',
            payment_method: input.paymentMethod,
            transaction_id: `txn_${Date.now()}`,
          });
          if (payErr) {
            console.warn('Direct Supabase payment insert error:', payErr);
          }
        }
      } catch (dbError) {
        console.warn('Supabase order creation exception:', dbError);
      }
    }

    // 2. Prepare in-memory order object
    const orderItems: OrderItem[] = input.items.map((it) => ({
      id: Crypto.randomUUID(),
      menuItemId: it.menuItem.id,
      name: it.menuItem.name,
      price: it.unitPrice,
      quantity: it.quantity,
      isVeg: it.menuItem.isVeg,
      selectedOptions: it.selectedOptions,
      totalPrice: it.totalPrice,
    }));

    const newOrder: Order = {
      id: orderUuid,
      orderNumber,
      restaurantId: validRestaurantId,
      restaurantName: input.restaurantName,
      restaurantAddress: input.restaurantAddress,
      restaurantImage: input.restaurantImage,
      items: orderItems,
      deliveryAddress: input.deliveryAddress,
      status: 'placed',
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'paid',
      itemTotal: input.itemTotal,
      deliveryFee: input.deliveryFee,
      taxesAndFees: input.taxesAndFees,
      discountAmount: input.discountAmount,
      tipAmount: input.tipAmount,
      grandTotal: input.grandTotal,
      appliedCoupon: input.appliedCoupon,
      cookingInstructions: input.cookingInstructions,
      deliveryOtp,
      estimatedDeliveryMinutes: 30,
      placedAt: new Date().toISOString(),
      rider: {
        id: 'rider-01',
        name: 'Ramesh Kumar',
        phone: '+91 98450 12345',
        rating: 4.8,
        vehicleNumber: 'KA 03 EN 4829',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        currentLat: 12.9716,
        currentLng: 77.6412,
      },
    };

    const updatedOrders = [newOrder, ...get().orders];
    set({ orders: updatedOrders, activeOrder: newOrder });

    // Auto-advance order status:
    setTimeout(() => {
      get().advanceOrderStatus(newOrder.id);
    }, 4000);

    setTimeout(() => {
      get().advanceOrderStatus(newOrder.id);
    }, 10000);

    return newOrder;
  },

  cancelOrder: async (orderId: string) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.status !== 'placed') {
      return {
        success: false,
        message: 'Order cannot be cancelled after restaurant has accepted it.',
      };
    }

    const updatedOrders = get().orders.map((o) =>
      o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
    );

    set({
      orders: updatedOrders,
      activeOrder: get().activeOrder?.id === orderId ? null : get().activeOrder,
    });

    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.warn('Direct database order cancellation error:', err);
      }
    }

    return { success: true, message: 'Order cancelled successfully.' };
  },

  advanceOrderStatus: async (orderId: string) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (
      !order ||
      order.status === 'delivered' ||
      order.status === 'cancelled' ||
      order.status === 'rejected'
    ) {
      return;
    }

    const currentIndex = ORDER_LIFECYCLE.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= ORDER_LIFECYCLE.length - 1) return;

    const nextStatus = ORDER_LIFECYCLE[currentIndex + 1];

    const updatedOrders = get().orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: nextStatus,
            deliveredAt: nextStatus === 'delivered' ? new Date().toISOString() : undefined,
          }
        : o
    );

    const updatedActive =
      nextStatus === 'delivered'
        ? null
        : get().activeOrder?.id === orderId
        ? { ...order, status: nextStatus }
        : get().activeOrder;

    set({ orders: updatedOrders, activeOrder: updatedActive });

    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.warn('Direct database order advance error:', err);
      }
    }
  },

  rateOrder: async (
    orderId: string,
    restaurantRating: number,
    deliveryRating: number,
    comment?: string
  ) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (supabase && order) {
      try {
        const user = useAuthStore.getState().user;
        await supabase.from('reviews').insert({
          id: Crypto.randomUUID(),
          order_id: orderId,
          customer_id: user?.id || null,
          restaurant_id: order.restaurantId,
          restaurant_rating: restaurantRating,
          delivery_rating: deliveryRating,
          comment: comment || null,
        });
      } catch (err) {
        console.warn('Direct database review insert error:', err);
      }
    }
  },

  setActiveOrder: (order: Order | null) => {
    set({ activeOrder: order });
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((o) => o.id === orderId);
  },
}));
