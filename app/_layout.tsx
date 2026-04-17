import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useAuthContext } from '@/context';
import { useAppTheme, useThemeProvider, ThemeContext } from '@/hooks/useAppTheme';

export default function RootLayout() {
  const themeCtx = useThemeProvider();

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeContext.Provider value={themeCtx}>
        <AppProvider>
          <AuthGuard />
        </AppProvider>
      </ThemeContext.Provider>
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
    if (!isAuthenticated && !onAuthScreen) router.replace('/(auth)/login');
    else if (isAuthenticated && inAuthGroup) router.replace('/(tabs)');
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
      <Stack.Screen name="trip/add" options={{ title: 'New Trip', headerBackTitle: 'Back' }} />
      <Stack.Screen name="trip/[id]" options={{ title: 'Trip', headerBackTitle: 'Trips' }} />
      <Stack.Screen name="activity/add" options={{ title: 'Log Activity', headerBackTitle: 'Back' }} />
      <Stack.Screen name="activity/[id]" options={{ title: 'Activity', headerBackTitle: 'Back' }} />
      <Stack.Screen name="activity/[id]/edit" options={{ title: 'Edit Activity', headerBackTitle: 'Back' }} />
      <Stack.Screen name="category/add" options={{ title: 'Add Category', headerBackTitle: 'Back' }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Category', headerBackTitle: 'Back' }} />
      <Stack.Screen name="category/[id]/edit" options={{ title: 'Edit Category', headerBackTitle: 'Back' }} />
      <Stack.Screen name="target/add" options={{ title: 'New Goal', headerBackTitle: 'Back' }} />
      <Stack.Screen name="target/[id]" options={{ title: 'Goal', headerBackTitle: 'Back' }} />
      <Stack.Screen name="target/[id]/edit" options={{ title: 'Edit Goal', headerBackTitle: 'Back' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
