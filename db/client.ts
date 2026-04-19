import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const sqlite = openDatabaseSync('holidayplanner.db');

export const db = drizzle(sqlite, { schema });

// SQLite requires FK enforcement to be opted in per connection — default is off.
// Must run before any CREATE TABLE so references are checked from the first write.
db.run(sql`PRAGMA foreign_keys = ON`);

/**
 * Creates all tables immediately at module load time.
 * This ensures tables exist before any hook or component tries to query them.
 */
function initializeDatabase() {
  db.run(sql`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '', home_city TEXT NOT NULL DEFAULT '', profile_picture TEXT NOT NULL DEFAULT '')`);
  // Additive migrations for users — existing installs predating the Account
  // redesign won't have these columns yet. Default '' so the profile screen
  // can render before the user fills them in.
  try { db.run(sql`ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
  try { db.run(sql`ALTER TABLE users ADD COLUMN home_city TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
  try { db.run(sql`ALTER TABLE users ADD COLUMN profile_picture TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
  db.run(sql`CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, destination TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', cover_image TEXT, start_date TEXT NOT NULL, end_date TEXT NOT NULL)`);
  try { db.run(sql`ALTER TABLE trips ADD COLUMN destination TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
  try { db.run(sql`ALTER TABLE trips ADD COLUMN country TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
  try { db.run(sql`ALTER TABLE trips ADD COLUMN cover_image TEXT`); } catch { /* exists */ }
  db.run(sql`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT NOT NULL, icon TEXT NOT NULL)`);
  // FK clauses mirror `schema.ts` — cascade on trip deletion, restrict on
  // category deletion so a category in use can't be removed out from under
  // its activities. Existing installs predating these clauses keep their
  // un-FK'd tables (SQLite can't ALTER-add constraints) — those paths rely
  // on the manual cascade in `deleteTripById` for cleanup.
  db.run(sql`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE, category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT, date TEXT NOT NULL, metric INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'planned', notes TEXT, is_favourite INTEGER NOT NULL DEFAULT 0)`);
  try { db.run(sql`ALTER TABLE activities ADD COLUMN status TEXT NOT NULL DEFAULT 'planned'`); } catch { /* exists */ }
  // Additive column for the "favourite activity per trip" feature. Existing
  // installs predating the feature won't have it — safe no-op on fresh DBs
  // created with the CREATE TABLE clause above.
  try { db.run(sql`ALTER TABLE activities ADD COLUMN is_favourite INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  db.run(sql`CREATE TABLE IF NOT EXISTS saved_filters (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, filter_type TEXT NOT NULL, filter_value TEXT NOT NULL, created_at TEXT NOT NULL)`);
  db.run(sql`CREATE TABLE IF NOT EXISTS recent_searches (id INTEGER PRIMARY KEY AUTOINCREMENT, query TEXT NOT NULL, created_at TEXT NOT NULL)`);
  db.run(sql`CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL)`);
  db.run(sql`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL)`);
  db.run(sql`CREATE TABLE IF NOT EXISTS targets (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE, category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT, target_value INTEGER NOT NULL, period TEXT NOT NULL DEFAULT 'weekly')`);

  // AI trip overviews — one row per trip, PK-shared so a trip can only
  // ever have a single cached summary. `recommended_order` is a JSON
  // string (activity IDs in the AI's suggested order) — SQLite has no
  // native array type so we serialise at the app boundary.
  db.run(sql`CREATE TABLE IF NOT EXISTS trip_ai_overviews (trip_id INTEGER PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE, content TEXT NOT NULL, recommended_order TEXT NOT NULL DEFAULT '[]', model TEXT NOT NULL, generated_at TEXT NOT NULL)`);

  // Indexes — speed up the hot lookup paths (per-trip activities, per-category
  // aggregations for insights, per-date grouping). `IF NOT EXISTS` keeps reruns
  // idempotent across cold-starts.
  db.run(sql`CREATE INDEX IF NOT EXISTS activities_trip_id_idx ON activities (trip_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS activities_category_id_idx ON activities (category_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS activities_date_idx ON activities (date)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS targets_trip_id_idx ON targets (trip_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS targets_category_id_idx ON targets (category_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`);
}

// Migrate existing trips that have empty destination/country
function migrateData() {
  try {
    db.run(sql`UPDATE trips SET destination = 'Rome', country = 'Italy', cover_image = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80' WHERE id = 1 AND (destination = '' OR destination IS NULL)`);
    db.run(sql`UPDATE trips SET destination = 'Paris', country = 'France', cover_image = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' WHERE id = 2 AND (destination = '' OR destination IS NULL)`);
  } catch { /* ignore */ }
}

// Run immediately when this module is first imported
initializeDatabase();
migrateData();

export { initializeDatabase };
