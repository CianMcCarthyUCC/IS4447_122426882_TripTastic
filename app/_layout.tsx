import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useAuthContext } from '@/context';
import { useAppTheme, useThemeProvider, ThemeContext } from '@/hooks/useAppTheme';
import { GlobalToast } from '@/components/feedback';

export default function RootLayout() {
  const themeCtx = useThemeProvider();

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeContext.Provider value={themeCtx}>
        <AppProvider>
          <AuthGuard />
          <GlobalToast />
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
        headerShown: false,
        contentStyle: { backgroundColor: theme.screenBackground },
      }}
    >
      {/* Add-entity routes present as transparent modals over the previous
          route, so they override the stack-level opaque background. */}
      <Stack.Screen
        name="trip/add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="activity/add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="category/add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="target/add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="place-picker" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
