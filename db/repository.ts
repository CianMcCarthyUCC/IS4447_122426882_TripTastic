import { desc, eq, notInArray } from 'drizzle-orm';
import { db } from './client';
import { categories, activities, targets, users, sessions, savedFilters, recentSearches, settings, trips } from './schema';
import type {
  CategoryFormData,
  ActivityFormData,
  TargetFormData,
  TripFormData,
  Activity,
  Target,
  User,
  UpdateProfileInput,
} from '@/types';

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

export async function deleteActivitiesByTripId(tripId: number) {
  await db.delete(activities).where(eq(activities.tripId, tripId));
}

export async function deleteTripById(id: number) {
  // One atomic unit: if any child delete fails we don't leave orphaned rows
  // pointing at a now-deleted trip. Also avoids three separate round-trips.
  await db.transaction(async (tx) => {
    await tx.delete(activities).where(eq(activities.tripId, id));
    await tx.delete(targets).where(eq(targets.tripId, id));
    await tx.delete(trips).where(eq(trips.id, id));
  });
}

// ── Categories ──────────────────────────────────────────

export async function getAllCategories() {
  return db.select().from(categories);
}

export async function insertCategory(data: CategoryFormData): Promise<number> {
  const rows = await db.insert(categories).values(data).returning({ id: categories.id });
  return rows[0].id;
}

export async function updateCategoryById(id: number, data: CategoryFormData) {
  // Backstop for the UI lock: the Unspecified system row must stay exactly
  // as seeded so it's recognisable as the fallback on every screen. Throw
  // loudly rather than silently no-op so a misuse shows up in dev.
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  if (row?.isSystem) {
    throw new Error('The Unspecified category cannot be edited.');
  }
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategoryById(id: number) {
  // Reassign instead of cascade: activities and goals belonging to the
  // deleted category are moved to the system-flagged "Unspecified" row
  // so nothing the user logged is lost. Guarded so the Unspecified row
  // itself can never be deleted - the app needs exactly one of these at
  // all times to serve as the fallback target.
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(categories).where(eq(categories.id, id));
    if (!row) return;
    if (row.isSystem) {
      throw new Error('The Unspecified category cannot be deleted.');
    }
    const [fallback] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.isSystem, true));
    if (!fallback) {
      throw new Error('Unspecified category is missing.');
    }
    await tx
      .update(activities)
      .set({ categoryId: fallback.id })
      .where(eq(activities.categoryId, id));
    await tx
      .update(targets)
      .set({ categoryId: fallback.id })
      .where(eq(targets.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });
}

// ── Activities ──────────────────────────────────────────

export async function getAllActivities(): Promise<Activity[]> {
  // Drizzle types `status` as `string` (it's a plain text column); the app
  // narrows it to the `ActivityStatus` union. Writes always go through
  // `ActivityFormData` so the invariant is upheld on insert.
  const rows = await db.select().from(activities);
  return rows as Activity[];
}

export async function insertActivity(data: ActivityFormData) {
  // `metric` arrives from a text input, so `Number()` can emit `NaN` when the
  // user submitted "abc" or blank. Persisting NaN to SQLite silently coerces
  // it to `null` and breaks aggregate charts downstream, so reject early.
  const metric = Number(data.metric);
  if (!Number.isFinite(metric)) {
    throw new Error('Activity metric must be a finite number.');
  }
  await db.insert(activities).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    date: data.date,
    metric,
    status: data.status,
    place: data.place.trim() || null,
    notes: data.notes.trim() || null,
  });
}

export async function updateActivityById(id: number, data: ActivityFormData) {
  // See insertActivity: guard against NaN so aggregates stay clean.
  const metric = Number(data.metric);
  if (!Number.isFinite(metric)) {
    throw new Error('Activity metric must be a finite number.');
  }
  await db
    .update(activities)
    .set({
      tripId: data.tripId,
      categoryId: data.categoryId,
      date: data.date,
      metric,
      status: data.status,
      place: data.place.trim() || null,
      notes: data.notes.trim() || null,
    })
    .where(eq(activities.id, id));
}

export async function deleteActivityById(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
}

/**
 * Marks an activity as a favourite and remembers when the user starred
 * it, so the favourites list can keep them in the order they were added.
 */
export async function setFavouriteActivity(activityId: number) {
  await db
    .update(activities)
    .set({ isFavourite: true, favouritedAt: new Date().toISOString() })
    .where(eq(activities.id, activityId));
}

/** Unstars a single activity, clearing its `favouritedAt` timestamp. */
export async function unsetFavouriteActivity(activityId: number) {
  await db
    .update(activities)
    .set({ isFavourite: false, favouritedAt: null })
    .where(eq(activities.id, activityId));
}

/**
 * Flips a single activity between planned and completed. Used by the
 * inline complete toggle on the activity card.
 */
export async function setActivityStatus(
  activityId: number,
  status: 'planned' | 'completed',
) {
  await db.update(activities).set({ status }).where(eq(activities.id, activityId));
}

// ── Targets ────────────────────────────────────────────

export async function getAllTargets(): Promise<Target[]> {
  // See getAllActivities: `period` is a text column narrowed to `TargetPeriod`
  // here, safe because inserts go through the typed form.
  const rows = await db.select().from(targets);
  return rows as Target[];
}

export async function insertTarget(data: TargetFormData) {
  await db.insert(targets).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    targetValue: Number(data.targetValue),
    period: data.period,
    notes: data.notes.trim() || null,
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
      notes: data.notes.trim() || null,
    })
    .where(eq(targets.id, id));
}

export async function deleteTargetById(id: number) {
  await db.delete(targets).where(eq(targets.id, id));
}

export async function setFavouriteTarget(id: number) {
  await db.update(targets).set({ isFavourite: true }).where(eq(targets.id, id));
}

export async function unsetFavouriteTarget(id: number) {
  await db.update(targets).set({ isFavourite: false }).where(eq(targets.id, id));
}

// ── Users ──────────────────────────────────────────────

// Narrow a raw users row to the public `User` shape - strips passwordHash and
// keeps the selection of exposed fields in one place so adding new profile
// columns later only touches this helper.
type UserRow = typeof users.$inferSelect;
function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
    displayName: row.displayName,
    homeCity: row.homeCity,
    profilePicture: row.profilePicture,
  };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  if (rows.length === 0) return undefined;
  return toUser(rows[0]);
}

export async function findUserWithHashByEmail(
  email: string,
): Promise<(User & { passwordHash: string }) | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  if (rows.length === 0) return undefined;
  return { ...toUser(rows[0]), passwordHash: rows[0].passwordHash };
}

export async function findUserById(id: number): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  if (rows.length === 0) return undefined;
  return toUser(rows[0]);
}

export async function updateUserProfile(
  id: number,
  data: UpdateProfileInput,
): Promise<User | undefined> {
  await db
    .update(users)
    .set({
      displayName: data.displayName,
      homeCity: data.homeCity,
      profilePicture: data.profilePicture,
    })
    .where(eq(users.id, id));
  return findUserById(id);
}

export async function insertUser(email: string, passwordHash: string): Promise<void> {
  await db.insert(users).values({
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteUserById(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.delete(users).where(eq(users.id, id));
  });
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
  // Dedupe + insert + trim inside a single transaction so a mid-operation
  // crash can't leave the list with an orphaned duplicate or an over-long
  // tail. Trimming now selects only the ids of the 10 most-recent rows
  // and deletes everything outside that set - avoids pulling the full
  // table into memory, and uses an explicit `createdAt` order instead of
  // relying on insertion order (SQLite doesn't guarantee that).
  await db.transaction(async (tx) => {
    await tx.delete(recentSearches).where(eq(recentSearches.query, query));
    await tx.insert(recentSearches).values({
      query,
      createdAt: new Date().toISOString(),
    });
    const keep = await tx
      .select({ id: recentSearches.id })
      .from(recentSearches)
      .orderBy(desc(recentSearches.createdAt))
      .limit(10);
    if (keep.length > 0) {
      await tx
        .delete(recentSearches)
        .where(notInArray(recentSearches.id, keep.map((r) => r.id)));
    }
  });
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
  // One atomic statement via SQLite UPSERT - replaces the old
  // SELECT → branch → INSERT/UPDATE round-trip. Avoids the race where two
  // writers could both pass the existence check and duplicate the row.
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });
}
