import { FlatList } from 'react-native';
import { StudentCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Student } from '@/types';

type Props = {
  students: Student[];
};

/**
 * Performant student list using FlatList (not ScrollView).
 * FlatList only renders visible items — better for large lists.
 * Reuse this anywhere you need to display a list of students.
 */
export default function StudentList({ students }: Props) {
  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <StudentCard student={item} />}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <EmptyState title="No students yet" message="Tap 'Add Student' to get started." />
      }
    />
  );
}
