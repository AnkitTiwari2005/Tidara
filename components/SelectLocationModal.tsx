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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { router } from 'expo-router';
import { useAppStore } from '../store/useAppStore';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

const POPULAR_HUBS = [
  { id: 'hub_1', name: 'Mundian Kalan', city: 'Ludhiana', desc: '33 Feet Road, Chandigarh Rd' },
  { id: 'hub_2', name: 'Model Town', city: 'Ludhiana', desc: 'Main Market & Gol Market' },
  { id: 'hub_3', name: 'BRS Nagar', city: 'Ludhiana', desc: 'Bhai Randhir Singh Nagar' },
  { id: 'hub_4', name: 'Sarabha Nagar', city: 'Ludhiana', desc: 'Malhar Road & Kitchlu Nagar' },
  { id: 'hub_5', name: 'Civil Lines', city: 'Ludhiana', desc: 'Club Road & Fountain Chowk' },
  { id: 'hub_6', name: 'Sector 32', city: 'Ludhiana', desc: 'Chandigarh Road Urban Estate' },
  { id: 'hub_7', name: 'South City', city: 'Ludhiana', desc: 'Canal Road Gated Enclave' },
];

export default function SelectLocationModal({ visible, onClose }: LocationModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { savedAddresses, selectSavedAddress, location, setLocation } = useAppStore();

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

  const handleSelectHub = (hub: (typeof POPULAR_HUBS)[0]) => {
    setLocation({
      city: hub.city,
      address: `${hub.name}, ${hub.desc}, ${hub.city}, Punjab`,
      lat: 30.901,
      lng: 75.8573,
      isServiceable: true,
      type: 'Other',
    });
    onClose();
  };

  const q = search.trim().toLowerCase();
  const filteredAddresses = savedAddresses.filter(
    (a) =>
      a.fullAddress.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q)
  );

  const filteredHubs = POPULAR_HUBS.filter(
    (h) =>
      h.name.toLowerCase().includes(q) ||
      h.desc.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q)
  );

  const bottomInsetPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
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
                {/* Drag Handle Bar */}
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.title}>Select Service Location</Text>
                    <Text style={styles.subtitle}>15-min helper dispatch available</Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Close location selection"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
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
                    clearButtonMode="while-editing"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Action Cards: Current GPS & New Address */}
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
                      <View style={styles.optionContent}>
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
                      <View style={styles.optionContent}>
                        <Text style={styles.optionLabel}>New Address</Text>
                        <Text style={styles.optionSub}>Add flat / house #</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Current Active Location Card */}
                  {location?.address && (
                    <View style={styles.currentCard}>
                      <View style={styles.currentCardHeader}>
                        <View style={styles.currentBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#059669" />
                          <Text style={styles.currentBadgeText}>CURRENT ACTIVE LOCATION</Text>
                        </View>
                      </View>
                      <View style={styles.currentCardBody}>
                        <View style={styles.currentPinCircle}>
                          <Ionicons name="location" size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.currentTextWrap}>
                          <Text style={styles.currentCityText}>{location.city || 'Ludhiana'}</Text>
                          <Text style={styles.currentAddrText} numberOfLines={2}>
                            {location.address}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Saved Addresses Section */}
                  {savedAddresses.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <Text style={styles.sectionTitle}>Saved Addresses</Text>
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
                                  <View style={styles.selectedPill}>
                                    <Text style={styles.selectedPillText}>SELECTED</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.addrLine} numberOfLines={2}>
                                {addr.fullAddress}
                              </Text>
                            </View>

                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                              size={20}
                              color={isSelected ? Colors.primary : Colors.textMuted}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Popular Service Hubs & Sectors */}
                  <View style={styles.sectionWrap}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Popular Hubs & Sectors</Text>
                      <View style={styles.expressTag}>
                        <Ionicons name="flash" size={10} color="#D97706" />
                        <Text style={styles.expressTagText}>15-MIN EXPRESS</Text>
                      </View>
                    </View>

                    <View style={styles.hubsGrid}>
                      {filteredHubs.map((hub) => {
                        const isSelected = location?.address?.includes(hub.name);
                        return (
                          <TouchableOpacity
                            key={hub.id}
                            style={[
                              styles.hubCard,
                              isSelected && styles.hubCardActive,
                            ]}
                            onPress={() => handleSelectHub(hub)}
                            activeOpacity={0.75}
                          >
                            <View style={styles.hubHeader}>
                              <Ionicons
                                name="business-outline"
                                size={14}
                                color={isSelected ? Colors.primary : Colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.hubName,
                                  isSelected && styles.hubNameActive,
                                ]}
                              >
                                {hub.name}
                              </Text>
                            </View>
                            <Text style={styles.hubDesc} numberOfLines={1}>
                              {hub.desc}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Tidara Trust Footer */}
                  <View style={styles.footerNote}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.footerNoteText}>
                      Tidara Service Guarantee: 100% background-checked helpers with ₹10,000 cover
                    </Text>
                  </View>
                </ScrollView>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  keyboardContainer: {
    width: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    maxHeight: '85%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
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
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollArea: {
    maxHeight: 520,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  currentCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  currentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  currentCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTextWrap: {
    flex: 1,
  },
  currentCityText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  currentAddrText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  expressTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expressTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  savedItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  addrIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  selectedPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  selectedPillText: {
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
  hubsGrid: {
    gap: 6,
  },
  hubCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hubCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hubNameActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  hubDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 14,
  },
});
