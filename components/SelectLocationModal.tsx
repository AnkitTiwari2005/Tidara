import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { router } from 'expo-router';
import { useAppStore } from '../store/useAppStore';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SelectLocationModal({ visible, onClose }: LocationModalProps) {
  const [search, setSearch] = useState('');
  const { savedAddresses, selectSavedAddress, location } = useAppStore();

  const handleCurrentLocation = () => {
    onClose();
    router.push('/(onboarding)/confirm-location');
  };

  const handleNewAddress = () => {
    onClose();
    router.push('/add-address');
  };

  const handleSelectAddress = (id: string) => {
    selectSavedAddress(id);
    onClose();
  };

  const filteredAddresses = savedAddresses.filter(
    (a) =>
      a.fullAddress.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase())
  );

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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardContainer}
            >
              <View style={styles.container}>
                {/* Handle bar */}
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                  <Text style={styles.title}>Select Service Location</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Close location selection"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search apartment, road or saved address..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleCurrentLocation}
                    returnKeyType="search"
                  />
                </View>

                {/* Action Cards */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={handleCurrentLocation}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Use current GPS location"
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="navigate" size={20} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Current GPS</Text>
                      <Text style={styles.optionSub}>Detect sector automatically</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={handleNewAddress}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Add house and flat address"
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="add" size={22} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>New Address</Text>
                      <Text style={styles.optionSub}>Add flat / house #</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Saved Addresses List */}
                {savedAddresses.length > 0 && (
                  <View style={styles.savedSection}>
                    <Text style={styles.sectionTitle}>Saved Addresses</Text>
                    <ScrollView
                      style={styles.savedList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {filteredAddresses.map((addr) => {
                        const isSelected = location?.address === addr.fullAddress;
                        return (
                          <TouchableOpacity
                            key={addr.id}
                            style={[
                              styles.savedItem,
                              isSelected && styles.savedItemActive,
                            ]}
                            onPress={() => handleSelectAddress(addr.id)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${addr.type} address: ${addr.fullAddress}`}
                          >
                            <View
                              style={[
                                styles.addrIconCircle,
                                isSelected && { backgroundColor: Colors.primary },
                              ]}
                            >
                              <Ionicons
                                name={
                                  addr.type === 'Home'
                                    ? 'home'
                                    : addr.type === 'Work'
                                    ? 'briefcase'
                                    : 'location'
                                }
                                size={16}
                                color={isSelected ? '#FFFFFF' : Colors.primary}
                              />
                            </View>

                            <View style={styles.addrTextContainer}>
                              <View style={styles.addrTypeRow}>
                                <Text style={styles.addrType}>{addr.type}</Text>
                                {isSelected && (
                                  <View style={styles.currentBadge}>
                                    <Text style={styles.currentBadgeText}>SELECTED</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.addrLine} numberOfLines={2}>
                                {addr.fullAddress}
                              </Text>
                            </View>

                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                              size={18}
                              color={isSelected ? Colors.primary : Colors.textMuted}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  savedSection: {
    marginTop: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  savedList: {
    maxHeight: 180,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  addrIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrTextContainer: {
    flex: 1,
  },
  addrTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addrType: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  addrLine: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
