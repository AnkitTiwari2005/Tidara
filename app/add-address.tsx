import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    
    // Clean base area without recursive flat prefixes
    let baseArea = location?.address || currentCity;
    // If base area contains previously entered comma separated flat prefix, use it cleanly
    const fullFormatted = `${flat.trim()}${landmark.trim() ? `, Near ${landmark.trim()}` : ''}, ${baseArea}`;

    setLocation({
      city: currentCity,
      address: fullFormatted,
      lat: location?.lat || 28.4595,
      lng: location?.lng || 77.0266,
      isServiceable: true,
      type: addressType,
    });

    Alert.alert('Address Saved 🎉', `Saved as ${addressType} address.`, [
      {
        text: 'Continue',
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address Details</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* City Info Card */}
          <View style={styles.cityCard}>
            <View style={styles.cityIconBox}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>{location?.city || 'Selected Location'}</Text>
              <Text style={styles.cityAddress} numberOfLines={2}>
                {location?.address || 'Area confirmed via location selection'}
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
                autoCapitalize="words"
                returnKeyType="next"
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
                autoCapitalize="words"
                returnKeyType="done"
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
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
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
            accessibilityRole="button"
            accessibilityLabel="Save address and continue"
          >
            <Text style={styles.saveBtnText}>Save Address</Text>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    color: Colors.textPrimary,
  },
  cityAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
