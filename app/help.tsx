import React, { useState } from 'react';
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
import { Colors } from '../constants/colors';
import { HELP_TOPICS } from '../constants/services';

export default function HelpScreen() {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('1');

  const handleWhatsAppSupport = async () => {
    const url = 'https://wa.me/918000000000?text=Hi%20Tidara%20Support,%20I%20need%20assistance%20with%20my%20booking.';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Contact Support', 'Please reach our 24/7 support desk at support@tidara.com');
      }
    } catch {
      Alert.alert('Contact Support', 'Please reach our 24/7 support desk at support@tidara.com');
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:18001209999').catch(() => {
      Alert.alert('Helpline', 'Call our toll-free customer helpline: 1800-120-9999');
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
        <Text style={styles.headerTitle}>Help & Support</Text>
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
                Instant replies on WhatsApp for bookings & support.
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#059669" />
        </TouchableOpacity>

        {/* Refunds Status Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Refunds & Payment Disputes</Text>
          <View style={styles.emptyRefunds}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={30} color={Colors.primary} />
            </View>
            <Text style={styles.emptyRefundTitle}>100% Refund Protection</Text>
            <Text style={styles.emptyRefundText}>
              Any cancelled visit before pro arrival is credited back to your original payment method or wallet within 2-4 hours.
            </Text>
          </View>
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

        {/* Emergency Call Box */}
        <TouchableOpacity
          style={styles.emergencyBox}
          onPress={handleCallHelpline}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Call Tidara Safety Helpline"
        >
          <Ionicons name="call" size={18} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Customer Helpline (Toll-Free)</Text>
            <Text style={styles.emergencyText}>Tap to call: 1800-120-9999 • 8 AM to 11 PM daily</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#059669" />
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  emptyRefunds: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyRefundTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyRefundText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  topicsList: {
    gap: 2,
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
});
