import { eq } from 'drizzle-orm';
import { db } from './client';
import { categories, activities, targets, users, sessions, savedFilters, recentSearches, settings, trips } from './schema';
import type { CategoryFormData, ActivityFormData, TargetFormData, TripFormData, Activity, Target, User } from '@/types';

// ── Trips ──────────────────────────────────────────────

export async function getAllTrips() {
  return db.select().from(trips);
}

export async function insertTrip(data: TripFormData) {
  await db.insert(trips).values(data);
}

export async function updateTripById(id: number, data: TripFormData) {
  await db.update(trips).set(data).where(eq(trips.id, id));
}

export async function deleteTripById(id: number) {
  await db.delete(activities).where(eq(activities.tripId, id));
  await db.delete(targets).where(eq(targets.tripId, id));
  await db.delete(trips).where(eq(trips.id, id));
}

// ── Categories ──────────────────────────────────────────

export async function getAllCategories() {
  return db.select().from(categories);
}

export async function insertCategory(data: CategoryFormData) {
  await db.insert(categories).values(data);
}

export async function updateCategoryById(id: number, data: CategoryFormData) {
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategoryById(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
}

// ── Activities ──────────────────────────────────────────

export async function getAllActivities(): Promise<Activity[]> {
  const rows = await db.select().from(activities);
  return rows as Activity[];
}

export async function insertActivity(data: ActivityFormData) {
  await db.insert(activities).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    date: data.date,
    metric: Number(data.metric),
    status: data.status,
    notes: data.notes || null,
  });
}

export async function updateActivityById(id: number, data: ActivityFormData) {
  await db
    .update(activities)
    .set({
      tripId: data.tripId,
      categoryId: data.categoryId,
      date: data.date,
      metric: Number(data.metric),
      status: data.status,
      notes: data.notes || null,
    })
    .where(eq(activities.id, id));
}

export async function deleteActivityById(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
}

// ── Targets ────────────────────────────────────────────

export async function getAllTargets(): Promise<Target[]> {
  const rows = await db.select().from(targets);
  return rows as Target[];
}

export async function insertTarget(data: TargetFormData) {
  await db.insert(targets).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    targetValue: Number(data.targetValue),
    period: data.period,
  });
}

export async function updateTargetById(id: number, data: TargetFormData) {
  await db
    .update(targets)
    .set({
      tripId: data.tripId,
      categoryId: data.categoryId,
      targetValue: Number(data.targetValue),
      period: data.period,
    })
    .where(eq(targets.id, id));
}

export async function deleteTargetById(id: number) {
  await db.delete(targets).where(eq(targets.id, id));
}

// ── Users ──────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return { id: row.id, email: row.email, createdAt: row.createdAt };
}

export async function findUserWithHashByEmail(
  email: string,
): Promise<(User & { passwordHash: string }) | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows[0] as (User & { passwordHash: string }) | undefined;
}

export async function findUserById(id: number): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return { id: row.id, email: row.email, createdAt: row.createdAt };
}

export async function insertUser(email: string, passwordHash: string): Promise<void> {
  await db.insert(users).values({
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteUserById(id: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.delete(users).where(eq(users.id, id));
}

// ── Sessions (SQLite-based session persistence) ────────

export async function getActiveSession(): Promise<number | null> {
  const rows = await db.select().from(sessions);
  if (rows.length === 0) return null;
  return rows[0].userId;
}

export async function createSession(userId: number): Promise<void> {
  await db.delete(sessions);
  await db.insert(sessions).values({
    userId,
    createdAt: new Date().toISOString(),
  });
}

export async function clearSessionDb(): Promise<void> {
  await db.delete(sessions);
}

// ── Saved Filters ──────────────────────────────────────

export async function getAllSavedFilters() {
  return db.select().from(savedFilters);
}

export async function insertSavedFilter(name: string, filterType: string, filterValue: string) {
  await db.insert(savedFilters).values({
    name,
    filterType,
    filterValue,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteSavedFilterById(id: number) {
  await db.delete(savedFilters).where(eq(savedFilters.id, id));
}

// ── Recent Searches ────────────────────────────────────

export async function getRecentSearches(limit = 5) {
  const rows = await db.select().from(recentSearches);
  return rows.slice(-limit).reverse();
}

export async function insertRecentSearch(query: string) {
  // Avoid duplicates
  const existing = await db.select().from(recentSearches).where(eq(recentSearches.query, query));
  if (existing.length > 0) {
    await db.delete(recentSearches).where(eq(recentSearches.id, existing[0].id));
  }
  await db.insert(recentSearches).values({
    query,
    createdAt: new Date().toISOString(),
  });
  // Keep only last 10
  const all = await db.select().from(recentSearches);
  if (all.length > 10) {
    const oldest = all.slice(0, all.length - 10);
    for (const item of oldest) {
      await db.delete(recentSearches).where(eq(recentSearches.id, item.id));
    }
  }
}

export async function clearRecentSearches() {
  await db.delete(recentSearches);
}

// ── Settings (key-value store in SQLite) ───────────────

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(settings).where(eq(settings.key, key));
  if (existing.length > 0) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}
