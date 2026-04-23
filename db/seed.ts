import { db } from './client';
import { categories, trips, activities, targets, savedFilters } from './schema';

export async function seedDataIfEmpty() {
  const allCategories = await db.select().from(categories);
  const userCategories = allCategories.filter((c) => !c.isSystem);
  if (userCategories.length > 0) {
    // Existing install - just make sure the Unspecified catch-all exists
    // so the delete-category flow always has a reassignment target.
    const hasSystem = allCategories.some((c) => c.isSystem);
    if (!hasSystem) {
      await db.insert(categories).values({
        name: 'Unspecified',
        color: '#9CA3AF',
        icon: 'help-circle',
        isSystem: true,
      });
    }
    return;
  }

  // All-or-nothing: if the app is killed mid-seed we never want a partial
  // DB (e.g. categories seeded but trips not). Without a transaction the
  // next launch sees categories, short-circuits the empty-check, and wedges
  // the DB in a half-populated state that nothing recovers from.
  await db.transaction(async (tx) => {
    // Seed user categories. The system "Unspecified" row is inserted
    // idempotently during client-side init, so it's not repeated here.
    await tx.insert(categories).values([
      { name: 'Sightseeing', color: '#3B82F6', icon: 'eye' },
      { name: 'Food', color: '#F59E0B', icon: 'restaurant' },
      { name: 'Transport', color: '#6366F1', icon: 'car' },
      { name: 'Accommodation', color: '#10B981', icon: 'bed' },
      { name: 'Shopping', color: '#EC4899', icon: 'cart' },
    ]);

    // Seed default trips - first two are upcoming/planned, last two are
    // completed past trips that power the Previous Trips rail + the
    // past-trip summary screen. Past dates are chosen so they remain
    // strictly before "today" at demo time.
    await tx.insert(trips).values([
      { name: 'Summer in Italy', destination: 'Rome', country: 'Italy', coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', startDate: '2026-07-01', endDate: '2026-07-14' },
      { name: 'Weekend in Paris', destination: 'Paris', country: 'France', coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', startDate: '2026-08-15', endDate: '2026-08-18' },
      { name: '9 Days in Tokyo', destination: 'Tokyo', country: 'Japan', coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', startDate: '2025-10-15', endDate: '2025-10-23' },
      { name: 'New York City Break', destination: 'New York', country: 'USA', coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80', startDate: '2026-02-07', endDate: '2026-02-14' },
    ]);

    // Seed sample activities. `place` is the venue/location the activity
    // happens at (populated where obvious from the existing note); `notes`
    // keeps the short descriptive blurb so cards still have something
    // readable under the venue.
    await tx.insert(activities).values([
      { tripId: 1, categoryId: 1, date: '2026-07-01', metric: 180, status: 'completed', place: 'Colosseum', notes: 'Guided tour', isFavourite: true, favouritedAt: '2026-07-01T10:00:00.000Z'},
      { tripId: 1, categoryId: 2, date: '2026-07-01', metric: 60, status: 'completed', place: 'Trattoria da Enzo', notes: 'Lunch with locals' },
      { tripId: 1, categoryId: 1, date: '2026-07-02', metric: 120, status: 'completed', place: 'Vatican Museums', notes: 'Sistine Chapel highlight' },
      { tripId: 1, categoryId: 3, date: '2026-07-02', metric: 90, status: 'completed', place: 'Roma Termini', notes: 'Train to Florence' },
      { tripId: 1, categoryId: 2, date: '2026-07-03', metric: 45, status: 'completed', place: 'Mercato Centrale', notes: 'Pasta making class' },
      { tripId: 1, categoryId: 1, date: '2026-07-03', metric: 150, status: 'completed', place: 'Uffizi Gallery', notes: 'Botticelli room' },
      { tripId: 1, categoryId: 5, date: '2026-07-04', metric: 60, status: 'planned', place: 'San Lorenzo Market', notes: 'Leather shopping' },
      { tripId: 1, categoryId: 2, date: '2026-07-04', metric: 30, status: 'planned', place: 'Vivoli Gelateria', notes: 'Gelato tasting' },
      { tripId: 1, categoryId: 3, date: '2026-07-05', metric: 45, status: 'planned', place: 'SITA bus terminal', notes: 'Bus to Siena' },
      { tripId: 1, categoryId: 1, date: '2026-07-05', metric: 200, status: 'planned', place: 'Siena', notes: 'Day trip to Piazza del Campo' },
      { tripId: 1, categoryId: 4, date: '2026-07-06', metric: 60, status: 'planned', place: 'Trastevere Airbnb', notes: 'Check-in' },
      { tripId: 1, categoryId: 2, date: '2026-07-06', metric: 90, status: 'planned', place: 'Antica Enoteca', notes: 'Wine tasting dinner' },
      { tripId: 1, categoryId: 1, date: '2026-07-07', metric: 240, status: 'planned', place: 'Cinque Terre', notes: 'Coastal hike between villages' },
      { tripId: 1, categoryId: 3, date: '2026-07-07', metric: 120, status: 'planned', place: 'La Spezia Centrale', notes: 'Train to Cinque Terre' },

      // Paris (trip 2) - spans 2026-08-15 to 2026-08-18 across multiple categories + statuses
      { tripId: 2, categoryId: 3, date: '2026-08-15', metric: 90, status: 'completed', place: 'Gare du Nord', notes: 'Eurostar arrival' },
      { tripId: 2, categoryId: 4, date: '2026-08-15', metric: 30, status: 'completed', place: 'Hôtel du Petit Moulin', notes: 'Check-in Le Marais' },
      { tripId: 2, categoryId: 1, date: '2026-08-15', metric: 120, status: 'completed', place: 'Notre-Dame Cathedral', notes: 'Evening walk' },
      { tripId: 2, categoryId: 1, date: '2026-08-16', metric: 180, status: 'completed', place: 'Louvre Museum', notes: 'Mona Lisa + Egyptian wing', isFavourite: true, favouritedAt: '2026-08-16T12:00:00.000Z'},
      { tripId: 2, categoryId: 2, date: '2026-08-16', metric: 75, status: 'completed', place: 'Tuileries Garden cafés', notes: 'Lunch near the gardens' },
      { tripId: 2, categoryId: 1, date: '2026-08-16', metric: 90, status: 'completed', place: 'Eiffel Tower', notes: 'Sunset viewing' },
      { tripId: 2, categoryId: 5, date: '2026-08-17', metric: 120, status: 'planned', place: 'Champs-Élysées', notes: 'Shopping stroll' },
      { tripId: 2, categoryId: 2, date: '2026-08-17', metric: 90, status: 'planned', place: 'Montmartre', notes: 'Dinner up the hill' },
      { tripId: 2, categoryId: 1, date: '2026-08-18', metric: 150, status: 'planned', place: 'Château de Versailles', notes: 'Day trip from Paris' },

      // Tokyo (trip 3) - 9-day completed trip (2025-10-15 → 2025-10-23).
      // Everything is `completed` so the past-trip recap, highlights card,
      // and AI recap card all have meaningful data on a fresh install.
      // Favourite is the sunrise Senso-ji visit - the canonical "priority
      // moment" of the trip for the Highlights row.

      // Day 1 - arrival
      { tripId: 3, categoryId: 3, date: '2025-10-15', metric: 720, status: 'completed', place: 'Haneda Airport', notes: 'Flight Dublin → Haneda via Doha' },
      { tripId: 3, categoryId: 4, date: '2025-10-15', metric: 45, status: 'completed', place: 'Asakusa ryokan', notes: 'Check-in + onsen soak' },

      // Day 2 - Asakusa + Tsukiji
      { tripId: 3, categoryId: 1, date: '2025-10-16', metric: 150, status: 'completed', place: 'Senso-ji Temple', notes: 'Sunrise visit before the crowds', isFavourite: true, favouritedAt: '2025-10-16T06:00:00.000Z'},
      { tripId: 3, categoryId: 2, date: '2025-10-16', metric: 60, status: 'completed', place: 'Tsukiji Outer Market', notes: 'Sushi breakfast at Sushi Dai' },
      { tripId: 3, categoryId: 1, date: '2025-10-16', metric: 90, status: 'completed', place: 'Ueno Park', notes: 'Afternoon stroll + Tokyo National Museum' },

      // Day 3 - Harajuku + Shibuya
      { tripId: 3, categoryId: 1, date: '2025-10-17', metric: 200, status: 'completed', place: 'Meiji Shrine', notes: 'Shrine walk through Yoyogi Park' },
      { tripId: 3, categoryId: 5, date: '2025-10-17', metric: 120, status: 'completed', place: 'Harajuku - Takeshita Street', notes: 'Street fashion + crepes' },
      { tripId: 3, categoryId: 1, date: '2025-10-17', metric: 90, status: 'completed', place: 'Shibuya Crossing', notes: 'Evening crossing + Shibuya Sky' },

      // Day 4 - Odaiba + teamLab
      { tripId: 3, categoryId: 3, date: '2025-10-18', metric: 45, status: 'completed', place: 'Yurikamome Line', notes: 'Driverless train to Odaiba' },
      { tripId: 3, categoryId: 1, date: '2025-10-18', metric: 180, status: 'completed', place: 'teamLab Planets', notes: 'Immersive art exhibit - waterfall room' },
      { tripId: 3, categoryId: 2, date: '2025-10-18', metric: 75, status: 'completed', place: 'Aqua City Odaiba', notes: 'Tonkatsu dinner with bay view' },

      // Day 5 - day trip to Kamakura
      { tripId: 3, categoryId: 3, date: '2025-10-19', metric: 120, status: 'completed', place: 'JR Yokosuka Line', notes: 'Day trip to Kamakura' },
      { tripId: 3, categoryId: 1, date: '2025-10-19', metric: 210, status: 'completed', place: 'Kotoku-in - Great Buddha', notes: 'Bronze Daibutsu + Hase-dera temple' },
      { tripId: 3, categoryId: 2, date: '2025-10-19', metric: 60, status: 'completed', place: 'Komachi-dori', notes: 'Street food lunch crawl' },

      // Day 6 - Akihabara + Ginza
      { tripId: 3, categoryId: 5, date: '2025-10-20', metric: 150, status: 'completed', place: 'Akihabara', notes: 'Electronics + retro game haul' },
      { tripId: 3, categoryId: 2, date: '2025-10-20', metric: 90, status: 'completed', place: 'Ginza - Ichiran', notes: 'Solo-booth tonkotsu ramen' },
      { tripId: 3, categoryId: 5, date: '2025-10-20', metric: 75, status: 'completed', place: 'Ginza Six', notes: 'Souvenir shopping' },

      // Day 7 - Shinjuku
      { tripId: 3, categoryId: 1, date: '2025-10-21', metric: 120, status: 'completed', place: 'Shinjuku Gyoen', notes: 'Early autumn colours in the park' },
      { tripId: 3, categoryId: 1, date: '2025-10-21', metric: 90, status: 'completed', place: 'Tokyo Metropolitan Gov Building', notes: 'Free observation deck at sunset' },
      { tripId: 3, categoryId: 2, date: '2025-10-21', metric: 120, status: 'completed', place: 'Omoide Yokocho', notes: 'Yakitori alley dinner' },

      // Day 8 - Skytree + sumo
      { tripId: 3, categoryId: 1, date: '2025-10-22', metric: 120, status: 'completed', place: 'Tokyo Skytree', notes: 'Tembo Galleria walk' },
      { tripId: 3, categoryId: 1, date: '2025-10-22', metric: 180, status: 'completed', place: 'Ryogoku Kokugikan', notes: 'Grand Sumo Tournament - bench seats' },
      { tripId: 3, categoryId: 2, date: '2025-10-22', metric: 75, status: 'completed', place: 'Ryogoku - Tomoegata', notes: 'Chanko nabe hotpot dinner' },

      // Day 9 - departure
      { tripId: 3, categoryId: 4, date: '2025-10-23', metric: 30, status: 'completed', place: 'Asakusa ryokan', notes: 'Checkout + luggage forwarding' },
      { tripId: 3, categoryId: 3, date: '2025-10-23', metric: 60, status: 'completed', place: 'Narita Express', notes: 'Train to Narita Airport' },
      { tripId: 3, categoryId: 3, date: '2025-10-23', metric: 780, status: 'completed', place: 'Narita Airport', notes: 'Flight Narita → Dublin' },

      // New York (trip 4) - past trip, a tighter city break. Favourite is
      // the Broadway show, which is the canonical "one thing you have to
      // do" in NYC.
      { tripId: 4, categoryId: 3, date: '2026-02-07', metric: 480, status: 'completed', place: 'JFK Airport', notes: 'Flight Dublin → JFK' },
      { tripId: 4, categoryId: 4, date: '2026-02-07', metric: 30, status: 'completed', place: 'Midtown hotel', notes: 'Check-in' },
      { tripId: 4, categoryId: 1, date: '2026-02-08', metric: 180, status: 'completed', place: 'Central Park', notes: 'Walk then MoMA' },
      { tripId: 4, categoryId: 2, date: '2026-02-08', metric: 60, status: 'completed', place: '5th Avenue bagel shop', notes: 'Brunch' },
      { tripId: 4, categoryId: 1, date: '2026-02-09', metric: 150, status: 'completed', place: 'Statue of Liberty', notes: 'Ferry tour' },
      { tripId: 4, categoryId: 1, date: '2026-02-10', metric: 165, status: 'completed', place: 'Richard Rodgers Theatre', notes: 'Broadway: Hamilton', isFavourite: true, favouritedAt: '2026-02-10T20:00:00.000Z'},
      { tripId: 4, categoryId: 2, date: '2026-02-11', metric: 75, status: 'completed', place: 'Brooklyn', notes: 'Pizza crawl' },
      { tripId: 4, categoryId: 1, date: '2026-02-12', metric: 120, status: 'completed', place: 'Empire State Building', notes: 'Sunset observation deck' },
      { tripId: 4, categoryId: 5, date: '2026-02-13', metric: 90, status: 'completed', place: 'SoHo', notes: 'Boutique shopping' },
      { tripId: 4, categoryId: 3, date: '2026-02-14', metric: 480, status: 'completed', place: 'JFK Airport', notes: 'Flight JFK → Dublin' },
    ]);

    // Seed sample targets
    await tx.insert(targets).values([
      {
        tripId: 1,
        categoryId: 1,
        targetValue: 600,
        period: 'weekly',
        notes: 'Make the most of the sightseeing pass - aim for a full morning each day.',
        isFavourite: true,
      },
      {
        tripId: 1,
        categoryId: 2,
        targetValue: 300,
        period: 'weekly',
        notes: 'Plenty of local food spots to try this week.',
        isFavourite: false,
      },
      {
        tripId: null,
        categoryId: 3,
        targetValue: 500,
        period: 'monthly',
        notes: 'Keep getting around on public transport when I can to save on taxis.',
        isFavourite: false,
      },
      {
        tripId: 1,
        categoryId: 5,
        targetValue: 120,
        period: 'weekly',
        notes: 'Souvenirs and small gifts for family and friends back home.',
        isFavourite: false,
      },
      {
        tripId: 2,
        categoryId: 1,
        targetValue: 400,
        period: 'weekly',
        notes: 'Balance landmark visits with cafe time so the trip does not feel rushed.',
        isFavourite: true,
      },
      {
        tripId: 2,
        categoryId: 2,
        targetValue: 200,
        period: 'weekly',
        notes: 'Dinner out a few nights this week to try the local cuisine.',
        isFavourite: false,
      },
    ]);

    // Seed default saved filters so users see them immediately.
    //
    // `filterType` must match the consuming screen's `SCOPE` - currently
    // only ActivitiesSection reads these rows, and it scopes on
    // `filterType === 'activities'`. `filterValue` is the JSON-encoded
    // partial state the screen spreads into its filter setters
    // (`selectedCategory`, `dateRange`, `searchQuery`). Legacy rows here
    // used `filterType: 'category'` + a bare ID string, which the hook
    // would silently swallow inside its JSON.parse try/catch - so the
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

    // Insert the Unspecified catch-all AFTER the seeded user categories
    // so it lands at id 6 on a fresh install - the activities above
    // reference category ids 1..5, which must stay pointed at the
    // seeded user categories and not the fallback row.
    await tx.insert(categories).values({
      name: 'Unspecified',
      color: '#9CA3AF',
      icon: 'help-circle',
      isSystem: true,
    });
  });
}

