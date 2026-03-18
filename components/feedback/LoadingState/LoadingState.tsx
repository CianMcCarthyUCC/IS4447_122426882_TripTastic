import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants';

type Props = {
  message?: string;
};

/**
 * Reusable loading spinner — show while data is being fetched.
 * Use anywhere you need a loading indicator.
 */
export default function LoadingState({ message = 'Loading...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primaryAction} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.md,
  },
});
