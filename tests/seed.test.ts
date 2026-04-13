const mockValues = jest.fn().mockResolvedValue(undefined);
const mockFrom = jest.fn();

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({ from: mockFrom })),
    insert: jest.fn(() => ({ values: mockValues })),
    run: jest.fn(),
  },
}));

jest.mock('drizzle-orm/sqlite-core', () => ({
  sqliteTable: (name: string, columns: any) => columns,
  integer: (name: string) => ({
    primaryKey: () => ({ autoIncrement: true }),
    notNull: () => ({ unique: () => ({}) }),
  }),
  text: (name: string) => ({
    notNull: () => ({ unique: () => ({}) }),
  }),
}));

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

    // 2 trips
    const tripInsert = mockValues.mock.calls[1][0];
    expect(tripInsert).toHaveLength(2);
    expect(tripInsert[0]).toHaveProperty('name', 'Summer in Italy');
    expect(tripInsert[1]).toHaveProperty('name', 'Weekend in Paris');

    // 14 activities
    const activitiesInsert = mockValues.mock.calls[2][0];
    expect(activitiesInsert).toHaveLength(14);

    // 4 targets
    const targetsInsert = mockValues.mock.calls[3][0];
    expect(targetsInsert).toHaveLength(4);
  });

  it('does not insert data when categories already exist', async () => {
    mockFrom.mockResolvedValue([{ id: 1, name: 'Existing', color: '#000', icon: 'star' }]);

    await seedDataIfEmpty();

    const { db } = require('@/db/client');
    expect(db.insert).not.toHaveBeenCalled();
  });
});
