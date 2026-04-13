import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks';
import { Spacing, Shadows } from '@/constants';
import {
  ActivitiesIcon,
  CategoriesIcon,
  TargetsIcon,
  InsightsIcon,
  ProfileIcon,
} from '@/components/icons';

const ProfileButton = memo(function ProfileButton() {
  const router = useRouter();
  const theme = useAppTheme();
  const openProfile = useCallback(() => router.push('/profile'), [router]);

  return (
    <Pressable
      onPress={openProfile}
      style={styles.profileButton}
      accessibilityLabel="Open profile"
      accessibilityHint="View your account, logout, or delete profile"
      accessibilityRole="button"
    >
      <ProfileIcon size={26} color={theme.accentAction} />
    </Pressable>
  );
});

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
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerRight: () => <ProfileButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <ActivitiesIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Activities tab',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <CategoriesIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Categories tab',
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <TargetsIcon size={22} color={color} />,
          tabBarAccessibilityLabel: 'Goals tab',
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    marginRight: Spacing.lg,
  },
});
