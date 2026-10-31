import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/colors';
import { useAppStore, AlertButton } from '../store/useAppStore';

const { width } = Dimensions.get('window');

export default function GlobalAlertModal() {
  const { alertConfig, hideAlert } = useAppStore();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alertConfig) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [alertConfig]);

  if (!alertConfig) return null;

  const type = alertConfig.type || 'info';

  const getIconProps = () => {
    if (alertConfig.icon) {
      return {
        name: alertConfig.icon,
        color: type === 'error' ? '#DC2626' : type === 'warning' ? '#D97706' : Colors.primary,
        bg: type === 'error' ? '#FEE2E2' : type === 'warning' ? '#FEF3C7' : '#ECFDF5',
        border: type === 'error' ? '#FECACA' : type === 'warning' ? '#FDE68A' : '#A7F3D0',
      };
    }

    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
        };
      case 'warning':
        return {
          name: 'alert-circle' as const,
          color: '#D97706',
          bg: '#FEF3C7',
          border: '#FDE68A',
        };
      case 'error':
        return {
          name: 'close-circle' as const,
          color: '#DC2626',
          bg: '#FEE2E2',
          border: '#FECACA',
        };
      default:
        return {
          name: 'information-circle' as const,
          color: Colors.primary,
          bg: '#ECFDF5',
          border: '#A7F3D0',
        };
    }
  };

  const iconProps = getIconProps();

  const handleButtonPress = (btn?: AlertButton) => {
    hideAlert();
    if (btn?.onPress) {
      btn.onPress();
    }
  };

  const buttons = alertConfig.buttons && alertConfig.buttons.length > 0
    ? alertConfig.buttons
    : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal
      transparent
      visible={!!alertConfig}
      animationType="none"
      statusBarTranslucent
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={hideAlert}
        />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Decorative Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: iconProps.bg, borderColor: iconProps.border },
            ]}
          >
            <Ionicons name={iconProps.name as any} size={30} color={iconProps.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{alertConfig.title}</Text>

          {/* Structured Details with SVGs/Vector Icons (0 Emojis) */}
          {alertConfig.details && alertConfig.details.length > 0 ? (
            <View style={styles.detailsContainer}>
              {alertConfig.details.map((item, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <View style={styles.detailIconCircle}>
                    <Ionicons name={item.iconName as any} size={15} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : alertConfig.message ? (
            <Text style={styles.message}>{alertConfig.message}</Text>
          ) : null}

          {/* Buttons Row / Stack */}
          <View style={styles.buttonContainer}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnStyle: any = styles.defaultBtn;
              let textStyle: any = styles.defaultBtnText;

              if (isCancel) {
                btnStyle = styles.cancelBtn;
                textStyle = styles.cancelBtnText;
              } else if (isDestructive) {
                btnStyle = styles.destructiveBtn;
                textStyle = styles.destructiveBtnText;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[btnStyle, buttons.length > 1 && { flex: 1 }]}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.85}
                >
                  <Text style={textStyle}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(width - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Fonts.bold,
  },
  message: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    fontFamily: Fonts.regular,
    paddingHorizontal: 6,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 18,
  },
  defaultBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  cancelBtn: {
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Fonts.medium,
  },
  destructiveBtn: {
    height: 48,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
});
