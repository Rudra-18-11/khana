import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAddressStore } from '../../stores/useAddressStore';
import { UserRole } from '../../types';
import { Colors } from '../../constants/theme';
import {
  MapPin,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  LogIn,
  Sparkles,
  ChevronRight,
  UserCheck,
  CreditCard,
  Bell,
  Pencil,
  X,
  Check,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';

export default function ProfileScreen() {
  const { user, role, setRole, updateProfile, logout, syncCurrentProfile } = useAuthStore();
  const addresses = useAddressStore((state) => state.addresses);
  const { signOut } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    syncCurrentProfile();
  }, [syncCurrentProfile]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setIsSaving(true);
    await updateProfile({
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
    });
    setIsSaving(false);
    setIsEditModalOpen(false);
    Alert.alert('Profile Saved', 'Profile changes synced directly to Supabase.');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    Alert.alert('Role Updated', `Active user role switched to "${newRole}".`);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            console.warn('Clerk signOut error:', e);
          }
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card or Login Prompt */}
        {user ? (
          <View style={styles.profileCard}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.profileDetails}>
              <Text style={styles.userName}>{user?.name || 'Foodie Guest'}</Text>
              <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileBtn}
              activeOpacity={0.7}
              onPress={() => {
                setEditName(user?.name || '');
                setEditPhone(user?.phone || '');
                setIsEditModalOpen(true);
              }}
            >
              <Pencil size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestContent}>
              <Text style={styles.guestTitle}>Welcome to KHANA</Text>
              <Text style={styles.guestSubtitle}>
                Log in or create an account to view your saved addresses and track orders
              </Text>
              <TouchableOpacity
                style={styles.loginCtaBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
              >
                <LogIn size={16} color="#08080C" style={{ marginRight: 6 }} />
                <Text style={styles.loginCtaText}>LOG IN / SIGN UP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PRD Role Switcher (FR-2 Demo) */}
        <View style={styles.roleBox}>
          <View style={styles.roleHeaderRow}>
            <UserCheck size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.roleHeading}>CLERK ROLE (PRD FR-2)</Text>
          </View>
          <Text style={styles.roleSubtext}>
            Test role-based access: Active role is{' '}
            <Text style={{ fontWeight: '800', color: Colors.primaryDark }}>{role.toUpperCase()}</Text>
          </Text>

          <View style={styles.roleButtonsRow}>
            {(['customer', 'restaurant', 'delivery', 'admin'] as UserRole[]).map((r) => {
              const isSelected = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, isSelected && styles.roleBtnActive]}
                  onPress={() => handleRoleChange(r)}
                >
                  <Text style={[styles.roleBtnText, isSelected && styles.roleBtnTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Clerk Organizations (B2B Multi-tenancy) */}
        <View style={styles.orgCard}>
          <View style={styles.orgHeader}>
            <View style={styles.orgIconWrap}>
              <Sparkles size={16} color="#D4AF37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orgLabel}>CLERK WORKSPACE</Text>
              <Text style={styles.orgName}>KHANA Partner Kitchens</Text>
            </View>
            <View style={styles.orgBadge}>
              <Text style={styles.orgBadgeText}>ORGS ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.orgSub}>
            Organizations enabled on application <Text style={{ fontWeight: '700' }}>KHANA</Text>
          </Text>
        </View>

        {/* Menu Section 1 */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/address')}
          >
            <View style={styles.menuLeft}>
              <MapPin size={20} color={Colors.darkText} style={styles.menuIcon} />
              <View>
                <Text style={styles.menuTitle}>Saved Addresses</Text>
                <Text style={styles.menuSubtitle}>{addresses.length} saved addresses</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Payment Methods', 'UPI, Netbanking & Cards linked.')}
          >
            <View style={styles.menuLeft}>
              <CreditCard size={20} color={Colors.darkText} style={styles.menuIcon} />
              <View>
                <Text style={styles.menuTitle}>Payments & Refunds</Text>
                <Text style={styles.menuSubtitle}>Manage UPI, cards & refund accounts</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'Order status push alerts are enabled.')}
          >
            <View style={styles.menuLeft}>
              <Bell size={20} color={Colors.darkText} style={styles.menuIcon} />
              <View>
                <Text style={styles.menuTitle}>Notification Preferences</Text>
                <Text style={styles.menuSubtitle}>Order updates, promo alerts</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Menu Section 2: Help & Legal */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Help & FAQs',
                'For live order queries, use the call rider button in Order Tracking or email support@swiggyclone.app'
              )
            }
          >
            <View style={styles.menuLeft}>
              <HelpCircle size={20} color={Colors.darkText} style={styles.menuIcon} />
              <Text style={styles.menuTitle}>Help & FAQs</Text>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Terms & Privacy', 'Terms of Service and Privacy Policy v1.0')
            }
          >
            <View style={styles.menuLeft}>
              <FileText size={20} color={Colors.darkText} style={styles.menuIcon} />
              <Text style={styles.menuTitle}>Terms & Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/login')}
          >
            <View style={styles.menuLeft}>
              <LogIn size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={[styles.menuTitle, { color: Colors.primary }]}>
                {user ? 'Switch Account / Clerk Login' : 'Log In or Sign Up'}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          {user && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleLogout}
              >
                <View style={styles.menuLeft}>
                  <LogOut size={20} color={Colors.danger} style={styles.menuIcon} />
                  <Text style={[styles.menuTitle, { color: Colors.danger }]}>Log Out</Text>
                </View>
                <ChevronRight size={18} color={Colors.mutedText} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.versionLogo}
            resizeMode="cover"
          />
          <Text style={styles.versionText}>KHANA Food Delivery v1.0.0</Text>
          <Text style={styles.stackText}>
            Royal Taste Delivered Fast · Built with Expo SDK 58
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal (Direct Supabase Sync) */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile (Live Supabase)</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSaveText}>
                {isSaving ? 'Syncing to Database...' : 'Save & Sync Direct ❯'}
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.darkText,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  guestCard: {
    backgroundColor: '#08080C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  guestContent: {
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D4AF37',
    marginBottom: 6,
  },
  guestSubtitle: {
    fontSize: 12.5,
    color: 'rgba(244,236,225,0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  loginCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginCtaText: {
    color: '#08080C',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    backgroundColor: '#E2E8F0',
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkText,
  },
  userPhone: {
    fontSize: 13,
    color: Colors.subText,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  roleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  roleSubtext: {
    fontSize: 12,
    color: Colors.subText,
    marginBottom: 12,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkText,
    textTransform: 'capitalize',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  orgCard: {
    backgroundColor: '#08080C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orgIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orgLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4ECE1',
    marginTop: 2,
  },
  orgBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  orgBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
  orgSub: {
    fontSize: 11,
    color: 'rgba(244,236,225,0.6)',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  menuSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 50,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    marginBottom: 8,
    backgroundColor: '#000000',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  stackText: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkText,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subText,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
