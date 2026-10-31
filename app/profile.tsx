import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, formatCurrency } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import { updateUserProfile, deleteUserAccount, normalizePhone } from '../lib/supabase';
import TermsModal from '../components/TermsModal';
import TidaraPassModal from '../components/TidaraPassModal';

const MENU_ITEMS = [
  { id: 'address', icon: 'location-outline' as const, label: 'Saved Addresses', badge: null, color: '#2563EB', bg: '#EFF6FF' },
  { id: 'whatsapp', icon: 'logo-whatsapp' as const, label: 'WhatsApp Order Updates', badge: 'ACTIVE', color: '#15803D', bg: '#DCFCE7' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & 24/7 Support', badge: null, color: '#059669', bg: '#ECFDF5' },
  { id: 'terms', icon: 'document-text-outline' as const, label: 'Terms of Service', badge: null, color: '#475569', bg: '#F1F5F9' },
  { id: 'privacy', icon: 'shield-checkmark-outline' as const, label: 'Privacy & Data Policy', badge: null, color: '#475569', bg: '#F1F5F9' },
];

export default function ProfileScreen() {
  const {
    user,
    walletBalance,
    savedAddresses,
    hasTidaraPass,
    passVisitsLeft,
    setUser,
    saveUserToDB,
    logout,
    addToCart,
  } = useAppStore();

  const [editVisible, setEditVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');
  const [passVisible, setPassVisible] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const displayName = user
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : 'Valued Guest';
  const displayPhone = user?.phone
    ? normalizePhone(user.phone)
    : 'Not verified';

  const openEdit = () => {
    if (!user) {
      Alert.alert('Sign in Required', 'Please log in to edit your profile information.', [
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'Please provide at least your first name.');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const canonicalPhone = normalizePhone(user.phone);
      const updated = {
        id: user.id,
        phone: canonicalPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
      };

      setUser(updated);
      await saveUserToDB(updated);

      await updateUserProfile(canonicalPhone, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
      });

      setEditVisible(false);
      Alert.alert('Profile Saved', 'Your information has been updated.');
    } catch {
      Alert.alert('Error', 'Could not update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Confirm Log Out', 'Are you sure you want to log out of Tidara?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (!user?.phone) {
      logout();
      router.replace('/(auth)/login');
      return;
    }
    Alert.alert(
      'Delete Account & Data?',
      'This will permanently delete your account, saved addresses, wallet balance, and order history in compliance with DPDP Act 2023. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            await deleteUserAccount(user.phone);
            logout();
            setSaving(false);
            Alert.alert('Account Deleted', 'Your personal account and data have been removed.');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <TouchableOpacity
          onPress={openEdit}
          style={styles.editHeaderBtn}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <LinearGradient
            colors={['#0B5335', '#04271A']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] ?? 'U').toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {user && <Ionicons name="checkmark-circle" size={16} color="#059669" />}
            </View>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>{user ? 'Edit' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.tilesRow}>
          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => router.push('/(tabs)/money')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Wallet with balance of ${formatCurrency(walletBalance)}`}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.tileLabel}>Wallet</Text>
            <Text style={styles.tileValue}>{formatCurrency(walletBalance)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View all bookings"
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.tileLabel}>Bookings</Text>
            <Text style={styles.tileValue}>View All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => setPassVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View VIP Pass"
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="gift-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.tileLabel}>VIP Pass</Text>
            <Text style={styles.tileValue}>
              {hasTidaraPass && passVisitsLeft > 0 ? `${passVisitsLeft} Visits` : 'Special'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => {
            const dynamicBadge = item.id === 'address' && savedAddresses.length > 0
              ? `${savedAddresses.length} Saved`
              : item.badge;
            return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => {
                if (item.id === 'help') {
                  router.push('/help');
                } else if (item.id === 'address') {
                  router.push('/add-address');
                } else if (item.id === 'terms') {
                  setTermsType('terms');
                  setTermsVisible(true);
                } else if (item.id === 'privacy') {
                  setTermsType('privacy');
                  setTermsVisible(true);
                } else if (item.id === 'whatsapp') {
                  Alert.alert(
                    'WhatsApp Notifications',
                    'Visit alerts and arrival updates are sent to your verified number.'
                  );
                }
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>

              <Text style={styles.menuLabel}>{item.label}</Text>

              {dynamicBadge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{dynamicBadge}</Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            );
          })}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{user ? 'Log Out' : 'Switch Account'}</Text>
        </TouchableOpacity>

        {/* Delete Account (App Store & DPDP Compliant) */}
        {user && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteText}>Delete Account & Data</Text>
          </TouchableOpacity>
        )}

        {/* App Version */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, marginBottom: 24 }}>
          <Text style={styles.versionText}>Tidara v1.0.0 • Made with</Text>
          <Ionicons name="heart" size={12} color="#EF4444" />
          <Text style={styles.versionText}>in India</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => setEditVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close edit profile dialog"
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>First Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Last Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveModalBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveModalBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Terms & Privacy Modal */}
      <TermsModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        type={termsType}
      />

      {/* Pass Modal */}
      <TidaraPassModal
        visible={passVisible}
        onClose={() => setPassVisible(false)}
        onBook={() => {
          setPassVisible(false);
          addToCart('tidara_pass_3', 60, 129);
          router.push('/cart');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  editHeaderBtn: { padding: 6 },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalBody: { gap: 14 },
  modalField: { gap: 6 },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  saveModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
