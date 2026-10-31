import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../constants/colors';
import { HELP_TOPICS } from '../constants/services';
import { useAppStore } from '../store/useAppStore';
import { getUserBookings, Booking } from '../lib/supabase';

export default function HelpScreen() {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('1');
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.phone) {
      loadRefunds();
    }
  }, [user?.phone]);

  const loadRefunds = async () => {
    if (!user?.phone) return;
    setLoadingRefunds(true);
    try {
      const { data } = await getUserBookings(user.phone);
      if (data) {
        const cancelled = data.filter((b) => b.status === 'cancelled');
        setCancelledBookings(cancelled);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleWhatsAppSupport = async () => {
    const url = 'https://wa.me/919999999999?text=Hi%20Tidara%20Support,%20I%20need%20assistance%20with%20my%20service%20booking.';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Contact Support', 'You can write directly to our 24/7 team at support@tidara.app');
      }
    } catch {
      Alert.alert('Contact Support', 'You can write directly to our 24/7 team at support@tidara.app');
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:18001209999').catch(() => {
      Alert.alert('Toll-Free Helpline', 'Please dial 1800-120-9999 (Available 8:00 AM – 11:00 PM IST).');
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@tidara.app?subject=Tidara%20Customer%20Support%20Request').catch(() => {
      Alert.alert('Email Support', 'Send an email to support@tidara.app');
    });
  };

  const toggleTopic = (id: string) => {
    setExpandedTopicId((prev) => (prev === id ? null : id));
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
        <Text style={styles.headerTitle}>Help & Customer Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instant WhatsApp Support Card */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={handleWhatsAppSupport}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Chat with Tidara Assistant on WhatsApp"
        >
          <View style={styles.supportLeft}>
            <View style={styles.whatsappIconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Chat with Tidara Assistant</Text>
              <Text style={styles.supportSubtitle}>
                24/7 instant WhatsApp support for live visit tracking & queries.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#059669" />
        </TouchableOpacity>

        {/* Live Refunds & Disputes Status (HP-04) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Refunds & Dispute Resolution</Text>
            <TouchableOpacity onPress={loadRefunds} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {cancelledBookings.length > 0 ? (
            <View style={styles.refundsList}>
              {cancelledBookings.map((b) => (
                <View key={b.id} style={styles.refundItem}>
                  <View style={styles.refundLeft}>
                    <Ionicons name="arrow-undo-circle" size={22} color="#059669" />
                    <View>
                      <Text style={styles.refundServiceName}>{b.service_name}</Text>
                      <Text style={styles.refundStatusText}>
                        Refund of {formatCurrency(b.price)} processed to {b.payment_method || 'Source'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.refundBadge}>
                    <Text style={styles.refundBadgeText}>PROCESSED</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRefunds}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-checkmark" size={26} color={Colors.primary} />
              </View>
              <Text style={styles.emptyRefundTitle}>100% Refund Protection Guarantee</Text>
              <Text style={styles.emptyRefundText}>
                No active disputes or pending refunds. Any visit cancelled prior to professional arrival is instantly credited back within 2-4 business hours.
              </Text>
            </View>
          )}
        </View>

        {/* Help Topics Accordion */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.topicsList}>
            {HELP_TOPICS.map((topic, index) => {
              const isExpanded = expandedTopicId === topic.id;
              return (
                <View
                  key={topic.id}
                  style={[
                    styles.topicItemContainer,
                    index < HELP_TOPICS.length - 1 && styles.topicItemBorder,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.topicHeader}
                    onPress={() => toggleTopic(topic.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={[styles.topicIconBox, { backgroundColor: topic.iconBg }]}>
                      <Ionicons name={topic.iconName as any} size={20} color={topic.iconColor} />
                    </View>
                    <View style={styles.topicInfo}>
                      <Text style={styles.topicTitle}>{topic.title}</Text>
                      <Text style={styles.topicDesc}>{topic.description}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerBox}>
                      <Text style={styles.answerText}>{topic.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Toll-Free Calling Helpline */}
        <TouchableOpacity
          style={styles.emergencyBox}
          onPress={handleCallHelpline}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Call Customer Helpline at 1800 120 9999"
        >
          <Ionicons name="call" size={18} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Customer Helpline (Toll-Free)</Text>
            <Text style={styles.emergencyText}>Dial 1800-120-9999 • 8:00 AM – 11:00 PM IST daily</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#059669" />
        </TouchableOpacity>

        {/* Email Support Card */}
        <TouchableOpacity
          style={styles.emailCard}
          onPress={handleEmailSupport}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Email customer desk at support@tidara.app"
        >
          <Ionicons name="mail" size={18} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emailTitle}>Email Support Desk</Text>
            <Text style={styles.emailText}>support@tidara.app • Inquiries answered within 2 hours</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </TouchableOpacity>

        {/* Grievance & Statutory Compliance (HP-06) */}
        <View style={styles.statutoryCard}>
          <Text style={styles.statutoryTitle}>Grievance Redressal & Legal Officer</Text>
          <Text style={styles.statutoryText}>
            As per Consumer Protection (E-Commerce) Rules, 2020 & Information Technology Rules, 2021:
          </Text>
          <View style={styles.grievanceDetails}>
            <Text style={styles.grievanceRow}><Text style={styles.bold}>Officer:</Text> Mr. Amit Verma (Nodal Officer)</Text>
            <Text style={styles.grievanceRow}><Text style={styles.bold}>Email:</Text> grievance@tidara.app</Text>
            <Text style={styles.grievanceRow}><Text style={styles.bold}>Registered Office:</Text> Cyber City, DLF Phase 2, Gurugram, HR 122002</Text>
            <Text style={styles.grievanceRow}><Text style={styles.bold}>Redressal Timeline:</Text> Ticket acknowledged within 48h; resolved in 30 days.</Text>
          </View>
        </View>
      </ScrollView>
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
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    elevation: 2,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  whatsappIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: { flex: 1 },
  supportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  supportSubtitle: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  refundsList: {
    gap: 10,
  },
  refundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  refundServiceName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refundStatusText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refundBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  refundBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyRefunds: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyRefundTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyRefundText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  topicsList: {
    gap: 2,
    marginTop: 10,
  },
  topicItemContainer: {
    paddingVertical: 10,
  },
  topicItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topicIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: { flex: 1 },
  topicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  topicDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  answerBox: {
    marginTop: 10,
    marginLeft: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  answerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  emergencyText: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 1,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emailTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  emailText: {
    fontSize: 11,
    color: '#1E40AF',
    marginTop: 1,
  },
  statutoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  statutoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statutoryText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  grievanceDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  grievanceRow: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
