import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { Colors, BorderRadius, Spacing } from '@/constants';
import type { Student } from '@/types';

type Props = {
  student: Student;
};

export default function StudentCard({ student }: Props) {
  const router = useRouter();

  const openDetails = () =>
    router.push({ pathname: '/student/[id]', params: { id: student.id.toString() } });

  return (
    <View style={styles.card}>
      <Pressable onPress={openDetails}>
        <Text style={styles.name}>{student.name}</Text>
      </Pressable>

      <View style={styles.tags}>
        <InfoTag label="Major" value={student.major} />
        <InfoTag label="Year" value={student.year} />
      </View>

      <PrimaryButton compact label="View Profile" onPress={openDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: Spacing.lg,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
});
