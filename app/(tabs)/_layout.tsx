import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants';

const ProfileButton = memo(function ProfileButton() {
  const router = useRouter();
  const openProfile = useCallback(() => router.push('/profile'), [router]);

  return (
    <Pressable
      onPress={openProfile}
      style={styles.profileButton}
      accessibilityLabel="Open profile"
      accessibilityHint="View your account, logout, or delete profile"
      accessibilityRole="button"
    >
      <Ionicons name="person-circle-outline" size={28} color={Colors.primaryAction} />
    </Pressable>
  );
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryAction,
        headerRight: () => <ProfileButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} accessibilityElementsHidden />
          ),
          tabBarAccessibilityLabel: 'Activities tab',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} accessibilityElementsHidden />
          ),
          tabBarAccessibilityLabel: 'Categories tab',
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag" size={size} color={color} accessibilityElementsHidden />
          ),
          tabBarAccessibilityLabel: 'Targets tab',
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} accessibilityElementsHidden />
          ),
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
