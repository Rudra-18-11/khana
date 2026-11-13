import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '../../stores/useOrderStore';
import { useCartStore } from '../../stores/useCartStore';
import { supabase } from '../../services/supabase';
import { Colors, Shadows } from '../../constants/theme';
import { Order, OrderStatus } from '../../types';
import { Clock, RotateCcw, ChevronRight, CheckCircle2, Star, Bike } from 'lucide-react-native';
import { router } from 'expo-router';

export default function OrdersScreen() {
  const { orders, activeOrder, loadOrders, rateOrder } = useOrderStore();
  const { addItem, clearCart } = useCartStore();
  const [ratedOrders, setRatedOrders] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadReviewsFromDatabase = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('reviews').select('order_id, restaurant_rating');
      if (data) {
        const mapped: Record<string, number> = {};
        data.forEach((r: any) => {
          if (r.order_id && r.restaurant_rating) {
            mapped[r.order_id] = r.restaurant_rating;
          }
        });
        setRatedOrders(mapped);
      }
    } catch (e) {
      console.warn('Failed to load reviews from database:', e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadReviewsFromDatabase();
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadReviewsFromDatabase()]);
    setRefreshing(false);
  };

  const handleRate = async (orderId: string, rating: number) => {
    setRatedOrders((prev) => ({ ...prev, [orderId]: rating }));
    await rateOrder(orderId, rating, rating, 'Customer direct rating');
  };

  const handleReorder = (order: Order) => {
    Alert.alert(
      'Reorder items?',
      `This will add ${order.items.length} items from ${order.restaurantName} to your cart.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reorder',
          onPress: () => {
            clearCart();
            order.items.forEach((item) => {
              addItem(
                {
                  id: order.restaurantId,
                  name: order.restaurantName,
                  address: order.restaurantAddress,
                  image: order.restaurantImage,
                },
                {
                  id: item.menuItemId,
                  restaurantId: order.restaurantId,
                  categoryId: 'reorder',
                  name: item.name,
                  description: '',
                  price: item.price,
                  isVeg: item.isVeg,
                  isAvailable: true,
                  imageUrl: order.restaurantImage,
                },
                item.selectedOptions
              );
            });
            router.push('/cart');
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { label: 'Delivered', bg: '#EDF8EE', color: Colors.secondary };
      case 'cancelled':
      case 'rejected':
        return { label: 'Cancelled', bg: Colors.dangerLight, color: Colors.danger };
      default:
        return { label: 'In Progress', bg: Colors.primaryLight, color: Colors.primaryDark };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
      >
        {/* Active Order Card */}
        {activeOrder && activeOrder.status !== 'delivered' && (
          <TouchableOpacity
            style={[styles.activeCard, Shadows.card]}
            activeOpacity={0.9}
            onPress={() => router.push(`/track/${activeOrder.id}`)}
          >
            <View style={styles.activeHeader}>
              <View style={styles.pulsingDot} />
              <Text style={styles.activeStatusText}>
                ORDER {activeOrder.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.activeContent}>
              <Image source={{ uri: activeOrder.restaurantImage }} style={styles.activeRestImg} />
              <View style={styles.activeDetails}>
                <Text style={styles.activeRestName}>{activeOrder.restaurantName}</Text>
                <Text style={styles.activeItems} numberOfLines={1}>
                  {activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
                <Text style={styles.activeTotal}>₹{activeOrder.grandTotal}</Text>
              </View>
            </View>

            <View style={styles.activeAction}>
              <Text style={styles.trackActionText}>Track Live Order</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Past Orders Heading */}
        <Text style={styles.sectionHeading}>PAST ORDERS</Text>

        {orders.map((order) => {
          const badge = getStatusBadge(order.status);
          const currentRating = ratedOrders[order.id];

          return (
            <View key={order.id} style={[styles.orderCard, Shadows.small]}>
              {/* Restaurant Header */}
              <View style={styles.cardHeader}>
                <Image source={{ uri: order.restaurantImage }} style={styles.restThumb} />
                <View style={styles.restInfo}>
                  <Text style={styles.restName}>{order.restaurantName}</Text>
                  <Text style={styles.restLoc}>{order.restaurantAddress}</Text>
                  <Text style={styles.dateText}>
                    {new Date(order.placedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Items List */}
              <View style={styles.itemsBlock}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Total and Reorder Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total Bill</Text>
                  <Text style={styles.totalAmount}>₹{order.grandTotal}</Text>
                </View>

                <View style={styles.footerActions}>
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => router.push(`/track/${order.id}`)}
                  >
                    <Text style={styles.trackBtnText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => handleReorder(order)}
                  >
                    <RotateCcw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.reorderBtnText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5-Star Rating Row (FR-40) */}
              {order.status === 'delivered' && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingPrompt}>Rate this order:</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRate(order.id, star)}
                        style={{ padding: 4 }}
                      >
                        <Star
                          size={18}
                          color={star <= (currentRating || 0) ? '#F59E0B' : '#CBD5E1'}
                          fill={star <= (currentRating || 0) ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {orders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Clock size={48} color={Colors.mutedText} />
            <Text style={styles.emptyTitle}>No past orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven&apos;t ordered anything yet. Explore delicious restaurants near you!
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreBtnText}>Find Food Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
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
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRestImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  activeDetails: {
    flex: 1,
  },
  activeRestName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  activeItems: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  activeTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.darkText,
    marginTop: 2,
  },
  activeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  trackActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  restInfo: {
    flex: 1,
  },
  restName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  restLoc: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  itemsBlock: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: Colors.mutedText,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkText,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  ratingPrompt: {
    fontSize: 12,
    color: Colors.subText,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkText,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.subText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
