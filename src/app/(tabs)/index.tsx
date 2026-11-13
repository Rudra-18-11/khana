import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { BannerCarousel } from '../../components/BannerCarousel';
import { CategoryBar } from '../../components/CategoryBar';
import { FilterBar } from '../../components/FilterBar';
import { RestaurantCard } from '../../components/RestaurantCard';
import { FloatingCart } from '../../components/FloatingCart';
import { useAddressStore } from '../../stores/useAddressStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useCartStore } from '../../stores/useCartStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { fetchRestaurants } from '../../services/supabase';
import { Restaurant } from '../../types';
import { Colors } from '../../constants/theme';
import { Search, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { favorites, loadFavorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const { isVegOnly, minRating, hasOffersOnly, sortBy } = useFilterStore();
  const {
    conflictPendingItem,
    resolveConflictAndAdd,
    clearConflict,
    restaurant: cartRestaurant,
  } = useCartStore();
  const pastOrders = useOrderStore((state) => state.orders);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchRestaurants();
      setRestaurants(data);
      setLoading(false);
      loadFavorites();
    }
    loadData();
  }, [loadFavorites]);

  // Filtered & Sorted Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        // Veg Only Filter
        if (isVegOnly && !r.isPureVeg) return false;

        // Rating Filter
        if (minRating && r.rating < minRating) return false;

        // Offers Filter
        if (hasOffersOnly && !r.discountTag) return false;

        // Category Filter
        if (selectedCategory) {
          const matchCuisine = r.cuisines.some((c) =>
            c.toLowerCase().includes(selectedCategory.replace('_', ' ').toLowerCase())
          );
          const matchItems = r.categories?.some((cat) =>
            cat.items.some((item) =>
              item.name.toLowerCase().includes(selectedCategory.replace('_', ' ').toLowerCase())
            )
          );
          if (!matchCuisine && !matchItems) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'delivery_time') return a.deliveryTimeMin - b.deliveryTimeMin;
        if (sortBy === 'cost_low_to_high') return a.costForTwo - b.costForTwo;
        if (sortBy === 'cost_high_to_low') return b.costForTwo - a.costForTwo;
        return 0;
      });
  }, [restaurants, isVegOnly, minRating, hasOffersOnly, selectedCategory, sortBy]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Address & Profile Header */}
      <Header address={selectedAddress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar Shortcut */}
        <TouchableOpacity
          style={styles.searchShortcut}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Search size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder}>
            Search dishes or restaurants on KHANA...
          </Text>
        </TouchableOpacity>

        {/* Offers Carousel */}
        <BannerCarousel
          onSelectCoupon={(code) => {
            router.push('/(tabs)/search');
          }}
        />

        {/* What's On Your Mind - Category Circles */}
        <CategoryBar
          selectedCategoryId={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />

        {/* Filter Bar */}
        <FilterBar />

        {/* Order Again Section (if user has completed orders) */}
        {pastOrders.length > 0 && (
          <View style={styles.orderAgainSection}>
            <View style={styles.sectionHeaderRow}>
              <RotateCcw size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>ORDER AGAIN</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderAgainScroll}>
              {pastOrders.slice(0, 3).map((ord) => (
                <TouchableOpacity
                  key={ord.id}
                  style={styles.orderAgainCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/restaurant/${ord.restaurantId}`)}
                >
                  <Text style={styles.orderAgainRest} numberOfLines={1}>
                    {ord.restaurantName}
                  </Text>
                  <Text style={styles.orderAgainItems} numberOfLines={1}>
                    {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </Text>
                  <Text style={styles.orderAgainTotal}>₹{ord.grandTotal}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Restaurants Feed Header */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>
            {filteredRestaurants.length} RESTAURANTS TO EXPLORE
          </Text>
        </View>

        {/* Restaurant Cards List */}
        <View style={styles.listContainer}>
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={favorites.includes(restaurant.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}

          {filteredRestaurants.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching restaurants</Text>
              <Text style={styles.emptySubtitle}>
                Try clearing your filters or changing your search criteria.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <FloatingCart />

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
              Your cart already contains items from{' '}
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
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchPlaceholder: {
    fontSize: 13,
    color: Colors.mutedText,
    flex: 1,
  },
  orderAgainSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
  },
  orderAgainScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  orderAgainCard: {
    width: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderAgainRest: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.darkText,
  },
  orderAgainItems: {
    fontSize: 11,
    color: Colors.subText,
    marginVertical: 3,
  },
  orderAgainTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  feedHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkText,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.subText,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
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
