import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareForm } from '@/components/layout/KeyboardAwareForm';
import FormField from '@/components/forms/FormField';
import { DateField } from '@/components/forms/DateField';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import { PrimaryButton } from '@/components/buttons';
import { BorderRadius, SharedStyles, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { validateActivityFields } from '@/utils/validation';
import type { ActivityFieldErrors } from '@/utils/validation';
import type { ActivityFormData, ActivityStatus, Category } from '@/types';

type Props = {
  formData: ActivityFormData;
  onChangeField: (field: keyof ActivityFormData, value: string | number) => void;
  /** Called only when per-field validation passes - caller handles async save. */
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  categories: Category[];
  /** Form-level submit error (e.g. "Something went wrong"). */
  error?: string;
  loading?: boolean;
  /** Optional - when provided, shows a "Pick a place" button that opens the POI picker. */
  onPickPlace?: () => void;
  /** When true, the trip has already ended - lock status to Completed. */
  isPastTrip?: boolean;
};

const STATUS_OPTIONS = [
  { label: 'Planned', value: 'planned', icon: 'calendar-outline' as const },
  { label: 'Completed', value: 'completed', icon: 'checkmark-circle-outline' as const },
];
const COMPLETED_ONLY_OPTIONS = STATUS_OPTIONS.filter((o) => o.value === 'completed');

// Which wizard step each validation error lives on. Used to snap the
// user back to the step containing the first missing field when they
// hit Save on step 2 without having filled step 1 out fully.
const STEP_OF_FIELD: Record<keyof ActivityFieldErrors, 1 | 2> = {
  place: 1,
  categoryId: 1,
  date: 2,
  metric: 2,
};

/**
 * The two-step Log Activity form. The first step asks what the user did,
 * where and in which category; the second step covers the date, how long
 * it took and any notes. Errors appear inline, and the user is brought
 * back to the right step if anything on the first step is missing.
 */
export default function ActivityForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  categories,
  error,
  loading = false,
  onPickPlace,
  isPastTrip = false,
}: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();
  const [step, setStep] = useState<1 | 2>(1);
  const [fieldErrors, setFieldErrors] = useState<ActivityFieldErrors>({});

  const isPlanned = formData.status === 'planned';

  // Clearing an error as soon as the user edits the offending field is
  // a small but important UX beat - it validates "fix as you go" instead
  // of leaving the red text hanging until the next submit attempt.
  const onChange = useCallback(
    (field: keyof ActivityFormData, value: string | number) => {
      onChangeField(field, value);
      if (field in fieldErrors) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof ActivityFieldErrors];
          return next;
        });
      }
    },
    [onChangeField, fieldErrors],
  );

  const handleNext = useCallback(() => {
    // Only block on step-1 fields so the user isn't forced through a
    // full-form validation until Save. Still nudges them if they somehow
    // advance without category (e.g. Dropdown never touched).
    const errs = validateActivityFields(formData);
    const stepOneErrs: ActivityFieldErrors = {};
    if (errs.place) stepOneErrs.place = errs.place;
    if (errs.categoryId) stepOneErrs.categoryId = errs.categoryId;
    if (Object.keys(stepOneErrs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...stepOneErrs }));
      haptics.error();
      return;
    }
    setStep(2);
  }, [formData, haptics]);

  const handleSave = useCallback(() => {
    const errs = validateActivityFields(formData);
    setFieldErrors(errs);
    const keys = Object.keys(errs) as (keyof ActivityFieldErrors)[];
    if (keys.length > 0) {
      haptics.error();
      // Jump to the first step that contains a missing field so the
      // user sees the red helper text without hunting across steps.
      const firstErrorField = keys[0];
      const targetStep = STEP_OF_FIELD[firstErrorField];
      if (targetStep !== step) setStep(targetStep);
      return;
    }
    onSubmit();
  }, [formData, haptics, onSubmit, step]);

  const categoryError = fieldErrors.categoryId;
  const dateError = fieldErrors.date;
  const metricError = fieldErrors.metric;
  const placeError = fieldErrors.place;

  const pickedPlace = formData.place.trim();

  const stepIndicator = useMemo(
    () => (
      <View style={styles.stepperRow}>
        <View style={styles.stepDots}>
          <View
            style={[
              styles.stepDot,
              { backgroundColor: step === 1 ? theme.accentAction : theme.cardBorder },
            ]}
          />
          <View
            style={[
              styles.stepDot,
              { backgroundColor: step === 2 ? theme.accentAction : theme.cardBorder },
            ]}
          />
        </View>
        <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
          Step {step} of 2 - {step === 1 ? 'What & where' : 'When & how long'}
        </Text>
      </View>
    ),
    [step, theme.accentAction, theme.cardBorder, theme.textSecondary],
  );

  return (
    <KeyboardAwareForm>
      {stepIndicator}

      {step === 1 ? (
        <View style={SharedStyles.form}>
          <Dropdown
            label="Status"
            helpText={
              isPastTrip
                ? 'This trip has ended - activities are logged as completed.'
                : 'Is this activity planned or already done?'
            }
            options={isPastTrip ? COMPLETED_ONLY_OPTIONS : STATUS_OPTIONS}
            selected={formData.status}
            onSelect={(v) => onChange('status', v as ActivityStatus)}
            accessibilityLabel="Activity status"
          />

          <FormField
            label="Place"
            helpText={
              isPlanned
                ? 'Where are you going? Pick one nearby or just type it.'
                : 'Where did this happen? Pick one nearby or just type it.'
            }
            value={formData.place}
            onChangeText={(v) => onChange('place', v)}
            placeholder="e.g. Colosseum"
            error={placeError}
            accessibilityLabel="Place"
          />

          {onPickPlace ? (
            <View style={styles.pickPlaceRow}>
              <PrimaryButton
                label={pickedPlace ? 'Change place' : 'Pick from nearby'}
                variant="secondary"
                compact
                onPress={onPickPlace}
                accessibilityLabel="Pick a place from nearby points of interest"
              />
              {pickedPlace ? (
                <Text style={[styles.pickedHint, { color: theme.textSecondary }]} numberOfLines={1}>
                  Selected: {pickedPlace}
                </Text>
              ) : null}
            </View>
          ) : null}

          <CategoryPicker
            categories={categories}
            selectedId={formData.categoryId}
            onSelect={(id) => onChange('categoryId', id)}
          />
          {categoryError ? (
            <Text style={[styles.inlineError, { color: theme.dangerAction }]}>
              {categoryError}
            </Text>
          ) : null}

          <View style={styles.navRow}>
            <View style={styles.navSide}>
              <PrimaryButton
                label="Cancel"
                variant="secondary"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
            <View style={styles.navSide}>
              <PrimaryButton
                label="Next"
                variant="accent"
                onPress={handleNext}
                accessibilityLabel="Continue to when and how long"
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={SharedStyles.form}>
          <DateField
            label={isPlanned ? 'Planned date' : 'Date'}
            value={formData.date}
            onChange={(date) => onChange('date', date)}
            accessibilityLabel="Activity date"
            accessibilityHint="Select the activity date"
          />
          {dateError ? (
            <Text style={[styles.inlineError, { color: theme.dangerAction }]}>
              {dateError}
            </Text>
          ) : null}

          <FormField
            label="Duration (minutes)"
            helpText={
              isPlanned
                ? 'Roughly how long do you expect this to take? (e.g. a 2-hour tour = 120)'
                : 'How long did you spend on this? (e.g. a 2-hour tour = 120)'
            }
            value={formData.metric}
            onChangeText={(v) => onChange('metric', v)}
            placeholder="e.g. 120"
            keyboardType="numeric"
            error={metricError}
            accessibilityLabel="Duration in minutes"
          />

          <FormField
            label="Notes"
            helpText={
              isPlanned
                ? 'Optional - anything to remember about this one?'
                : 'Optional - how did it go?'
            }
            value={formData.notes}
            onChangeText={(v) => onChange('notes', v)}
            placeholder={isPlanned ? 'e.g. Book tickets ahead' : 'e.g. Guided tour was great'}
            accessibilityLabel="Activity notes"
          />

          {error ? (
            <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text>
          ) : null}

          {/* Summary chip - tiny recap of step-1 choices so the user
              doesn't need to step back just to double-check what they
              picked before committing. */}
          <View style={[styles.summaryChip, { borderColor: theme.cardBorder, backgroundColor: theme.tagBackground }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={2}>
              {pickedPlace ? `${pickedPlace} · ` : ''}
              {STATUS_OPTIONS.find((o) => o.value === formData.status)?.label}
              {categories.find((c) => c.id === formData.categoryId)
                ? ` · ${categories.find((c) => c.id === formData.categoryId)?.name}`
                : ''}
            </Text>
          </View>

          <View style={styles.navRow}>
            <View style={styles.navSide}>
              <PrimaryButton
                label="Back"
                variant="secondary"
                onPress={() => setStep(1)}
                disabled={loading}
                accessibilityLabel="Back to what and where"
              />
            </View>
            <View style={styles.navSide}>
              <PrimaryButton
                label={submitLabel}
                variant="accent"
                onPress={handleSave}
                loading={loading}
              />
            </View>
          </View>
        </View>
      )}
    </KeyboardAwareForm>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepDot: {
    borderRadius: BorderRadius.pill,
    height: 8,
    width: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pickPlaceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pickedHint: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inlineError: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  navSide: {
    flex: 1,
  },
  summaryChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
