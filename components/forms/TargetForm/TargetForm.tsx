import { View, Text } from 'react-native';
import { KeyboardAwareForm } from '@/components/layout/KeyboardAwareForm';
import FormField from '@/components/forms/FormField';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { PeriodPicker } from '@/components/forms/PeriodPicker';
import PillToggle from '@/components/forms/PillToggle/PillToggle';
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

type ScopeValue = 'trip' | 'global';

const SCOPE_OPTIONS = [
  { label: 'This Trip Only', value: 'trip' as ScopeValue },
  { label: 'All Trips', value: 'global' as ScopeValue },
];

/**
 * Target form — composes CategoryPicker, PeriodPicker, PillToggle, and FormField.
 * Validation is handled by the parent screen.
 */
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
  const scopeValue: ScopeValue = formData.tripId === null ? 'global' : 'trip';

  const handleScopeChange = (val: ScopeValue) => {
    onChangeField('tripId', val === 'trip' ? 1 : null);
  };

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

        <PillToggle
          label="Scope"
          options={SCOPE_OPTIONS}
          selected={scopeValue}
          onSelect={handleScopeChange}
          accessibilityLabel="Select target scope"
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
