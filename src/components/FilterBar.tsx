import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';
import { Star, Zap, Percent, SlidersHorizontal, Check } from 'lucide-react-native';
import { useFilterStore } from '../stores/useFilterStore';

export const FilterBar: React.FC = () => {
  const {
    isVegOnly,
    toggleVegOnly,
    minRating,
    setMinRating,
    hasOffersOnly,
    toggleOffersOnly,
    sortBy,
    setSortBy,
  } = useFilterStore();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Veg Only */}
        <TouchableOpacity
          style={[styles.chip, isVegOnly && styles.activeChip]}
          activeOpacity={0.7}
          onPress={toggleVegOnly}
        >
          <View style={[styles.vegDot, isVegOnly && { backgroundColor: Colors.veg }]} />
          <Text style={[styles.chipText, isVegOnly && styles.activeChipText]}>Pure Veg</Text>
        </TouchableOpacity>

        {/* Rating 4.0+ */}
        <TouchableOpacity
          style={[styles.chip, minRating !== null && styles.activeChip]}
          activeOpacity={0.7}
          onPress={() => setMinRating(minRating ? null : 4.0)}
        >
          <Star
            size={13}
            color={minRating ? Colors.primary : Colors.darkText}
            fill={minRating ? Colors.primary : 'none'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, minRating !== null && styles.activeChipText]}>
            Ratings 4.0+
          </Text>
        </TouchableOpacity>

        {/* Offers */}
        <TouchableOpacity
          style={[styles.chip, hasOffersOnly && styles.activeChip]}
          activeOpacity={0.7}
          onPress={toggleOffersOnly}
        >
          <Percent
            size={12}
            color={hasOffersOnly ? Colors.primary : Colors.darkText}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, hasOffersOnly && styles.activeChipText]}>Offers</Text>
        </TouchableOpacity>

        {/* Delivery Time sort */}
        <TouchableOpacity
          style={[styles.chip, sortBy === 'delivery_time' && styles.activeChip]}
          activeOpacity={0.7}
          onPress={() => setSortBy(sortBy === 'delivery_time' ? 'relevance' : 'delivery_time')}
        >
          <Zap
            size={13}
            color={sortBy === 'delivery_time' ? Colors.primary : Colors.darkText}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, sortBy === 'delivery_time' && styles.activeChipText]}>
            Fast Delivery
          </Text>
        </TouchableOpacity>

        {/* Cost sort */}
        <TouchableOpacity
          style={[styles.chip, sortBy === 'cost_low_to_high' && styles.activeChip]}
          activeOpacity={0.7}
          onPress={() => setSortBy(sortBy === 'cost_low_to_high' ? 'relevance' : 'cost_low_to_high')}
        >
          <Text style={[styles.chipText, sortBy === 'cost_low_to_high' && styles.activeChipText]}>
            Less than ₹300
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  activeChip: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
  },
  activeChipText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.veg,
    marginRight: 6,
  },
});
