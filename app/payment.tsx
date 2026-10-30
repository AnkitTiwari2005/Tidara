import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import { createRazorpayOrder, getRazorpayCheckoutHTML } from '../lib/razorpay';
import { createBooking } from '../lib/supabase';
import RazorpayWebView from '../components/RazorpayWebView';
import { SERVICES } from '../constants/services';

type PaymentMethod = 'upi' | 'phonepe' | 'gpay' | 'paytm' | 'card' | 'cod' | 'wallet';

const UPI_APPS = [
  { key: 'gpay' as PaymentMethod, label: 'Google Pay', icon: 'logo-google' as const, color: '#4285F4' },
  { key: 'phonepe' as PaymentMethod, label: 'PhonePe', icon: 'phone-portrait-outline' as const, color: '#5F259F' },
  { key: 'paytm' as PaymentMethod, label: 'Paytm UPI', icon: 'wallet-outline' as const, color: '#00BAF2' },
  { key: 'upi' as PaymentMethod, label: 'Any UPI App', icon: 'qr-code-outline' as const, color: '#059669' },
];

const SERVICE_FEE = 10;
const GST_RATE = 0.05;

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);

  const { cartItems, clearCart, user, walletBalance, setWalletBalance } = useAppStore();

  const itemTotal =
    cartItems.reduce((sum, i) => sum + i.quantity * 299, 0) || 299;
  const gst = parseFloat((itemTotal * GST_RATE).toFixed(2));
  const total = itemTotal + SERVICE_FEE + gst;
  const totalPaise = Math.round(total * 100);

  /* Save booking to Supabase */
  const saveBookingToDB = async (paymentMethod: string) => {
    if (!user?.phone) return;
    const phone = user.phone.startsWith('+91')
      ? user.phone
      : `+91${user.phone}`;
    const now = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    for (const item of cartItems) {
      const svc = SERVICES.find((s) => s.id === item.serviceId);
      await createBooking({
        user_phone: phone,
        service_id: item.serviceId,
        service_name: svc?.name ?? 'Tidara Express Service',
        price: total,
        status: 'upcoming',
        scheduled_at: now,
        address: 'Default address',
      });
    }

    if (cartItems.length === 0) {
      await createBooking({
        user_phone: phone,
        service_id: 'general',
        service_name: 'Tidara Home Service',
        price: total,
        status: 'upcoming',
        scheduled_at: now,
        address: 'Default address',
      });
    }
  };

  /* COD Flow */
  const handleCOD = async () => {
    setLoading(true);
    try {
      await saveBookingToDB('Cash on Delivery');
      clearCart();
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your expert is dispatched.\nPay ${formatCurrency(
          total
        )} in cash or UPI once the work is completed to your satisfaction.`,
        [
          {
            text: 'View Booking',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Could not confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Wallet Payment Flow */
  const handleWalletPayment = async () => {
    if (walletBalance < total) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `Your balance is ${formatCurrency(
          walletBalance
        )}. Please top up or choose another payment method.`
      );
      return;
    }
    setLoading(true);
    try {
      const remaining = walletBalance - total;
      setWalletBalance(remaining);
      await saveBookingToDB('Tidara Wallet');
      clearCart();
      Alert.alert(
        'Paid from Tidara Wallet! 🎉',
        `Payment of ${formatCurrency(total)} was deducted.\nRemaining balance: ${formatCurrency(
          remaining
        )}`,
        [
          {
            text: 'View Booking',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Wallet transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  /* Razorpay Flow */
  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const receipt = `tid_${Date.now()}`;
      const order = await createRazorpayOrder(totalPaise, receipt);
      const userName = user
        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
        : 'Customer';
      const phone = user?.phone ?? '';

      const html = getRazorpayCheckoutHTML({
        orderId: order.id,
        amount: order.amount,
        name: userName,
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        description: 'Tidara Verified Home Services',
      });
      setRazorpayHtml(html);
    } catch (err: any) {
      Alert.alert(
        'Gateway Error',
        err.message ?? 'Could not initialize online checkout.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (selectedMethod === 'cod') {
      handleCOD();
    } else if (selectedMethod === 'wallet') {
      handleWalletPayment();
    } else {
      handleRazorpay();
    }
  };

  const onPaymentSuccess = async () => {
    setRazorpayHtml(null);
    await saveBookingToDB('Razorpay Online');
    clearCart();
    Alert.alert(
      'Payment Successful! 🎉',
      `Payment of ${formatCurrency(total)} confirmed. Your certified pro is assigned.`,
      [{ text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') }]
    );
  };

  const onPaymentFailure = (error: string | null, cancelled?: boolean) => {
    setRazorpayHtml(null);
    if (!cancelled) {
      Alert.alert('Payment Cancelled', error ?? 'Transaction was not completed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payable Total Header Card */}
        <View style={styles.amountCard}>
          <View>
            <Text style={styles.amountLabel}>Total Payable Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
          </View>

          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.secureText}>256-Bit SSL</Text>
          </View>
        </View>

        {/* Tidara Wallet Option */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedMethod === 'wallet' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedMethod('wallet')}
          activeOpacity={0.85}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.optionTitle}>Tidara Wallet</Text>
              <Text style={styles.optionSub}>
                Balance: {formatCurrency(walletBalance)}
                {walletBalance < total && ' (Low Balance)'}
              </Text>
            </View>
          </View>

          <View style={[styles.radioCircle, selectedMethod === 'wallet' && styles.radioActive]}>
            {selectedMethod === 'wallet' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* UPI Apps Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>UPI (Fast & Zero Surcharge)</Text>

          <View style={styles.upiGrid}>
            {UPI_APPS.map((app) => {
              const isSelected = selectedMethod === app.key;
              return (
                <TouchableOpacity
                  key={app.key}
                  style={[styles.upiCard, isSelected && styles.upiCardSelected]}
                  onPress={() => setSelectedMethod(app.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.upiIconBox, { backgroundColor: `${app.color}15` }]}>
                    <Ionicons name={app.icon} size={22} color={app.color} />
                  </View>
                  <Text style={styles.upiLabel}>{app.label}</Text>
                  {isSelected && (
                    <View style={styles.upiSelectedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cash On Delivery (COD) */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedMethod === 'cod' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedMethod('cod')}
          activeOpacity={0.85}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash" size={22} color="#D97706" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Cash On Delivery (COD)</Text>
              <Text style={styles.optionSub}>Pay pro in cash after service completion</Text>
            </View>
          </View>

          <View style={[styles.radioCircle, selectedMethod === 'cod' && styles.radioActive]}>
            {selectedMethod === 'cod' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Credit / Debit Cards & NetBanking */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedMethod === 'card' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedMethod('card')}
          activeOpacity={0.85}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Credit / Debit Cards</Text>
              <Text style={styles.optionSub}>Visa, Mastercard, RuPay, Amex</Text>
            </View>
          </View>

          <View style={[styles.radioCircle, selectedMethod === 'card' && styles.radioActive]}>
            {selectedMethod === 'card' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Trust Notice */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="lock-closed" size={16} color="#64748B" />
          <Text style={styles.guaranteeText}>
            Payments are 100% secure. You are backed by the Tidara Happiness Guarantee.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handleProceed}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.payBtnContent}>
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
              <Text style={styles.payBtnText}>
                {selectedMethod === 'cod'
                  ? `Confirm Booking (${formatCurrency(total)})`
                  : `Pay ${formatCurrency(total)}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay WebView */}
      {razorpayHtml && (
        <RazorpayWebView
          html={razorpayHtml}
          onSuccess={onPaymentSuccess}
          onFailure={onPaymentFailure}
          onClose={() => setRazorpayHtml(null)}
        />
      )}
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
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  secureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 2,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  upiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  upiCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  upiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  upiSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  payBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: {
    backgroundColor: Colors.gray400,
  },
  payBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
