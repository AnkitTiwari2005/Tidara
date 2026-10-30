import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  type?: 'terms' | 'privacy';
}

export function TermsModal({ visible, onClose, type = 'terms' }: TermsModalProps) {
  const isPrivacy = type === 'privacy';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons
                  name={isPrivacy ? 'shield-checkmark' : 'document-text'}
                  size={22}
                  color={Colors.primary}
                />
                <Text style={styles.headerTitle}>
                  {isPrivacy ? 'Privacy & Data Policy' : 'Terms of Service'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close terms dialog"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Legal Body */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {isPrivacy ? (
                <>
                  <Text style={styles.sectionHeader}>1. Information We Collect</Text>
                  <Text style={styles.paragraph}>
                    Tidara collects your mobile number, name, and address to facilitate home service delivery. Location data is collected strictly while the app is in use to dispatch nearby service professionals to your address.
                  </Text>

                  <Text style={styles.sectionHeader}>2. Compliance with DPDP Act 2023</Text>
                  <Text style={styles.paragraph}>
                    In accordance with India's Digital Personal Data Protection (DPDP) Act 2023, you have the right to access, rectify, or request deletion of your personal data at any time from your Account Settings.
                  </Text>

                  <Text style={styles.sectionHeader}>3. Security & Payments</Text>
                  <Text style={styles.paragraph}>
                    Payment credentials (UPI IDs, card details) are encrypted with 256-bit SSL and processed directly by RBI-authorised payment aggregators (Razorpay). Tidara does not store your card numbers or UPI PINs.
                  </Text>

                  <Text style={styles.sectionHeader}>4. Account Deletion</Text>
                  <Text style={styles.paragraph}>
                    You can request complete deletion of your account and associated booking history anytime via the "Delete Account" button in your Profile screen.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.sectionHeader}>1. Platform & Booking Terms</Text>
                  <Text style={styles.paragraph}>
                    Tidara is an on-demand home services platform connecting verified independent service professionals with household customers. By creating an account or placing a booking, you agree to these terms.
                  </Text>

                  <Text style={styles.sectionHeader}>2. Cancellations & Refunds</Text>
                  <Text style={styles.paragraph}>
                    Free cancellation is permitted up to 10 minutes prior to professional arrival. If cancelled before arrival, full refunds are processed automatically back to your original payment method or Tidara Wallet.
                  </Text>

                  <Text style={styles.sectionHeader}>3. Service Satisfaction Guarantee</Text>
                  <Text style={styles.paragraph}>
                    Every booking is backed by the Tidara Happiness Guarantee. If a service does not meet quality expectations, notify us within 24 hours for a complimentary inspection and rework.
                  </Text>

                  <Text style={styles.sectionHeader}>4. Safety & Conduct</Text>
                  <Text style={styles.paragraph}>
                    Our professionals are background-checked and trained. Both customers and service professionals are expected to maintain respectful, safe behavior at all times during household visits.
                  </Text>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>I Understand & Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default TermsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 6,
  },
  paragraph: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
