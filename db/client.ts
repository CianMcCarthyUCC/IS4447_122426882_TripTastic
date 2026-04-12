import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const sqlite = openDatabaseSync('holidayplanner.db');

export const db = drizzle(sqlite, { schema });

/**
 * Creates all tables using Drizzle schema definitions as the single source of truth.
 * Called once on app startup before any data operations.
 */
export function initializeDatabase() {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      metric INTEGER NOT NULL,
      notes TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      category_id INTEGER NOT NULL,
      target_value INTEGER NOT NULL,
      period TEXT NOT NULL DEFAULT 'weekly'
    )
  `);
}
