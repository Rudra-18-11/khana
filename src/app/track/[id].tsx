import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrderStore } from '../../stores/useOrderStore';
import { supabase } from '../../services/supabase';
import { Order, OrderStatus } from '../../types';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { Colors, Shadows } from '../../constants/theme';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Shield,
  ArrowLeft,
  Bike,
  Receipt,
  Home,
} from 'lucide-react-native';

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, advanceOrderStatus, cancelOrder } = useOrderStore();
  const storeOrder = getOrderById(id || '');
  const [order, setOrder] = useState<Order | null>(storeOrder || null);
  const [loading, setLoading] = useState(!storeOrder);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchLiveOrder() {
      if (supabase) {
        try {
          const { data: dbOrder, error } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(*),
              restaurant:restaurants(id, name, address, cover_image)
            `)
            .eq('id', id)
            .maybeSingle();

          if (!error && dbOrder && isMounted) {
            const mappedOrder: Order = {
              id: dbOrder.id,
              orderNumber: dbOrder.order_number,
              restaurantId: dbOrder.restaurant_id,
              restaurantName: dbOrder.restaurant?.name || 'KHANA Kitchen',
              restaurantAddress:
                dbOrder.restaurant?.address || dbOrder.address_snapshot?.addressLine1 || '',
              restaurantImage:
                dbOrder.restaurant?.cover_image ||
                'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
              items: (dbOrder.items || []).map((it: any) => ({
                id: it.id,
                menuItemId: it.menu_item_id || it.id,
                name: it.name,
                price: Math.round((it.unit_price || 0) / 100),
                quantity: it.quantity,
                isVeg: true,
                selectedOptions: it.selected_options || [],
                totalPrice: Math.round((it.total_price || 0) / 100),
              })),
              deliveryAddress: dbOrder.address_snapshot || {
                id: 'addr-default',
                label: 'Home',
                addressLine1: 'Indiranagar',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560038',
                latitude: 12.9716,
                longitude: 77.5946,
              },
              status: dbOrder.status as OrderStatus,
              paymentMethod: dbOrder.payment_method,
              paymentStatus: dbOrder.payment_status,
              itemTotal: Math.round((dbOrder.item_total || 0) / 100),
              deliveryFee: Math.round((dbOrder.delivery_fee || 0) / 100),
              taxesAndFees: Math.round((dbOrder.taxes_and_fees || 0) / 100),
              discountAmount: Math.round((dbOrder.discount_amount || 0) / 100),
              tipAmount: Math.round((dbOrder.tip_amount || 0) / 100),
              grandTotal: Math.round((dbOrder.grand_total || 0) / 100),
              cookingInstructions: dbOrder.cooking_instructions || '',
              deliveryOtp: dbOrder.delivery_otp || '4829',
              estimatedDeliveryMinutes: 30,
              placedAt: dbOrder.created_at,
              rider: {
                id: 'rider-01',
                name: 'Ramesh Kumar',
                phone: '+91 98450 12345',
                rating: 4.8,
                vehicleNumber: 'KA 03 EN 4829',
                avatarUrl:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                currentLat: 12.9716,
                currentLng: 77.6412,
              },
            };
            setOrder(mappedOrder);
          }
        } catch (e) {
          console.warn('Direct fetch live order failed:', e);
        }
      }
      if (isMounted) setLoading(false);
    }

    fetchLiveOrder();

    // Supabase Realtime Listener for status changes
    let channel: any;
    if (supabase) {
      channel = supabase
        .channel(`order-track-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`,
          },
          (payload: any) => {
            if (payload.new && payload.new.status) {
              setOrder((prev) => (prev ? { ...prev, status: payload.new.status } : prev));
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [id]);

  if (!order && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Order not found</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={styles.btnText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Loading live order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          const res = await cancelOrder(order.id);
          Alert.alert(res.success ? 'Order Cancelled' : 'Action Failed', res.message);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with ETA */}
      <View style={styles.topBar}>
        <View style={styles.etaContainer}>
          <Clock size={20} color={Colors.primary} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
            <Text style={styles.etaTime}>
              {order.status === 'delivered'
                ? 'Delivered'
                : `${order.estimatedDeliveryMinutes} Minutes`}
            </Text>
          </View>
        </View>

        <View style={styles.orderNumberBadge}>
          <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Route Visualizer Card (FR-35) */}
        <View style={[styles.mapCard, Shadows.card]}>
          <View style={styles.mapGraphic}>
            {/* Restaurant Pin */}
            <View style={styles.pinRest}>
              <View style={styles.pinCircleRest}>
                <Text style={{ fontSize: 16 }}>🍽️</Text>
              </View>
              <Text style={styles.pinLabelRest}>{order.restaurantName}</Text>
            </View>

            {/* Simulated Animated Road / Track */}
            <View style={styles.roadTrack}>
              <View
                style={[
                  styles.riderMover,
                  order.status === 'out_for_delivery' && { left: '55%' },
                  order.status === 'delivered' && { left: '85%' },
                  ['placed', 'accepted', 'preparing'].includes(order.status) && { left: '10%' },
                ]}
              >
                <View style={styles.bikeIconContainer}>
                  <Bike size={16} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Customer Pin */}
            <View style={styles.pinUser}>
              <View style={styles.pinCircleUser}>
                <Home size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.pinLabelUser}>Delivery Address</Text>
            </View>
          </View>

          <View style={styles.mapFooter}>
            <MapPin size={14} color={Colors.subText} style={{ marginRight: 4 }} />
            <Text style={styles.mapAddress} numberOfLines={1}>
              {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
            </Text>
          </View>
        </View>

        {/* Live Order Status Timeline (FR-33 & FR-34) */}
        <OrderStatusTimeline
          order={order}
          onAdvanceStatus={() => advanceOrderStatus(order.id)}
          onCancelOrder={handleCancel}
        />

        {/* Order Items & Receipt Card (FR-38) */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Receipt size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.receiptTitle}>ORDER DETAILS</Text>
          </View>

          <View style={styles.receiptRestRow}>
            <Image source={{ uri: order.restaurantImage }} style={styles.receiptRestImg} />
            <View>
              <Text style={styles.receiptRestName}>{order.restaurantName}</Text>
              <Text style={styles.receiptRestLoc}>{order.restaurantAddress}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items */}
          {order.items.map((item) => (
            <View key={item.id} style={styles.receiptItemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Bill summary */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billVal}>₹{order.itemTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery & Platform Fee</Text>
            <Text style={styles.billVal}>₹{order.deliveryFee + order.taxesAndFees}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: Colors.secondary }]}>Discount</Text>
              <Text style={[styles.billVal, { color: Colors.secondary }]}>
                -₹{order.discountAmount}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>PAID VIA {order.paymentMethod.toUpperCase()}</Text>
            <Text style={styles.grandTotalVal}>₹{order.grandTotal}</Text>
          </View>
        </View>

        {/* Back to Home CTA */}
        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.5,
  },
  etaTime: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkText,
  },
  orderNumberBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkText,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  mapGraphic: {
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  pinRest: {
    position: 'absolute',
    left: 16,
    alignItems: 'center',
  },
  pinCircleRest: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF4EB',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLabelRest: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.darkText,
    marginTop: 4,
    maxWidth: 70,
    textAlign: 'center',
  },
  pinUser: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
  },
  pinCircleUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLabelUser: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.darkText,
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
  roadTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginHorizontal: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  riderMover: {
    position: 'absolute',
    top: -12,
  },
  bikeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  mapAddress: {
    fontSize: 12,
    color: Colors.subText,
    flex: 1,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
  },
  receiptRestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptRestImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  receiptRestName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
  },
  receiptRestLoc: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkText,
    width: 24,
  },
  itemName: {
    fontSize: 13,
    color: Colors.darkText,
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: Colors.subText,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkText,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkText,
  },
  homeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
