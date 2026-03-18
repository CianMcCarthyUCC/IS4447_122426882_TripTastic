import { Stack } from 'expo-router';
import { StudentProvider } from '@/context';

/**
 * Root layout — thin shell. All logic lives in StudentProvider.
 */
export default function RootLayout() {
  return (
    <StudentProvider>
      <Stack />
    </StudentProvider>
  );
}
