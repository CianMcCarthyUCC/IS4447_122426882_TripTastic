import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { BorderRadius, Shadows, Spacing } from '@/constants';

type Props = {
  /** Section heading shown at the top of the card. */
  title: string;
  /** Section content — typically a mix of tags, toggles, or buttons. */
  children: ReactNode;
};

/**
 * Themed card container used to group related settings on the Profile screen.
 */
export function SettingsSection({ title, children }: Props) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
});
