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
  // System-managed categories (e.g. "Unspecified") can't be renamed or
  // deleted. Deleting a user category reassigns its activities + goals
  // to the unique row flagged isSystem=true instead of cascading away.
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
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
    // Where the activity happens - optional. Either picked via the
    // place-picker modal or typed free-form by the user. Kept separate
    // from `notes` so charts/AI prompts can surface the venue without
    // parsing prose.
    place: text('place'),
    notes: text('notes'),
    // Per-activity favourite flag. A trip can have any number of favourites;
    // they sort to the top of the activities list in the order they were
    // starred (earliest first) via `favouritedAt`. Stored as 0/1 at the SQLite
    // level via Drizzle's boolean mode.
    isFavourite: integer('is_favourite', { mode: 'boolean' }).notNull().default(false),
    // ISO timestamp set the moment `isFavourite` flips true; cleared back to
    // null when unstarred. Drives the favourites-first ordering.
    favouritedAt: text('favourited_at'),
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
  // (sensible default: empty string at migration) - users upgrading from an
  // earlier build won't have these populated until they visit Edit Profile.
  displayName: text('display_name').notNull().default(''),
  homeCity: text('home_city').notNull().default(''),
  // Local file URI for the user's avatar (e.g. `file:///.../avatars/user-1-<ts>.jpg`).
  // Empty string when unset - the Account screen falls back to initials in that
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
    notes: text('notes'),
    isFavourite: integer('is_favourite', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => ({
    tripIdx: index('targets_trip_id_idx').on(t.tripId),
    categoryIdx: index('targets_category_id_idx').on(t.categoryId),
  }),
);
