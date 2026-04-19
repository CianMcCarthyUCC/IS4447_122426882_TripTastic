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
      <Line x1="5" y1="20" x2="5" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="20" x2="10" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="15" y1="20" x2="15" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="20" y1="20" x2="20" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function TripsIcon({ size = 24, color = Palette.black }: IconProps) {
  // Paper-plane / airplane silhouette, tilted upper-right.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3 3 10.5l6.5 2.2L12 21l2.4-5.2L21 3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="9.5" y1="12.7" x2="14.4" y2="15.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ExploreIcon({ size = 24, color = Palette.black }: IconProps) {
  // Folded trifold map with two vertical creases.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6.5 9 4.5l6 2 6-2v13l-6 2-6-2-6 2v-13Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Line x1="9" y1="4.5" x2="9" y2="17.5" stroke={color} strokeWidth="1.8" />
      <Line x1="15" y1="6.5" x2="15" y2="19.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = Palette.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="3.8" stroke={color} strokeWidth="1.8" />
      <Path d="M4.5 20c1.2-3.6 4.3-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
