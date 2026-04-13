import { View, Text } from 'react-native';
import { KeyboardAwareForm } from '@/components/layout/KeyboardAwareForm';
import FormField from '@/components/forms/FormField';
import { DateField } from '@/components/forms/DateField';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import type { ActivityFormData, ActivityStatus, Category } from '@/types';

type Props = {
  formData: ActivityFormData;
  onChangeField: (field: keyof ActivityFormData, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  categories: Category[];
  error?: string;
  loading?: boolean;
};

const STATUS_OPTIONS = [
  { label: 'Planned', value: 'planned', icon: 'calendar-outline' as const },
  { label: 'Completed', value: 'completed', icon: 'checkmark-circle-outline' as const },
];

export default function ActivityForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  categories,
  error,
  loading = false,
}: Props) {
  const isIncomplete = !formData.date || !formData.metric || !formData.categoryId;

  return (
    <KeyboardAwareForm>
      <View style={SharedStyles.form}>
        <Dropdown
          label="Status"
          helpText="Is this activity planned or already done?"
          options={STATUS_OPTIONS}
          selected={formData.status}
          onSelect={(v) => onChangeField('status', v as ActivityStatus)}
          accessibilityLabel="Activity status"
        />

        <DateField
          label="Date"
          value={formData.date}
          onChange={(date) => onChangeField('date', date)}
          accessibilityLabel="Activity date"
          accessibilityHint="Select the activity date"
        />

        <FormField
          label="Duration (minutes)"
          helpText="How long did you spend on this? (e.g. a 2-hour tour = 120)"
          value={formData.metric}
          onChangeText={(v) => onChangeField('metric', v)}
          placeholder="e.g. 120"
          keyboardType="numeric"
          accessibilityLabel="Duration in minutes"
        />

        <FormField
          label="Notes"
          helpText="Optional — where did you go? What did you enjoy?"
          value={formData.notes}
          onChangeText={(v) => onChangeField('notes', v)}
          placeholder="e.g. Visited the Colosseum"
          accessibilityLabel="Activity notes"
        />

        <CategoryPicker
          categories={categories}
          selectedId={formData.categoryId}
          onSelect={(id) => onChangeField('categoryId', id)}
        />
      </View>

      {error ? (
        <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text>
      ) : null}

      <PrimaryButton label={submitLabel} onPress={onSubmit} loading={loading} disabled={isIncomplete} />
      <View style={SharedStyles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} disabled={loading} />
      </View>
    </KeyboardAwareForm>
  );
}
