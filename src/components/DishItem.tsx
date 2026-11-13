import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MenuItem } from '../types';
import { VegBadge } from './VegBadge';
import { Colors, Shadows } from '../constants/theme';
import { Star, Plus, Minus } from 'lucide-react-native';

interface DishItemProps {
  item: MenuItem;
  quantityInCart: number;
  onPressAdd: (item: MenuItem) => void;
  onPressIncrement: (item: MenuItem) => void;
  onPressDecrement: (item: MenuItem) => void;
}

export const DishItem: React.FC<DishItemProps> = ({
  item,
  quantityInCart,
  onPressAdd,
  onPressIncrement,
  onPressDecrement,
}) => {
  const isAvailable = item.isAvailable !== false;
  const hasOptions =
    Boolean(item.hasCustomization) &&
    Array.isArray(item.optionGroups) &&
    item.optionGroups.length > 0;

  return (
    <View style={styles.container}>
      {/* Left Details */}
      <View style={styles.leftSection}>
        <View style={styles.badgeRow}>
          <VegBadge isVeg={item.isVeg} size={15} />
          {item.isBestseller && (
            <View style={styles.bestsellerBadge}>
              <Star size={10} color="#D97706" fill="#D97706" style={{ marginRight: 3 }} />
              <Text style={styles.bestsellerText}>Bestseller</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{item.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
          )}
        </View>

        {item.rating && (
          <View style={styles.ratingRow}>
            <View style={styles.starBox}>
              <Star size={10} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.starText}>{item.rating}</Text>
            </View>
            {item.ratingCount && (
              <Text style={styles.ratingCount}>({item.ratingCount})</Text>
            )}
          </View>
        )}

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Right Image + Add/Stepper Button */}
      <View style={styles.rightSection}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />

        <View style={styles.actionContainer}>
          {!isAvailable ? (
            <View style={[styles.addButton, styles.disabledButton, Shadows.small]}>
              <Text style={styles.disabledText}>SOLD OUT</Text>
            </View>
          ) : quantityInCart === 0 ? (
            <TouchableOpacity
              style={[styles.addButton, Shadows.small]}
              activeOpacity={0.8}
              onPress={() => onPressAdd(item)}
            >
              <Text style={styles.addText}>ADD</Text>
              {hasOptions && <Text style={styles.plusSign}>+</Text>}
            </TouchableOpacity>
          ) : (
            <View style={[styles.stepperContainer, Shadows.small]}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onPressDecrement(item)}
                activeOpacity={0.7}
              >
                <Minus size={14} color={Colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantityInCart}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onPressIncrement(item)}
                activeOpacity={0.7}
              >
                <Plus size={14} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {isAvailable && hasOptions && (
            <Text style={styles.customisableText}>customisable</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  leftSection: {
    flex: 1,
    paddingRight: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  bestsellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.mutedText,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  starBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ratingGreen,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  starText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  ratingCount: {
    fontSize: 11,
    color: Colors.subText,
  },
  description: {
    fontSize: 12,
    color: Colors.subText,
    lineHeight: 16,
  },
  rightSection: {
    width: 115,
    alignItems: 'center',
  },
  image: {
    width: 115,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: -16,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 90,
  },
  addText: {
    color: Colors.secondary,
    fontWeight: '800',
    fontSize: 14,
  },
  plusSign: {
    color: Colors.secondary,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '800',
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 90,
  },
  stepBtn: {
    padding: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondary,
  },
  customisableText: {
    fontSize: 10,
    color: Colors.mutedText,
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  disabledText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
