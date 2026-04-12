import { eq } from 'drizzle-orm';
import { db } from './client';
import { categories, activities } from './schema';
import type { CategoryFormData, ActivityFormData } from '@/types';

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
