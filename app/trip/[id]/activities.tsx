import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, useTrips, useTripScopedData } from '@/hooks';
import { SegmentedPills } from '@/components/forms';
import { TripInfoBar, TripHero } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { Spacing } from '@/constants';
import type { SegmentOption } from '@/components/forms';
import {
  ActivitiesSection,
  GoalsSection,
  PlacesSection,
  InsightsSection,
} from '@/components/trip-sections';

type Section = 'activities' | 'goals' | 'places' | 'insights';

const SECTION_OPTIONS: ReadonlyArray<SegmentOption<Section>> = [
  { label: 'Activities', value: 'activities' },
  { label: 'Goals', value: 'goals' },
  { label: 'Places', value: 'places' },
  // The "insights" route internally — surfaced to the user as "Summary" since
  // it now pairs charts + the AI travel guide, which reads more as a trip
  // recap than an analytics drill-down.
  { label: 'Summary', value: 'insights' },
];

/**
 * Trip detail screen — thin shell that composes the hero, info bar, segmented
 * control, and whichever section is currently selected. All section-specific
 * state lives inside the section components (`./_sections/`), keeping this
 * file focused on layout + routing concerns only.
 */
export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTripById } = useTrips();
  const theme = useAppTheme();

  const trip = findTripById(Number(id));
  const [section, setSection] = useState<Section>('activities');

  const { activities, targets, completedCount, totalMinutes } = useTripScopedData(Number(id));

  // router.back() pops the stack back to the screen that pushed us; Expo
  // Router keeps the tab screen mounted under this route, so the user lands
  // on the exact card/marker they tapped. Fallback to the tabs root if the
  // stack is empty (e.g. deep-linked straight in).
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!trip) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.screenBackground }]}
        edges={['top', 'bottom']}
      >
        <EmptyState title="Trip not found" message="This trip may have been deleted." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.screenBackground }]}
      edges={['bottom']}
    >
      {/* Hero stays full-bleed — ignores horizontal padding below. */}
      <TripHero
        trip={trip}
        completedCount={completedCount}
        totalCount={activities.length}
        onBack={handleBack}
      />

      {/* Plain View — no press-wrapper. Earlier revisions wrapped this
          region in a TouchableWithoutFeedback that dismissed the keyboard
          on empty-space taps, but Pressability's press-classification
          window captured those touches before the nested FlatLists could
          claim the pan gesture, producing the "scroll only works on
          cards" symptom. Keyboard dismissal is now handled by the
          section lists' `keyboardDismissMode="on-drag"`, which is the
          native iOS/Android pattern and doesn't intercept gestures. */}
      <View style={styles.content}>
        <TripInfoBar city={trip.destination} country={trip.country} />

        <SegmentedPills<Section>
          options={SECTION_OPTIONS}
          selected={section}
          onSelect={setSection}
          accessibilityLabel="Trip sections"
        />

        {section === 'activities' && <ActivitiesSection activities={activities} />}
        {section === 'goals' && <GoalsSection activities={activities} targets={targets} />}
        {section === 'places' && (
          <PlacesSection destination={trip.destination} country={trip.country} />
        )}
        {section === 'insights' && (
          <InsightsSection
            trip={trip}
            activities={activities}
            targets={targets}
            totalMinutes={totalMinutes}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
});
