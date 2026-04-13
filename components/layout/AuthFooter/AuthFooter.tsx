import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  message: string;
  linkLabel: string;
  onPress: () => void;
};

export default function AuthFooter({ message, linkLabel, onPress }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.footer}>
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={linkLabel}>
        <Text style={[styles.link, { color: theme.accentAction }]}> {linkLabel}</Text>
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
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
  },
});
