import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface VegBadgeProps {
  isVeg: boolean;
  size?: number;
}

export const VegBadge: React.FC<VegBadgeProps> = ({ isVeg, size = 16 }) => {
  const color = isVeg ? Colors.veg : Colors.nonVeg;
  const dotSize = Math.max(6, Math.floor(size * 0.45));

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderColor: color,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: isVeg ? dotSize / 2 : 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dot: {},
});
