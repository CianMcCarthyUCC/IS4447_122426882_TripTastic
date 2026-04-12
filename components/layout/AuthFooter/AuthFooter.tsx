import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants';

type Props = {
  message: string;
  linkLabel: string;
  onPress: () => void;
};

/**
 * Reusable footer for auth screens — "Don't have an account? Register" pattern.
 */
export default function AuthFooter({ message, linkLabel, onPress }: Props) {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>{message}</Text>
      <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={linkLabel}>
        <Text style={styles.link}> {linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  link: {
    color: Colors.primaryAction,
    fontSize: 15,
    fontWeight: '700',
  },
});
