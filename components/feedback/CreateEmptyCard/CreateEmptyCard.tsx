import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme, useThemeControl } from '@/hooks/useAppTheme';

const LOGO_LIGHT = require('@/assets/images/logo/transparent-logo-light.png');
const LOGO_DARK = require('@/assets/images/logo/transparent-logo-dark.png');

type Props = {
  onPress: () => void;
  /** Ionicon shown in the centre bubble (e.g. "compass", "flag"). */
  icon: keyof typeof Ionicons.glyphMap;
  /** Ionicon used as the faint background silhouette. */
  backgroundIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  helper: string;
  accessibilityLabel?: string;
};

/**
 * Empty-state card styled to match the "Create Trip" onboarding card -
 * dashed inner border, tinted gradient, centred icon bubble that flashes
 * coral on press, and the TripTastic logo pinned to the bottom. Used as
 * the "nothing here yet - add your first" invitation across the app.
 */
function CreateEmptyCard({ onPress, icon, backgroundIcon, title, helper, accessibilityLabel }: Props) {
  const theme = useAppTheme();
  const { isDark } = useThemeControl();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint="Opens the form to add your first"
    >
      {({ pressed }) => (
        <>
          <LinearGradient
            colors={[theme.tagBackground, theme.cardBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />

          <View
            style={styles.silhouette}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Ionicons name={backgroundIcon} size={180} color={theme.textSecondary} />
          </View>

          <View
            pointerEvents="none"
            style={[styles.dashedBorder, { borderColor: theme.textSecondary }]}
          />

          <View style={styles.centerBlock}>
            <View
              style={[
                styles.iconBubble,
                pressed
                  ? { backgroundColor: theme.accentAction, borderColor: theme.accentAction }
                  : { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <Ionicons
                name={icon}
                size={36}
                color={pressed ? Palette.white : theme.accentAction}
              />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            <Text style={[styles.helper, { color: theme.textSecondary }]}>{helper}</Text>
          </View>

          <Image
            source={isDark ? LOGO_DARK : LOGO_LIGHT}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </>
      )}
    </Pressable>
  );
}

export default memo(CreateEmptyCard);

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xl,
    maxWidth: 340,
    overflow: 'hidden',
    width: '90%',
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  silhouette: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    opacity: 0.08,
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ rotate: '-12deg' }],
  },
  dashedBorder: {
    borderRadius: BorderRadius.lg - 4,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    bottom: Spacing.md,
    left: Spacing.md,
    opacity: 0.6,
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
  },
  centerBlock: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 72,
    ...Shadows.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  helper: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 2,
    paddingHorizontal: Spacing.sm,
    textAlign: 'center',
  },
  brandLogo: {
    alignSelf: 'center',
    bottom: Spacing.xl,
    height: 40,
    position: 'absolute',
    width: 145,
  },
});
