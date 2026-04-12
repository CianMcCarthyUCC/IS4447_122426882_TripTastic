import { Stack } from 'expo-router';
import { AppProvider } from '@/context';

/**
 * Root layout — thin shell. All logic lives in AppProvider.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <Stack />
    </AppProvider>
  );
}
