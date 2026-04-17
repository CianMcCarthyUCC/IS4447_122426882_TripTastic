import { Tabs } from 'expo-router';
import { useAppTheme } from '@/hooks';
import { Shadows } from '@/constants';
import { TripsIcon, ExploreIcon, InsightsIcon, ProfileIcon } from '@/components/icons';

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: theme.headerBackground,
          ...Shadows.md,
        },
        headerTintColor: theme.textOnHeader,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <TripsIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Trips tab',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <ExploreIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Explore tab',
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <InsightsIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Insights tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}
