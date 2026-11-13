import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCartStore } from '../stores/useCartStore';
import { Colors, Shadows } from '../constants/theme';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export const FloatingCart: React.FC = () => {
  const { items, restaurant, getItemCount, getGrandTotal } = useCartStore();

  const count = getItemCount();
  if (count === 0 || !restaurant) return null;

  const total = getGrandTotal();

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={[styles.container, Shadows.floating]}
        activeOpacity={0.9}
        onPress={() => router.push('/cart')}
      >
        <View style={styles.leftInfo}>
          <View style={styles.bagIcon}>
            <ShoppingBag size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.countText}>
              {count} {count === 1 ? 'ITEM' : 'ITEMS'} • ₹{total}
            </Text>
            <Text style={styles.restaurantName} numberOfLines={1}>
              From {restaurant.name}
            </Text>
          </View>
        </View>

        <View style={styles.rightAction}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  bagIcon: {
    marginRight: 10,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  restaurantName: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginRight: 2,
  },
});
