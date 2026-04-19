import { eq, inArray } from 'drizzle-orm';
import { db } from './client';
import { categories, activities, targets, users, sessions, savedFilters, recentSearches, settings, trips, tripAiOverviews } from './schema';
import type {
  CategoryFormData,
  ActivityFormData,
  TargetFormData,
  TripFormData,
  Activity,
  Target,
  User,
  UpdateProfileInput,
  TripAiOverview,
  TripAiOverviewInput,
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
    notes: data.notes || null,
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
      notes: data.notes || null,
    })
    .where(eq(activities.id, id));
}

export async function deleteActivityById(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
}

/**
 * Marks a single activity as the trip's favourite ("number-one priority").
 * Wrapped in a transaction so the "at most one favourite per trip"
 * invariant can never be violated by a mid-operation crash — either we
 * successfully unstar the old favourite AND star the new one, or we
 * leave the DB untouched.
 *
 * Passing `activityId` as the one currently starred is a no-op (unstar
 * then restar is effectively idempotent from the user's POV).
 */
export async function setFavouriteActivity(tripId: number, activityId: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(activities)
      .set({ isFavourite: false })
      .where(eq(activities.tripId, tripId));
    await tx
      .update(activities)
      .set({ isFavourite: true })
      .where(eq(activities.id, activityId));
  });
}

/** Clears the favourite flag for every activity on the given trip. */
export async function clearFavouriteActivity(tripId: number) {
  await db
    .update(activities)
    .set({ isFavourite: false })
    .where(eq(activities.tripId, tripId));
}

// ── AI Trip Overviews ──────────────────────────────────

/**
 * Read the cached AI overview for a trip, if one exists. Returns `null`
 * rather than throwing when absent so callers can branch on presence
 * without a try/catch.
 *
 * The `recommended_order` column is stored as a JSON string — parsing
 * happens here so the rest of the app never sees the raw text. Bad JSON
 * (corrupted row, schema migration mismatch) degrades gracefully to an
 * empty array; we'd rather show the overview without the ordered list
 * than crash the Summary tab.
 */
export async function getAiOverview(tripId: number): Promise<TripAiOverview | null> {
  // `.limit(1)` is intent documentation — the PK already guarantees a single
  // row — but making it explicit lets SQLite short-circuit the cursor after
  // the first match on builds without the optimisation baked in.
  const rows = await db
    .select()
    .from(tripAiOverviews)
    .where(eq(tripAiOverviews.tripId, tripId))
    .limit(1);
  if (rows.length === 0) return null;
  const row = rows[0];
  let parsedOrder: number[] = [];
  try {
    const candidate = JSON.parse(row.recommendedOrder);
    if (Array.isArray(candidate)) {
      parsedOrder = candidate.filter((n): n is number => typeof n === 'number');
    }
  } catch {
    // Corrupted JSON — fall through with the empty default.
  }
  return {
    tripId: row.tripId,
    content: row.content,
    recommendedOrder: parsedOrder,
    model: row.model,
    generatedAt: row.generatedAt,
  };
}

/**
 * Upsert a trip's AI overview using SQLite's native `ON CONFLICT DO UPDATE`
 * via Drizzle's `onConflictDoUpdate`. Expo ships SQLite 3.39+ so the
 * UPSERT semantics (available since 3.24) are safe to rely on. This is a
 * single atomic statement — no transaction wrapper needed — which is both
 * faster and eliminates the brief "row deleted, row not yet inserted"
 * window the previous delete-then-insert had.
 */
export async function upsertAiOverview(input: TripAiOverviewInput): Promise<void> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const serialisedOrder = JSON.stringify(input.recommendedOrder ?? []);
  await db
    .insert(tripAiOverviews)
    .values({
      tripId: input.tripId,
      content: input.content,
      recommendedOrder: serialisedOrder,
      model: input.model,
      generatedAt,
    })
    .onConflictDoUpdate({
      target: tripAiOverviews.tripId,
      set: {
        content: input.content,
        recommendedOrder: serialisedOrder,
        model: input.model,
        generatedAt,
      },
    });
}

/** Remove the cached overview for a trip (e.g. user tapped "Clear"). */
export async function clearAiOverview(tripId: number): Promise<void> {
  await db.delete(tripAiOverviews).where(eq(tripAiOverviews.tripId, tripId));
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

// Narrow a raw users row to the public `User` shape — strips passwordHash and
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
  // tail. Trimming uses one batched `inArray` delete instead of the former
  // N+1 per-row loop, which dominated latency once the list hit its cap.
  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(recentSearches)
      .where(eq(recentSearches.query, query));
    if (existing.length > 0) {
      await tx.delete(recentSearches).where(eq(recentSearches.id, existing[0].id));
    }
    await tx.insert(recentSearches).values({
      query,
      createdAt: new Date().toISOString(),
    });
    const all = await tx.select().from(recentSearches);
    if (all.length > 10) {
      const ids = all.slice(0, all.length - 10).map((r) => r.id);
      await tx.delete(recentSearches).where(inArray(recentSearches.id, ids));
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
  const existing = await db.select().from(settings).where(eq(settings.key, key));
  if (existing.length > 0) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}
