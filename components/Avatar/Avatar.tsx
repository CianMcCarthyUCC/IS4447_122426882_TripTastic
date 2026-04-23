import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Shadows } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  /** Local `file://` URI of the saved avatar, or `null`/`''` for initials. */
  uri?: string | null;
  /** Display name used to derive initials (preferred source). */
  displayName?: string;
  /** Email used as a fallback source when no display name is set. */
  email?: string;
  /** Outer ring diameter in px. Defaults to 96, matching the Account hero. */
  size?: number;
};

/**
 * The round profile avatar. Displays the user's photo when they have set
 * one, and falls back to their initials inside a coloured ring so the
 * avatar never looks empty.
 */
export default function Avatar({ uri, displayName, email, size = 96 }: Props) {
  const theme = useAppTheme();

  const initials = useMemo(() => {
    const trimmed = displayName?.trim();
    // Fall back to the email's local part when the user hasn't set a
    // display name - keeps the avatar from ever reading as just "?".
    const source = trimmed || email?.split('@')[0] || '';
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [displayName, email]);

  // Inner circle sits 6px inside the ring - keeps a consistent ring width
  // regardless of the caller's requested size.
  const innerSize = size - 6;
  // Initials scale with size so a smaller avatar doesn't look cramped.
  const initialsFontSize = Math.round(size * 0.3125);

  const hasImage = typeof uri === 'string' && uri.length > 0;

  return (
    <View
      style={[
        styles.ring,
        {
          backgroundColor: theme.accentAction,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
      accessible
      accessibilityLabel={
        hasImage
          ? `Profile photo for ${displayName || email || 'user'}`
          : `Avatar for ${displayName || email || 'user'}`
      }
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: theme.cardBackground,
            borderRadius: innerSize / 2,
            height: innerSize,
            width: innerSize,
          },
        ]}
      >
        {hasImage ? (
          <Image
            source={{ uri: uri as string }}
            style={[styles.image, { borderRadius: innerSize / 2 }]}
            // Avatars are rendered at small sizes but photos come from the
            // full-resolution picker output - let RN downscale rather than
            // stretching.
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initials,
              { color: theme.accentAction, fontSize: initialsFontSize },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    // `overflow: 'hidden'` clips the <Image> to the rounded bounds - without
    // it the borderRadius on the image itself is ignored on Android.
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
