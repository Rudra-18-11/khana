import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';
import { useCartStore } from '../stores/useCartStore';
import { Heart, Sparkles } from 'lucide-react-native';

const TIP_OPTIONS = [20, 30, 50];

export const BillBreakdown: React.FC = () => {
  const {
    getItemTotal,
    getDeliveryFee,
    getTaxesAndFees,
    getDiscountAmount,
    getGrandTotal,
    tipAmount,
    setTip,
    appliedCoupon,
  } = useCartStore();

  const itemTotal = getItemTotal();
  const deliveryFee = getDeliveryFee();
  const taxesAndFees = getTaxesAndFees();
  const discount = getDiscountAmount();
  const grandTotal = getGrandTotal();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bill Details</Text>

      {/* Item Total */}
      <View style={styles.row}>
        <Text style={styles.label}>Item Total</Text>
        <Text style={styles.value}>₹{itemTotal}</Text>
      </View>

      {/* Delivery Fee */}
      <View style={styles.row}>
        <View style={styles.labelWithSub}>
          <Text style={styles.label}>Delivery Partner Fee</Text>
          {deliveryFee === 0 && (
            <Text style={styles.freeBadge}>FREE (Orders over ₹299)</Text>
          )}
        </View>
        <View style={styles.priceWithOriginal}>
          {deliveryFee === 0 ? (
            <>
              <Text style={styles.strikethrough}>₹35</Text>
              <Text style={styles.freeText}>FREE</Text>
            </>
          ) : (
            <Text style={styles.value}>₹{deliveryFee}</Text>
          )}
        </View>
      </View>

      {/* Taxes & Restaurant Charges */}
      <View style={styles.row}>
        <Text style={styles.label}>Taxes & Platform Charges</Text>
        <Text style={styles.value}>₹{taxesAndFees}</Text>
      </View>

      {/* Discount */}
      {discount > 0 && (
        <View style={styles.row}>
          <View style={styles.labelWithSub}>
            <Text style={[styles.label, styles.discountText]}>Coupon Discount</Text>
            {appliedCoupon && (
              <Text style={styles.couponCodeText}>({appliedCoupon.code})</Text>
            )}
          </View>
          <Text style={[styles.value, styles.discountText]}>-₹{discount}</Text>
        </View>
      )}

      {/* Tip Section */}
      <View style={styles.tipSection}>
        <View style={styles.tipHeader}>
          <Heart size={14} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.tipTitle}>Tip your delivery partner</Text>
        </View>
        <Text style={styles.tipSubtitle}>100% of the tip goes directly to the driver.</Text>

        <View style={styles.tipButtonsRow}>
          {TIP_OPTIONS.map((amt) => {
            const isSelected = tipAmount === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.tipBtn, isSelected && styles.tipBtnActive]}
                activeOpacity={0.7}
                onPress={() => setTip(isSelected ? 0 : amt)}
              >
                <Text style={[styles.tipBtnText, isSelected && styles.tipBtnTextActive]}>
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            );
          })}
          {tipAmount > 0 && !TIP_OPTIONS.includes(tipAmount) && (
            <TouchableOpacity
              style={[styles.tipBtn, styles.tipBtnActive]}
              onPress={() => setTip(0)}
            >
              <Text style={[styles.tipBtnText, styles.tipBtnTextActive]}>₹{tipAmount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tip In Bill row */}
      {tipAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Delivery Tip</Text>
          <Text style={styles.value}>₹{tipAmount}</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Grand Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TO PAY</Text>
        <Text style={styles.totalValue}>₹{grandTotal}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: Colors.subText,
  },
  labelWithSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
  },
  priceWithOriginal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikethrough: {
    fontSize: 12,
    color: Colors.mutedText,
    textDecorationLine: 'line-through',
  },
  freeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondary,
  },
  discountText: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  couponCodeText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '800',
  },
  tipSection: {
    backgroundColor: '#FFF9F3',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FFE8D6',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  tipSubtitle: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
    marginBottom: 8,
  },
  tipButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tipBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkText,
  },
  tipBtnTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkText,
  },
});
