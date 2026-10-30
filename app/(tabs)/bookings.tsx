import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { getUserBookings, Booking } from '../../lib/supabase';

type TabType = 'upcoming' | 'previous';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAppStore();

  const fetchBookings = useCallback(async () => {
    if (!user?.phone) {
      setLoading(false);
      return;
    }
    const phone = user.phone.startsWith('+91') ? user.phone : `+91${user.phone}`;
    const { data } = await getUserBookings(phone);
    setBookings(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [user?.phone]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const previous = bookings.filter((b) => b.status !== 'upcoming');
  const displayed = activeTab === 'upcoming' ? upcoming : previous;

  const handleTrackPro = (booking: Booking) => {
    Alert.alert(
      'Live Pro Tracking',
      `Your service pro is en route for ${booking.service_name}.\nEstimated Arrival: 12 minutes.\nGPS link active.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Real-time status & visit records</Text>
        </View>

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push('/help')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.helpText}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={activeTab === 'upcoming' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}
          >
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'previous' && styles.tabBtnActive]}
          onPress={() => setActiveTab('previous')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={16}
            color={activeTab === 'previous' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'previous' && styles.tabBtnTextActive]}
          >
            Past Visits ({previous.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            displayed.length === 0 ? styles.scrollEmpty : styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {displayed.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={activeTab === 'upcoming' ? 'calendar-outline' : 'archive-outline'}
                  size={42}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? 'No Upcoming Bookings'
                  : 'No Past Service Records'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Need immediate house help or a deep clean? Book our top-rated pros in minutes.'
                  : 'Your completed bookings and tax invoices will appear here.'}
              </Text>

              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => router.replace('/(tabs)')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Explore Services</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Booking Cards */
            displayed.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.serviceIconCircle}>
                    <Ionicons name="sparkles" size={18} color={Colors.primary} />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.bookingServiceName} numberOfLines={1}>
                      {booking.service_name}
                    </Text>
                    <Text style={styles.bookingDate}>
                      📅 {booking.scheduled_at || 'Today'}
                    </Text>
                  </View>

                  {/* Status Pill */}
                  <View
                    style={[
                      styles.statusPill,
                      booking.status === 'upcoming'
                        ? styles.statusUpcoming
                        : booking.status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        booking.status === 'upcoming'
                          ? styles.statusTextUpcoming
                          : booking.status === 'completed'
                          ? styles.statusTextCompleted
                          : styles.statusTextCancelled,
                      ]}
                    >
                      {booking.status === 'upcoming'
                        ? 'CONFIRMED'
                        : booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Address Box */}
                <View style={styles.addressBox}>
                  <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {booking.address || 'Saved Home Address'}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Footer Row */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Total Paid</Text>
                    <Text style={styles.priceValue}>
                      {formatCurrency(Number(booking.price) || 0)}
                    </Text>
                  </View>

                  {booking.status === 'upcoming' ? (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => handleTrackPro(booking)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="navigate" size={14} color="#FFFFFF" />
                      <Text style={styles.trackBtnText}>Track Pro</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.rebookBtn}
                      onPress={() => router.push('/(tabs)')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="repeat" size={14} color={Colors.primary} />
                      <Text style={styles.rebookBtnText}>Book Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  helpText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  bookingServiceName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bookingDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusUpcoming: {
    backgroundColor: '#ECFDF5',
  },
  statusCompleted: {
    backgroundColor: '#EFF6FF',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextUpcoming: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: '#2563EB',
  },
  statusTextCancelled: {
    color: '#EF4444',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rebookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
