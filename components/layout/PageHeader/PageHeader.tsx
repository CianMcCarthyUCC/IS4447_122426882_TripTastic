import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PressableOpacity } from '@/components/buttons';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  title: string;
  /** Override the default `router.back()` behaviour of the back chevron. */
  onBack?: () => void;
  /** Hide the back chevron - useful on root screens that still want the title row. */
  showBack?: boolean;
};

/**
 * The flat page header used on detail and settings screens. Shows a back
 * chevron on the left and a centred title, with no surrounding card or
 * shadow so it blends into the rest of the screen.
 */
export default function PageHeader({ title, onBack, showBack = true }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack ? (
          <PressableOpacity
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </PressableOpacity>
        ) : null}
      </View>
      <Text
        style={[styles.title, { color: theme.textPrimary }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    minHeight: 40,
  },
  side: {
    alignItems: 'flex-start',
    width: 40,
  },
  backBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
