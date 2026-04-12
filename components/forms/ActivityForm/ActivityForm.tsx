import { View, Text, ScrollView } from 'react-native';
import FormField from '@/components/forms/FormField';
import { DateField } from '@/components/forms/DateField';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import type { ActivityFormData, Category } from '@/types';

type Props = {
  formData: ActivityFormData;
  onChangeField: (field: keyof ActivityFormData, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  categories: Category[];
  error?: string;
};

/**
 * Activity form — composes reusable DateField, FormField, and CategoryPicker.
 * Wrapped in ScrollView so fields are reachable on smaller screens.
 * Validation is handled by the parent screen before calling onSubmit.
 */
export default function ActivityForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  categories,
  error,
}: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={SharedStyles.form}>
        <DateField
          label="Date"
          value={formData.date}
          onChange={(date) => onChangeField('date', date)}
          accessibilityLabel="Activity date"
          accessibilityHint="Select the activity date"
        />

        <FormField
          label="Duration (minutes)"
          value={formData.metric}
          onChangeText={(v) => onChangeField('metric', v)}
          placeholder="e.g. 120"
          keyboardType="numeric"
          accessibilityLabel="Duration in minutes"
          accessibilityHint="Enter the activity duration"
        />

        <FormField
          label="Notes"
          value={formData.notes}
          onChangeText={(v) => onChangeField('notes', v)}
          placeholder="Optional notes"
          accessibilityLabel="Activity notes"
          accessibilityHint="Enter optional notes"
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

      <PrimaryButton label={submitLabel} onPress={onSubmit} />
      <View style={SharedStyles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    </ScrollView>
  );
}
