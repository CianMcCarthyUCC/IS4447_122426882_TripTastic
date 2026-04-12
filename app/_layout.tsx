import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { AppProvider, useAuthContext } from '@/context';
import { Colors } from '@/constants';

/**
 * Root layout — wraps app in providers, then conditionally renders
 * auth screens or main app based on authentication state.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="activity/add" options={{ title: 'Add Activity' }} />
      <Stack.Screen name="activity/[id]" options={{ title: 'Activity' }} />
      <Stack.Screen name="activity/[id]/edit" options={{ title: 'Edit Activity' }} />
      <Stack.Screen name="category/add" options={{ title: 'Add Category' }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Category' }} />
      <Stack.Screen name="category/[id]/edit" options={{ title: 'Edit Category' }} />
      <Stack.Screen name="target/add" options={{ title: 'Add Target' }} />
      <Stack.Screen name="target/[id]" options={{ title: 'Target' }} />
      <Stack.Screen name="target/[id]/edit" options={{ title: 'Edit Target' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: Colors.screenBackground,
    flex: 1,
    justifyContent: 'center',
  },
});
