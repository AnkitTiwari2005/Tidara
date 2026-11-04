import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../../lib/whatsy';
import { useAppStore } from '../../store/useAppStore';
import { normalizePhone } from '../../lib/supabase';

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

  const canonicalPhone = normalizePhone(phone ?? '');

  useEffect(() => {
    if (!phone) {
      router.replace('/(auth)/login');
      return;
    }
  }, [phone]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // If user typed a new digit into an already filled box (e.g. "5" -> "58"), replace only that cell with the latest digit
    if (clean.length > 1 && clean.length < OTP_LENGTH) {
      const replacedDigit = clean.slice(-1);
      const newOtp = [...otp];
      newOtp[index] = replacedDigit;
      setOtp(newOtp);
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // Handles full paste or SMS autofill (all 6 digits)
    if (clean.length >= OTP_LENGTH) {
      // If pasting into a cell that already held a digit (e.g. 7 digits), take the 6 pasted digits cleanly (V13)
      const targetStr = clean.length > OTP_LENGTH ? clean.slice(-OTP_LENGTH) : clean.slice(0, OTP_LENGTH);
      const digits = targetStr.split('');
      const newOtp = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(digits.join(''));
      return;
    }

    // Single digit typed
    setError(null);
    const newOtp = [...otp];
    newOtp[index] = clean.slice(-1);
    setOtp(newOtp);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      const filled = [...newOtp];
      if (filled.every((d) => d !== '')) handleVerify(filled.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    if (otpCode.length < OTP_LENGTH) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyWhatsAppOTP(canonicalPhone, otpCode);
      if (result.success) {
        if (result.token) {
          useAppStore.getState().setAuthToken(result.token);
        }
        const found = await syncUserFromDB(canonicalPhone);
        const { user } = useAppStore.getState();

        if (!found || !user || !user.firstName || user.firstName.trim().length === 0) {
          // Half-registered: do NOT authenticate until firstName is submitted in profile-setup
          setUser({
            phone: canonicalPhone,
            firstName: '',
          });
          router.replace('/(auth)/profile-setup');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(result.message ?? 'Incorrect code. Please double check and try again.');
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
    if (countdown > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
    setLoading(true);
    try {
      const result = await sendWhatsAppOTP(canonicalPhone);
      if (result.success) {
        setCountdown(RESEND_COUNTDOWN);
        Alert.alert('Code Sent', 'A fresh 6-digit code has been delivered to your WhatsApp.');
      } else {
        Alert.alert('Resend Failed', result.message ?? 'Please wait a moment before trying again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.every((d) => d !== '');

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
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Badge Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses" size={28} color="#15803D" />
          </View>

          <Text style={styles.title}>Enter 6-digit code</Text>
          <Text style={styles.subtitle}>
            Code sent via WhatsApp to <Text style={styles.phoneHighlight}>{canonicalPhone}</Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                keyboardType="number-pad"
                maxLength={12}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
                editable={!loading}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, isComplete && !loading && styles.verifyBtnActive]}
            onPress={() => handleVerify()}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Verify and proceed"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.verifyBtnText, isComplete && styles.verifyBtnTextActive]}>
                Verify & Proceed
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerCount}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendBtnText}>Resend code via WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
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
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  placeholder: { width: 36 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 18,
  },
  phoneHighlight: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: '#FEE2E2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  verifyBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  verifyBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  verifyBtnTextActive: {
    color: '#FFFFFF',
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  timerCount: {
    fontWeight: '700',
    color: Colors.primary,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
});
