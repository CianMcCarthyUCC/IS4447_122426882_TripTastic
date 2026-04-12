import { View, Text, ScrollView } from 'react-native';
import FormField from '@/components/forms/FormField';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import type { CategoryFormData } from '@/types';

type Props = {
  formData: CategoryFormData;
  onChangeField: (field: keyof CategoryFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  error?: string;
};

export default function CategoryForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  error,
}: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={SharedStyles.form}>
        <FormField
          label="Name"
          value={formData.name}
          onChangeText={(v) => onChangeField('name', v)}
          placeholder="e.g. Sightseeing"
          accessibilityLabel="Category name"
          accessibilityHint="Enter the category name"
        />
        <FormField
          label="Color (hex)"
          value={formData.color}
          onChangeText={(v) => onChangeField('color', v)}
          placeholder="e.g. #3B82F6"
          accessibilityLabel="Category color"
          accessibilityHint="Enter a hex color code"
        />
        <FormField
          label="Icon"
          value={formData.icon}
          onChangeText={(v) => onChangeField('icon', v)}
          placeholder="e.g. eye, restaurant, car"
          accessibilityLabel="Category icon name"
          accessibilityHint="Enter an icon name"
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
