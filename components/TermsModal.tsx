import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Colors } from '../constants/colors';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ visible, onClose, onAccept }: TermsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.icon}>📋</Text>
                <Text style={styles.title}>
                  We have updated our{'\n'}Terms & Conditions
                </Text>
                <Text style={styles.subtitle}>
                  These updates will apply from{' '}
                  <Text style={styles.date}>25th March onwards.</Text>
                </Text>

                <View style={styles.changesList}>
                  {[
                    'Updated privacy and data usage policy',
                    'New refund and cancellation terms',
                    'Enhanced safety guidelines for professionals',
                  ].map((change, i) => (
                    <View key={i} style={styles.changeRow}>
                      <Text style={styles.changeBullet}>•</Text>
                      <Text style={styles.changeText}>{change}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.viewFullBtn}
                >
                  <Text style={styles.viewFullBtnText}>View full terms</Text>
                </TouchableOpacity>
              </View>

              {/* Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={onAccept}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  date: {
    color: Colors.primary,
    fontWeight: '600',
  },
  changesList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  changeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  changeBullet: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginTop: -1,
  },
  changeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  viewFullBtn: {
    paddingVertical: 4,
  },
  viewFullBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
  },
  continueBtn: {
    backgroundColor: Colors.buttonGreen,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
