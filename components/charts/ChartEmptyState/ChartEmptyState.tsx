import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/buttons';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme, useThemeControl } from '@/hooks/useAppTheme';

const LOGO_LIGHT = require('@/assets/images/logo/transparent-logo-light.png');
const LOGO_DARK = require('@/assets/images/logo/transparent-logo-dark.png');

type Props = {
  /** Title shown at the top of the empty card. */
  title: string;
  /** Supporting line shown under the title. */
  message: string;
  /** Optional call-to-action button label + handler. */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * The branded empty state shown inside chart cards when the current
 * window has nothing to plot yet. Uses the same dashed-border + faint
 * travel silhouette treatment as the Create Trip card so it reads as
 * part of the same visual family, and nudges the user straight into
 * logging an activity or opening their most recent trip.
 */
function ChartEmptyState({ title, message, actionLabel, onAction }: Props) {
  const theme = useAppTheme();
  const { isDark } = useThemeControl();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
      accessibilityRole="summary"
    >
      {/* Same soft gradient base as the Create Trip card, so both empty
          states read as part of one visual family. */}
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
        <Ionicons name="airplane" size={120} color={theme.textSecondary} />
      </View>

      <View
        pointerEvents="none"
        style={[styles.dashedBorder, { borderColor: theme.textSecondary }]}
      />

      <View style={styles.content}>
        <View style={[styles.plusBubble, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Ionicons name="bar-chart-outline" size={28} color={theme.accentAction} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
        {actionLabel && onAction ? (
          <View style={styles.cta}>
            <PrimaryButton label={actionLabel} onPress={onAction} variant="accent" />
          </View>
        ) : null}
        <Image
          source={isDark ? LOGO_DARK : LOGO_LIGHT}
          style={styles.brandLogo}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </View>
  );
}

export default memo(ChartEmptyState);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
    paddingVertical: Spacing.xxl,
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
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    bottom: Spacing.md,
    left: Spacing.md,
    opacity: 0.5,
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  plusBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  brandLogo: {
    alignSelf: 'center',
    height: 44,
    marginTop: Spacing.lg,
    opacity: 0.95,
    width: 180,
  },
});
