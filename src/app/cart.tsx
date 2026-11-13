import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../stores/useCartStore';
import { useAddressStore } from '../stores/useAddressStore';
import { fetchCoupons } from '../services/supabase';
import { Coupon } from '../types';
import { VegBadge } from '../components/VegBadge';
import { BillBreakdown } from '../components/BillBreakdown';
import { Colors, Shadows } from '../constants/theme';
import {
  MapPin,
  Tag,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function CartScreen() {
  const {
    items,
    restaurant,
    incrementItem,
    decrementItem,
    removeItem,
    cookingInstructions,
    setCookingInstructions,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchCoupons();
      setCoupons(data);
    }
    load();
  }, []);

  const handleApplyCoupon = (coupon: Coupon) => {
    const res = applyCoupon(coupon);
    Alert.alert(res.success ? 'Success' : 'Invalid Coupon', res.message);
  };

  const handleManualApply = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const match = coupons.find((c) => c.code === code);
    if (match) {
      handleApplyCoupon(match);
      setCouponInput('');
    } else {
      Alert.alert('Invalid Coupon', `Coupon code "${code}" is not valid or expired.`);
    }
  };

  if (items.length === 0 || !restaurant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={54} color={Colors.mutedText} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Good food is always cooking! Go ahead, explore restaurants and order something
            delicious.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseBtnText}>See Restaurants Near You</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const grandTotal = getGrandTotal();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Header */}
        <View style={styles.restHeader}>
          <Image source={{ uri: restaurant.image }} style={styles.restImage} />
          <View style={styles.restInfo}>
            <Text style={styles.restName}>{restaurant.name}</Text>
            <Text style={styles.restAddress} numberOfLines={1}>
              {restaurant.address}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Clear Cart?', 'Are you sure you want to remove all items?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart },
              ]);
            }}
            style={styles.clearCartBtn}
          >
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Delivery Address Bar */}
        <TouchableOpacity
          style={styles.addressBar}
          activeOpacity={0.7}
          onPress={() => router.push('/address')}
        >
          <MapPin size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>
              Delivering to <Text style={{ fontWeight: '800' }}>{selectedAddress.label}</Text>
            </Text>
            <Text style={styles.addressLine} numberOfLines={1}>
              {selectedAddress.addressLine1}, {selectedAddress.city}
            </Text>
          </View>
          <ChevronRight size={16} color={Colors.mutedText} />
        </TouchableOpacity>

        {/* Cart Items List */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardHeader}>ITEMS IN CART</Text>

          {items.map((cartItem) => (
            <View key={cartItem.cartItemId} style={styles.itemRow}>
              {/* Veg Indicator */}
              <View style={styles.vegCol}>
                <VegBadge isVeg={cartItem.menuItem.isVeg} size={14} />
              </View>

              {/* Item Info */}
              <View style={styles.itemInfoCol}>
                <Text style={styles.itemName}>{cartItem.menuItem.name}</Text>

                {/* Selected Options Chips */}
                {cartItem.selectedOptions.length > 0 && (
                  <Text style={styles.customOptionsText}>
                    {cartItem.selectedOptions.map((o) => o.choiceName).join(', ')}
                  </Text>
                )}

                <Text style={styles.itemPrice}>₹{cartItem.unitPrice}</Text>
              </View>

              {/* Stepper */}
              <View style={styles.stepperBox}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => decrementItem(cartItem.cartItemId)}
                >
                  <Minus size={13} color={Colors.secondary} />
                </TouchableOpacity>
                <Text style={styles.stepQty}>{cartItem.quantity}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => incrementItem(cartItem.cartItemId)}
                >
                  <Plus size={13} color={Colors.secondary} />
                </TouchableOpacity>
              </View>

              {/* Total Item Price */}
              <Text style={styles.rowTotalPrice}>₹{cartItem.totalPrice}</Text>
            </View>
          ))}

          {/* Cooking Instructions (FR-25) */}
          <View style={styles.instructionsContainer}>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Any cooking instructions? (e.g. less spicy, extra tissue)"
              placeholderTextColor={Colors.mutedText}
              value={cookingInstructions}
              onChangeText={setCookingInstructions}
              maxLength={150}
            />
          </View>
        </View>

        {/* Coupon Section (FR-26) */}
        <View style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <Tag size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.couponCardTitle}>Offers & Benefits</Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCouponRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.appliedBadge}>
                  <Check size={12} color={Colors.secondary} style={{ marginRight: 4 }} />
                  <Text style={styles.appliedCode}>{appliedCoupon.code} APPLIED</Text>
                </View>
                <Text style={styles.appliedDesc}>{appliedCoupon.title}</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Promo Code"
                  placeholderTextColor={Colors.mutedText}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleManualApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>APPLY</Text>
                </TouchableOpacity>
              </View>

              {/* Quick coupons list */}
              <View style={styles.quickCoupons}>
                {coupons.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.quickCouponPill}
                    onPress={() => handleApplyCoupon(c)}
                  >
                    <Text style={styles.quickCouponCode}>{c.code}</Text>
                    <Text style={styles.quickCouponDesc} numberOfLines={1}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Detailed Bill Breakdown */}
        <BillBreakdown />

        {/* Cancellation Policy Note */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            100% refund is guaranteed if order is cancelled before restaurant confirms. Avoid
            cancellations after food preparation has begun.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Action */}
      <View style={[styles.bottomBar, Shadows.medium]}>
        <View>
          <Text style={styles.totalDueLabel}>TO PAY</Text>
          <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={styles.proceedBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
          <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
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
    padding: 16,
    paddingBottom: 90,
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  restImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  restInfo: {
    flex: 1,
  },
  restName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkText,
  },
  restAddress: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  clearCartBtn: {
    padding: 6,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 13,
    color: Colors.darkText,
  },
  addressLine: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  vegCol: {
    marginRight: 10,
  },
  itemInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  customOptionsText: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 12,
  },
  stepBtn: {
    padding: 4,
  },
  stepQty: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
    paddingHorizontal: 8,
  },
  rowTotalPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
    minWidth: 45,
    textAlign: 'right',
  },
  instructionsContainer: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsInput: {
    fontSize: 12,
    color: Colors.darkText,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDF8EE',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C6E8CA',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondary,
  },
  appliedDesc: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.danger,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  quickCoupons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickCouponPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  quickCouponCode: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  quickCouponDesc: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  policyCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subText,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 11,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalDueLabel: {
    fontSize: 11,
    color: Colors.subText,
    fontWeight: '800',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkText,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkText,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.subText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  browseBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
