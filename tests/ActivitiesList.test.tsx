import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityContext } from '@/context/ActivityContext';
import { CategoryContext } from '@/context/CategoryContext';
import IndexScreen from '@/app/(tabs)/index';

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockActivity = {
  id: 1,
  tripId: 1,
  categoryId: 1,
  date: '2026-07-02',
  metric: 180,
  notes: 'Colosseum tour',
};

const mockCategory = {
  id: 1,
  name: 'Sightseeing',
  color: '#3B82F6',
  icon: 'eye',
};

describe('IndexScreen', () => {
  it('renders the seeded activity and the add button', () => {
    const { getByText } = render(
      <CategoryContext.Provider value={{ categories: [mockCategory], setCategories: jest.fn() }}>
        <ActivityContext.Provider value={{ activities: [mockActivity], setActivities: jest.fn() }}>
          <IndexScreen />
        </ActivityContext.Provider>
      </CategoryContext.Provider>
    );

    expect(getByText('2026-07-02')).toBeTruthy();
    expect(getByText('Add Activity')).toBeTruthy();
  });
});
