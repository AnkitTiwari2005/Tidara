import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HELP_TOPICS } from '../constants/services';

export default function HelpScreen() {
  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919999999999?text=Hi%20Tidara%20Support,%20I%20need%20help%20with%20my%20booking.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
        >
          <View style={styles.supportLeft}>
            <View style={styles.whatsappIconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Chat with Tidara Assistant</Text>
              <Text style={styles.supportSubtitle}>
                Instant replies 24/7 on WhatsApp for any issue.
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
              <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyRefundTitle}>No Active Refunds</Text>
            <Text style={styles.emptyRefundText}>
              Any cancelled or disputed visit refunds will be credited within 2 hours.
            </Text>
          </View>
        </View>

        {/* Help Topics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Frequently Asked Topics</Text>
          <View style={styles.topicsList}>
            {HELP_TOPICS.map((topic, index) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicItem,
                  index < HELP_TOPICS.length - 1 && styles.topicItemBorder,
                ]}
                onPress={handleWhatsAppSupport}
                activeOpacity={0.7}
              >
                <View style={[styles.topicIconBox, { backgroundColor: topic.iconBg }]}>
                  <Ionicons name={topic.iconName as any} size={20} color={topic.iconColor} />
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDesc}>{topic.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Call Box */}
        <View style={styles.emergencyBox}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.emergencyText}>
            Tidara Trust & Safety Helpline: Available 8 AM to 11 PM daily.
          </Text>
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    paddingVertical: 20,
    gap: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
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
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  topicsList: {
    gap: 2,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  topicItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topicIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emergencyText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
});
