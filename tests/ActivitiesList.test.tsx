import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ActivityContext } from '@/context/ActivityContext';
import { CategoryContext } from '@/context/CategoryContext';
import { TripContext } from '@/context/TripContext';
import { TargetContext } from '@/context/TargetContext';

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
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
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

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

import IndexScreen from '@/app/(tabs)/index';

const mockTrip = { id: 1, name: 'Summer in Italy', destination: 'Rome', country: 'Italy', coverImage: null, startDate: '2026-07-01', endDate: '2026-07-14' };
const mockActivity = { id: 1, tripId: 1, categoryId: 1, date: '2026-07-02', metric: 180, status: 'completed' as const, place: 'Colosseum', notes: 'Guided tour', isFavourite: false, favouritedAt: null };
const mockCategory = { id: 1, name: 'Sightseeing', color: '#3B82F6', icon: 'eye', isSystem: false };

describe('Trips Screen', () => {
  it('renders the seeded trip on the home screen', async () => {
    const { getAllByText } = render(
      <TripContext.Provider value={{ trips: [mockTrip], setTrips: jest.fn(), currentTrip: mockTrip, setCurrentTrip: jest.fn() }}>
        <CategoryContext.Provider value={{ categories: [mockCategory], setCategories: jest.fn() }}>
          <ActivityContext.Provider value={{ activities: [mockActivity], setActivities: jest.fn() }}>
            <TargetContext.Provider value={{ targets: [], setTargets: jest.fn() }}>
              <IndexScreen />
            </TargetContext.Provider>
          </ActivityContext.Provider>
        </CategoryContext.Provider>
      </TripContext.Provider>
    );

    // Flush pending async state updates (e.g. @expo/vector-icons font loader)
    // so React doesn't warn about updates not wrapped in act(...).
    await act(async () => {});

    expect(getAllByText('Summer in Italy').length).toBeGreaterThan(0);
    expect(getAllByText('Planned Trips').length).toBeGreaterThan(0);
  });
});
