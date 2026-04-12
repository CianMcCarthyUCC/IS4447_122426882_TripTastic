import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, SharedStyles } from '@/constants';

type Props = {
  title: string;
  message?: string;
};

/**
 * Reusable empty state — show this when a list has no data.
 * Use anywhere: activity list, category list, search results, etc.
 */
export default function EmptyState({ title, message }: Props) {
  return (
    <View style={SharedStyles.centeredContainer}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
