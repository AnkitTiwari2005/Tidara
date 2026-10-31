import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { sendWhatsAppOTP } from '../../lib/whatsy';
import TermsModal from '../../components/TermsModal';

const HIGHLIGHTS = [
  { icon: 'flash' as const, label: '15-min Express' },
  { icon: 'shield-checkmark' as const, label: 'Verified Pros' },
  { icon: 'star' as const, label: 'Top Rated' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');

  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  const isValidIndianPhone = /^[6-9]\d{9}$/.test(cleanDigits);
  const formattedPhone = `+91${cleanDigits}`;

  const handleContinue = async () => {
    if (!isValidIndianPhone) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendWhatsAppOTP(cleanDigits);
      if (result.success) {
        router.push({ pathname: '/(auth)/otp', params: { phone: formattedPhone } });
      } else {
        Alert.alert(
          'Failed to send OTP',
          result.message ?? 'Please check your WhatsApp connection or try again.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Connection Error', 'Unable to reach the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Hero with Deep Forest Gradient */}
          <LinearGradient
            colors={['#063D26', '#0B5335', '#0A4B30']}
            style={styles.heroHeader}
          >
            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => router.replace('/(onboarding)/location')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Explore as guest"
            >
              <Text style={styles.skipText}>Explore as Guest</Text>
              <Ionicons name="arrow-forward" size={14} color="#A7F3D0" />
            </TouchableOpacity>

            {/* Hero Branding */}
            <View style={styles.heroContent}>
              <View style={styles.badgeWrapper}>
                <View style={styles.pulseDot} />
                <Text style={styles.heroBadgeText}>NOW LIVE IN SELECT METROS</Text>
              </View>

              <View style={styles.logoRow}>
                <Text style={styles.logoText}>Tidara</Text>
                <View style={styles.logoDot} />
              </View>

              <Text style={styles.heroSubtitle}>
                Verified household assistance & deep cleaning at your doorstep.
              </Text>

              {/* Quick trust pills */}
              <View style={styles.highlightRow}>
                {HIGHLIGHTS.map((item, idx) => (
                  <View key={idx} style={styles.highlightPill}>
                    <Ionicons name={item.icon} size={13} color="#10B981" />
                    <Text style={styles.highlightText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* Bottom Card / Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter your mobile number</Text>
            <Text style={styles.formSubtitle}>
              We will send a 6-digit verification code to your WhatsApp.
            </Text>

            {/* Input Box */}
            <View style={[styles.phoneInputRow, isFocused && styles.phoneInputRowFocused]}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="98765 43210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={!loading}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />

              {phone.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPhone('')}
                  style={styles.clearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Clear phone number"
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* WhatsApp Updates Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setWhatsapp(!whatsapp)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: whatsapp }}
            >
              <View style={[styles.checkbox, whatsapp && styles.checkboxChecked]}>
                {whatsapp && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Receive booking updates & tracking on <Text style={styles.whatsappHighlight}>WhatsApp</Text>
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                isValidIndianPhone && !loading && styles.continueBtnActive,
              ]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!isValidIndianPhone || loading}
              accessibilityRole="button"
              accessibilityLabel="Get verification code"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Text
                    style={[
                      styles.continueBtnText,
                      isValidIndianPhone && styles.continueBtnTextActive,
                    ]}
                  >
                    Get Verification Code
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isValidIndianPhone ? '#FFFFFF' : Colors.gray400}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Legal / Terms */}
            <Text style={styles.termsNotice}>
              By proceeding, you agree to Tidara’s{' '}
              <Text
                style={styles.termsLink}
                onPress={() => {
                  setTermsType('terms');
                  setTermsModalVisible(true);
                }}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => {
                  setTermsType('privacy');
                  setTermsModalVisible(true);
                }}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms & Privacy Modal */}
      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        type={termsType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#063D26',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
  },
  heroHeader: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: '#063D26',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  heroContent: {
    marginTop: 24,
    alignItems: 'flex-start',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    height: 56,
  },
  phoneInputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  clearBtn: {
    padding: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  whatsappHighlight: {
    fontWeight: '800',
    color: '#15803D',
  },
  continueBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  continueBtnTextActive: {
    color: '#FFFFFF',
  },
  termsNotice: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
