import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import { SERVICES } from '../constants/services';

const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM',
];

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

export default function RecurringBookingScreen() {
  const {
    scheduledDays: initialDays,
    scheduledSlot: initialSlot,
    setRecurringSchedule,
    cartItems,
    addToCart,
  } = useAppStore();

  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot || '9:00 AM');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialDays.length > 0 ? initialDays : ['Mon', 'Wed', 'Fri']
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>('1');

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day];
      // Always maintain chronological weekday order (RC-04)
      return next.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
    });
  };

  const handleConfirm = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day for your recurring visits.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Select Slot', 'Please select an arrival time slot for your expert.');
      return;
    }

    const sortedDays = [...selectedDays].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    );

    // Save recurring schedule in store (RC-01)
    setRecurringSchedule(sortedDays, selectedSlot);

    // If cart is empty, add the selected service so checkout doesn't fail (RC-02)
    if (cartItems.length === 0) {
      const svc = SERVICES.find((s) => s.id === selectedServiceId) ?? SERVICES[0];
      addToCart(svc.id, 60, svc.price);
    }

    Alert.alert(
      'Recurring Schedule Set! 🎉',
      `Your pro is scheduled every ${sortedDays.join(', ')} at ${selectedSlot}. You can pause or cancel anytime from the Bookings tab.`,
      [
        {
          text: 'Review in Cart',
          onPress: () => router.push('/cart'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Recurring Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="repeat" size={20} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Dedicated Pro for Your Home</Text>
            <Text style={styles.infoSub}>
              Same certified helper arrives every week. No re-booking hassle. Pause or cancel anytime.
            </Text>
          </View>
        </View>

        {/* Days Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Weekly Days</Text>
          </View>

          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const active = selectedDays.includes(day.short);
              return (
                <TouchableOpacity
                  key={day.short}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => toggleDay(day.short)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${day.full}, ${active ? 'selected' : 'not selected'}`}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                    {day.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.daysSelectedText}>
              Every {selectedDays.length > 0 ? selectedDays.join(', ') : 'week'}
            </Text>
          </View>
        </View>

        {/* Slot Timings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Daily Arrival Slot</Text>
          </View>

          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotBtn, active && styles.slotBtnActive]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Arrival time ${slot}, ${active ? 'selected' : 'not selected'}`}
                >
                  <Text style={[styles.slotBtnText, active && styles.slotBtnTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Service Selection (if Cart is empty) */}
        {cartItems.length === 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Recurring Service Task</Text>
            </View>

            <View style={styles.servicesList}>
              {SERVICES.slice(0, 4).map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.serviceOption, isSelected && styles.serviceOptionActive]}
                    onPress={() => setSelectedServiceId(svc.id)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${svc.name}, price ₹${svc.price}`}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{svc.name}</Text>
                      <Text style={styles.servicePrice}>₹{svc.price} per visit • {svc.duration}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Terms Note */}
        <View style={styles.termsNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
          <Text style={styles.termsText}>
            Zero cancellation charges. You are only billed per completed visit with 100% satisfaction guarantee.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Confirm recurring schedule"
        >
          <Text style={styles.confirmBtnText}>Confirm Recurring Schedule</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  placeholder: { width: 36 },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoTextContainer: { flex: 1 },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  infoSub: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  daysSelectedText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  slotBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: Colors.primary,
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  slotBtnTextActive: {
    color: Colors.primary,
  },
  servicesList: {
    gap: 8,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  servicePrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  termsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  termsText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
