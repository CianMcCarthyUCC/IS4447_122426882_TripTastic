import {
  suggestActivityFilter,
  suggestTripFilter,
  suggestTargetFilter,
} from '@/utils/filterSuggestions';
import type { Activity, Category, Target, Trip } from '@/types';

// Helper — a date string N days ago. The suggestion logic compares
// ISO-date prefixes, so we format to `YYYY-MM-DD` and never mutate.
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const cat = (id: number, name: string): Category => ({
  id,
  name,
  color: '#000000',
  icon: 'star',
});

const activity = (id: number, categoryId: number, date: string, metric: number): Activity => ({
  id,
  tripId: 1,
  categoryId,
  date,
  metric,
  status: 'completed',
  notes: null,
  isFavourite: false,
});

describe('suggestActivityFilter', () => {
  const categories = [cat(1, 'Food'), cat(2, 'Sightseeing'), cat(3, 'Transport')];

  it('suggests the dominant recent category when it clears the 40% threshold', () => {
    const activities = [
      activity(1, 1, daysAgo(1), 60),
      activity(2, 1, daysAgo(2), 60),
      activity(3, 2, daysAgo(3), 30),
    ];
    const result = suggestActivityFilter(activities, categories);
    expect(result).not.toBeNull();
    expect(result?.label).toBe('Focus: Food this week');
    expect(result?.apply).toEqual({ selectedCategory: '1', dateRange: 'week' });
  });

  it('returns null when there are no activities at all', () => {
    expect(suggestActivityFilter([], categories)).toBeNull();
  });

  it('returns null when no single category clears 40% of recent minutes', () => {
    // Three categories, deliberately balanced so the top one is ~35% — no
    // single category deserves the focus chip.
    const activities = [
      activity(1, 1, daysAgo(1), 35),
      activity(2, 2, daysAgo(2), 33),
      activity(3, 3, daysAgo(3), 32),
    ];
    expect(suggestActivityFilter(activities, categories)).toBeNull();
  });

  it('ignores activities older than 7 days', () => {
    const activities = [
      activity(1, 1, daysAgo(60), 1000), // old — should be ignored
      activity(2, 2, daysAgo(1), 10),
    ];
    const result = suggestActivityFilter(activities, categories);
    expect(result?.apply.selectedCategory).toBe('2');
  });
});

describe('suggestTripFilter', () => {
  const futureDate = (days: number): string =>
    new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const trip = (id: number, startDate: string, endDate: string): Trip => ({
    id,
    name: `Trip ${id}`,
    destination: 'Somewhere',
    country: 'IE',
    coverImage: null,
    startDate,
    endDate,
  });

  it('suggests "upcoming trips only" when at least one trip is in the future', () => {
    const trips = [trip(1, futureDate(5), futureDate(10))];
    const result = suggestTripFilter(trips);
    expect(result?.apply).toEqual({ status: 'upcoming' });
  });

  it('falls back to the dominant year when all trips are in the past', () => {
    // All end before today so the "upcoming" branch is skipped.
    const trips = [
      trip(1, '2024-01-01', '2024-01-05'),
      trip(2, '2024-06-01', '2024-06-05'),
      trip(3, '2024-09-01', '2024-09-10'),
    ];
    const result = suggestTripFilter(trips);
    expect(result?.apply).toEqual({ year: '2024' });
  });

  it('returns null when there are no trips', () => {
    expect(suggestTripFilter([])).toBeNull();
  });
});

describe('suggestTargetFilter', () => {
  const target = (id: number, categoryId: number, targetValue: number): Target => ({
    id,
    tripId: null,
    categoryId,
    targetValue,
    period: 'weekly',
  });

  it('suggests "in-progress" when at least one target is unmet', () => {
    const targets = [target(1, 1, 100)];
    const activities = [activity(1, 1, daysAgo(1), 30)];
    const result = suggestTargetFilter(targets, activities);
    expect(result?.apply).toEqual({ status: 'in-progress' });
  });

  it('returns null when every target has already been met', () => {
    const targets = [target(1, 1, 50)];
    const activities = [activity(1, 1, daysAgo(1), 60)];
    expect(suggestTargetFilter(targets, activities)).toBeNull();
  });

  it('returns null when there are no targets', () => {
    expect(suggestTargetFilter([], [])).toBeNull();
  });
});
