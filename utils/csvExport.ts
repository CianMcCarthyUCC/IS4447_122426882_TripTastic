import { File, Paths } from 'expo-file-system/next';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import type { Activity, Category, Target } from '@/types';

function activitiesToCsv(activities: Activity[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = 'Date,Duration (min),Category,Place,Notes';
  const rows = activities.map((a) =>
    `${a.date},${a.metric},"${catMap.get(a.categoryId) ?? 'Unknown'}","${(a.place ?? '').replace(/"/g, '""')}","${(a.notes ?? '').replace(/"/g, '""')}"`,
  );
  return [header, ...rows].join('\n');
}

function targetsToCsv(targets: Target[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = 'Category,Target (min),Period,Scope';
  const rows = targets.map((t) =>
    `"${catMap.get(t.categoryId) ?? 'Unknown'}",${t.targetValue},${t.period},${t.tripId ? 'This Trip' : 'All Trips'}`,
  );
  return [header, ...rows].join('\n');
}

/**
 * Builds a CSV file of the user's activities and goals and hands it off
 * to the system share sheet, so the user can back their data up or send
 * it anywhere they like.
 */
export async function exportDataAsCsv(
  activities: Activity[],
  targets: Target[],
  categories: Category[],
): Promise<void> {
  const actCsv = activitiesToCsv(activities, categories);
  const tgtCsv = targetsToCsv(targets, categories);
  const combined = `ACTIVITIES\n${actCsv}\n\nGOALS\n${tgtCsv}`;

  const file = new File(Paths.cache, 'triptastic-export.csv');
  file.write(combined);

  if (await isAvailableAsync()) {
    await shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export TripTastic Data',
    });
  }
}
