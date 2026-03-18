import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants';

type Props = {
  title: string;
  message?: string;
};

/**
 * Reusable empty state — show this when a list has no data.
 * Use anywhere: student list, search results, etc.
 */
export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
