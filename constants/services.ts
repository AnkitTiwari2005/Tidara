// Service & Category Definitions
import { Ionicons } from '@expo/vector-icons';

export const ServiceImages = {
  cleaning: require('../assets/images/services/cleaning.webp'),
  bathroom: require('../assets/images/services/bathroom.webp'),
  kitchen: require('../assets/images/services/kitchen.webp'),
  utensils: require('../assets/images/services/utensils.webp'),
  dusting: require('../assets/images/services/dusting.webp'),
  mopping: require('../assets/images/services/mopping.webp'),
  chopping: require('../assets/images/services/chopping.webp'),
  laundry: require('../assets/images/services/laundry.webp'),
  fan: require('../assets/images/services/fan.webp'),
  window: require('../assets/images/services/window.webp'),
  balcony: require('../assets/images/services/balcony.webp'),
  staircase: require('../assets/images/services/staircase.webp'),
};

export const BrandImages = {
  partnerAvatar: require('../assets/images/brand/partner_avatar.webp'),
  partnerBadge: require('../assets/images/brand/partner_badge.webp'),
  lightning: require('../assets/images/brand/lightning.gif'),
  bookingCompleted: require('../assets/images/brand/booking_completed.png'),
  bookingConfirmed: require('../assets/images/brand/booking_confirmed.webp'),
  recurringTrust: require('../assets/images/brand/recurring_trust.webp'),
  passFast: require('../assets/images/brand/pass_fast.webp'),
  passShield: require('../assets/images/brand/pass_shield.webp'),
  passDiscount: require('../assets/images/brand/pass_discount.webp'),
  trustMarker1: require('../assets/images/brand/trust_marker1.webp'),
  trustMarker2: require('../assets/images/brand/trust_marker2.webp'),
  trustMarker3: require('../assets/images/brand/trust_marker3.webp'),
};

export const PaymentIcons = {
  upi: require('../assets/images/payments/upi.webp'),
  googlepay: require('../assets/images/payments/googlepay.webp'),
  phonepe: require('../assets/images/payments/phonepe.webp'),
  paytm: require('../assets/images/payments/paytm.webp'),
  rupay: require('../assets/images/payments/rupay.webp'),
  visa: require('../assets/images/payments/visa.webp'),
  mastercard: require('../assets/images/payments/mastercard.webp'),
};

export interface Service {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  ratingCount: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  category: 'cleaning' | 'kitchen' | 'bathroom' | 'laundry' | 'exterior';
  description: string;
  duration: string;
  imageUrl: any;
  isNew?: boolean;
  popular?: boolean;
}

export interface FestivePack {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  isNew: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  description: string;
  imageUrl: any;
  badge?: string;
}

export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  answer: string;
}

export const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM',
];

export const CATEGORIES: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All Services', icon: 'grid-outline' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
  { id: 'kitchen', label: 'Kitchen & Prep', icon: 'restaurant-outline' },
  { id: 'laundry', label: 'Laundry & Iron', icon: 'shirt-outline' },
  { id: 'exterior', label: 'Car & Plants', icon: 'leaf-outline' },
];

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Hourly Home Help',
    price: 49,
    originalPrice: 99,
    rating: 4.9,
    ratingCount: 'Top Rated',
    iconName: 'time-outline',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    category: 'cleaning',
    description: 'Expert assistant for multi-task household help by the hour.',
    duration: '60 mins',
    imageUrl: ServiceImages.cleaning,
    popular: true,
  },
  {
    id: '2',
    name: 'Bathroom Deep Clean',
    price: 199,
    originalPrice: 299,
    rating: 4.9,
    ratingCount: 'Popular',
    iconName: 'water-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    category: 'bathroom',
    description: 'Tile descaling, stain removal, mirror buffing and disinfection.',
    duration: '45 mins',
    imageUrl: ServiceImages.bathroom,
    popular: true,
  },
  {
    id: '3',
    name: 'Dusting & Surface Polish',
    price: 79,
    originalPrice: 149,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'sparkles-outline',
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
    category: 'cleaning',
    description: 'Complete furniture dusting, TV unit, tables & decor wiping.',
    duration: '40 mins',
    imageUrl: ServiceImages.dusting,
  },
  {
    id: '4',
    name: 'Kitchen Deep Clean',
    price: 249,
    originalPrice: 399,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'restaurant-outline',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    category: 'kitchen',
    description: 'Degreasing stovetop, chimney exterior, counters and sink scrubbing.',
    duration: '60 mins',
    imageUrl: ServiceImages.kitchen,
    popular: true,
  },
  {
    id: '5',
    name: 'Floor Scrub & Mop',
    price: 99,
    originalPrice: 179,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'disc-outline',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    category: 'cleaning',
    description: 'Machine/manual floor scrubbing with scented anti-bacterial solution.',
    duration: '45 mins',
    imageUrl: ServiceImages.mopping,
  },
  {
    id: '6',
    name: 'Sofa & Upholstery Vacuum',
    price: 149,
    originalPrice: 249,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'bed-outline',
    iconBg: '#FAF5FF',
    iconColor: '#9333EA',
    category: 'cleaning',
    description: 'High-suction vacuuming to pull deep dust, mite & pet hair.',
    duration: '40 mins',
    imageUrl: ServiceImages.cleaning,
  },
  {
    id: '7',
    name: 'Meal Prep & Chopping',
    price: 69,
    originalPrice: 129,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'nutrition-outline',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    category: 'kitchen',
    description: 'Vegetable peeling, fine chopping, knead atta & kitchen prep work.',
    duration: '45 mins',
    imageUrl: ServiceImages.chopping,
    popular: true,
  },
  {
    id: '8',
    name: 'Dishes & Sink Sanitization',
    price: 59,
    originalPrice: 119,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'cafe-outline',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    category: 'kitchen',
    description: 'Sparkling dish wash, air dry stacking & food residue cleanup.',
    duration: '35 mins',
    imageUrl: ServiceImages.utensils,
  },
  {
    id: '9',
    name: 'Fridge Clean & Defrost',
    price: 129,
    originalPrice: 229,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'snow-outline',
    iconBg: '#F0FDFA',
    iconColor: '#0D9488',
    category: 'kitchen',
    description: 'Shelf removal, deodorizing, food stain wipe & re-organization.',
    duration: '45 mins',
    imageUrl: ServiceImages.kitchen,
  },
  {
    id: '10',
    name: 'Steam Ironing (10 Garments)',
    price: 79,
    originalPrice: 149,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'shirt-outline',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
    category: 'laundry',
    description: 'Crisp steam ironing with neat closet-ready folding.',
    duration: '30 mins',
    imageUrl: ServiceImages.laundry,
    popular: true,
  },
  {
    id: '11',
    name: 'Kitchen Cabinets Polish',
    price: 299,
    originalPrice: 499,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'file-tray-stacked-outline',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    category: 'kitchen',
    description: 'Interior & exterior wipe down, shelf reorganization.',
    duration: '75 mins',
    imageUrl: ServiceImages.kitchen,
  },
  {
    id: '12',
    name: 'Complete Wardrobe Organize',
    price: 299,
    originalPrice: 499,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'layers-outline',
    iconBg: '#F8FAFC',
    iconColor: '#334155',
    category: 'cleaning',
    description: 'Declutter, category sorting, folding and hanger arrangement.',
    duration: '75 mins',
    imageUrl: ServiceImages.laundry,
  },
  {
    id: '13',
    name: 'Window & Mesh Cleaning',
    price: 119,
    originalPrice: 199,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'browsers-outline',
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
    category: 'cleaning',
    description: 'Glass streak-free spray wipe, mosquito mesh brushing.',
    duration: '40 mins',
    imageUrl: ServiceImages.window,
  },
  {
    id: '14',
    name: 'Ceiling Fan & Exhaust Clean',
    price: 49,
    originalPrice: 99,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'sync-outline',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    category: 'cleaning',
    description: 'Blade degreasing, motor housing wipe & air vent dust removal.',
    duration: '25 mins',
    imageUrl: ServiceImages.fan,
    popular: true,
  },
  {
    id: '15',
    name: 'Shoe Rack Care & Polish',
    price: 69,
    originalPrice: 129,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'footsteps-outline',
    iconBg: '#FFFBEB',
    iconColor: '#78350F',
    category: 'cleaning',
    description: 'Dust removal, sanitization spray & neat shoe alignment.',
    duration: '30 mins',
    imageUrl: ServiceImages.dusting,
  },
  {
    id: '16',
    name: 'Car Exterior Wash & Shine',
    price: 179,
    originalPrice: 299,
    rating: 4.8,
    ratingCount: 'Verified',
    iconName: 'car-sport-outline',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    category: 'exterior',
    description: 'Foam wash, glass cleaning, tire dressing and microfiber wipe.',
    duration: '45 mins',
    imageUrl: ServiceImages.cleaning,
    isNew: true,
  },
  {
    id: '17',
    name: 'Balcony Garden & Plant Care',
    price: 149,
    originalPrice: 249,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'leaf-outline',
    iconBg: '#F0FDF4',
    iconColor: '#15803D',
    category: 'exterior',
    description: 'Pot aerating, pruning dead leaves, watering and fertilizing.',
    duration: '45 mins',
    imageUrl: ServiceImages.balcony,
    isNew: true,
  },
  {
    id: 'tidara_pass_3',
    name: 'Tidara Pass Club (3 Visits)',
    price: 129,
    originalPrice: 199,
    rating: 4.9,
    ratingCount: 'Verified',
    iconName: 'gift-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    category: 'cleaning',
    description: 'VIP Club Pass: 3 dedicated 60-min home help sessions.',
    duration: '3 Visits',
    imageUrl: BrandImages.passShield,
    popular: true,
  },
];

export const FESTIVE_PACKS: FestivePack[] = [
  {
    id: 'pack_1',
    name: 'Full Home Makeover',
    price: 499,
    originalPrice: 799,
    duration: '3 Hours',
    isNew: true,
    iconName: 'sparkles',
    gradientColors: ['#0B5335', '#042F2C'],
    description: 'Complete deep cleaning for Living Room, Kitchen & 2 Bathrooms.',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    badge: 'BESTSELLER',
  },
  {
    id: 'pack_2',
    name: 'Express Party Cleanup',
    price: 249,
    originalPrice: 399,
    duration: '90 Mins',
    isNew: true,
    iconName: 'flash',
    gradientColors: ['#1E293B', '#0F172A'],
    description: 'Fast cleanup before or after guests: dishes, living room & trash removal.',
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
    badge: 'EXPRESS',
  },
  {
    id: 'pack_3',
    name: 'Devotional Mandir Special Clean',
    price: 199,
    originalPrice: 349,
    duration: '60 Mins',
    isNew: false,
    iconName: 'flame',
    gradientColors: ['#9A3412', '#7C2D12'],
    description: 'Brass & copper item polishing, marble cleanup & neat setup.',
    imageUrl: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
    badge: 'POPULAR',
  },
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: '1',
    title: 'Bookings & Scheduling',
    description: 'Reschedule, cancellations and pro arrival details',
    iconName: 'calendar-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    answer: 'You can view all your active bookings on the "Bookings" tab. To cancel or reschedule an upcoming visit, simply tap on the booking card before the professional arrives. Free cancellation is supported up to 10 minutes prior to the scheduled slot.',
  },
  {
    id: '2',
    title: 'Payments & Refunds',
    description: 'UPI, Razorpay, Cash on Delivery & refund timing',
    iconName: 'card-outline',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    answer: 'Tidara accepts UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, NetBanking, Tidara Wallet, and Cash on Delivery (COD). Cancelled prepaid bookings are automatically credited back to your original payment method or Tidara Wallet within 2-4 hours.',
  },
  {
    id: '3',
    title: 'Tidara Pass & Wallet',
    description: 'VIP visit credits, wallet recharge and cashback benefits',
    iconName: 'wallet-outline',
    iconColor: '#7C3AED',
    iconBg: '#F3E8FF',
    answer: 'Tidara Wallet allows instant 1-click checkout with zero OTP delays. Top up ₹250 or more to receive instant 5% extra cashback added to your balance. Wallet balance never expires and can be used on any service.',
  },
  {
    id: '4',
    title: 'Service Guarantee & Verified Pros',
    description: 'Safety standards, verified professionals & quality checks',
    iconName: 'shield-checkmark-outline',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    answer: 'All Tidara service experts undergo strict identity verification, background screening, and practical skill training. If you are not satisfied with any service, we provide a free re-work or refund under the Tidara Happiness Guarantee.',
  },
  {
    id: '5',
    title: 'Account & Saved Addresses',
    description: 'Update phone number, name, email and saved locations',
    iconName: 'person-outline',
    iconColor: '#475569',
    iconBg: '#F1F5F9',
    answer: 'Manage your profile and home addresses anytime from the Profile tab. Your saved addresses make instant 15-minute express dispatch seamless without re-typing your house number.',
  },
];
