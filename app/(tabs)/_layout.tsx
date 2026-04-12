import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryAction,
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
    </Tabs>
  );
}
