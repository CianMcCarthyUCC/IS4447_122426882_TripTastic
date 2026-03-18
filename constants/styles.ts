import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing } from './spacing';

/**
 * Shared styles reused across multiple screens.
 * Import these instead of duplicating StyleSheet definitions.
 */

export const SharedStyles = StyleSheet.create({
  screenContainer: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
    padding: 20,
  },
  screenContainerWithTabs: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
    paddingHorizontal: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
});
