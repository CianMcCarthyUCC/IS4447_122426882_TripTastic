import { useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTrips, useAppTheme } from '@/hooks';

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectTrip, findTripById } = useTrips();
  const theme = useAppTheme();
  const trip = findTripById(Number(id));

  useEffect(() => {
    if (id) selectTrip(Number(id));
  }, [id, selectTrip]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activities" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
