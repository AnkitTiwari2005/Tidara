import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  BrandImages,
} from '../../constants/services';
import { useAppStore } from '../../store/useAppStore';
import TidaraPassModal from '../../components/TidaraPassModal';
import SelectLocationModal from '../../components/SelectLocationModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 12) / 2;

// Animated Service Card Component with Image
function ServiceCard({ service }: { service: Service }) {
  const { addToCart, removeFromCart, cartItems } = useAppStore();
  const matchingItems = cartItems.filter((i) => i.serviceId === service.id);
  const qty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
  const activeDuration = matchingItems[0]?.durationMinutes ?? 60;
  const activeUnitPrice = matchingItems[0]?.unitPrice ?? service.price;

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/service/${service.id}` as any)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, price ${formatCurrency(service.price)}`}
    >
      {/* Photo Container */}
      <View style={styles.imageContainer}>
        <Image
          source={typeof service.imageUrl === 'number' ? service.imageUrl : { uri: service.imageUrl }}
          style={styles.servicePhoto}
          resizeMode="cover"
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
                  removeFromCart(service.id, activeDuration);
                }}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{qty}</Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  addToCart(service.id, activeDuration, activeUnitPrice);
                }}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                addToCart(service.id, undefined, service.price);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${service.name} to cart`}
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
  const cartItemId = pack.id;
  const cartItem = cartItems.find((i) => i.serviceId === cartItemId || i.serviceId === `pack_${cartItemId}`);
  const qty = cartItem?.quantity ?? 0;

  return (
    <View style={styles.packCardWrapper}>
      <Image
        source={typeof pack.imageUrl === 'number' ? pack.imageUrl : { uri: pack.imageUrl }}
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
                onPress={() => removeFromCart(cartItem ? cartItem.serviceId : cartItemId, 60)}
                style={styles.packStepperBtn}
                accessibilityRole="button"
                accessibilityLabel="Decrease pack quantity"
              >
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.packStepperVal}>{qty}</Text>
              <TouchableOpacity
                onPress={() => addToCart(cartItemId, 60, pack.price)}
                style={styles.packStepperBtn}
                accessibilityRole="button"
                accessibilityLabel="Increase pack quantity"
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.packAddBtn}
              onPress={() => addToCart(cartItemId, 60, pack.price)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Book ${pack.name} for ${formatCurrency(pack.price)}`}
            >
              <Text style={styles.packAddBtnText}>BOOK PACK</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}


const HOME_CATEGORIES: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All Services', icon: 'apps' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
  { id: 'kitchen', label: 'Kitchen &\nPrep', icon: 'restaurant-outline' },
  { id: 'bathroom', label: 'Bathroom', icon: 'water-outline' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline' },
  { id: 'more', label: 'More', icon: 'ellipsis-horizontal' },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const { location, cartItems, user, addToCart } = useAppStore();
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
    const q = searchQuery.trim().toLowerCase();
    return SERVICES.filter((s) => {
      let matchesCategory = false;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'bathroom') {
        matchesCategory = s.id === '2' || s.name.toLowerCase().includes('bath');
      } else if (selectedCategory === 'more') {
        matchesCategory = s.category === 'exterior';
      } else {
        matchesCategory = s.category === selectedCategory;
      }
      const matchesSearch =
        q.length === 0 ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart total amount calculation
  const cartTotalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (
        item.serviceId.startsWith('pack_') ||
        item.serviceId === 'pack_1' ||
        item.serviceId === 'pack_2' ||
        item.serviceId === 'pack_3'
      ) {
        const pack = FESTIVE_PACKS.find(
          (p) => p.id === item.serviceId || p.id === item.serviceId.replace('pack_', '')
        );
        return sum + (item.unitPrice ?? pack?.price ?? 199) * item.quantity;
      }
      const svc = SERVICES.find((s) => s.id === item.serviceId);
      return sum + (item.unitPrice ?? svc?.price ?? 49) * item.quantity;
    }, 0);
  }, [cartItems]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header with Soft Organic Green Aura */}
      <View style={styles.topAuraContainer}>
        <LinearGradient
          colors={['#E6F7EC', '#F2FBF6', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />

        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Selected location: ${currentCity}, ${currentAddress}`}
          >
            <View style={styles.locationPinBg}>
              <Ionicons name="location-sharp" size={18} color="#064E3B" />
            </View>
            <View style={styles.locationTextContainer}>
              <View style={styles.cityRow}>
                <Text style={styles.cityName}>{currentCity}</Text>
                <Ionicons name="chevron-down" size={14} color="#111827" />
              </View>
              <Text style={styles.addressLine} numberOfLines={1}>
                {currentAddress}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerGiftBtn}
              onPress={() => setPassModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View Tidara VIP Pass details"
            >
              <Ionicons name="gift-outline" size={22} color="#059669" />
              <View style={styles.vipPillBadge}>
                <Text style={styles.vipPillBadgeText}>VIP</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go to Profile"
            >
              <Text style={styles.avatarText}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar Capsule */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#059669" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services (e.g., deep clean, ironing...)"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="mic" size={20} color="#059669" />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photographic Hero Banner */}
        <View style={styles.heroSection}>
          <View style={styles.heroBannerCard}>
            <Image
              source={require('../../assets/images/hero_banner.jpg')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['#042F20', '#042F20', 'rgba(4, 47, 32, 0.94)', 'rgba(4, 47, 32, 0.35)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.heroBannerGradient}
            >
              <View style={styles.heroBannerContent}>
                {/* 15-Min Express Arrival Tag */}
                <View style={styles.liveTagRow}>
                  <Ionicons name="flash" size={12} color="#FBBF24" />
                  <Text style={styles.liveTagText}>15-Min Express Arrival</Text>
                </View>

                {/* Main Headline */}
                <Text style={styles.heroBannerTitle}>
                  5-Star Certified Pros
                  {'\n'}
                  At Your Doorstep
                </Text>

                {/* Trust Markers Row */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="shield-checkmark-outline" size={13} color="#A7F3D0" />
                    <Text style={styles.trustBadgeText}>100% Background-checked</Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <View style={styles.rupeeCircle}>
                      <Text style={styles.rupeeCircleText}>₹</Text>
                    </View>
                    <Text style={styles.trustBadgeText}>₹10,000 Safety Cover</Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="star" size={13} color="#FBBF24" />
                    <Text style={styles.trustBadgeText}>4.9★ Avg. Rating</Text>
                  </View>
                </View>

                {/* Book Now Button */}
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => {
                    const firstSvc = SERVICES[0];
                    if (firstSvc) router.push(`/service/${firstSvc.id}` as any);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Book Now →</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Carousel Pagination Dots */}
          <View style={styles.carouselDotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Category Squircles */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {HOME_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categorySquircle,
                    isActive && styles.categorySquircleActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryIconBox,
                      isActive && styles.categoryIconBoxActive,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={isActive ? '#FFFFFF' : '#064E3B'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categorySquircleLabel,
                      isActive && styles.categorySquircleLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tidara VIP Pass Club Strip */}
        <TouchableOpacity
          style={styles.passClubCard}
          onPress={() => setPassModalVisible(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFFDF5', '#FFFBEB', '#FEF3C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.passClubGradient}
          >
            <View style={styles.passClubLeft}>
              <View style={styles.passClubCrownRow}>
                <Text style={styles.passCrownEmoji}>👑</Text>
                <Text style={styles.passClubTag}>TIDARA PASS CLUB</Text>
              </View>
              <Text style={styles.passClubTitle}>3 Home Visits for ₹177 Only</Text>
              <Text style={styles.passClubSub}>Save ₹573 on recurring cleaning & kitchen prep</Text>
            </View>

            <View style={styles.passClubRight}>
              <View style={styles.passTicketBadge}>
                <Text style={styles.passTicketCrown}>👑</Text>
                <Text style={styles.passTicketPrice}>₹177</Text>
              </View>
              <View style={styles.passChevronCircle}>
                <Ionicons name="chevron-forward" size={14} color="#111827" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Services Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all'
                ? 'Curated Services'
                : HOME_CATEGORIES.find((c) => c.id === selectedCategory)?.label.replace('\n', ' ')}
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
          accessibilityRole="button"
          accessibilityLabel={`View Cart with ${totalCartCount} items, total ${formatCurrency(cartTotalAmount)}`}
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
          addToCart('tidara_pass_3', 60, 129);
          router.push('/cart');
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
  topAuraContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationPinBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  addressLine: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerGiftBtn: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vipPillBadge: {
    position: 'absolute',
    top: -5,
    right: -2,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  vipPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 4,
  },
  heroSection: {
    marginTop: 12,
    marginBottom: 14,
  },
  heroBannerCard: {
    marginHorizontal: 16,
    height: 195,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#042F20',
    shadowColor: '#042F20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  heroBannerImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    height: '100%',
  },
  heroBannerGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  heroBannerContent: {
    gap: 8,
    maxWidth: '72%',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroBannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 2,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rupeeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeCircleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A7F3D0',
    lineHeight: 11,
  },
  trustBadgeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  bookNowBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#064E3B',
  },
  categoriesSection: {
    marginBottom: 14,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categorySquircle: {
    width: 68,
    height: 78,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categorySquircleActive: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
    shadowColor: '#064E3B',
    shadowOpacity: 0.25,
    elevation: 3,
  },
  categoryIconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconBoxActive: {},
  categorySquircleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 13,
  },
  categorySquircleLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  passClubCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  passClubGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  passClubLeft: {
    flex: 1,
    paddingRight: 8,
  },
  passClubCrownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  passCrownEmoji: {
    fontSize: 12,
  },
  passClubTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  passClubTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: -0.2,
  },
  passClubSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    fontWeight: '500',
  },
  passClubRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passTicketBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    transform: [{ rotate: '-4deg' }],
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  passTicketCrown: {
    fontSize: 10,
  },
  passTicketPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
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
    paddingHorizontal: 4,
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
    textAlign: 'center',
  },
  trustItemDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 14,
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
