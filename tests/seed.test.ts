const mockValues = jest.fn().mockResolvedValue(undefined);
const mockFrom = jest.fn();

// `db.transaction` hands the seed a tx-scoped client. In this mock we just
// pass `db` itself through so the existing `insert`/`select` spies keep
// working — the seed code's behaviour is identical whether it's talking to
// `db` or a real transaction object.
jest.mock('@/db/client', () => {
  const db: any = {
    select: jest.fn(() => ({ from: mockFrom })),
    insert: jest.fn(() => ({ values: mockValues })),
    run: jest.fn(),
  };
  db.transaction = jest.fn(async (cb: (tx: any) => Promise<void>) => cb(db));
  return { db };
});

// Minimal column stub that chains every builder method the schema uses
// (`.notNull()`, `.unique()`, `.primaryKey()`, `.references()`, `.default()`).
// Each method returns the same stub so chains of any depth work. The actual
// values aren't meaningful for the seed test — it only cares that the
// column objects exist so `sqliteTable` can return its columns map.
jest.mock('drizzle-orm/sqlite-core', () => {
  const makeColumn = (): any => {
    const col: any = {};
    const chain = () => col;
    col.primaryKey = chain;
    col.notNull = chain;
    col.unique = chain;
    col.references = chain;
    col.default = chain;
    col.$defaultFn = chain;
    return col;
  };
  return {
    // `sqliteTable(name, columns)` and `sqliteTable(name, columns, extraFn)`
    // both collapse to just the columns map here — indexes/foreign keys
    // aren't exercised by the seed path.
    sqliteTable: (_name: string, columns: any) => columns,
    integer: () => makeColumn(),
    text: () => makeColumn(),
    // `index('name').on(col)` returns an opaque object; the seed never
    // touches it, but the table-options callback needs the call to succeed.
    index: () => ({ on: () => ({}) }),
  };
});

import { seedDataIfEmpty } from '@/db/seed';

describe('seedDataIfEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
  });

  it('inserts sample data into all core tables when database is empty', async () => {
    mockFrom.mockResolvedValue([]);

    await seedDataIfEmpty();

    const { db } = require('@/db/client');
    // categories, trip, activities, targets = 4 core inserts
    expect(db.insert).toHaveBeenCalled();

    // 5 categories
    const categoriesInsert = mockValues.mock.calls[0][0];
    expect(categoriesInsert).toHaveLength(5);
    expect(categoriesInsert[0]).toHaveProperty('name', 'Sightseeing');
    expect(categoriesInsert[4]).toHaveProperty('name', 'Shopping');

    // 4 trips — two upcoming/planned (Italy, Paris) + two past (Tokyo, NY)
    // that power the Previous Trips rail on the Trips tab.
    const tripInsert = mockValues.mock.calls[1][0];
    expect(tripInsert).toHaveLength(4);
    expect(tripInsert[0]).toHaveProperty('name', 'Summer in Italy');
    expect(tripInsert[1]).toHaveProperty('name', 'Weekend in Paris');
    expect(tripInsert[2]).toHaveProperty('name', 'Autumn in Japan');
    expect(tripInsert[3]).toHaveProperty('name', 'New York City Break');

    // 44 activities — 14 Italy + 9 Paris + 11 Tokyo + 10 NY. This count
    // tracks the seed, so bump it deliberately when seed data grows; a
    // stale number means the seed changed without thought.
    const activitiesInsert = mockValues.mock.calls[2][0];
    expect(activitiesInsert).toHaveLength(44);

    // One favourite per trip (pre-seeded so the Priority marker is
    // visible out of the box on every trip). Counting them guards against
    // accidentally starring two activities inside the same trip.
    const favouriteCount = activitiesInsert.filter((a: { isFavourite?: boolean }) => a.isFavourite).length;
    expect(favouriteCount).toBe(4);

    // 6 targets — four for Italy/global, two for Paris.
    const targetsInsert = mockValues.mock.calls[3][0];
    expect(targetsInsert).toHaveLength(6);
  });

  it('does not insert data when categories already exist', async () => {
    mockFrom.mockResolvedValue([{ id: 1, name: 'Existing', color: '#000', icon: 'star' }]);

    await seedDataIfEmpty();

    const { db } = require('@/db/client');
    expect(db.insert).not.toHaveBeenCalled();
  });
});
