import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Order, OrderStatus } from '../types';
import { Colors } from '../constants/theme';
import { CheckCircle2, Clock, Phone, AlertCircle, ChefHat, Bike, PackageCheck } from 'lucide-react-native';

interface OrderStatusTimelineProps {
  order: Order;
  onAdvanceStatus?: () => void;
  onCancelOrder?: () => void;
}

const STAGES: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'placed',
    label: 'Order Placed',
    desc: 'Waiting for restaurant confirmation',
    icon: Clock,
  },
  {
    status: 'accepted',
    label: 'Order Confirmed',
    desc: 'Restaurant is reviewing your order',
    icon: CheckCircle2,
  },
  {
    status: 'preparing',
    label: 'Food Being Prepared',
    desc: 'Chef is cooking your meal fresh',
    icon: ChefHat,
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    desc: 'Rider is on the way to your doorstep',
    icon: Bike,
  },
  {
    status: 'delivered',
    label: 'Delivered',
    desc: 'Order handed over successfully',
    icon: PackageCheck,
  },
];

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  order,
  onAdvanceStatus,
  onCancelOrder,
}) => {
  const currentStatusIndex = STAGES.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  const handleCallRider = () => {
    if (order.rider?.phone) {
      Linking.openURL(`tel:${order.rider.phone}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cancellation banner if applicable */}
      {isCancelled ? (
        <View style={styles.cancelledBanner}>
          <AlertCircle size={20} color={Colors.danger} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>
              This order was cancelled before food preparation. Any debited amount will be refunded.
            </Text>
          </View>
        </View>
      ) : (
        <>
          {/* Stepper Timeline */}
          <View style={styles.timeline}>
            {STAGES.map((stage, index) => {
              const isPassed = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const IconComp = stage.icon;

              return (
                <View key={stage.status} style={styles.stepRow}>
                  {/* Left Column: Circle & Line */}
                  <View style={styles.indicatorColumn}>
                    <View
                      style={[
                        styles.circle,
                        isPassed && styles.circlePassed,
                        isCurrent && styles.circleCurrent,
                      ]}
                    >
                      <IconComp
                        size={14}
                        color={isPassed ? '#FFFFFF' : Colors.mutedText}
                      />
                    </View>
                    {index < STAGES.length - 1 && (
                      <View
                        style={[
                          styles.verticalLine,
                          index < currentStatusIndex && styles.linePassed,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Title and Description */}
                  <View style={styles.contentColumn}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCurrent && styles.stepLabelCurrent,
                        isPassed && styles.stepLabelPassed,
                      ]}
                    >
                      {stage.label}
                    </Text>
                    <Text style={styles.stepDesc}>{stage.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Rider Info Card (Visible during out for delivery or delivered) */}
          {order.rider && (
            <View style={styles.riderCard}>
              <Image source={{ uri: order.rider.avatarUrl }} style={styles.riderAvatar} />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{order.rider.name}</Text>
                <Text style={styles.vehicleNumber}>
                  {order.rider.vehicleNumber} • {order.rider.rating} ★
                </Text>
                <View style={styles.otpPill}>
                  <Text style={styles.otpLabel}>Delivery PIN: </Text>
                  <Text style={styles.otpValue}>{order.deliveryOtp}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.callButton}
                activeOpacity={0.8}
                onPress={handleCallRider}
              >
                <Phone size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Test Simulation Controls */}
          {order.status !== 'delivered' && (
            <View style={styles.controlsRow}>
              {onAdvanceStatus && (
                <TouchableOpacity
                  style={styles.advanceBtn}
                  activeOpacity={0.8}
                  onPress={onAdvanceStatus}
                >
                  <Text style={styles.advanceBtnText}>Simulate Next Status</Text>
                </TouchableOpacity>
              )}

              {order.status === 'placed' && onCancelOrder && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.8}
                  onPress={onCancelOrder}
                >
                  <Text style={styles.cancelBtnText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  cancelledBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.dangerLight,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.danger,
  },
  cancelledSubtitle: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  timeline: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorColumn: {
    alignItems: 'center',
    width: 30,
    marginRight: 12,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circlePassed: {
    backgroundColor: Colors.secondary,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  linePassed: {
    backgroundColor: Colors.secondary,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  stepLabelPassed: {
    color: Colors.darkText,
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.subText,
    marginTop: 2,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  riderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: '#CBD5E1',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkText,
  },
  vehicleNumber: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  otpLabel: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  otpValue: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  advanceBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  advanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  cancelBtn: {
    backgroundColor: Colors.dangerLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
});
