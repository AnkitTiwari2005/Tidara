import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../constants/colors';

interface TidaraPassModalProps {
  visible: boolean;
  onClose: () => void;
  onBook: () => void;
}

export default function TidaraPassModal({ visible, onClose, onBook }: TidaraPassModalProps) {
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
            <View style={styles.container}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close Pass details"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>

              {/* Pass Card Graphic */}
              <View style={styles.cardWrapper}>
                <LinearGradient
                  colors={['#063D26', '#0B5335', '#0A4B30']}
                  style={styles.passCard}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.vipTag}>
                      <Ionicons name="sparkles" size={12} color="#F59E0B" />
                      <Text style={styles.vipTagText}>VIP CLUB PASS</Text>
                    </View>
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  </View>

                  <View style={styles.cardCenter}>
                    <Text style={styles.brandTitle}>Tidara Pass</Text>
                    <Text style={styles.brandSub}>3 Home Help Sessions (60 mins each)</Text>
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.cardValidity}>Validity: 30 Days</Text>
                    <Text style={styles.cardCode}>#CLUB-VIP</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Offer Details */}
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>3 Visits for only </Text>
                <Text style={styles.origPrice}>{formatCurrency(199)}</Text>
                <Text style={styles.dealPrice}> {formatCurrency(129)}</Text>
              </View>

              <Text style={styles.savingsTag}>
                ⚡ Save ₹70 with VIP member pricing • Valid on all cleaning & kitchen prep
              </Text>

              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.featureText}>Priority instant dispatch in 15 mins</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.featureText}>Top-tier certified & rated pros</Text>
                </View>
              </View>

              {/* Book Button */}
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={onBook}
                activeOpacity={0.85}
              >
                <Text style={styles.bookBtnText}>Claim Pass for {formatCurrency(129)}</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardWrapper: {
    width: '100%',
    marginVertical: 8,
  },
  passCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
    justifyContent: 'space-between',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  cardCenter: {
    marginVertical: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardValidity: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  cardCode: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  offerLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  origPrice: {
    fontSize: 15,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  dealPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  savingsTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
