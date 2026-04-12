import { StyleSheet, Text, View } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants';

type Props = {
  label: string;
  value: string;
};

export default function InfoTag({ label, value }: Props) {
  return (
    <View style={styles.tag} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.tagBackground,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    marginRight: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: {
    color: Colors.tagLabel,
    fontSize: 12,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  value: {
    color: Colors.tagValue,
    fontSize: 12,
    fontWeight: '500',
  },
});
