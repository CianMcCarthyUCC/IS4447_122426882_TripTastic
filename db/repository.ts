import { eq } from 'drizzle-orm';
import { db } from './client';
import { categories, activities, targets, users, sessions } from './schema';
import type { CategoryFormData, ActivityFormData, TargetFormData, Target, User } from '@/types';

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

export async function getAllActivities() {
  return db.select().from(activities);
}

export async function insertActivity(data: ActivityFormData) {
  await db.insert(activities).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    date: data.date,
    metric: Number(data.metric),
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
