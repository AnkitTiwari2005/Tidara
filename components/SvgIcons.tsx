import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface SvgIconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

/**
 * Luxury 5-Point Crown Vector SVG (Replaces 👑 emoji)
 */
export function CrownSvg({ size = 16, color = '#F59E0B' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 19H21.5V20.5C21.5 21.0523 21.0523 21.5 20.5 21.5H3.5C2.94772 21.5 2.5 21.0523 2.5 20.5V19Z"
        fill={color}
      />
      <Path
        d="M2 9.5L6.5 17.5H17.5L22 9.5L16 12.5L12 4.5L8 12.5L2 9.5Z"
        fill={color}
      />
      <Circle cx="2" cy="8.5" r="1.5" fill={color} />
      <Circle cx="8" cy="11.5" r="1.2" fill={color} />
      <Circle cx="12" cy="3.5" r="1.7" fill={color} />
      <Circle cx="16" cy="11.5" r="1.2" fill={color} />
      <Circle cx="22" cy="8.5" r="1.5" fill={color} />
    </Svg>
  );
}

/**
 * High-Voltage Lightning Bolt Vector SVG (Replaces ⚡ emoji)
 */
export function LightningSvg({ size = 16, color = '#FBBF24' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Calendar Vector SVG (Replaces 🗓 emoji)
 */
export function CalendarSvg({ size = 16, color = '#059669' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="3"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8" cy="18" r="1" fill={color} />
      <Circle cx="12" cy="18" r="1" fill={color} />
    </Svg>
  );
}

/**
 * Security Trust Shield with Checkmark SVG
 */
export function ShieldCheckSvg({ size = 16, color = '#A7F3D0' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Rupee Safety Badge SVG
 */
export function RupeeCoverSvg({ size = 16, color = '#A7F3D0' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8.5 7H15.5M8.5 10.5H14M8.5 7V14C10.5 14 12.5 13.5 13.5 11.5M11.5 13.5L15.5 18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Star Rating SVG
 */
export function StarSvg({ size = 16, color = '#FBBF24' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Luxury Voucher Ticket Vector SVG
 */
export function VoucherTicketSvg({
  width = 72,
  height = 36,
  color = '#F59E0B',
  priceText = '₹177',
}: {
  width?: number;
  height?: number;
  color?: string;
  priceText?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 72 36" fill="none">
      <Path
        d="M4 0H68C70.2091 0 72 1.79086 72 4V13C70.3431 13 69 14.3431 69 16C69 17.6569 70.3431 19 72 19V32C72 34.2091 70.2091 36 68 36H4C1.79086 36 0 34.2091 0 32V19C1.65685 19 3 17.6569 3 16C3 14.3431 1.65685 13 0 13V4C0 1.79086 1.79086 0 4 0Z"
        fill={color}
      />
      <Path
        d="M22 6V30"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        strokeOpacity="0.6"
      />
      {/* Mini Crown */}
      <Path
        d="M9 13L11 19H17L19 13L16 15L14 10L12 15L9 13Z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
    </Svg>
  );
}
