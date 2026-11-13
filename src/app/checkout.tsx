import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../stores/useCartStore';
import { useAddressStore } from '../stores/useAddressStore';
import { useOrderStore } from '../stores/useOrderStore';
import { PaymentMethod } from '../types';
import { Colors, Shadows } from '../constants/theme';
import {
  MapPin,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Lock,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function CheckoutScreen() {
  const {
    items,
    restaurant,
    appliedCoupon,
    cookingInstructions,
    tipAmount,
    getItemTotal,
    getDeliveryFee,
    getTaxesAndFees,
    getDiscountAmount,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const createOrder = useOrderStore((state) => state.createOrder);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0 || !restaurant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No active items to checkout</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.backBtnText}>Explore Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const grandTotal = getGrandTotal();
  const itemTotal = getItemTotal();
  const deliveryFee = getDeliveryFee();
  const taxesAndFees = getTaxesAndFees();
  const discountAmount = getDiscountAmount();

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // Simulate quick secure payment confirmation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newOrder = await createOrder({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        restaurantImage: restaurant.image,
        items,
        deliveryAddress: selectedAddress,
        paymentMethod,
        itemTotal,
        deliveryFee,
        taxesAndFees,
        discountAmount,
        tipAmount,
        grandTotal,
        appliedCoupon: appliedCoupon?.code,
        cookingInstructions,
      });

      // Clear cart once order is confirmed
      clearCart();
      setIsProcessing(false);

      // Navigate to live tracking
      router.replace(`/track/${newOrder.id}`);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Payment Failed', 'Unable to process transaction. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Confirmation Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>DELIVER TO</Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>{selectedAddress.label} Address</Text>
            <Text style={styles.addressLine}>
              {selectedAddress.addressLine1}, {selectedAddress.addressLine2 || ''}
            </Text>
            <Text style={styles.addressCity}>
              {selectedAddress.city}, {selectedAddress.pincode}
            </Text>
          </View>
        </View>

        {/* Payment Methods (FR-29) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SELECT PAYMENT METHOD</Text>

          {/* UPI Option */}
          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === 'upi' && styles.paymentRowActive]}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod('upi')}
          >
            <View style={styles.paymentLeft}>
              <Smartphone size={20} color={Colors.primary} style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.paymentName}>UPI (Instant & Recommended)</Text>
                <Text style={styles.paymentSub}>Google Pay, PhonePe, Paytm, QR</Text>
              </View>
            </View>
            <View
              style={[styles.radioCircle, paymentMethod === 'upi' && styles.radioActive]}
            >
              {paymentMethod === 'upi' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* UPI App selector if UPI chosen */}
          {paymentMethod === 'upi' && (
            <View style={styles.upiAppsContainer}>
              {(['gpay', 'phonepe', 'paytm'] as const).map((app) => {
                const isSelected = selectedUpiApp === app;
                const labels: Record<string, string> = {
                  gpay: 'Google Pay',
                  phonepe: 'PhonePe',
                  paytm: 'Paytm UPI',
                };
                return (
                  <TouchableOpacity
                    key={app}
                    style={[styles.upiAppBtn, isSelected && styles.upiAppBtnActive]}
                    onPress={() => setSelectedUpiApp(app)}
                  >
                    <Text
                      style={[styles.upiAppText, isSelected && styles.upiAppTextActive]}
                    >
                      {labels[app]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Cards Option */}
          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === 'card' && styles.paymentRowActive]}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentLeft}>
              <CreditCard size={20} color={Colors.darkText} style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.paymentName}>Credit or Debit Card</Text>
                <Text style={styles.paymentSub}>Visa, Mastercard, RuPay</Text>
              </View>
            </View>
            <View
              style={[styles.radioCircle, paymentMethod === 'card' && styles.radioActive]}
            >
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === 'cod' && styles.paymentRowActive]}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentLeft}>
              <Banknote size={20} color={Colors.secondary} style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentSub}>Pay cash or scan QR upon delivery</Text>
              </View>
            </View>
            <View
              style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioActive]}
            >
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Assurance */}
        <View style={styles.securityBox}>
          <ShieldCheck size={18} color={Colors.secondary} style={{ marginRight: 8 }} />
          <Text style={styles.securityText}>
            100% Safe and Encrypted Payments via RBI Authorized Gateways
          </Text>
        </View>

        {/* Order Summary Snapshot */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{items.length} items from {restaurant.name}</Text>
            <Text style={styles.summaryValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA Bottom Bar */}
      <View style={[styles.bottomBar, Shadows.medium]}>
        <View>
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
          activeOpacity={0.85}
          disabled={isProcessing}
          onPress={handlePlaceOrder}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.btnInner}>
              <Lock size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.payBtnText}>
                {paymentMethod === 'cod' ? 'Confirm Order' : 'Pay & Order'}
              </Text>
            </View>
          )}
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 3,
  },
  addressLine: {
    fontSize: 12,
    color: Colors.subText,
  },
  addressCity: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  paymentRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  paymentSub: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  upiAppsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  upiAppBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  upiAppBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.subText,
  },
  upiAppTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8EE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  securityText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.subText,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.darkText,
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
  amountLabel: {
    fontSize: 10,
    color: Colors.subText,
    fontWeight: '800',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkText,
  },
  payBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
