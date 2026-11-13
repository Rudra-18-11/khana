import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, TrendingUp, Clock, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { fetchRestaurants } from '../../services/supabase';
import { Restaurant, MenuItem, CartItemOption } from '../../types';
import { RestaurantCard } from '../../components/RestaurantCard';
import { DishItem } from '../../components/DishItem';
import { CustomizationModal } from '../../components/CustomizationModal';
import { FloatingCart } from '../../components/FloatingCart';
import { useCartStore } from '../../stores/useCartStore';
import { router } from 'expo-router';

const POPULAR_SEARCHES = ['Biryani', 'Pizza', 'Burger', 'Chole Bhature', 'Waffles', 'Chai', 'Momo'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'restaurants' | 'dishes'>('all');
  const [selectedCustomItem, setSelectedCustomItem] = useState<{
    item: MenuItem;
    restaurant: Restaurant;
  } | null>(null);

  const {
    addItem,
    incrementItem,
    decrementItem,
    getItemQuantityInCart,
    items: cartItems,
  } = useCartStore();

  useEffect(() => {
    async function load() {
      const data = await fetchRestaurants();
      setRestaurants(data);
    }
    load();
  }, []);

  // Filtered Restaurants and Dishes matching query
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { matchingRestaurants: [], matchingDishes: [] };
    }

    const matchingRestaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(trimmed) ||
        r.cuisines.some((c) => c.toLowerCase().includes(trimmed))
    );

    const matchingDishes: { item: MenuItem; restaurant: Restaurant }[] = [];
    restaurants.forEach((rest) => {
      rest.categories?.forEach((cat) => {
        cat.items.forEach((dish) => {
          if (
            dish.name.toLowerCase().includes(trimmed) ||
            dish.description.toLowerCase().includes(trimmed)
          ) {
            matchingDishes.push({ item: dish, restaurant: rest });
          }
        });
      });
    });

    return { matchingRestaurants, matchingDishes };
  }, [query, restaurants]);

  const handleAddDish = (dish: MenuItem, rest: Restaurant) => {
    const hasValidOptions =
      Boolean(dish.hasCustomization) &&
      Array.isArray(dish.optionGroups) &&
      dish.optionGroups.length > 0;

    if (hasValidOptions) {
      setSelectedCustomItem({ item: dish, restaurant: rest });
    } else {
      addItem(
        {
          id: rest.id,
          name: rest.name,
          address: rest.address,
          image: rest.coverImage,
        },
        dish
      );
    }
  };

  const handleConfirmCustom = (dish: MenuItem, options: CartItemOption[]) => {
    if (!selectedCustomItem) return;
    addItem(
      {
        id: selectedCustomItem.restaurant.id,
        name: selectedCustomItem.restaurant.name,
        address: selectedCustomItem.restaurant.address,
        image: selectedCustomItem.restaurant.coverImage,
      },
      dish,
      options
    );
  };

  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Input Box */}
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchInputRow}>
          <SearchIcon size={20} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Search for restaurants and food"
            placeholderTextColor={Colors.mutedText}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            returnKeyType="search"
          />
          {hasQuery && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <X size={16} color={Colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filters (Restaurants vs Dishes) */}
        {hasQuery && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'restaurants' && styles.tabBtnActive]}
              onPress={() => setActiveTab('restaurants')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'restaurants' && styles.tabTextActive,
                ]}
              >
                Restaurants ({searchResults.matchingRestaurants.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'dishes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('dishes')}
            >
              <Text style={[styles.tabText, activeTab === 'dishes' && styles.tabTextActive]}>
                Dishes ({searchResults.matchingDishes.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Popular / Trending Suggestions if query is empty */}
        {!hasQuery && (
          <View style={styles.trendingSection}>
            <View style={styles.trendingHeader}>
              <TrendingUp size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.trendingTitle}>POPULAR SEARCHES</Text>
            </View>
            <View style={styles.chipsWrap}>
              {POPULAR_SEARCHES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.popularChip}
                  activeOpacity={0.7}
                  onPress={() => setQuery(item)}
                >
                  <SearchIcon size={12} color={Colors.subText} style={{ marginRight: 4 }} />
                  <Text style={styles.chipLabel}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {hasQuery && (
          <View style={styles.resultsContainer}>
            {/* Matching Dishes */}
            {(activeTab === 'all' || activeTab === 'dishes') &&
              searchResults.matchingDishes.length > 0 && (
                <View style={styles.dishResultsBlock}>
                  <Text style={styles.sectionHeading}>DISHES</Text>
                  {searchResults.matchingDishes.map(({ item, restaurant }) => {
                    const cartQty = getItemQuantityInCart(item.id);
                    return (
                      <View key={item.id} style={styles.dishCardWrapper}>
                        <TouchableOpacity
                          style={styles.dishRestHeader}
                          onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                        >
                          <Text style={styles.dishRestName}>By {restaurant.name}</Text>
                          <ChevronRight size={14} color={Colors.subText} />
                        </TouchableOpacity>

                        <DishItem
                          item={item}
                          quantityInCart={cartQty}
                          onPressAdd={() => handleAddDish(item, restaurant)}
                          onPressIncrement={() => {
                            const found = cartItems.find((ci) => ci.menuItem.id === item.id);
                            if (found) incrementItem(found.cartItemId);
                          }}
                          onPressDecrement={() => {
                            const found = cartItems.find((ci) => ci.menuItem.id === item.id);
                            if (found) decrementItem(found.cartItemId);
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              )}

            {/* Matching Restaurants */}
            {(activeTab === 'all' || activeTab === 'restaurants') &&
              searchResults.matchingRestaurants.length > 0 && (
                <View style={styles.restaurantResultsBlock}>
                  <Text style={styles.sectionHeading}>RESTAURANTS</Text>
                  {searchResults.matchingRestaurants.map((rest) => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))}
                </View>
              )}

            {/* Empty state */}
            {searchResults.matchingRestaurants.length === 0 &&
              searchResults.matchingDishes.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No results found for &quot;{query}&quot;</Text>
                  <Text style={styles.emptySubtitle}>
                    Check your spelling or explore other popular cuisines like Biryani, Pizza, or Burgers.
                  </Text>
                </View>
              )}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <FloatingCart />

      {/* Customization Modal */}
      <CustomizationModal
        visible={Boolean(selectedCustomItem)}
        item={selectedCustomItem?.item || null}
        onClose={() => setSelectedCustomItem(null)}
        onConfirm={handleConfirmCustom}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBoxContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.subText,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  trendingSection: {
    padding: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipLabel: {
    fontSize: 13,
    color: Colors.darkText,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  dishResultsBlock: {
    marginBottom: 16,
  },
  dishCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishRestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dishRestName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  restaurantResultsBlock: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  },
});
