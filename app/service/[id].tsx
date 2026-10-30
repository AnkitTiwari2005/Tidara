import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import { SERVICES, FESTIVE_PACKS } from '../../constants/services';
import { useAppStore } from '../../store/useAppStore';

const DURATION_OPTIONS = [
  { mins: 45, priceMultiplier: 1.0, label: 'Standard (45 mins)' },
  { mins: 90, priceMultiplier: 1.8, label: 'Deep Session (90 mins)' },
  { mins: 150, priceMultiplier: 2.8, label: 'Full Home Reset (150 mins)' },
];

const HOW_IT_WORKS = [
  {
    icon: 'clipboard-outline' as const,
    title: '1. Task Alignment',
    desc: 'Certified pro arrives equipped with specialized tools and reviews your priority areas.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: '2. Systematic Execution',
    desc: 'Deep cleaning, dusting and sanitization completed systematically with eco-friendly solutions.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: '3. Final Quality Inspection',
    desc: 'Walkthrough with you to ensure 100% satisfaction before marking the task complete.',
  },
];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);

  const { addToCart, removeFromCart, cartItems } = useAppStore();

  const service =
    SERVICES.find((s) => s.id === id) ||
    FESTIVE_PACKS.find((p) => p.id === id) ||
    SERVICES[0];

  const basePrice = (service as any).price || 99;
  const originalPrice = (service as any).originalPrice || 199;
  const currentPrice = Math.round(
    basePrice * DURATION_OPTIONS[selectedDurationIndex].priceMultiplier
  );

  const cartItem = cartItems.find((ci) => ci.serviceId === service.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service.name}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/cart')}
          style={styles.cartIconBtn}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.textPrimary} />
          {cartItems.length > 0 && <View style={styles.cartBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Hero Photo Banner */}
        <View style={styles.heroImageBox}>
          <Image
            source={{ uri: (service as any).imageUrl }}
            style={styles.heroPhoto}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.75)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroBadgeRow}>
            <View style={styles.instantDispatchPill}>
              <Ionicons name="flash" size={12} color="#10B981" />
              <Text style={styles.instantDispatchText}>15-min Express Arrival</Text>
            </View>
          </View>
        </View>

        {/* Title & Metadata */}
        <View style={styles.detailCard}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingScore}>4.9</Text>
              <Text style={styles.ratingCount}>(240k+ verified visits)</Text>
            </View>
          </View>

          <Text style={styles.serviceTitle}>{service.name}</Text>
          <Text style={styles.serviceDescription}>
            {(service as any).description ||
              'Certified professional home assistance with commercial-grade cleaning equipment.'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatCurrency(currentPrice)}</Text>
            <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 50%</Text>
            </View>
          </View>
        </View>

        {/* Duration Options */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Choose Service Duration</Text>
          <View style={styles.durationList}>
            {DURATION_OPTIONS.map((opt, index) => {
              const isSelected = selectedDurationIndex === index;
              const optPrice = Math.round(basePrice * opt.priceMultiplier);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.durationOption,
                    isSelected && styles.durationOptionSelected,
                  ]}
                  onPress={() => setSelectedDurationIndex(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.durationLeft}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.durationLabel,
                        isSelected && styles.durationLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <Text style={styles.durationPrice}>{formatCurrency(optPrice)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* What's Included */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What's Included in This Service</Text>
          <View style={styles.checkList}>
            {[
              '100% Background-verified & vaccinated professional',
              'Eco-friendly antiseptic cleaning solutions included',
              'Deep scrubbing of corners, tracks & hidden spots',
              'Post-service quality inspection with customer',
              'Damage cover up to ₹10,000 included for free',
            ].map((text, idx) => (
              <View key={idx} style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.checkItemText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            {HOW_IT_WORKS.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepIconBox}>
                  <Ionicons name={step.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerPriceLabel}>TOTAL PRICE</Text>
          <Text style={styles.footerPrice}>{formatCurrency(currentPrice)}</Text>
        </View>

        {qty > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={() => removeFromCart(service.id)}
              style={styles.stepperBtn}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{qty}</Text>
            <TouchableOpacity
              onPress={() => addToCart(service.id)}
              style={styles.stepperBtn}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={() => addToCart(service.id)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addCartBtnText}>Add to Booking</Text>
          </TouchableOpacity>
        )}
      </View>
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    marginHorizontal: 12,
  },
  cartIconBtn: {
    padding: 6,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 90 },
  heroImageBox: {
    height: 200,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 14,
    left: 14,
  },
  instantDispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  instantDispatchText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ratingCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  serviceDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  durationList: {
    gap: 8,
  },
  durationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  durationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  durationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  durationLabelSelected: {
    fontWeight: '800',
    color: Colors.primary,
  },
  durationPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  checkList: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkItemText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stepsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: { flex: 1 },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
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
  footerPriceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addCartBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 8,
  },
});
