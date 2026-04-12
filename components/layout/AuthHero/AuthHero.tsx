import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants';

type Props = {
  tagline?: string;
};

/**
 * Reusable branded hero section for auth screens.
 * Displays the app name and optional tagline.
 */
export default function AuthHero({ tagline = 'Plan your perfect holiday' }: Props) {
  return (
    <View style={styles.hero} accessibilityRole="header">
      <Text style={styles.appName}>TripTastic</Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  appName: {
    color: Colors.primaryAction,
    fontSize: 32,
    fontWeight: '800',
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.xs,
  },
});
