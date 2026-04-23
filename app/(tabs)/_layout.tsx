import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/hooks';
import { Shadows } from '@/constants';
import { TripsIcon, ExploreIcon, InsightsIcon, ProfileIcon } from '@/components/icons';

const TAB_ICON_SIZE = 26;

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
          borderTopWidth: StyleSheet.hairlineWidth,
          // Taller, airier bar. iOS needs more bottom padding for the home-indicator inset.
          height: Platform.OS === 'ios' ? 86 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          ...Shadows.sm,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: 4,
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
          // Hide the nav bar on the Trips screen so the screen background
          // flows edge-to-edge into the status area and the in-page "My
          // Trips" heading acts as the visual header. A floating theme
          // toggle sits top-right of the content itself.
          headerShown: false,
          tabBarIcon: ({ color }) => <TripsIcon size={TAB_ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: 'Trips tab',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color }) => <ExploreIcon size={TAB_ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: 'Explore tab',
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          headerShown: false,
          tabBarIcon: ({ color }) => <InsightsIcon size={TAB_ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: 'Insights tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          // Route file stays `profile.tsx` (stable URL), but user-facing
          // surfaces say "Account" - feels more appropriate once the screen
          // covers name, home city, theme, notifications, and sign-out.
          title: 'Account',
          headerShown: false,
          tabBarIcon: ({ color }) => <ProfileIcon size={TAB_ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: 'Account tab',
        }}
      />
    </Tabs>
  );
}
