import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../constants/colors';
import { SERVICES, FESTIVE_PACKS } from '../constants/services';
import { useAppStore } from '../store/useAppStore';

type CartTab = 'Instant' | 'Scheduled' | 'Recurring';

const SERVICE_FEE = 10;
const GST_RATE = 0.05;

export default function CartScreen() {
  const [activeTab, setActiveTab] = useState<CartTab>('Instant');
  const [couponApplied, setCouponApplied] = useState(false);
  const { cartItems, location, addToCart, removeFromCart, clearCart } = useAppStore();

  const cartServices = cartItems
    .map((ci) => {
      if (ci.serviceId.startsWith('pack_')) {
        const packId = ci.serviceId.replace('pack_', '');
        const pack = FESTIVE_PACKS.find((p) => p.id === packId);
        if (!pack) return null;
        return {
          ...ci,
          service: {
            id: ci.serviceId,
            name: pack.name,
            price: pack.price,
            originalPrice: pack.originalPrice,
            duration: pack.duration,
            iconName: pack.iconName,
            iconBg: '#ECFDF5',
            iconColor: '#059669',
          },
        };
      }
      const svc = SERVICES.find((s) => s.id === ci.serviceId);
      if (!svc) return null;
      return { ...ci, service: svc };
    })
    .filter(Boolean) as Array<{
    serviceId: string;
    quantity: number;
    service: {
      id: string;
      name: string;
      price: number;
      originalPrice: number;
      duration: string;
      iconName: string;
      iconBg: string;
      iconColor: string;
    };
  }>;

  const itemTotal = cartServices.reduce(
    (sum, ci) => sum + ci.service.price * ci.quantity,
    0
  );
  const discount = couponApplied ? Math.min(itemTotal * 0.2, 100) : 0;
  const taxable = Math.max(itemTotal - discount, 0);
  const gst = parseFloat((taxable * GST_RATE).toFixed(2));
  const grandTotal = taxable + (itemTotal > 0 ? SERVICE_FEE : 0) + gst;
  const totalSaved =
    cartServices.reduce(
      (sum, ci) => sum + (ci.service.originalPrice - ci.service.price) * ci.quantity,
      0
    ) + discount;

  const handleApplyCoupon = () => {
    if (!couponApplied) {
      setCouponApplied(true);
      Alert.alert('Coupon TIDARA20 Applied! 🎉', 'You saved 20% extra on your booking.');
    } else {
      setCouponApplied(false);
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
        <Text style={styles.headerTitle}>Review Booking</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Booking Mode Selector */}
      <View style={styles.modeContainer}>
        {(['Instant', 'Scheduled', 'Recurring'] as CartTab[]).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.modeTab, isSelected && styles.modeTabSelected]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  tab === 'Instant'
                    ? 'flash'
                    : tab === 'Scheduled'
                    ? 'calendar'
                    : 'repeat'
                }
                size={14}
                color={isSelected ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.modeTabText, isSelected && styles.modeTabTextSelected]}>
                {tab === 'Instant' ? '15-Min Express' : tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressLeft}>
            <View style={styles.addressIconCircle}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressCity}>
                Delivering to {location?.city || 'Gurugram'}
              </Text>
              <Text style={styles.addressFull} numberOfLines={1}>
                {location?.address || 'Sector 48, Sohna Road, Gurugram'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeAddressBtn}
            onPress={() => router.push('/(onboarding)/confirm-location')}
          >
            <Text style={styles.changeAddressText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Services Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selected Services</Text>
            <Text style={styles.sectionCount}>
              {cartServices.length} {cartServices.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {cartServices.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="basket-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtitle}>
                Add services from the home screen to proceed with checkout.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.browseBtnText}>Browse Services</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cartServices.map((ci) => (
              <View key={ci.serviceId} style={styles.cartItemRow}>
                <View style={[styles.itemIconBox, { backgroundColor: ci.service.iconBg }]}>
                  <Ionicons
                    name={ci.service.iconName as any}
                    size={22}
                    color={ci.service.iconColor}
                  />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {ci.service.name}
                  </Text>
                  <Text style={styles.itemDuration}>⏱ {ci.service.duration}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(ci.service.price * ci.quantity)}
                    </Text>
                    <Text style={styles.itemOrigPrice}>
                      {formatCurrency(ci.service.originalPrice * ci.quantity)}
                    </Text>
                  </View>
                </View>

                {/* Stepper */}
                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => removeFromCart(ci.serviceId)}
                    style={styles.stepperBtn}
                  >
                    <Ionicons name="remove" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{ci.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => addToCart(ci.serviceId)}
                    style={styles.stepperBtn}
                  >
                    <Ionicons name="add" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {cartServices.length > 0 && (
            <TouchableOpacity
              style={styles.addMoreRow}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addMoreText}>Add more services</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Coupons Card */}
        {cartServices.length > 0 && (
          <TouchableOpacity
            style={styles.couponCard}
            onPress={handleApplyCoupon}
            activeOpacity={0.8}
          >
            <View style={styles.couponLeft}>
              <View style={styles.couponIconBox}>
                <Ionicons name="pricetag" size={16} color="#B45309" />
              </View>
              <View>
                <Text style={styles.couponTitle}>
                  {couponApplied ? 'Coupon TIDARA20 Applied' : 'TIDARA20 (20% OFF)'}
                </Text>
                <Text style={styles.couponSub}>
                  {couponApplied ? 'Saved ₹' + discount.toFixed(0) : 'Tap to apply coupon'}
                </Text>
              </View>
            </View>

            <Text style={[styles.couponAction, couponApplied && styles.couponActionApplied]}>
              {couponApplied ? 'REMOVE' : 'APPLY'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bill Summary */}
        {cartServices.length > 0 && (
          <View style={styles.billCard}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>{formatCurrency(itemTotal)}</Text>
            </View>

            {couponApplied && (
              <View style={styles.billRow}>
                <Text style={styles.discountLabel}>Coupon Discount (20%)</Text>
                <Text style={styles.discountValue}>-{formatCurrency(discount)}</Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Safety & Dispatch Fee</Text>
              <Text style={styles.billValue}>{formatCurrency(SERVICE_FEE)}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & GST (5%)</Text>
              <Text style={styles.billValue}>{formatCurrency(gst)}</Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billRowGrand}>
              <View>
                <Text style={styles.grandLabel}>Grand Total</Text>
                <Text style={styles.savedNotice}>
                  🎉 You saved {formatCurrency(totalSaved)} on this booking!
                </Text>
              </View>
              <Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        )}

        {/* Cancellation Guarantee */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.safetyText}>
            Free cancellation up to 10 mins before arrival. 100% money-back guarantee.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Checkout Bar */}
      {cartServices.length > 0 && (
        <View style={styles.footerBar}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTotalLabel}>TO PAY</Text>
            <Text style={styles.footerTotal}>{formatCurrency(grandTotal)}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/payment')}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Payment</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  clearBtn: { padding: 6 },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
  modeContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#F8FAFC',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeTabTextSelected: {
    color: '#FFFFFF',
  },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 100 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  addressIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextContainer: { flex: 1 },
  addressCity: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addressFull: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  changeAddressBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeAddressText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyCartSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
    marginBottom: 8,
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemDuration: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  itemOrigPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    paddingHorizontal: 6,
  },
  addMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  couponSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  couponAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  couponActionApplied: {
    color: Colors.error,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  discountLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  savedNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  grandValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  footerLeft: {},
  footerTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
