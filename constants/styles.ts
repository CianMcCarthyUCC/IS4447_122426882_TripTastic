import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing, BorderRadius, Shadows } from './spacing';

/**
 * Shared styles reused across multiple screens.
 * These use the default (light) theme. For dynamic theming,
 * components should use useAppTheme() and apply overrides.
 */
export const SharedStyles = StyleSheet.create({
  screenContainer: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
    padding: Spacing.xxl,
  },
  screenContainerWithTabs: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  form: {
    marginBottom: Spacing.sm,
  },
  buttonSpacing: {
    marginTop: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  colorDot: {
    borderRadius: BorderRadius.pill,
    height: 14,
    width: 14,
    marginRight: Spacing.sm,
  },
  fieldWrapper: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    color: Colors.textLabel,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  errorText: {
    color: Colors.dangerAction,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  // Progress bars
  progressBarBg: {
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.pill,
    height: 8,
    marginTop: Spacing.md,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    borderRadius: BorderRadius.pill,
    height: 8,
  },
  // Badges
  badge: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    color: Colors.textButton,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  // Pill toggles
  pillRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  pill: {
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pillSelected: {
    backgroundColor: Colors.accentAction,
    borderColor: Colors.accentAction,
  },
  pillText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pillTextSelected: {
    color: Colors.textButton,
  },
});
