import { useState } from 'react';
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
import { useAppStore, showAppAlert } from '../store/useAppStore';
import { saveUserAddress, normalizePhone } from '../lib/supabase';

type AddressType = 'Home' | 'Work' | 'Other';

const ADDRESS_TYPES: { key: AddressType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'Home', icon: 'home-outline', label: 'Home' },
  { key: 'Work', icon: 'briefcase-outline', label: 'Office' },
  { key: 'Other', icon: 'location-outline', label: 'Other' },
];

export default function AddAddressScreen() {
  const { location, addSavedAddress, user } = useAppStore();

  const currentCity = location?.city || 'Gurugram';
  const defaultArea = location?.address && !location.address.startsWith('Flat')
    ? location.address
    : 'Sector 48, Sohna Road';

  const [flat, setFlat] = useState('');
  const [area, setArea] = useState(defaultArea);
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('Home');

  const handleSave = () => {
    if (!flat.trim()) {
      showAppAlert('Missing Details', 'Please provide your Flat / House / Floor number.', 'warning');
      return;
    }
    if (!area.trim()) {
      showAppAlert('Missing Details', 'Please provide your Sector, Colony or Street name.', 'warning');
      return;
    }
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      showAppAlert('Invalid PIN Code', 'Please enter a valid 6-digit Indian Postal PIN Code.', 'warning');
      return;
    }

    const cleanFlat = flat.trim();
    const cleanArea = area.trim();
    const cleanLandmark = landmark.trim() ? `, Near ${landmark.trim()}` : '';
    const cleanPincode = pincode.trim() ? ` - ${pincode.trim()}` : '';
    const fullFormatted = `${cleanFlat}${cleanLandmark}, ${cleanArea}, ${currentCity}${cleanPincode}`;

    addSavedAddress({
      flat: cleanFlat,
      area: cleanArea,
      landmark: landmark.trim() || undefined,
      pincode: pincode.trim() || undefined,
      city: currentCity,
      fullAddress: fullFormatted,
      type: addressType,
      lat: location?.lat || 28.4595,
      lng: location?.lng || 77.0266,
      isDefault: true,
    });

    // Also persist to Supabase addresses table
    const phone = user?.phone ? normalizePhone(user.phone) : '';
    if (phone) {
      saveUserAddress({
        user_phone: phone,
        address_type: addressType,
        flat_no: cleanFlat,
        landmark: landmark.trim() || undefined,
        full_address: fullFormatted,
        city: currentCity,
        latitude: location?.lat || 28.4595,
        longitude: location?.lng || 77.0266,
      }).catch(() => {});
    }

    showAppAlert('Address Saved', `Saved as ${addressType} address and selected for bookings.`, 'success', [
      {
        text: 'OK',
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
        <Text style={styles.headerTitle}>Add Complete Address</Text>
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
          {/* City / Service Zone Card */}
          <View style={styles.cityCard}>
            <View style={styles.cityIconBox}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>Service Hub: {currentCity}</Text>
              <Text style={styles.cityAddress} numberOfLines={2}>
                Pros are dispatched within 15 minutes in this locality.
              </Text>
            </View>
          </View>

          {/* Address Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Doorstep Details</Text>

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

            {/* Street / Colony / Sector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Sector / Colony / Street <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sector 48, Sohna Road"
                placeholderTextColor={Colors.textMuted}
                value={area}
                onChangeText={setArea}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Landmark & PIN Code Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Mother Dairy"
                  placeholderTextColor={Colors.textMuted}
                  value={landmark}
                  onChangeText={setLandmark}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={[styles.fieldGroup, { width: 110 }]}>
                <Text style={styles.fieldLabel}>PIN Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 122018"
                  placeholderTextColor={Colors.textMuted}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Address Tag */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Save Address As</Text>
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
                      accessibilityLabel={`Save as ${type.label}`}
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
            accessibilityLabel="Save address and select for booking"
          >
            <Text style={styles.saveBtnText}>Save & Apply Address</Text>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
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
