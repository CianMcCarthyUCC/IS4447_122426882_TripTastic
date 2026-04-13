import { View, Text } from 'react-native';
import FormField from '@/components/forms/FormField';
import { ColorPicker } from '@/components/forms/ColorPicker';
import { IconPicker } from '@/components/forms/IconPicker';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import { KeyboardAwareForm } from '@/components/layout/KeyboardAwareForm';
import type { CategoryFormData } from '@/types';

type Props = {
  formData: CategoryFormData;
  onChangeField: (field: keyof CategoryFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  error?: string;
  loading?: boolean;
};

export default function CategoryForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  error,
  loading = false,
}: Props) {
  const isIncomplete = !formData.name.trim();

  return (
    <KeyboardAwareForm>
      <View style={SharedStyles.form}>
        <FormField
          label="Name"
          value={formData.name}
          onChangeText={(v) => onChangeField('name', v)}
          placeholder="e.g. Sightseeing"
          accessibilityLabel="Category name"
          accessibilityHint="Enter the category name"
        />

        <ColorPicker
          selectedColor={formData.color}
          onSelect={(color) => onChangeField('color', color)}
        />

        <IconPicker
          selectedIcon={formData.icon}
          accentColor={formData.color}
          onSelect={(icon) => onChangeField('icon', icon)}
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
