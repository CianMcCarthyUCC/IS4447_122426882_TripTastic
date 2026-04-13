import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  date: text('date').notNull(),
  metric: integer('metric').notNull(),
  notes: text('notes'),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
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

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id'),
  categoryId: integer('category_id').notNull(),
  targetValue: integer('target_value').notNull(),
  period: text('period').notNull(),
});
