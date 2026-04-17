import { db } from './client';
import { categories, trips, activities, targets, savedFilters } from './schema';

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

  // Seed default trips
  await db.insert(trips).values([
    { name: 'Summer in Italy', destination: 'Rome', country: 'Italy', coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', startDate: '2026-07-01', endDate: '2026-07-14' },
    { name: 'Weekend in Paris', destination: 'Paris', country: 'France', coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', startDate: '2026-08-15', endDate: '2026-08-18' },
  ]);

  // Seed sample activities
  await db.insert(activities).values([
    { tripId: 1, categoryId: 1, date: '2026-07-01', metric: 180, status: 'completed', notes: 'Colosseum tour' },
    { tripId: 1, categoryId: 2, date: '2026-07-01', metric: 60, status: 'completed', notes: 'Lunch at trattoria' },
    { tripId: 1, categoryId: 1, date: '2026-07-02', metric: 120, status: 'completed', notes: 'Vatican Museums' },
    { tripId: 1, categoryId: 3, date: '2026-07-02', metric: 90, status: 'completed', notes: 'Train to Florence' },
    { tripId: 1, categoryId: 2, date: '2026-07-03', metric: 45, status: 'completed', notes: 'Pasta making class' },
    { tripId: 1, categoryId: 1, date: '2026-07-03', metric: 150, status: 'completed', notes: 'Uffizi Gallery' },
    { tripId: 1, categoryId: 5, date: '2026-07-04', metric: 60, status: 'planned', notes: 'Leather market' },
    { tripId: 1, categoryId: 2, date: '2026-07-04', metric: 30, status: 'planned', notes: 'Gelato tasting' },
    { tripId: 1, categoryId: 3, date: '2026-07-05', metric: 45, status: 'planned', notes: 'Bus to Siena' },
    { tripId: 1, categoryId: 1, date: '2026-07-05', metric: 200, status: 'planned', notes: 'Siena day trip' },
    { tripId: 1, categoryId: 4, date: '2026-07-06', metric: 60, status: 'planned', notes: 'Check-in Airbnb' },
    { tripId: 1, categoryId: 2, date: '2026-07-06', metric: 90, status: 'planned', notes: 'Wine tasting dinner' },
    { tripId: 1, categoryId: 1, date: '2026-07-07', metric: 240, status: 'planned', notes: 'Cinque Terre hike' },
    { tripId: 1, categoryId: 3, date: '2026-07-07', metric: 120, status: 'planned', notes: 'Train to Cinque Terre' },
  ]);

  // Seed sample targets
  await db.insert(targets).values([
    { tripId: 1, categoryId: 1, targetValue: 600, period: 'weekly' },
    { tripId: 1, categoryId: 2, targetValue: 300, period: 'weekly' },
    { tripId: null, categoryId: 3, targetValue: 500, period: 'monthly' },
    { tripId: 1, categoryId: 5, targetValue: 120, period: 'weekly' },
  ]);

  // Seed default saved filters so users see them immediately
  await db.insert(savedFilters).values([
    { name: 'Sightseeing only', filterType: 'category', filterValue: '1', createdAt: new Date().toISOString() },
    { name: 'Food & Dining', filterType: 'category', filterValue: '2', createdAt: new Date().toISOString() },
    { name: 'This Week', filterType: 'dateRange', filterValue: 'week', createdAt: new Date().toISOString() },
  ]);
}
