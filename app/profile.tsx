import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, formatCurrency } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import { updateUserProfile } from '../lib/supabase';

const MENU_ITEMS = [
  { id: 'refer', icon: 'gift-outline' as const, label: 'Refer & Earn ₹100', badge: 'FREE CASH', color: '#D97706', bg: '#FEF3C7' },
  { id: 'whatsapp', icon: 'logo-whatsapp' as const, label: 'WhatsApp Notification Settings', badge: 'ACTIVE', color: '#15803D', bg: '#DCFCE7' },
  { id: 'address', icon: 'location-outline' as const, label: 'Saved Addresses', badge: null, color: '#2563EB', bg: '#EFF6FF' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & 24/7 Support', badge: null, color: '#059669', bg: '#ECFDF5' },
  { id: 'terms', icon: 'document-text-outline' as const, label: 'Terms of Service', badge: null, color: '#475569', bg: '#F1F5F9' },
  { id: 'privacy', icon: 'shield-checkmark-outline' as const, label: 'Privacy Policy', badge: null, color: '#475569', bg: '#F1F5F9' },
];

export default function ProfileScreen() {
  const { user, walletBalance, setUser, saveUserToDB, logout } = useAppStore();

  const [editVisible, setEditVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const displayName = user
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : 'Valued Guest';
  const displayPhone = user?.phone
    ? user.phone.startsWith('+91')
      ? user.phone
      : `+91 ${user.phone}`
    : '+91 98765 43210';

  const openEdit = () => {
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
    setSaving(true);
    try {
      const updated = {
        id: user?.id ?? Date.now().toString(),
        phone: user?.phone ?? '',
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
      };
      setUser(updated);
      await saveUserToDB(updated);

      if (user?.phone) {
        const phone = user.phone.startsWith('+91')
          ? user.phone
          : `+91${user.phone}`;
        await updateUserProfile(phone, {
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          email: email.trim() || undefined,
        });
      }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <TouchableOpacity onPress={openEdit} style={styles.editHeaderBtn}>
          <Ionicons name="create-outline" size={20} color="#A7F3D0" />
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
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            </View>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.tilesRow}>
          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => router.push('/(tabs)/money')}
            activeOpacity={0.8}
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
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.tileLabel}>Bookings</Text>
            <Text style={styles.tileValue}>View All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => router.push('/recurring-booking' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="gift-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.tileLabel}>VIP Pass</Text>
            <Text style={styles.tileValue}>3 Visits</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => {
                if (item.id === 'help') router.push('/help');
                else if (item.id === 'address') router.push('/(onboarding)/confirm-location');
                else if (item.id === 'refer') {
                  Alert.alert('Referral Code', 'Share code TIDARA100 with your neighbours. Both of you get ₹100 on their first completed service!');
                } else {
                  Alert.alert(item.label, 'Feature is active on your account.');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>

              <Text style={styles.menuLabel}>{item.label}</Text>

              {item.badge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{item.badge}</Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Tidara v1.0.0 • Made with ❤️ in India</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
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
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Last Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#063D26' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#063D26',
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editHeaderBtn: { padding: 6 },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 17,
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6,
  },
  tileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalBody: {
    gap: 14,
  },
  modalField: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.gray400,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
