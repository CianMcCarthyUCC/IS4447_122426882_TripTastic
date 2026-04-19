import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  country: text('country').notNull(),
  coverImage: text('cover_image'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const activities = sqliteTable(
  'activities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tripId: integer('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    date: text('date').notNull(),
    metric: integer('metric').notNull(),
    status: text('status').notNull(),
    notes: text('notes'),
    // Per-trip "priority" marker. Only one activity per trip should carry
    // this flag — `setFavouriteActivity` unstars siblings inside the same
    // transaction. Stored as 0/1 at the SQLite level via Drizzle's boolean
    // mode so selects hand the repo `true`/`false` directly.
    isFavourite: integer('is_favourite', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => ({
    tripIdx: index('activities_trip_id_idx').on(t.tripId),
    categoryIdx: index('activities_category_id_idx').on(t.categoryId),
    dateIdx: index('activities_date_idx').on(t.date),
  }),
);

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  // Display fields populated on the Account / Edit Profile screen. Nullable
  // (sensible default: empty string at migration) — users upgrading from an
  // earlier build won't have these populated until they visit Edit Profile.
  displayName: text('display_name').notNull().default(''),
  homeCity: text('home_city').notNull().default(''),
  // Local file URI for the user's avatar (e.g. `file:///.../avatars/user-1-<ts>.jpg`).
  // Empty string when unset — the Account screen falls back to initials in that
  // case. We store a URI string rather than a BLOB so the image file stays
  // streamable via `<Image source={{ uri }} />` without a round-trip through JS.
  profilePicture: text('profile_picture').notNull().default(''),
});

export const savedFilters = sqliteTable('saved_filters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  filterType: text('filter_type').notNull(),
  filterValue: text('filter_value').notNull(),
  createdAt: text('created_at').notNull(),
});

export const recentSearches = sqliteTable('recent_searches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull(),
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    userIdx: index('sessions_user_id_idx').on(t.userId),
  }),
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

/**
 * Cached AI-generated trip overviews. One row per trip (tripId is PK) — a
 * regenerate overwrites the existing row rather than appending history, so
 * the DB never grows unboundedly in the normal flow. `recommendedOrder`
 * is a JSON-encoded `number[]` of activity IDs in the AI's suggested order;
 * stored as text because SQLite lacks a native array type and the read-path
 * only ever consumes it after a single `JSON.parse`, which is cheap relative
 * to a Gemini round-trip.
 */
export const tripAiOverviews = sqliteTable('trip_ai_overviews', {
  // Sharing the PK with trips.id enforces the one-row-per-trip invariant at
  // the schema level — no composite keys, no extra unique index needed.
  tripId: integer('trip_id')
    .primaryKey()
    .references(() => trips.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  recommendedOrder: text('recommended_order').notNull().default('[]'),
  model: text('model').notNull(),
  generatedAt: text('generated_at').notNull(),
});

export const targets = sqliteTable(
  'targets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tripId: integer('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    targetValue: integer('target_value').notNull(),
    period: text('period').notNull(),
  },
  (t) => ({
    tripIdx: index('targets_trip_id_idx').on(t.tripId),
    categoryIdx: index('targets_category_id_idx').on(t.categoryId),
  }),
);
