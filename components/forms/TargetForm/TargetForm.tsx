import { View, Text } from 'react-native';
import { KeyboardAwareForm } from '@/components/layout/KeyboardAwareForm';
import FormField from '@/components/forms/FormField';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { PeriodPicker } from '@/components/forms/PeriodPicker';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import type { TargetFormData, TargetPeriod, Category } from '@/types';

type Props = {
  formData: TargetFormData;
  onChangeField: (field: keyof TargetFormData, value: string | number | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  categories: Category[];
  error?: string;
  loading?: boolean;
};

const SCOPE_OPTIONS = [
  { label: 'This Trip Only', value: 'trip', icon: 'airplane' as const },
  { label: 'All Trips', value: 'global', icon: 'globe-outline' as const },
];

export default function TargetForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  categories,
  error,
  loading = false,
}: Props) {
  const scopeValue = formData.tripId === null ? 'global' : 'trip';

  return (
    <KeyboardAwareForm>
      <View style={SharedStyles.form}>
        <CategoryPicker
          categories={categories}
          selectedId={formData.categoryId}
          onSelect={(id) => onChangeField('categoryId', id)}
        />

        <FormField
          label="Goal (minutes)"
          helpText="e.g. 300 min of sightseeing per week on your trip"
          value={formData.targetValue}
          onChangeText={(v) => onChangeField('targetValue', v)}
          placeholder="e.g. 300"
          keyboardType="numeric"
          accessibilityLabel="Goal value in minutes"
        />

        <PeriodPicker
          selectedPeriod={formData.period}
          onSelect={(p: TargetPeriod) => onChangeField('period', p)}
        />

        <Dropdown
          label="Scope"
          helpText="Apply to one trip or across all your trips?"
          options={SCOPE_OPTIONS}
          selected={scopeValue}
          onSelect={(v) => onChangeField('tripId', v === 'trip' ? 1 : null)}
          accessibilityLabel="Select goal scope"
        />

        <FormField
          label="Notes"
          helpText="Optional - a quick reminder of why this goal matters."
          value={formData.notes}
          onChangeText={(v) => onChangeField('notes', v)}
          placeholder="e.g. Make the most of the museum pass"
          accessibilityLabel="Notes about this goal"
        />
      </View>

      {error ? (
        <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text>
      ) : null}

      <PrimaryButton label={submitLabel} onPress={onSubmit} loading={loading} disabled={!formData.categoryId || !formData.targetValue} />
      <View style={SharedStyles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} disabled={loading} />
      </View>
    </KeyboardAwareForm>
  );
}
