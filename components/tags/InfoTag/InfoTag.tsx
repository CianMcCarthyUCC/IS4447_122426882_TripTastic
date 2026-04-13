import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label: string;
  value: string;
};

export default function InfoTag({ label, value }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.tag, { backgroundColor: theme.tagBackground }]} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.label, { color: theme.tagLabel }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.tagValue }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: Spacing.xs,
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
  },
});
