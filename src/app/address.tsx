import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAddressStore } from '../stores/useAddressStore';
import { requestAndGetCurrentLocation } from '../services/locationService';
import { Address } from '../types';
import { Colors } from '../constants/theme';
import {
  MapPin,
  Home,
  Briefcase,
  Navigation,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function AddressScreen() {
  const { addresses, selectedAddress, selectAddress, addAddress, deleteAddress } =
    useAddressStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // New address form state
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560038');

  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    const { coords, detectedAddress } = await requestAndGetCurrentLocation();
    setIsDetecting(false);

    setAddressLine1(detectedAddress.addressLine1 || 'Indiranagar 100ft Road');
    setAddressLine2(detectedAddress.addressLine2 || '');
    setCity(detectedAddress.city || 'Bengaluru');
    setPincode(detectedAddress.pincode || '560038');
    setIsModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressLine1.trim()) {
      Alert.alert('Address Required', 'Please enter your street address or house number.');
      return;
    }

    await addAddress({
      label,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state: 'Karnataka',
      pincode,
      latitude: 12.9716,
      longitude: 77.5946,
    });

    setIsModalOpen(false);
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
  };

  const getLabelIcon = (lbl: string) => {
    switch (lbl) {
      case 'Home':
        return <Home size={18} color={Colors.primary} />;
      case 'Work':
        return <Briefcase size={18} color={Colors.primary} />;
      default:
        return <MapPin size={18} color={Colors.primary} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* GPS Current Location Bar (FR-6) */}
        <TouchableOpacity
          style={styles.gpsButton}
          activeOpacity={0.8}
          onPress={handleUseCurrentLocation}
          disabled={isDetecting}
        >
          <View style={styles.gpsIconCircle}>
            <Navigation size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsTitle}>Use Current Location</Text>
            <Text style={styles.gpsSubtitle}>
              {isDetecting ? 'Detecting GPS location...' : 'Fetch via device GPS'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Add New Address Trigger (FR-7) */}
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => setIsModalOpen(true)}
        >
          <Plus size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Saved Addresses List */}
        <Text style={styles.sectionHeading}>SAVED ADDRESSES ({addresses.length})</Text>

        {addresses.map((addr) => {
          const isSelected = selectedAddress.id === addr.id;

          return (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, isSelected && styles.addressCardSelected]}
              activeOpacity={0.85}
              onPress={() => {
                selectAddress(addr);
                Alert.alert(
                  'Delivery Address Selected',
                  `Active address set to "${addr.label}"`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.labelRow}>
                  {getLabelIcon(addr.label)}
                  <Text style={styles.labelText}>{addr.label}</Text>
                  {isSelected && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  )}
                </View>

                {addresses.length > 1 && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteAddress(addr.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.addressLine1}>{addr.addressLine1}</Text>
              {addr.addressLine2 ? (
                <Text style={styles.addressLine2}>{addr.addressLine2}</Text>
              ) : null}
              {addr.landmark ? (
                <Text style={styles.landmarkText}>Landmark: {addr.landmark}</Text>
              ) : null}
              <Text style={styles.cityPin}>
                {addr.city}, {addr.pincode}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Add Address Modal Form */}
      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
              {/* Tag Picker */}
              <Text style={styles.inputLabel}>ADDRESS TYPE</Text>
              <View style={styles.tagPickerRow}>
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagPill, label === t && styles.tagPillActive]}
                    onPress={() => setLabel(t)}
                  >
                    <Text style={[styles.tagText, label === t && styles.tagTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Form fields */}
              <Text style={styles.inputLabel}>HOUSE / FLAT / BUILDING NO. *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. #402 Sunshine Heights, 12th Main Rd"
                placeholderTextColor={Colors.mutedText}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />

              <Text style={styles.inputLabel}>AREA / LOCALITY</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. HAL 2nd Stage, Indiranagar"
                placeholderTextColor={Colors.mutedText}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />

              <Text style={styles.inputLabel}>LANDMARK (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Near Sony Center"
                placeholderTextColor={Colors.mutedText}
                value={landmark}
                onChangeText={setLandmark}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>CITY</Text>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>PINCODE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pincode}
                    keyboardType="numeric"
                    onChangeText={setPincode}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.85}
                onPress={handleSaveAddress}
              >
                <Text style={styles.saveBtnText}>Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBF7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  activePill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteBtn: {
    padding: 4,
  },
  addressLine1: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
  },
  addressLine2: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  cityPin: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkText,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  formContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.subText,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  tagPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkText,
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.darkText,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
