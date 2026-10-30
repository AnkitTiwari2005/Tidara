import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { sendWhatsAppOTP } from '../../lib/whatsy';

const { width } = Dimensions.get('window');

const HIGHLIGHTS = [
  { icon: 'flash' as const, label: '15-min Arrival' },
  { icon: 'shield-checkmark' as const, label: 'Verified Pros' },
  { icon: 'star' as const, label: '4.9★ Rated' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPhoneFilled = phone.length === 10;
  const formattedPhone = `+91${phone}`;

  const handleContinue = async () => {
    if (!isPhoneFilled) return;
    setLoading(true);
    try {
      const result = await sendWhatsAppOTP(formattedPhone);
      if (result.success) {
        router.push({ pathname: '/(auth)/otp', params: { phone: formattedPhone } });
      } else {
        Alert.alert(
          'Failed to send OTP',
          result.message ?? 'Please try again later or check your WhatsApp number.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to reach the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          >
            <Text style={styles.skipText}>Explore as Guest</Text>
            <Ionicons name="arrow-forward" size={14} color="#A7F3D0" />
          </TouchableOpacity>

          {/* Hero Branding */}
          <View style={styles.heroContent}>
            <View style={styles.badgeWrapper}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroBadgeText}>NOW LIVE IN NCR & METROS</Text>
            </View>

            <View style={styles.logoRow}>
              <Text style={styles.logoText}>Tidara</Text>
              <View style={styles.logoDot} />
            </View>

            <Text style={styles.heroSubtitle}>
              House help & deep cleaning at your fingertips.
            </Text>

            {/* Quick trust pills */}
            <View style={styles.highlightRow}>
              {HIGHLIGHTS.map((item, index) => (
                <View key={index} style={styles.highlightPill}>
                  <Ionicons name={item.icon} size={13} color="#10B981" />
                  <Text style={styles.highlightText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Elevated Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Enter Mobile Number</Text>
          <Text style={styles.formSubtitle}>
            We will send a 6-digit verification code to your WhatsApp.
          </Text>

          {/* WhatsApp OTP Info Callout */}
          <View style={styles.whatsappCallout}>
            <View style={styles.whatsappIconCircle}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </View>
            <View style={styles.whatsappCalloutContent}>
              <Text style={styles.whatsappCalloutTitle}>Instant OTP via WhatsApp</Text>
              <Text style={styles.whatsappCalloutDesc}>
                No waiting for SMS delays. 100% spam-free.
              </Text>
            </View>
          </View>

          {/* Input Box */}
          <View style={[styles.phoneInputRow, isFocused && styles.phoneInputRowFocused]}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>+91</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="10-digit number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              editable={!loading}
            />

            {phone.length > 0 && (
              <TouchableOpacity onPress={() => setPhone('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* WhatsApp Opt-in Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setWhatsapp(!whatsapp)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, whatsapp && styles.checkboxChecked]}>
              {whatsapp && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Get booking updates & tracking links on <Text style={styles.whatsappHighlight}>WhatsApp</Text>
            </Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueBtn, isPhoneFilled && !loading && styles.continueBtnActive]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!isPhoneFilled || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={[styles.continueBtnText, isPhoneFilled && styles.continueBtnTextActive]}>
                  Get Verification Code
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={isPhoneFilled ? '#FFFFFF' : Colors.gray400}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Legal / Terms */}
          <Text style={styles.termsNotice}>
            By proceeding, you agree to Tidara’s{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
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
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroContent: {
    marginTop: 20,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  logoDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    marginLeft: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    lineHeight: 22,
    maxWidth: '90%',
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  highlightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  whatsappCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  whatsappIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsappCalloutContent: {
    flex: 1,
  },
  whatsappCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  whatsappCalloutDesc: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    overflow: 'hidden',
  },
  phoneInputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  clearBtn: {
    paddingHorizontal: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  whatsappHighlight: {
    fontWeight: '700',
    color: '#15803D',
  },
  continueBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  continueBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray400,
  },
  continueBtnTextActive: {
    color: '#FFFFFF',
  },
  termsNotice: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
