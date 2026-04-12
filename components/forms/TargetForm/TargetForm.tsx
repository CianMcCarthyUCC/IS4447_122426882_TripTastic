import { View, Text, ScrollView } from 'react-native';
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
};

type ScopeValue = 'trip' | 'global';

const SCOPE_OPTIONS = [
  { label: 'Per Trip', value: 'trip' as ScopeValue },
  { label: 'Global', value: 'global' as ScopeValue },
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
}: Props) {
  const scopeValue: ScopeValue = formData.tripId === null ? 'global' : 'trip';

  const handleScopeChange = (val: ScopeValue) => {
    onChangeField('tripId', val === 'trip' ? 1 : null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={SharedStyles.form}>
        <CategoryPicker
          categories={categories}
          selectedId={formData.categoryId}
          onSelect={(id) => onChangeField('categoryId', id)}
        />

        <FormField
          label="Target Value (minutes)"
          value={formData.targetValue}
          onChangeText={(v) => onChangeField('targetValue', v)}
          placeholder="e.g. 300"
          keyboardType="numeric"
          accessibilityLabel="Target value in minutes"
          accessibilityHint="Enter the target number of minutes"
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

      <PrimaryButton label={submitLabel} onPress={onSubmit} />
      <View style={SharedStyles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    </ScrollView>
  );
}
