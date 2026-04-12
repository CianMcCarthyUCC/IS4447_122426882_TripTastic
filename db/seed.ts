import { db } from './client';
import { categories, trips, activities, targets } from './schema';

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
    { tripId: 1, categoryId: 1, date: '2026-07-01', metric: 180, notes: 'Colosseum tour' },
    { tripId: 1, categoryId: 2, date: '2026-07-01', metric: 60, notes: 'Lunch at trattoria' },
    { tripId: 1, categoryId: 1, date: '2026-07-02', metric: 120, notes: 'Vatican Museums' },
    { tripId: 1, categoryId: 3, date: '2026-07-02', metric: 90, notes: 'Train to Florence' },
    { tripId: 1, categoryId: 2, date: '2026-07-03', metric: 45, notes: 'Pasta making class' },
    { tripId: 1, categoryId: 1, date: '2026-07-03', metric: 150, notes: 'Uffizi Gallery' },
    { tripId: 1, categoryId: 5, date: '2026-07-04', metric: 60, notes: 'Leather market' },
    { tripId: 1, categoryId: 2, date: '2026-07-04', metric: 30, notes: 'Gelato tasting' },
    { tripId: 1, categoryId: 3, date: '2026-07-05', metric: 45, notes: 'Bus to Siena' },
    { tripId: 1, categoryId: 1, date: '2026-07-05', metric: 200, notes: 'Siena day trip' },
    { tripId: 1, categoryId: 4, date: '2026-07-06', metric: 60, notes: 'Check-in Airbnb' },
    { tripId: 1, categoryId: 2, date: '2026-07-06', metric: 90, notes: 'Wine tasting dinner' },
    { tripId: 1, categoryId: 1, date: '2026-07-07', metric: 240, notes: 'Cinque Terre hike' },
    { tripId: 1, categoryId: 3, date: '2026-07-07', metric: 120, notes: 'Train to Cinque Terre' },
  ]);

  // Seed sample targets
  await db.insert(targets).values([
    { tripId: 1, categoryId: 1, targetValue: 600, period: 'weekly' },
    { tripId: 1, categoryId: 2, targetValue: 300, period: 'weekly' },
    { tripId: null, categoryId: 3, targetValue: 500, period: 'monthly' },
    { tripId: 1, categoryId: 5, targetValue: 120, period: 'weekly' },
  ]);
}
