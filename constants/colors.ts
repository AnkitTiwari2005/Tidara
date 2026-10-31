export const Colors = {
  // Brand Primary & Accents
  primary: '#0B5335',           // Deep Luxury Emerald
  primaryDark: '#063D26',       // Obsidian Emerald
  primaryLight: '#0E6A44',      // Forest Green
  accent: '#059669',            // Rich Mint (WCAG AA compliant)
  accentLight: '#E8FBF4',       // Soft Mint Surface
  accentBorder: '#A7F3D0',      // Mint Border
  
  // Secondary Accents
  gold: '#D97706',              // Darker Gold for accessible text
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
  textSecondary: '#334155',     // Medium-Dark Slate
  textMuted: '#64748B',         // High Contrast Slate (4.7:1 AA on white)
  textWhite: '#FFFFFF',

  // Status & Utility
  success: '#059669',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
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
  errorRed: '#DC2626',
  border: '#E2E8F0',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#0B5335',
  tabBarInactive: '#64748B',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

/**
 * Authentic typography mapped to Lexend fonts from Pronto
 */
export const Fonts = {
  regular: 'Lexend-Regular',
  medium: 'Lexend-Medium',
  semiBold: 'Lexend-SemiBold',
  bold: 'Lexend-Bold',
  black: 'Lexend-Black',
};

/**
 * Format currency with Indian Rupee symbol, handling integers, decimals, and negative numbers.
 */
export const formatCurrency = (val: number | null | undefined): string => {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const formatted = Number.isInteger(abs)
    ? abs.toLocaleString('en-IN')
    : abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `-\u20B9${formatted}` : `\u20B9${formatted}`;
};

export default Colors;
