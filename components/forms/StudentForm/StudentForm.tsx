import { View } from 'react-native';
import FormField from '@/components/forms/FormField';
import { PrimaryButton } from '@/components/buttons';
import { SharedStyles } from '@/constants';
import type { StudentFormData } from '@/types';

type Props = {
  formData: StudentFormData;
  onChangeField: (field: keyof StudentFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
};

export default function StudentForm({
  formData,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  return (
    <>
      <View style={SharedStyles.form}>
        <FormField label="Name" value={formData.name} onChangeText={(v) => onChangeField('name', v)} />
        <FormField label="Major" value={formData.major} onChangeText={(v) => onChangeField('major', v)} />
        <FormField label="Year" value={formData.year} onChangeText={(v) => onChangeField('year', v)} />
      </View>

      <PrimaryButton label={submitLabel} onPress={onSubmit} />
      <View style={SharedStyles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    </>
  );
}
