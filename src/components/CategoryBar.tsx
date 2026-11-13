import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FOOD_CATEGORIES } from '../services/mockData';
import { Colors } from '../constants/theme';

interface CategoryBarProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>WHAT'S ON YOUR MIND?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FOOD_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id || (cat.id === 'all' && selectedCategoryId === null);
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => onSelectCategory(cat.id === 'all' ? null : cat.id)}
            >
              <View style={[styles.iconCircle, isSelected && styles.selectedCircle]}>
                <Text style={styles.iconText}>{cat.icon}</Text>
              </View>
              <Text style={[styles.name, isSelected && styles.selectedName]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectedCircle: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  iconText: {
    fontSize: 26,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
    textAlign: 'center',
  },
  selectedName: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
