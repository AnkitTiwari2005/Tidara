import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';

type AddressType = 'Home' | 'Work' | 'Other';

const ADDRESS_TYPES: { key: AddressType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'Home', icon: 'home-outline', label: 'Home' },
  { key: 'Work', icon: 'briefcase-outline', label: 'Office' },
  { key: 'Other', icon: 'location-outline', label: 'Other' },
];

export default function AddAddressScreen() {
  const [flat, setFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('Home');

  const { location, setLocation } = useAppStore();

  const handleSave = () => {
    if (!flat.trim()) {
      Alert.alert('Incomplete Address', 'Please provide your Flat / House number.');
      return;
    }
    const currentCity = location?.city || 'Gurugram';
    const currentAddress = `${flat.trim()}, ${landmark ? `${landmark.trim()}, ` : ''}${location?.address || currentCity}`;

    setLocation({
      city: currentCity,
      address: currentAddress,
      lat: location?.lat || 28.4595,
      lng: location?.lng || 77.0266,
      isServiceable: true,
    });

    Alert.alert('Address Saved', 'Your address has been pinned for this booking.', [
      { text: 'Proceed', onPress: () => router.push('/payment') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* City Info Card */}
        <View style={styles.cityCard}>
          <View style={styles.cityIconBox}>
            <Ionicons name="location" size={18} color={Colors.primary} />
          </View>
          <View style={styles.cityInfo}>
            <Text style={styles.cityName}>{location?.city || 'Gurugram'}</Text>
            <Text style={styles.cityAddress} numberOfLines={2}>
              {location?.address || 'Sector 48, Sohna Road, Gurugram, Haryana'}
            </Text>
          </View>
        </View>

        {/* Address Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>House / Flat Details</Text>

          {/* Flat / House # */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              House / Flat / Floor No. <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 402, Tower B, Palm Heights"
              placeholderTextColor={Colors.textMuted}
              value={flat}
              onChangeText={setFlat}
            />
          </View>

          {/* Landmark */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nearby Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Mother Dairy / Community Gate"
              placeholderTextColor={Colors.textMuted}
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          {/* Address Tag */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Save As</Text>
            <View style={styles.tagRow}>
              {ADDRESS_TYPES.map((type) => {
                const active = addressType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.tagPill, active && styles.tagPillActive]}
                    onPress={() => setAddressType(type.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type.icon}
                      size={16}
                      color={active ? '#FFFFFF' : Colors.textSecondary}
                    />
                    <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save Address & Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
  placeholder: { width: 36 },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityInfo: { flex: 1 },
  cityName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  cityAddress: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  required: { color: Colors.error },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  tagPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
