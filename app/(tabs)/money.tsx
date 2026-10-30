import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { createRazorpayOrder, getRazorpayCheckoutHTML } from '../../lib/razorpay';
import { updateUserProfile } from '../../lib/supabase';
import RazorpayWebView from '../../components/RazorpayWebView';

const PRESET_AMOUNTS = [
  { amount: 250, bonus: 12.5 },
  { amount: 500, bonus: 25 },
  { amount: 1000, bonus: 50 },
];

export default function MoneyScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);

  const { user, walletBalance, setWalletBalance } = useAppStore();

  const displayAmount =
    selectedAmount ?? (customAmount ? parseInt(customAmount) : 0);
  const bonusAmount =
    displayAmount >= 250 ? parseFloat((displayAmount * 0.05).toFixed(2)) : 0;
  const totalCredit = displayAmount + bonusAmount;

  const handleAddMoney = async () => {
    if (displayAmount < 1) {
      Alert.alert('Invalid Amount', 'Please enter at least ₹1 to top up.');
      return;
    }
    setLoading(true);
    try {
      const amountPaise = displayAmount * 100;
      const receipt = `wallet_${Date.now()}`;
      const order = await createRazorpayOrder(amountPaise, receipt);
      const userName = user
        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
        : 'Customer';
      const phone = user?.phone ?? '';

      const html = getRazorpayCheckoutHTML({
        orderId: order.id,
        amount: order.amount,
        name: userName,
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        description: `Top up ₹${displayAmount} to Tidara Wallet`,
      });
      setRazorpayHtml(html);
    } catch (err: any) {
      Alert.alert(
        'Top up Failed',
        err.message ?? 'Could not initialize payment gateway.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (data: { paymentId: string }) => {
    setRazorpayHtml(null);
    const newBalance = walletBalance + totalCredit;
    setWalletBalance(newBalance);

    if (user?.phone) {
      const phone = user.phone.startsWith('+91')
        ? user.phone
        : `+91${user.phone}`;
      await updateUserProfile(phone, { wallet_balance: newBalance });
    }

    Alert.alert(
      'Wallet Loaded Successfully! 🎉',
      `${formatCurrency(totalCredit)} has been credited to your wallet${
        bonusAmount > 0 ? ` (includes ${formatCurrency(bonusAmount)} bonus cashback)` : ''
      }.\n\nUpdated Balance: ${formatCurrency(newBalance)}`,
      [{ text: 'Awesome!' }]
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
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tidara Money</Text>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push('/help')}
        >
          <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Luxury Obsidian-Emerald Card */}
        <LinearGradient
          colors={['#063D26', '#0B5335', '#022115']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.luxuryCard}
        >
          <View style={styles.luxuryCardTop}>
            <View>
              <Text style={styles.cardBrand}>TIDARA DIGITAL WALLET</Text>
              <Text style={styles.cardHolder}>
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}` : 'Verified Member'}
              </Text>
            </View>
            <View style={styles.cardChip}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.cardChipText}>SECURE</Text>
            </View>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(walletBalance)}</Text>
          </View>

          <View style={styles.luxuryCardBottom}>
            <View style={styles.instantRefundPill}>
              <Ionicons name="flash" size={12} color="#A7F3D0" />
              <Text style={styles.instantRefundText}>1-Click Zero OTP Booking</Text>
            </View>
            <Text style={styles.expiryText}>NO EXPIRY</Text>
          </View>
        </LinearGradient>

        {/* 5% Cashback Promo */}
        <View style={styles.cashbackBanner}>
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cashbackGradient}
          >
            <View style={styles.cashbackIcon}>
              <Ionicons name="gift" size={20} color="#B45309" />
            </View>
            <View style={styles.cashbackTextContainer}>
              <Text style={styles.cashbackTitle}>Instant 5% Extra Cashback</Text>
              <Text style={styles.cashbackSubtitle}>
                Add ₹250 or more and get instant bonus credits added.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Add Money Section */}
        <View style={styles.addMoneyCard}>
          <Text style={styles.sectionTitle}>Top Up Wallet</Text>

          {/* Preset Buttons */}
          <View style={styles.presetsRow}>
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = selectedAmount === preset.amount && !customAmount;
              return (
                <TouchableOpacity
                  key={preset.amount}
                  style={[styles.presetBtn, isSelected && styles.presetBtnSelected]}
                  onPress={() => {
                    setSelectedAmount(preset.amount);
                    setCustomAmount('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.presetAmountText,
                      isSelected && styles.presetAmountTextSelected,
                    ]}
                  >
                    {formatCurrency(preset.amount)}
                  </Text>
                  <View style={styles.bonusTag}>
                    <Text style={styles.bonusTagText}>+{formatCurrency(preset.bonus)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Or enter custom amount"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={(val) => {
                setCustomAmount(val.replace(/[^0-9]/g, ''));
                setSelectedAmount(null);
              }}
            />
          </View>

          {/* Credit Calculation Summary */}
          {displayAmount > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                You will get:{' '}
                <Text style={styles.summaryAmount}>{formatCurrency(totalCredit)}</Text>
                {bonusAmount > 0 && (
                  <Text style={styles.bonusHighlight}>
                    {' '}
                    (includes {formatCurrency(bonusAmount)} bonus)
                  </Text>
                )}
              </Text>
            </View>
          )}

          {/* Top up Button */}
          <TouchableOpacity
            style={[styles.topupBtn, displayAmount > 0 && styles.topupBtnActive]}
            onPress={handleAddMoney}
            disabled={displayAmount < 1 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.topupBtnContent}>
                <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                <Text style={styles.topupBtnText}>
                  Add {formatCurrency(displayAmount || 0)} to Wallet
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Why Use Wallet */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Use Tidara Money?</Text>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="flash-outline" size={20} color="#059669" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureHeading}>Zero-Payment Hassle</Text>
              <Text style={styles.featureDesc}>
                No waiting for OTPs or failed UPI transactions at your door.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="refresh-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureHeading}>Instant Automatic Refunds</Text>
              <Text style={styles.featureDesc}>
                Cancellations or slot adjustments reflect immediately.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureHeading}>100% Safe & RBI Compliant</Text>
              <Text style={styles.featureDesc}>
                Encrypted via Razorpay banking infrastructure.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Razorpay Checkout Modal */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#063D26',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#063D26',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  helpBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  luxuryCard: {
    borderRadius: 22,
    padding: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  luxuryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1.5,
  },
  cardHolder: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  balanceSection: {
    marginVertical: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 4,
  },
  luxuryCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  instantRefundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instantRefundText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  expiryText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
  cashbackBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cashbackGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cashbackIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashbackTextContainer: {
    flex: 1,
  },
  cashbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  cashbackSubtitle: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  addMoneyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  presetBtnSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: Colors.primary,
  },
  presetAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  presetAmountTextSelected: {
    color: Colors.primary,
  },
  bonusTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  summaryBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryAmount: {
    fontWeight: '800',
    color: Colors.primary,
  },
  bonusHighlight: {
    fontWeight: '700',
    color: '#15803D',
  },
  topupBtn: {
    backgroundColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  topupBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topupBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topupBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
