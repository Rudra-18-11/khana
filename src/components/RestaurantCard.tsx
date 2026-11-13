import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, Clock, Heart } from 'lucide-react-native';
import { Restaurant } from '../types';
import { Colors, Shadows } from '../constants/theme';
import { router } from 'expo-router';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: (restaurantId: string) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, Shadows.small]}
      activeOpacity={0.85}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.coverImage }} style={styles.image} resizeMode="cover" />

        {/* Discount Overlay Tag */}
        {restaurant.discountTag && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{restaurant.discountTag.toUpperCase()}</Text>
          </View>
        )}

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={styles.heartButton}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(restaurant.id);
          }}
        >
          <Heart
            size={18}
            color={isFavorite ? Colors.danger : '#FFFFFF'}
            fill={isFavorite ? Colors.danger : 'rgba(0,0,0,0.3)'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        {/* Restaurant Name */}
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>

        {/* Rating and ETA Row */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Star size={11} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
          </View>

          <Text style={styles.dot}>•</Text>

          <View style={styles.timeSection}>
            <Clock size={12} color={Colors.subText} style={{ marginRight: 3 }} />
            <Text style={styles.timeText}>
              {restaurant.deliveryTimeMin}-{restaurant.deliveryTimeMax} mins
            </Text>
          </View>

          {restaurant.distanceKm && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.distanceText}>{restaurant.distanceKm} km</Text>
            </>
          )}
        </View>

        {/* Cuisines */}
        <Text style={styles.cuisines} numberOfLines={1}>
          {restaurant.cuisines.join(', ')}
        </Text>

        {/* Address and Cost for Two */}
        <View style={styles.footerRow}>
          <Text style={styles.address} numberOfLines={1}>
            {restaurant.address}
          </Text>
          <Text style={styles.costForTwo}>₹{restaurant.costForTwo} for two</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    padding: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ratingGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  dot: {
    marginHorizontal: 6,
    color: Colors.mutedText,
    fontSize: 14,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.subText,
  },
  cuisines: {
    fontSize: 13,
    color: Colors.subText,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: Colors.mutedText,
    flex: 1,
    marginRight: 8,
  },
  costForTwo: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
  },
});
