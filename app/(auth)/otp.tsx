import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../../lib/whatsy';
import { useAppStore } from '../../store/useAppStore';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 45;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<any[]>([]);
  const { setUser, syncUserFromDB } = useAppStore();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      if (digits.length === OTP_LENGTH) handleVerify(digits.join(''));
      return;
    }

    setError(null);
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (text && index === OTP_LENGTH - 1) {
      const filled = [...newOtp];
      if (filled.every((d) => d !== '')) handleVerify(filled.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    if (otpCode.length < OTP_LENGTH) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyWhatsAppOTP(phone ?? '', otpCode);
      if (result.success) {
        const cleanPhone = (phone ?? '').replace('+91', '');
        await syncUserFromDB(phone ?? '');

        const { user } = useAppStore.getState();
        if (!user || !user.firstName) {
          setUser({
            id: Date.now().toString(),
            phone: cleanPhone,
            firstName: '',
          });
          router.replace('/(auth)/profile-setup');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError('Incorrect code. Please double check and try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Connection timeout. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
    setCountdown(RESEND_COUNTDOWN);
    inputRefs.current[0]?.focus();
    try {
      const result = await sendWhatsAppOTP(phone ?? '');
      if (!result.success) {
        Alert.alert('Resend Failed', result.message ?? 'Please wait a moment before trying again.');
      }
    } catch {
      Alert.alert('Error', 'Could not resend verification code.');
    }
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* WhatsApp Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.whatsappPill}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.whatsappPillText}>Code Sent via WhatsApp</Text>
            </View>
          </View>

          <Text style={styles.title}>Enter 6-Digit Code</Text>
          <Text style={styles.subtitle}>
            We have sent a verification code to{' '}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpRow}>
            {Array(OTP_LENGTH)
              .fill(null)
              .map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { (inputRefs.current as any)[i] = ref; }}
                  style={[
                    styles.otpBox,
                    otp[i] ? styles.otpBoxFilled : null,
                    error ? styles.otpBoxError : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  value={otp[i]}
                  onChangeText={(t) => handleOtpChange(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  autoFocus={i === 0}
                  textAlign="center"
                  selectionColor={Colors.primary}
                  editable={!loading}
                />
              ))}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Resend Timer */}
          <View style={styles.resendSection}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerCount}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={loading} style={styles.resendBtn}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.resendBtnText}>Resend Code via WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, isComplete && !loading && styles.verifyBtnActive]}
            onPress={() => handleVerify()}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={[styles.verifyBtnText, isComplete && styles.verifyBtnTextActive]}>
                  Verify & Proceed
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={isComplete ? '#FFFFFF' : Colors.gray400}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  badgeRow: {
    marginBottom: 16,
  },
  whatsappPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  whatsappPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 32,
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: Colors.primary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
    flex: 1,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  timerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timerCount: {
    fontWeight: '700',
    color: Colors.primary,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  verifyBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnActive: {
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
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray400,
  },
  verifyBtnTextActive: {
    color: '#FFFFFF',
  },
});
