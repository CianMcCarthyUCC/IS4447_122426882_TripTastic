import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks';
import { BorderRadius, Palette, Spacing } from '@/constants';

/**
 * Header strip for the AI travel-guide card — violet chip + title +
 * decorative "Beta" pill. Extracted so the three render paths inside
 * `AiOverviewCard` (no-key / loading / populated) can share one node
 * without duplicating markup.
 *
 * The Beta pill is marked `accessibilityElementsHidden` + `importantForAccessibility`
 * so screen readers skip it — it's purely a visual affordance and adding
 * "beta" to every VoiceOver traversal of this card would be noisy.
 */
function AiOverviewHeaderImpl() {
  const theme = useAppTheme();
  return (
    <View style={styles.headerRow}>
      <View
        style={[styles.headerIcon, { backgroundColor: Palette.aiViolet }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name="sparkles" size={14} color={Palette.white} />
      </View>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
        AI Travel Guide
      </Text>
      <View
        style={[styles.headerPill, { backgroundColor: theme.tagBackground }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={[styles.headerPillText, { color: theme.textSecondary }]}>Beta</Text>
      </View>
    </View>
  );
}

export const AiOverviewHeader = memo(AiOverviewHeaderImpl);

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerIcon: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerPill: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
