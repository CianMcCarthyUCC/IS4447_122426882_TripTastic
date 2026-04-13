import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useAuthContext } from '@/context';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * Root layout — wraps app in GestureHandlerRootView (required for swipe gestures)
 * and AppProvider. AuthGuard handles navigation based on auth state.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <AuthGuard />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const theme = useAppTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onAuthScreen = inAuthGroup && (segments[1] === 'login' || segments[1] === 'register');

    if (!isAuthenticated && !onAuthScreen) {
      // Not logged in and not already on login/register → go to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Logged in but still on auth screens → go to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.headerBackground },
        headerTintColor: theme.textOnHeader,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.screenBackground },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="activity/add" options={{ title: 'Log Activity' }} />
      <Stack.Screen name="activity/[id]" options={{ title: 'Activity' }} />
      <Stack.Screen name="activity/[id]/edit" options={{ title: 'Edit Activity' }} />
      <Stack.Screen name="category/add" options={{ title: 'Add Category' }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Category' }} />
      <Stack.Screen name="category/[id]/edit" options={{ title: 'Edit Category' }} />
      <Stack.Screen name="target/add" options={{ title: 'New Goal' }} />
      <Stack.Screen name="target/[id]" options={{ title: 'Goal' }} />
      <Stack.Screen name="target/[id]/edit" options={{ title: 'Edit Goal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
