import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import { useAppStore, showAppAlert } from '../../store/useAppStore';
import { getUserBookings, cancelBooking, Booking } from '../../lib/supabase';
import { sendLocalNotification } from '../../lib/notifications';

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
    const { data, error } = await getUserBookings(user.phone);
    if (error) {
      showAppAlert('Connection Notice', 'Could not sync latest bookings. Pull down to refresh.', 'warning');
    } else if (data) {
      setBookings(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.phone]);

  useFocusEffect(
    useCallback(() => {
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

  const handleCancelBooking = (booking: Booking) => {
    if (!booking.id) return;
    showAppAlert(
      'Cancel Booking?',
      `Are you sure you want to cancel "${booking.service_name}"? Free cancellation is active.`,
      'warning',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Service',
          style: 'destructive',
          onPress: async () => {
            if (!user?.phone || !booking.id) {
              showAppAlert('Account Required', 'Please log in to manage your bookings.', 'warning');
              return;
            }
            setLoading(true);
            const res = await cancelBooking(booking.id, user.phone);
            setLoading(false);
            if (!res.success || res.error) {
              showAppAlert('Cancellation Failed', res.error?.message || 'Could not cancel booking. Only upcoming bookings can be cancelled.', 'error');
              return;
            }
            await fetchBookings();
            sendLocalNotification('Booking Cancelled', `Your appointment for "${booking.service_name}" was cancelled.`);
            showAppAlert('Booking Cancelled', 'Your booking was cancelled.', 'info');
          },
        },
      ]
    );
  };

  const handleBookingDetails = (booking: Booking) => {
    showAppAlert(
      booking.service_name,
      '',
      'info',
      booking.status === 'upcoming'
        ? [
            { text: 'Cancel Visit', style: 'destructive', onPress: () => handleCancelBooking(booking) },
            { text: 'OK' },
          ]
        : [{ text: 'OK' }],
      {
        icon: 'receipt-outline',
        details: [
          { iconName: 'calendar-outline', label: 'Slot', value: booking.scheduled_at || 'Today (Express 15-Min)' },
          { iconName: 'location-outline', label: 'Address', value: booking.address },
          { iconName: 'wallet-outline', label: 'Amount', value: formatCurrency(booking.price) },
          { iconName: 'checkmark-circle-outline', label: 'Status', value: booking.status.toUpperCase() },
        ],
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Status & visit records</Text>
        </View>

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push('/help')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open support"
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
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'upcoming' }}
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
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'previous' }}
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
      ) : !user ? (
        /* Guest State */
        <View style={styles.guestContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="person-outline" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sign in to View Bookings</Text>
          <Text style={styles.emptySubtitle}>
            Log in with your mobile number to view your active appointments and past service visits.
          </Text>
          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.bookNowText}>Sign In / Register</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
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
                  ? 'Need immediate house help or a deep clean? Book verified pros in minutes.'
                  : 'Your completed bookings and visit history will appear here.'}
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
            displayed.map((booking, index) => (
              <TouchableOpacity
                key={booking.id || index.toString()}
                style={styles.bookingCard}
                onPress={() => handleBookingDetails(booking)}
                activeOpacity={0.9}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.serviceIconCircle}>
                    <Ionicons name="sparkles" size={18} color={Colors.primary} />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.bookingServiceName} numberOfLines={1}>
                      {booking.service_name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.bookingDate}>
                        {booking.scheduled_at || 'Today'}
                      </Text>
                    </View>
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
                    {booking.address || 'Confirmed Home Address'}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Footer Row */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Amount</Text>
                    <Text style={styles.priceValue}>
                      {formatCurrency(Number(booking.price) || 0)}
                    </Text>
                  </View>

                  {booking.status === 'upcoming' ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancelBooking(booking)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => handleBookingDetails(booking)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="information-circle-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.trackBtnText}>Details</Text>
                      </TouchableOpacity>
                    </View>
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
              </TouchableOpacity>
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
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
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
    borderRadius: 14,
    marginTop: 8,
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    color: '#DC2626',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 10,
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
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  rebookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
