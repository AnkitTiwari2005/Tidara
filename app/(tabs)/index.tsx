import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '../../constants/colors';
import {
  SERVICES,
  FESTIVE_PACKS,
  CATEGORIES,
  Service,
  FestivePack,
} from '../../constants/services';
import { useAppStore } from '../../store/useAppStore';
import TidaraPassModal from '../../components/TidaraPassModal';
import SelectLocationModal from '../../components/SelectLocationModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 12) / 2;

// Animated Service Card Component with Image
function ServiceCard({ service }: { service: Service }) {
  const { addToCart, removeFromCart, cartItems } = useAppStore();
  const cartItem = cartItems.find((i) => i.serviceId === service.id);
  const qty = cartItem?.quantity ?? 0;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/service/${service.id}` as any)}
      activeOpacity={0.88}
    >
      {/* Photo Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: service.imageUrl }}
          style={styles.servicePhoto}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Fallback & Tint Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.6)']}
          style={styles.imageOverlay}
        />

        {/* Floating Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={styles.ratingScore}>{service.rating}</Text>
        </View>

        {service.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {service.popular && !service.isNew && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>TRENDING</Text>
          </View>
        )}
      </View>

      {/* Details Section */}
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {service.name}
        </Text>

        <Text style={styles.serviceDesc} numberOfLines={1}>
          {service.description}
        </Text>

        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.durationText}>{service.duration}</Text>
        </View>

        {/* Pricing & Stepper */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{formatCurrency(service.price)}</Text>
            <Text style={styles.originalPrice}>{formatCurrency(service.originalPrice)}</Text>
          </View>

          {qty > 0 ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  removeFromCart(service.id);
                }}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{qty}</Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  addToCart(service.id);
                }}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                addToCart(service.id);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color={Colors.primary} />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Festive Pack Card Component with Photo
function FestivePackCard({ pack }: { pack: FestivePack }) {
  const { addToCart, removeFromCart, cartItems } = useAppStore();
  const cartItemId = `pack_${pack.id}`;
  const cartItem = cartItems.find((i) => i.serviceId === cartItemId);
  const qty = cartItem?.quantity ?? 0;

  return (
    <View style={styles.packCardWrapper}>
      <Image
        source={{ uri: pack.imageUrl }}
        style={styles.packBgImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(6, 61, 38, 0.45)', 'rgba(4, 39, 26, 0.92)']}
        style={styles.packGradient}
      >
        <View style={styles.packTopRow}>
          {pack.badge && (
            <View style={styles.packBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
              <Text style={styles.packBadgeText}>{pack.badge}</Text>
            </View>
          )}
          <View style={styles.packDurationBadge}>
            <Text style={styles.packDurationText}>{pack.duration}</Text>
          </View>
        </View>

        <Text style={styles.packName} numberOfLines={2}>
          {pack.name}
        </Text>
        <Text style={styles.packDesc} numberOfLines={2}>
          {pack.description}
        </Text>

        <View style={styles.packFooter}>
          <View style={styles.packPriceRow}>
            <Text style={styles.packPrice}>{formatCurrency(pack.price)}</Text>
            <Text style={styles.packOrigPrice}>{formatCurrency(pack.originalPrice)}</Text>
          </View>

          {qty > 0 ? (
            <View style={styles.packStepper}>
              <TouchableOpacity
                onPress={() => removeFromCart(cartItemId)}
                style={styles.packStepperBtn}
              >
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.packStepperVal}>{qty}</Text>
              <TouchableOpacity
                onPress={() => addToCart(cartItemId)}
                style={styles.packStepperBtn}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.packAddBtn}
              onPress={() => addToCart(cartItemId)}
              activeOpacity={0.85}
            >
              <Text style={styles.packAddBtnText}>BOOK PACK</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const { location, cartItems, user } = useAppStore();
  const totalCartCount = useAppStore((state) => state.getCartCount());
  const currentCity = location?.city || 'Gurugram';
  const currentAddress = location?.address || 'Sector 48, Sohna Road';

  // Smooth Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cartSlideAnim = useRef(new Animated.Value(100)).current;

  // Pulse animation for express delivery badge
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // Slide up cart bar when items > 0
  useEffect(() => {
    if (totalCartCount > 0) {
      Animated.spring(cartSlideAnim, {
        toValue: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cartSlideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [totalCartCount]);

  // Filter services
  const filteredServices = useMemo(() => {
    return SERVICES.filter((s) => {
      const matchesCategory =
        selectedCategory === 'all' || s.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart total amount calculation
  const cartTotalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.serviceId.startsWith('pack_')) {
        const packId = item.serviceId.replace('pack_', '');
        const pack = FESTIVE_PACKS.find((p) => p.id === packId);
        return sum + (pack?.price ?? 199) * item.quantity;
      }
      const svc = SERVICES.find((s) => s.id === item.serviceId);
      return sum + (svc?.price ?? 49) * item.quantity;
    }, 0);
  }, [cartItems]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.locationPinBg}>
            <Ionicons name="location" size={16} color={Colors.primary} />
          </View>
          <View style={styles.locationTextContainer}>
            <View style={styles.cityRow}>
              <Text style={styles.cityName}>{currentCity}</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textPrimary} />
            </View>
            <Text style={styles.addressLine} numberOfLines={1}>
              {currentAddress}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setPassModalVisible(true)}
          >
            <Ionicons name="gift-outline" size={20} color={Colors.primary} />
            <View style={styles.passMiniBadge}>
              <Text style={styles.passMiniBadgeText}>VIP</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/profile')}
          >
            <LinearGradient
              colors={['#0B5335', '#063D26']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 'deep clean', 'ironing', 'kitchen'..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Photographic Hero Banner */}
        <View style={styles.heroBannerCard}>
          <Image
            source={require('../../assets/images/hero_banner.jpg')}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(6, 61, 38, 0.4)', 'rgba(4, 39, 26, 0.88)']}
            style={styles.heroBannerGradient}
          >
            <View style={styles.heroBannerContent}>
              <View style={styles.liveTagRow}>
                <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                <Text style={styles.liveTagText}>15-MIN EXPRESS ARRIVAL</Text>
              </View>

              <Text style={styles.heroBannerTitle}>
                5-Star Certified Pros{'\n'}At Your Doorstep
              </Text>

              <Text style={styles.heroBannerSub}>
                100% Background-checked • ₹10,000 Safety Cover
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tidara VIP Pass Club Strip */}
        <TouchableOpacity
          style={styles.vipPassCard}
          onPress={() => setPassModalVisible(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipPassGradient}
          >
            <View style={styles.vipPassLeft}>
              <View style={styles.vipTag}>
                <Ionicons name="sparkles" size={12} color="#B45309" />
                <Text style={styles.vipTagText}>TIDARA PASS CLUB</Text>
              </View>
              <Text style={styles.vipTitle}>3 Home Visits for ₹177 Only</Text>
              <Text style={styles.vipDesc}>Save ₹573 on recurring cleaning & kitchen prep</Text>
            </View>
            <View style={styles.vipClaimBtn}>
              <Text style={styles.vipClaimText}>View Pass →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Category Filter Pills */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={15}
                    color={active ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.categoryPillText, active && styles.categoryPillTextActive]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Services Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all'
                ? 'Curated Services'
                : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredServices.length} options ready for instant dispatch
            </Text>
          </View>
        </View>

        {/* Services Grid (2 Columns) */}
        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </View>

        {/* Festive Specials Carousel */}
        <View style={styles.festiveSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Deep Makeover Combos</Text>
              <Text style={styles.sectionSubtitle}>All-inclusive packages with specialized equipment</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.festiveList}
          >
            {FESTIVE_PACKS.map((pack) => (
              <FestivePackCard key={pack.id} pack={pack} />
            ))}
          </ScrollView>
        </View>

        {/* Safety & Trust Section */}
        <View style={styles.trustCard}>
          <Text style={styles.trustTitle}>The Tidara Safety Standard</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <Text style={styles.trustItemTitle}>Police Verified</Text>
              <Text style={styles.trustItemDesc}>Government ID checked</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="ribbon" size={20} color="#2563EB" />
              </View>
              <Text style={styles.trustItemTitle}>5-Star Trained</Text>
              <Text style={styles.trustItemDesc}>Certified skill audits</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.trustItemTitle}>₹10,000 Cover</Text>
              <Text style={styles.trustItemDesc}>Accidental protection</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Animated Bottom Cart Bar */}
      <Animated.View
        style={[
          styles.floatingCartContainer,
          {
            transform: [{ translateY: cartSlideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartCountCircle}>
              <Text style={styles.cartCountText}>{totalCartCount}</Text>
            </View>
            <View>
              <Text style={styles.cartPriceText}>{formatCurrency(cartTotalAmount)}</Text>
              <Text style={styles.cartSubText}>
                {totalCartCount} item{totalCartCount > 1 ? 's' : ''} in cart
              </Text>
            </View>
          </View>

          <View style={styles.floatingCartRight}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modals */}
      <TidaraPassModal
        visible={passModalVisible}
        onClose={() => setPassModalVisible(false)}
        onBook={() => {
          setPassModalVisible(false);
          router.push('/recurring-booking' as any);
        }}
      />

      <SelectLocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationPinBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addressLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passMiniBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  passMiniBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarBtn: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 4,
  },
  heroBannerCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroBannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroBannerContent: {
    gap: 4,
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  heroBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  heroBannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  vipPassCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  vipPassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  vipPassLeft: {
    flex: 1,
  },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vipTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  vipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
  },
  vipDesc: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  vipClaimBtn: {
    backgroundColor: '#78350F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vipClaimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    height: 115,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  servicePhoto: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingScore: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 4,
  },
  festiveSection: {
    marginBottom: 24,
  },
  festiveList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  packCardWrapper: {
    width: width * 0.78,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  packBgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  packGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  packTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  packBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  packDurationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  packDurationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  packDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 15,
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  packPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  packPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  packOrigPrice: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'line-through',
  },
  packAddBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  packAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  packStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  packStepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  packStepperVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  trustCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trustItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  trustItemDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartCountCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  cartPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cartSubText: {
    fontSize: 11,
    color: '#A7F3D0',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
