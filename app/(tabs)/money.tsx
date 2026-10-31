import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import { useAppStore, showAppAlert } from '../../store/useAppStore';
import { createRazorpayOrder, getRazorpayCheckoutHTML } from '../../lib/razorpay';
import { updateUserProfile, normalizePhone } from '../../lib/supabase';
import RazorpayWebView from '../../components/RazorpayWebView';

const PRESET_AMOUNTS = [
  { amount: 250, bonus: 12 },
  { amount: 500, bonus: 25 },
  { amount: 1000, bonus: 50 },
];

export default function MoneyScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);

  const { user, walletBalance, setWalletBalance } = useAppStore();

  const parsedCustom = parseInt(customAmount, 10);
  const displayAmount = customAmount
    ? (isNaN(parsedCustom) ? 0 : parsedCustom)
    : (selectedAmount ?? 0);

  const bonusAmount = displayAmount >= 250 ? Math.round(displayAmount * 0.05) : 0;
  const totalCredit = displayAmount + bonusAmount;

  const handleAddMoney = async () => {
    if (!user) {
      Alert.alert(
        'Sign in Required',
        'Please sign in with your mobile number to add funds to your wallet.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (displayAmount < 50) {
      Alert.alert('Minimum Recharge', 'Please enter at least ₹50 to top up your wallet.');
      return;
    }

    if (displayAmount > 10000) {
      Alert.alert('Recharge Limit', 'Single recharge cannot exceed ₹10,000 for standard customer accounts.');
      return;
    }

    setLoading(true);
    try {
      const amountPaise = displayAmount * 100;
      const receipt = `wal_${Date.now()}`.slice(0, 40);
      const order = await createRazorpayOrder(amountPaise, receipt);
      const userName = `${user.firstName} ${user.lastName ?? ''}`.trim() || 'Valued Member';
      const phone = normalizePhone(user.phone);

      const html = getRazorpayCheckoutHTML({
        orderId: order.id,
        amount: order.amount,
        name: userName,
        phone,
        description: `Top up ${formatCurrency(displayAmount)} to Tidara Wallet`,
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

  const onPaymentSuccess = async (_data: { paymentId: string }) => {
    setRazorpayHtml(null);
    const newBalance = walletBalance + totalCredit;
    setWalletBalance(newBalance);

    if (user?.phone) {
      await updateUserProfile(user.phone, { wallet_balance: newBalance });
    }

    showAppAlert(
      'Wallet Loaded Successfully',
      `${formatCurrency(totalCredit)} has been credited to your wallet${
        bonusAmount > 0 ? ` (includes ${formatCurrency(bonusAmount)} bonus cashback)` : ''
      }.\n\nUpdated Balance: ${formatCurrency(newBalance)}`,
      'success',
      [{ text: 'Great!' }],
      { icon: 'wallet-outline' }
    );
  };

  const onPaymentFailure = (error: string | null, cancelled?: boolean) => {
    setRazorpayHtml(null);
    if (!cancelled) {
      Alert.alert('Payment Notice', error ?? 'Transaction was not completed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tidara Money</Text>
          <Text style={styles.headerSubtitle}>Instant 1-click checkout</Text>
        </View>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push('/help')}
          accessibilityRole="button"
          accessibilityLabel="Open help"
        >
          <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.instantRefundText}>1-Click Zero OTP Checkout</Text>
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
                  accessibilityRole="button"
                  accessibilityLabel={`Select ₹${preset.amount}`}
                >
                  <Text
                    style={[
                      styles.presetAmount,
                      isSelected && styles.presetAmountSelected,
                    ]}
                  >
                    + {formatCurrency(preset.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.presetBonus,
                      isSelected && styles.presetBonusSelected,
                    ]}
                  >
                    +{formatCurrency(preset.bonus)} free
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter other amount (min ₹50)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '');
                setCustomAmount(numeric);
                setSelectedAmount(null);
              }}
              maxLength={5}
            />
          </View>

          {/* Summary */}
          {displayAmount > 0 && (
            <View style={styles.calcSummary}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Recharge Amount</Text>
                <Text style={styles.calcValue}>{formatCurrency(displayAmount)}</Text>
              </View>
              {bonusAmount > 0 && (
                <View style={styles.calcRow}>
                  <Text style={styles.bonusLabel}>5% Instant Bonus</Text>
                  <Text style={styles.bonusValue}>+{formatCurrency(bonusAmount)}</Text>
                </View>
              )}
              <View style={styles.calcDivider} />
              <View style={styles.calcRowTotal}>
                <Text style={styles.totalCreditLabel}>Total Added to Wallet</Text>
                <Text style={styles.totalCreditValue}>{formatCurrency(totalCredit)}</Text>
              </View>
            </View>
          )}

          {/* Recharge Button */}
          <TouchableOpacity
            style={[styles.addBtn, loading && styles.addBtnDisabled]}
            onPress={handleAddMoney}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Recharge wallet with ${formatCurrency(displayAmount)}`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>
                  {displayAmount > 0 ? `Recharge ${formatCurrency(displayAmount)}` : 'Select Amount'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsCard}>
          <Text style={styles.sectionTitle}>Why Use Tidara Money?</Text>
          <View style={styles.benefitsList}>
            {[
              { icon: 'flash', text: '1-click zero OTP checkout on all visits' },
              { icon: 'refresh', text: 'Instant refunds on any cancelled visits' },
              { icon: 'gift', text: '5% bonus cashback on every ₹250+ recharge' },
            ].map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <Ionicons name={b.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashbackTextContainer: { flex: 1 },
  cashbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  cashbackSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  addMoneyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  presetBtnSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: Colors.primary,
  },
  presetAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  presetAmountSelected: {
    color: Colors.primary,
  },
  presetBonus: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
  presetBonusSelected: {
    color: '#059669',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  calcSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bonusLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  bonusValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  totalCreditLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalCreditValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  addBtn: {
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
  addBtnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
