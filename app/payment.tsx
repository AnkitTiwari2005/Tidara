import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../constants/colors';
import { useAppStore, showAppAlert } from '../store/useAppStore';
import { createRazorpayOrder, getRazorpayCheckoutHTML } from '../lib/razorpay';
import { createBooking, updateUserProfile, normalizePhone, debitWallet, creditWallet, bookWithWallet } from '../lib/supabase';
import { sendLocalNotification } from '../lib/notifications';
import RazorpayWebView from '../components/RazorpayWebView';
import { SERVICES, FESTIVE_PACKS, PaymentIcons, BrandImages, TIME_SLOTS } from '../constants/services';
import { LightningSvg, CalendarSvg } from '../components/SvgIcons';

type PaymentMethod = 'upi' | 'phonepe' | 'gpay' | 'paytm' | 'card' | 'cod' | 'wallet';



const UPI_APPS = [
  { key: 'gpay' as PaymentMethod, label: 'Google Pay', image: PaymentIcons.googlepay },
  { key: 'phonepe' as PaymentMethod, label: 'PhonePe', image: PaymentIcons.phonepe },
  { key: 'paytm' as PaymentMethod, label: 'Paytm UPI', image: PaymentIcons.paytm },
  { key: 'upi' as PaymentMethod, label: 'Any UPI App', image: PaymentIcons.upi },
];

const SERVICE_FEE = 10;
const GST_RATE = 0.05;

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);

  const {
    cartItems,
    clearCart,
    user,
    walletBalance,
    setWalletBalance,
    location,
    bookingMode,
    setBookingMode,
    scheduledDays,
    scheduledDate,
    setScheduledDate,
    scheduledSlot,
    setScheduledSlot,
    discountAmount,
  } = useAppStore();

  const cartDetails = cartItems
    .map((item) => {
      if (
        item.serviceId.startsWith('pack_') ||
        item.serviceId === 'pack_1' ||
        item.serviceId === 'pack_2' ||
        item.serviceId === 'pack_3'
      ) {
        const pack = FESTIVE_PACKS.find(
          (p) => p.id === item.serviceId || p.id === item.serviceId.replace('pack_', '')
        );
        if (!pack) return null;
        return {
          id: item.serviceId,
          name: pack.name,
          price: item.unitPrice ?? pack.price,
          quantity: item.quantity,
          duration: pack.duration,
        };
      }
      const svc = SERVICES.find((s) => s.id === item.serviceId);
      if (!svc) return null;
      return {
        id: item.serviceId,
        name: svc.name,
        price: item.unitPrice ?? svc.price,
        quantity: item.quantity,
        duration: item.durationMinutes ? `${item.durationMinutes} mins` : svc.duration,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    duration: string;
  }>;

  const itemTotal = cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.min(discountAmount, itemTotal);
  const taxable = Math.max(0, itemTotal - discount);
  const gst = Math.round(taxable * GST_RATE);
  const total = cartDetails.length > 0 ? taxable + SERVICE_FEE + gst : 0;
  const totalPaise = Math.round(total * 100);

  if (cartDetails.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={54} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Services in Cart</Text>
          <Text style={styles.emptySubtitle}>
            Please select services from the Home screen before visiting the checkout page.
          </Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.returnBtnText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* Parse slot into real future Date respecting chosen date and time (V8, X8) */
  const parseSlotToDate = (slot?: string | null, dateChoice: string = 'Tomorrow'): Date => {
    const target = new Date();
    if (dateChoice === 'Tomorrow') {
      target.setDate(target.getDate() + 1);
    } else if (dateChoice === 'Day After') {
      target.setDate(target.getDate() + 2);
    }
    // If 'Today', target remains current day

    if (!slot) {
      target.setHours(9, 0, 0, 0);
      return target;
    }
    const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3].toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      target.setHours(hours, minutes, 0, 0);
    } else {
      target.setHours(9, 0, 0, 0);
    }
    return target;
  };

  const isSlotInPast = (slot: string, dateChoice?: string | null): boolean => {
    if (dateChoice !== 'Today') return false;
    const slotDate = parseSlotToDate(slot, 'Today');
    return slotDate.getTime() <= Date.now() + 30 * 60 * 1000;
  };

  const getScheduledDisplay = (): string => {
    if (bookingMode === 'Recurring') {
      return `Recurring: ${scheduledDays?.join(', ') || 'Weekly'} @ ${scheduledSlot || '9:00 AM'}`;
    }
    if (bookingMode === 'Scheduled') {
      return `${scheduledDate || 'Tomorrow'} @ ${scheduledSlot || '9:00 AM'}`;
    }
    return 'Today (Express 15-Min)';
  };

  /* Save booking to Supabase with real ISO timestamps and transaction verification */
  const saveBookingToDB = async (
    paymentMethod: string,
    paymentId?: string,
    orderId?: string
  ): Promise<boolean> => {
    if (!user?.phone) {
      showAppAlert('Account Required', 'Please log in with your phone number to complete booking.', 'warning');
      return false;
    }
    const phone = normalizePhone(user.phone);

    const scheduledDisplay = getScheduledDisplay();
    let scheduledIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (bookingMode === 'Scheduled') {
      scheduledIso = parseSlotToDate(scheduledSlot, scheduledDate || 'Tomorrow').toISOString();
    } else if (bookingMode === 'Recurring') {
      scheduledIso = parseSlotToDate(scheduledSlot, 'Tomorrow').toISOString();
    }

    const deliveryAddress = location?.address || 'Confirmed Service Address';
    let hasFailure = false;

    for (const item of cartDetails) {
      const { data, error } = await createBooking({
        user_phone: phone,
        service_id: item.id,
        service_name: item.name,
        price: item.price * item.quantity,
        quantity: item.quantity,
        duration: item.duration || '60 mins',
        slot_label: scheduledDisplay,
        status: 'upcoming',
        scheduled_at: scheduledIso,
        address: deliveryAddress,
        payment_method: paymentMethod,
        payment_id: paymentId,
        order_id: orderId,
      });

      if (error || !data) {
        hasFailure = true;
      }
    }

    if (!hasFailure) {
      const hasPass = cartDetails.some((item) => item.id === 'tidara_pass_3');
      if (hasPass) {
        useAppStore.getState().setTidaraPass(true, 3);
      }
      // Send booking confirmation notification to all successful bookings (V5)
      const serviceSummary = cartDetails.map((i) => i.name).join(', ');
      sendLocalNotification(
        'Booking Confirmed! 🎉',
        `Your visit for ${serviceSummary} is confirmed for ${scheduledDisplay}.`,
        { screen: 'bookings' }
      );
    }

    return !hasFailure;
  };

  /* COD Flow */
  const handleCOD = async () => {
    setLoading(true);
    try {
      const saved = await saveBookingToDB('Cash on Delivery');
      if (!saved) {
        showAppAlert(
          'Booking Failed',
          'Unable to record your booking right now. Please check your network and try again.',
          'error'
        );
        return;
      }
      clearCart();
      showAppAlert(
        'Booking Confirmed',
        `Your expert is confirmed for ${getScheduledDisplay()}.\nPay ${formatCurrency(
          total
        )} in cash or UPI once the work is completed to your satisfaction.`,
        'success',
        [
          {
            text: 'View Booking',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch {
      showAppAlert('Error', 'Could not confirm booking. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* Wallet Payment Flow (Debit FIRST with strict verification and rollback - V2) */
  const handleWalletPayment = async () => {
    if (walletBalance < total) {
      showAppAlert(
        'Insufficient Wallet Balance',
        `Your balance is ${formatCurrency(
          walletBalance
        )}. Please top up or choose another payment method.`,
        'warning'
      );
      return;
    }
    setLoading(true);
    try {
      // 1. Atomic wallet debit executed and verified FIRST (V2)
      const debitResult = await debitWallet(
        user!.phone,
        total,
        `Booking: ${cartDetails.map((i) => i.name).join(', ')}`
      );

      if (!debitResult.success) {
        showAppAlert(
          'Wallet Payment Failed',
          debitResult.error || 'Unable to debit your wallet. Your booking was not placed.',
          'error'
        );
        return;
      }

      // 2. Persist booking to database
      const saved = await saveBookingToDB('Tidara Wallet');
      if (!saved) {
        // Rollback debit if database insert failed
        await creditWallet(
          user!.phone,
          total,
          0,
          `Auto-Refund: Booking failed for ${cartDetails.map((i) => i.name).join(', ')}`
        );
        showAppAlert(
          'Booking Failed',
          'Could not record your booking. Any deducted amount has been restored to your wallet.',
          'error'
        );
        return;
      }

      const remaining = typeof debitResult.remaining === 'number'
        ? debitResult.remaining
        : Math.max(0, walletBalance - total);

      setWalletBalance(remaining);
      clearCart();
      showAppAlert(
        'Paid from Tidara Wallet',
        `Payment of ${formatCurrency(total)} was deducted.\nSlot: ${getScheduledDisplay()}\nRemaining balance: ${formatCurrency(
          remaining
        )}`,
        'success',
        [
          {
            text: 'View Booking',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch {
      showAppAlert('Error', 'Wallet transaction failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* Razorpay Flow */
  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const receipt = `tid_${Date.now()}`.slice(0, 40);
      const order = await createRazorpayOrder(totalPaise, receipt);
      const userName = user
        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
        : 'Customer';
      const phone = user?.phone ? normalizePhone(user.phone) : '';

      const html = getRazorpayCheckoutHTML({
        orderId: order.id,
        amount: order.amount,
        name: userName,
        phone,
        description: `${cartDetails.length} Tidara Home Service(s)`,
      });
      setRazorpayHtml(html);
    } catch (err: any) {
      showAppAlert(
        'Gateway Error',
        err.message ?? 'Could not initialize online checkout.',
        'error'
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

  const onPaymentSuccess = async (data: { paymentId: string; orderId?: string }) => {
    setRazorpayHtml(null);
    const saved = await saveBookingToDB('Razorpay Online', data.paymentId, data.orderId);
    clearCart();
    if (saved) {
      showAppAlert(
        'Payment Successful',
        `Payment of ${formatCurrency(total)} confirmed for ${getScheduledDisplay()}. Your certified pro is assigned.`,
        'success',
        [{ text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } else {
      showAppAlert(
        'Payment Confirmed with Notice',
        `Payment ID: ${data.paymentId} was received, but we experienced an issue creating the booking record. Our team is notified and will assign your pro.`,
        'warning',
        [{ text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    }
  };

  const onPaymentFailure = (error: string | null, cancelled?: boolean) => {
    setRazorpayHtml(null);
    if (!cancelled) {
      showAppAlert('Payment Notice', error ?? 'Transaction was not completed.', 'warning');
    }
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
            {discount > 0 && (
              <Text style={styles.discountTag}>Saved {formatCurrency(discount)} with coupon</Text>
            )}
          </View>

          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.secureText}>256-Bit SSL</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        <View style={styles.addressSummaryCard}>
          <View style={styles.addressSummaryLeft}>
            <View style={styles.addressIconBox}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressSummaryTitle}>
                {location?.type ? `${location.type} Address` : 'Service Address'}
              </Text>
              <Text style={styles.addressSummaryText} numberOfLines={2}>
                {location?.address || 'Sector 48, Sohna Road, Gurugram'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeAddressBtn}
            onPress={() => router.push('/add-address')}
            accessibilityRole="button"
            accessibilityLabel="Change delivery address"
          >
            <Text style={styles.changeAddressText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Booking Mode & Slot Selection Card (W12, X8) */}
        {bookingMode !== 'Recurring' ? (
          <View style={styles.slotPickerCard}>
            <View style={styles.slotPickerHeader}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.slotPickerTitle}>Delivery Mode & Time</Text>
            </View>

            {/* Persistent Express / Scheduled Toggle (X8) */}
            <View style={styles.bookingModeRow}>
              {(['Instant', 'Scheduled'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modePill, bookingMode === mode && styles.modePillActive]}
                  onPress={() => setBookingMode(mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: bookingMode === mode }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {mode === 'Instant' ? (
                      <LightningSvg size={14} color={bookingMode === 'Instant' ? '#FFFFFF' : '#059669'} />
                    ) : (
                      <CalendarSvg size={14} color={bookingMode === 'Scheduled' ? '#FFFFFF' : '#059669'} />
                    )}
                    <Text style={[styles.modePillText, bookingMode === mode && styles.modePillTextActive]}>
                      {mode === 'Instant' ? '15-Min Express' : 'Scheduled Slot'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* When Scheduled is active, show Date Chips & Time Slot Chips */}
            {bookingMode === 'Scheduled' && (
              <>
                <Text style={styles.slotSectionSubtitle}>Select Date</Text>
                <View style={styles.dateChipsRow}>
                  {['Today', 'Tomorrow', 'Day After'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dateChip,
                        (scheduledDate || 'Tomorrow') === d && styles.dateChipActive,
                      ]}
                      onPress={() => setScheduledDate(d)}
                    >
                      <Text
                        style={[
                          styles.dateChipText,
                          (scheduledDate || 'Tomorrow') === d && styles.dateChipTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.slotSectionSubtitle}>Select Arrival Slot</Text>
                <View style={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const disabled = isSlotInPast(slot, scheduledDate);
                    const selected = scheduledSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        disabled={disabled}
                        style={[
                          styles.slotChip,
                          selected && styles.slotChipActive,
                          disabled && styles.slotChipDisabled,
                        ]}
                        onPress={() => setScheduledSlot(slot)}
                      >
                        <Text
                          style={[
                            styles.slotChipText,
                            selected && styles.slotChipTextActive,
                            disabled && styles.slotChipTextDisabled,
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.slotPickerCard}>
            <View style={styles.slotPickerHeader}>
              <Ionicons name="repeat" size={18} color={Colors.primary} />
              <Text style={styles.slotPickerTitle}>Recurring Arrival Time</Text>
            </View>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotChip, scheduledSlot === slot && styles.slotChipActive]}
                  onPress={() => setScheduledSlot(slot)}
                >
                  <Text style={[styles.slotChipText, scheduledSlot === slot && styles.slotChipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {scheduledDays.length > 0 && (
              <Text style={styles.slotDaysHint}>
                Scheduled on: {scheduledDays.join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Tidara Wallet Option */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedMethod === 'wallet' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedMethod('wallet')}
          activeOpacity={0.85}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMethod === 'wallet' }}
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
          <Text style={styles.sectionTitle}>UPI (Fast & Direct)</Text>

          <View style={styles.upiGrid}>
            {UPI_APPS.map((app) => {
              const isSelected = selectedMethod === app.key;
              return (
                <TouchableOpacity
                  key={app.key}
                  style={[styles.upiCard, isSelected && styles.upiCardSelected]}
                  onPress={() => setSelectedMethod(app.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.upiIconBox, { backgroundColor: '#F8FAFC' }]}>
                    <Image source={app.image} style={{ width: 28, height: 28 }} resizeMode="contain" />
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
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMethod === 'cod' }}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash" size={22} color="#D97706" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Cash On Delivery (COD)</Text>
              <Text style={styles.optionSub}>Pay expert in cash or UPI after service</Text>
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
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMethod === 'card' }}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Credit / Debit Cards</Text>
              <Text style={styles.optionSub}>Visa, Mastercard, RuPay, NetBanking</Text>
            </View>
          </View>

          <View style={[styles.radioCircle, selectedMethod === 'card' && styles.radioActive]}>
            {selectedMethod === 'card' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Trust Notice */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.guaranteeText}>
            100% Secure Checkout backed by the Tidara Satisfaction Guarantee.
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
          accessibilityRole="button"
          accessibilityLabel={`Confirm payment of ${formatCurrency(total)}`}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
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
    color: Colors.primary,
    marginTop: 2,
  },
  discountTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  secureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  addressSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  addressIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addressSummaryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  changeAddressBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeAddressText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  sectionContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  upiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
    position: 'relative',
  },
  upiCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  upiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  guaranteeText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
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
    opacity: 0.6,
  },
  payBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  returnBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* ── Slot Picker (W12) ───────────────────────────────────────────────────── */
  slotPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  slotPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bookingModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modePillActive: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modePillTextActive: {
    color: Colors.primary,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  slotChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  slotChipTextActive: {
    color: Colors.primary,
  },
  slotDaysHint: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  slotSectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  dateChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  slotChipDisabled: {
    opacity: 0.35,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  slotChipTextDisabled: {
    color: Colors.textMuted,
  },
});