import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface RazorpayWebViewProps {
  visible?: boolean;
  html: string;
  onSuccess: (data: { paymentId: string; orderId?: string; signature?: string }) => void;
  onFailure: (error: string | null, cancelled?: boolean) => void;
  onClose?: () => void;
}

export default function RazorpayWebView({
  visible = true,
  html,
  onSuccess,
  onFailure,
  onClose,
}: RazorpayWebViewProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onFailure(null, true);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.success) {
        onSuccess({ paymentId: data.paymentId, orderId: data.orderId, signature: data.signature });
      } else if (data.cancelled) {
        onFailure(null, true);
      } else {
        onFailure(data.error ?? 'Payment failed');
      }
    } catch {
      onFailure('Unexpected error during checkout');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={styles.headerTitle}>Razorpay Secure Payment</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <WebView
          source={{ html }}
          onMessage={handleMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Connecting to bank gateway...</Text>
            </View>
          )}
          style={styles.webView}
        />
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
