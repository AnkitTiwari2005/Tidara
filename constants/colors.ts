export const Colors = {
  // Brand Primary & Accents
  primary: '#0B5335',           // Deep Luxury Emerald
  primaryDark: '#063D26',       // Obsidian Emerald
  primaryLight: '#0E6A44',      // Forest Green
  accent: '#10B981',            // Vivid Mint
  accentLight: '#E8FBF4',       // Soft Mint Surface
  accentBorder: '#A7F3D0',      // Mint Border
  
  // Secondary Accents
  gold: '#F59E0B',              // Rating Star Gold
  goldLight: '#FEF3C7',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  purple: '#7C3AED',
  purpleLight: '#F3E8FF',

  // Surfaces & Backgrounds
  background: '#F8FAFC',        // Slate Tinted Light Bg
  surface: '#FFFFFF',           // Pure White Card
  surfaceSecondary: '#F1F5F9',  // Subtle Gray Card
  cardBorder: '#E2E8F0',        // Subtle Clean Border

  // Typography
  textPrimary: '#0F172A',       // Obsidian Slate
  textSecondary: '#475569',     // Medium Slate
  textMuted: '#94A3B8',         // Subtle Muted Slate
  textWhite: '#FFFFFF',

  // Status & Utility
  success: '#10B981',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Brand Buttons
  buttonGreen: '#0B5335',
  buttonActive: '#063D26',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Backwards compatibility keys
  lightGreenBg: '#E8FBF4',
  inputBorder: '#E2E8F0',
  errorRed: '#EF4444',
  border: '#E2E8F0',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#0B5335',
  tabBarInactive: '#94A3B8',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const formatCurrency = (val: number): string => {
  return `\u20B9${val.toLocaleString('en-IN')}`;
};

export default Colors;
