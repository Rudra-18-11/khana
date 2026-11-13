import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, ChevronDown, User } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { Address } from '../types';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

interface HeaderProps {
  address: Address;
  onPressAddress?: () => void;
  onPressProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  address,
  onPressAddress,
  onPressProfile,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <View style={styles.container}>
      {/* Brand Logo (No text title needed as KHANA is inside the logo) */}
      <TouchableOpacity
        style={styles.brandContainer}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)')}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Address Selector Section */}
      <TouchableOpacity
        style={styles.addressSection}
        activeOpacity={0.7}
        onPress={onPressAddress || (() => router.push('/address'))}
      >
        <MapPin size={15} color={Colors.primary} style={styles.pinIcon} />
        <View style={styles.addressTextContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{address.label || 'Home'}</Text>
            <ChevronDown size={14} color={Colors.darkText} style={styles.chevron} />
          </View>
          <Text style={styles.addressLine} numberOfLines={1}>
            {address.addressLine1}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        style={styles.profileButton}
        activeOpacity={0.8}
        onPress={
          onPressProfile ||
          (() => router.push(isAuthenticated ? '/(tabs)/profile' : '/login'))
        }
      >
        <View style={styles.avatarPlaceholder}>
          <User size={17} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  brandContainer: {
    marginRight: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37', // Elegant gold accent
    backgroundColor: '#000000',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinIcon: {
    marginRight: 5,
  },
  addressTextContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.2,
  },
  chevron: {
    marginLeft: 2,
  },
  addressLine: {
    fontSize: 10.5,
    color: Colors.subText,
  },
  profileButton: {
    padding: 2,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.darkText,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
