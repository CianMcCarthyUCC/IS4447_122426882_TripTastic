import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  title: string;
  subtitle?: string;
};

export default function ScreenHeader({ title, subtitle }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
});
