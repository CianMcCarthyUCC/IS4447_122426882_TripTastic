import { db } from './client';
import { categories, trips, activities, targets, savedFilters } from './schema';

export async function seedDataIfEmpty() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  // All-or-nothing: if the app is killed mid-seed we never want a partial
  // DB (e.g. categories seeded but trips not). Without a transaction the
  // next launch sees categories, short-circuits the empty-check, and wedges
  // the DB in a half-populated state that nothing recovers from.
  await db.transaction(async (tx) => {
    // Seed categories
    await tx.insert(categories).values([
      { name: 'Sightseeing', color: '#3B82F6', icon: 'eye' },
      { name: 'Food', color: '#F59E0B', icon: 'restaurant' },
      { name: 'Transport', color: '#6366F1', icon: 'car' },
      { name: 'Accommodation', color: '#10B981', icon: 'bed' },
      { name: 'Shopping', color: '#EC4899', icon: 'cart' },
    ]);

    // Seed default trips — first two are upcoming/planned, last two are
    // completed past trips that power the Previous Trips rail + the
    // past-trip summary screen. Past dates are chosen so they remain
    // strictly before "today" at demo time.
    await tx.insert(trips).values([
      { name: 'Summer in Italy', destination: 'Rome', country: 'Italy', coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', startDate: '2026-07-01', endDate: '2026-07-14' },
      { name: 'Weekend in Paris', destination: 'Paris', country: 'France', coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', startDate: '2026-08-15', endDate: '2026-08-18' },
      { name: 'Autumn in Japan', destination: 'Tokyo', country: 'Japan', coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', startDate: '2025-10-15', endDate: '2025-10-25' },
      { name: 'New York City Break', destination: 'New York', country: 'USA', coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80', startDate: '2026-02-07', endDate: '2026-02-14' },
    ]);

    // Seed sample activities
    await tx.insert(activities).values([
      { tripId: 1, categoryId: 1, date: '2026-07-01', metric: 180, status: 'completed', notes: 'Colosseum tour', isFavourite: true },
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

      // Paris (trip 2) — spans 2026-08-15 to 2026-08-18 across multiple categories + statuses
      { tripId: 2, categoryId: 3, date: '2026-08-15', metric: 90, status: 'completed', notes: 'Eurostar to Paris' },
      { tripId: 2, categoryId: 4, date: '2026-08-15', metric: 30, status: 'completed', notes: 'Hotel check-in Le Marais' },
      { tripId: 2, categoryId: 1, date: '2026-08-15', metric: 120, status: 'completed', notes: 'Evening walk to Notre-Dame' },
      { tripId: 2, categoryId: 1, date: '2026-08-16', metric: 180, status: 'completed', notes: 'Louvre Museum', isFavourite: true },
      { tripId: 2, categoryId: 2, date: '2026-08-16', metric: 75, status: 'completed', notes: 'Lunch near Tuileries' },
      { tripId: 2, categoryId: 1, date: '2026-08-16', metric: 90, status: 'completed', notes: 'Eiffel Tower viewing' },
      { tripId: 2, categoryId: 5, date: '2026-08-17', metric: 120, status: 'planned', notes: 'Champs-Élysées shopping' },
      { tripId: 2, categoryId: 2, date: '2026-08-17', metric: 90, status: 'planned', notes: 'Dinner in Montmartre' },
      { tripId: 2, categoryId: 1, date: '2026-08-18', metric: 150, status: 'planned', notes: 'Versailles day trip' },

      // Tokyo (trip 3) — past trip, everything completed. Favourite is the
      // Senso-ji temple visit so the Previous Trips Highlights card has
      // something meaningful to surface as "must-do".
      { tripId: 3, categoryId: 3, date: '2025-10-15', metric: 720, status: 'completed', notes: 'Flight Dublin → Haneda' },
      { tripId: 3, categoryId: 4, date: '2025-10-15', metric: 45, status: 'completed', notes: 'Check-in ryokan in Asakusa' },
      { tripId: 3, categoryId: 1, date: '2025-10-16', metric: 150, status: 'completed', notes: 'Senso-ji temple at sunrise', isFavourite: true },
      { tripId: 3, categoryId: 2, date: '2025-10-16', metric: 60, status: 'completed', notes: 'Sushi breakfast at Tsukiji' },
      { tripId: 3, categoryId: 1, date: '2025-10-17', metric: 200, status: 'completed', notes: 'Meiji Shrine & Yoyogi Park' },
      { tripId: 3, categoryId: 5, date: '2025-10-17', metric: 120, status: 'completed', notes: 'Shibuya shopping' },
      { tripId: 3, categoryId: 3, date: '2025-10-18', metric: 180, status: 'completed', notes: 'Shinkansen to Kyoto' },
      { tripId: 3, categoryId: 1, date: '2025-10-19', metric: 240, status: 'completed', notes: 'Fushimi Inari thousand torii hike' },
      { tripId: 3, categoryId: 2, date: '2025-10-20', metric: 90, status: 'completed', notes: 'Ramen dinner in Gion' },
      { tripId: 3, categoryId: 1, date: '2025-10-22', metric: 180, status: 'completed', notes: 'teamLab Planets immersive art' },
      { tripId: 3, categoryId: 5, date: '2025-10-24', metric: 75, status: 'completed', notes: 'Akihabara electronics haul' },

      // New York (trip 4) — past trip, a tighter city break. Favourite is
      // the Broadway show, which is the canonical "one thing you have to
      // do" in NYC.
      { tripId: 4, categoryId: 3, date: '2026-02-07', metric: 480, status: 'completed', notes: 'Flight Dublin → JFK' },
      { tripId: 4, categoryId: 4, date: '2026-02-07', metric: 30, status: 'completed', notes: 'Check-in Midtown hotel' },
      { tripId: 4, categoryId: 1, date: '2026-02-08', metric: 180, status: 'completed', notes: 'Central Park walk + MoMA' },
      { tripId: 4, categoryId: 2, date: '2026-02-08', metric: 60, status: 'completed', notes: 'Bagel brunch on 5th Ave' },
      { tripId: 4, categoryId: 1, date: '2026-02-09', metric: 150, status: 'completed', notes: 'Statue of Liberty ferry' },
      { tripId: 4, categoryId: 1, date: '2026-02-10', metric: 165, status: 'completed', notes: 'Broadway: Hamilton', isFavourite: true },
      { tripId: 4, categoryId: 2, date: '2026-02-11', metric: 75, status: 'completed', notes: 'Pizza crawl in Brooklyn' },
      { tripId: 4, categoryId: 1, date: '2026-02-12', metric: 120, status: 'completed', notes: 'Empire State at sunset' },
      { tripId: 4, categoryId: 5, date: '2026-02-13', metric: 90, status: 'completed', notes: 'SoHo shopping' },
      { tripId: 4, categoryId: 3, date: '2026-02-14', metric: 480, status: 'completed', notes: 'Flight JFK → Dublin' },
    ]);

    // Seed sample targets
    await tx.insert(targets).values([
      { tripId: 1, categoryId: 1, targetValue: 600, period: 'weekly' },
      { tripId: 1, categoryId: 2, targetValue: 300, period: 'weekly' },
      { tripId: null, categoryId: 3, targetValue: 500, period: 'monthly' },
      { tripId: 1, categoryId: 5, targetValue: 120, period: 'weekly' },
      { tripId: 2, categoryId: 1, targetValue: 400, period: 'weekly' },
      { tripId: 2, categoryId: 2, targetValue: 200, period: 'weekly' },
    ]);

    // Seed default saved filters so users see them immediately.
    //
    // `filterType` must match the consuming screen's `SCOPE` — currently
    // only ActivitiesSection reads these rows, and it scopes on
    // `filterType === 'activities'`. `filterValue` is the JSON-encoded
    // partial state the screen spreads into its filter setters
    // (`selectedCategory`, `dateRange`, `searchQuery`). Legacy rows here
    // used `filterType: 'category'` + a bare ID string, which the hook
    // would silently swallow inside its JSON.parse try/catch — so the
    // filters never actually applied. Fixed so the presets work on a
    // fresh install.
    const seededAt = new Date().toISOString();
    await tx.insert(savedFilters).values([
      {
        name: 'Sightseeing only',
        filterType: 'activities',
        filterValue: JSON.stringify({ selectedCategory: '1' }),
        createdAt: seededAt,
      },
      {
        name: 'Food & Dining',
        filterType: 'activities',
        filterValue: JSON.stringify({ selectedCategory: '2' }),
        createdAt: seededAt,
      },
      {
        name: 'This Week',
        filterType: 'activities',
        filterValue: JSON.stringify({ dateRange: 'week' }),
        createdAt: seededAt,
      },
    ]);
  });
}
