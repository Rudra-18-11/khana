import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { fetchRestaurantById } from '../../services/supabase';
import { Restaurant, MenuItem, CartItemOption } from '../../types';
import { DishItem } from '../../components/DishItem';
import { CustomizationModal } from '../../components/CustomizationModal';
import { FloatingCart } from '../../components/FloatingCart';
import { useCartStore } from '../../stores/useCartStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { Colors, Shadows } from '../../constants/theme';
import {
  ArrowLeft,
  Star,
  Clock,
  Heart,
  Share2,
  Search,
  MapPin,
  Sparkles,
} from 'lucide-react-native';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const { isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore();
  const currentIsFav = id ? isFavorite(id) : false;

  const {
    addItem,
    incrementItem,
    decrementItem,
    getItemQuantityInCart,
    conflictPendingItem,
    resolveConflictAndAdd,
    clearConflict,
    restaurant: cartRestaurant,
    items: cartItems,
  } = useCartStore();

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await fetchRestaurantById(id);
      if (data) {
        setRestaurant(data);
        if (data.categories && data.categories.length > 0) {
          setActiveCategoryTab(data.categories[0].id);
        }
      }
      setLoading(false);
    }
    load();
    loadFavorites();
  }, [id, loadFavorites]);

  const handleAdd = (item: MenuItem) => {
    if (!restaurant) return;
    const hasValidOptions =
      Boolean(item.hasCustomization) &&
      Array.isArray(item.optionGroups) &&
      item.optionGroups.length > 0;

    if (hasValidOptions) {
      setCustomizingItem(item);
    } else {
      addItem(
        {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          image: restaurant.coverImage,
        },
        item
      );
    }
  };

  const handleConfirmCustomization = (item: MenuItem, selectedOptions: CartItemOption[]) => {
    if (!restaurant) return;
    addItem(
      {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        image: restaurant.coverImage,
      },
      item,
      selectedOptions
    );
  };

  if (!restaurant && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Restaurant not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundIconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkText} />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.roundIconBtn}
            onPress={() => {
              if (id) toggleFavorite(id);
            }}
          >
            <Heart
              size={20}
              color={currentIsFav ? Colors.danger : Colors.darkText}
              fill={currentIsFav ? Colors.danger : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {restaurant && (
          <>
            {/* Restaurant Meta Card */}
            <View style={[styles.metaCard, Shadows.card]}>
              <View style={styles.metaTitleRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.cuisines}>{restaurant.cuisines.join(', ')}</Text>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {restaurant.address} • {restaurant.distanceKm || 2.1} km
                  </Text>
                </View>

                {/* Rating Card */}
                <View style={styles.ratingCard}>
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.ratingNumber}>{restaurant.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.ratingCountText}>{restaurant.ratingCount}+ ratings</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.deliveryInfoRow}>
                <View style={styles.deliveryBadge}>
                  <Clock size={14} color={Colors.darkText} style={{ marginRight: 4 }} />
                  <Text style={styles.deliveryText}>
                    {restaurant.deliveryTimeMin}-{restaurant.deliveryTimeMax} MINS
                  </Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.costText}>₹{restaurant.costForTwo} for two</Text>
              </View>

              {restaurant.discountTag && (
                <View style={styles.offerBadge}>
                  <Sparkles size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.offerText}>{restaurant.discountTag}</Text>
                </View>
              )}
            </View>

            {/* Veg Only Toggle Filter (FR-20) */}
            <View style={styles.filterSection}>
              <View style={styles.vegToggleRow}>
                <Text style={styles.vegToggleLabel}>Veg Only</Text>
                <Switch
                  value={isVegOnly}
                  onValueChange={setIsVegOnly}
                  trackColor={{ false: '#CBD5E1', true: Colors.secondaryLight }}
                  thumbColor={isVegOnly ? Colors.secondary : '#FFFFFF'}
                />
              </View>
            </View>

            {/* Categorized Menu (FR-19) */}
            {restaurant.categories?.map((cat) => {
              const items = isVegOnly ? cat.items.filter((i) => i.isVeg) : cat.items;
              if (items.length === 0) return null;

              return (
                <View key={cat.id} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>
                      {cat.name} ({items.length})
                    </Text>
                  </View>

                  {items.map((dish) => {
                    const cartQty = getItemQuantityInCart(dish.id);
                    return (
                      <DishItem
                        key={dish.id}
                        item={dish}
                        quantityInCart={cartQty}
                        onPressAdd={handleAdd}
                        onPressIncrement={() => {
                          const found = cartItems.find((ci) => ci.menuItem.id === dish.id);
                          if (found) incrementItem(found.cartItemId);
                        }}
                        onPressDecrement={() => {
                          const found = cartItems.find((ci) => ci.menuItem.id === dish.id);
                          if (found) decrementItem(found.cartItemId);
                        }}
                      />
                    );
                  })}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <FloatingCart />

      {/* Customization Modal (FR-21) */}
      <CustomizationModal
        visible={Boolean(customizingItem)}
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onConfirm={handleConfirmCustomization}
      />

      {/* Cart Conflict Modal (FR-23) */}
      <Modal
        visible={Boolean(conflictPendingItem)}
        transparent
        animationType="fade"
        onRequestClose={clearConflict}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Replace items in cart?</Text>
            <Text style={styles.modalBody}>
              Your cart has items from{' '}
              <Text style={{ fontWeight: '800' }}>{cartRestaurant?.name}</Text>. Discard
              them to add items from{' '}
              <Text style={{ fontWeight: '800' }}>
                {conflictPendingItem?.restaurant.name}
              </Text>
              ?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={clearConflict}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={resolveConflictAndAdd}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Replace Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  roundIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  metaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.darkText,
    marginBottom: 4,
  },
  cuisines: {
    fontSize: 13,
    color: Colors.subText,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  ratingCard: {
    backgroundColor: Colors.ratingGreen,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  ratingCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkText,
  },
  dot: {
    marginHorizontal: 8,
    color: Colors.mutedText,
  },
  costText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkText,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  offerText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  vegToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegToggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  categoryBlock: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13,
    color: Colors.subText,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.subText,
  },
  modalConfirmBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
