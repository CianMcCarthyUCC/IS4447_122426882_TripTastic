import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Palette } from '@/constants';

type IconProps = {
  size?: number;
  color?: string;
};

/**
 * Custom SVG tab icons — travel-themed, consistent stroke style.
 * All icons use stroke-based design for a clean, modern look.
 */

export function ActivitiesIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Line x1="9" y1="4" x2="9" y2="10" stroke={color} strokeWidth="1.8" />
      <Line x1="15" y1="4" x2="15" y2="10" stroke={color} strokeWidth="1.8" />
      <Circle cx="8" cy="15" r="1.2" fill={color} />
      <Circle cx="12" cy="15" r="1.2" fill={color} />
      <Circle cx="16" cy="15" r="1.2" fill={color} />
    </Svg>
  );
}

export function CategoriesIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="13" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="3" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="13" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function TargetsIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

export function InsightsIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="1.8" />
      <Rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="1.8" />
      <Rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function TripsIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="7" width="16" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="1.8" />
      <Line x1="4" y1="13" x2="20" y2="13" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ExploreIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 3c-2.5 4-2.5 14 0 18" stroke={color} strokeWidth="1.8" />
      <Path d="M12 3c2.5 4 2.5 14 0 18" stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
