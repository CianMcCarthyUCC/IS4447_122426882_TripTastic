import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityContext } from '@/context/ActivityContext';
import { CategoryContext } from '@/context/CategoryContext';
import { TripContext } from '@/context/TripContext';

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({ from: jest.fn().mockResolvedValue([]) })),
    insert: jest.fn(() => ({ values: jest.fn() })),
    run: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));

jest.mock('@/hooks/useAppTheme', () => ({
  useAppTheme: () => ({
    screenBackground: '#F5F7FA', cardBackground: '#FFFFFF', cardBorder: '#E2E8F0',
    inputBorder: '#CBD5E1', textPrimary: '#0F172A', textSecondary: '#64748B',
    textLabel: '#334155', textButton: '#FFFFFF', textButtonSecondary: '#0A2463',
    accentAction: '#FE7D50', primaryAction: '#0A2463', dangerAction: '#DC2626',
    successAction: '#059669', tagBackground: '#DBEAFE', tagLabel: '#166AD2',
    tagValue: '#0A2463', headerBackground: '#0A2463', textOnHeader: '#FFFFFF',
    tabBarBackground: '#FFFFFF', tabBarBorder: '#E2E8F0', tabActive: '#FE7D50',
    tabInactive: '#94A3B8', overlay: 'rgba(0,0,0,0.5)', inputBackground: '#FFFFFF',
  }),
  ThemeContext: { Provider: ({ children }: any) => children },
  useThemeProvider: () => ({}),
  useThemeControl: () => ({ mode: 'light', isDark: false, setMode: jest.fn() }),
}));

jest.mock('@/hooks/useSavedFilters', () => ({
  useSavedFilters: () => ({ savedFilters: [], saveFilter: jest.fn(), removeFilter: jest.fn() }),
}));

jest.mock('@/hooks/useFilteredData', () => ({
  useFilteredActivities: (activities: any) => ({
    filtered: activities,
    searchQuery: '', selectedCategory: 'all', dateRange: 'all',
    setSearchQuery: jest.fn(), setSelectedCategory: jest.fn(), setDateRange: jest.fn(),
    resetFilters: jest.fn(), isFiltered: false, activeFilterCount: 0,
  }),
  useTextFilter: (items: any) => ({ filtered: items, searchQuery: '', setSearchQuery: jest.fn(), isFiltered: false }),
}));

jest.mock('@/utils/weatherApi', () => ({ getWeather: jest.fn().mockResolvedValue({ city: 'Rome', temp: 24, description: 'clear', icon: '', humidity: 50, windSpeed: 5 }) }));
jest.mock('@/utils/countriesApi', () => ({ getCountryInfo: jest.fn().mockResolvedValue({ name: 'Italy', capital: 'Rome', currency: 'Euro', language: 'Italian', timezone: 'CET', flag: '', population: 60000000 }) }));

import IndexScreen from '@/app/(tabs)/index';

const mockTrip = { id: 1, name: 'Summer in Italy', destination: 'Rome', country: 'Italy', coverImage: null, startDate: '2026-07-01', endDate: '2026-07-14' };
const mockActivity = { id: 1, tripId: 1, categoryId: 1, date: '2026-07-02', metric: 180, status: 'completed' as const, notes: 'Colosseum tour' };
const mockCategory = { id: 1, name: 'Sightseeing', color: '#3B82F6', icon: 'eye' };

describe('IndexScreen', () => {
  it('renders the seeded activity data on the list screen', () => {
    const { getByText, getAllByText } = render(
      <TripContext.Provider value={{ trips: [mockTrip], setTrips: jest.fn(), currentTrip: mockTrip, setCurrentTrip: jest.fn() }}>
        <CategoryContext.Provider value={{ categories: [mockCategory], setCategories: jest.fn() }}>
          <ActivityContext.Provider value={{ activities: [mockActivity], setActivities: jest.fn() }}>
            <IndexScreen />
          </ActivityContext.Provider>
        </CategoryContext.Provider>
      </TripContext.Provider>
    );

    expect(getByText('2026-07-02')).toBeTruthy();
    expect(getAllByText('Summer in Italy').length).toBeGreaterThan(0);
  });
});
