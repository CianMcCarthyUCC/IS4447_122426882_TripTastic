import { db } from './client';
import { categories, trips, activities } from './schema';

export async function seedDataIfEmpty() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  // Seed categories
  await db.insert(categories).values([
    { name: 'Sightseeing', color: '#3B82F6', icon: 'eye' },
    { name: 'Food', color: '#F59E0B', icon: 'restaurant' },
    { name: 'Transport', color: '#6366F1', icon: 'car' },
    { name: 'Accommodation', color: '#10B981', icon: 'bed' },
    { name: 'Shopping', color: '#EC4899', icon: 'cart' },
  ]);

  // Seed a default trip
  await db.insert(trips).values({
    name: 'Summer in Italy',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
  });

  // Seed sample activities
  await db.insert(activities).values([
    { tripId: 1, categoryId: 1, date: '2026-07-02', metric: 180, notes: 'Colosseum tour' },
    { tripId: 1, categoryId: 2, date: '2026-07-03', metric: 45, notes: 'Pasta making class' },
    { tripId: 1, categoryId: 3, date: '2026-07-04', metric: 120, notes: 'Train to Florence' },
    { tripId: 1, categoryId: 1, date: '2026-07-05', metric: 90, notes: 'Uffizi Gallery' },
  ]);
}
