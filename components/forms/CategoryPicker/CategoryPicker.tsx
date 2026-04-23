import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useCategories, useCategoryForm } from '@/hooks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { validateCategoryForm } from '@/utils/validation';
import { BorderRadius, Spacing } from '@/constants';
import type { DropdownOption } from '@/components/forms/Dropdown/Dropdown';
import type { Category } from '@/types';

type Props = {
  label?: string;
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
};

/**
 * The category selector used in the activity form. Opens a bottom sheet
 * with each category shown in its own colour, plus an inline option to
 * create a new category without leaving the form.
 */
export default function CategoryPicker({
  label = 'Category',
  categories,
  selectedId,
  onSelect,
}: Props) {
  const theme = useAppTheme();
  const { addCategory } = useCategories();
  const { formData, onChangeField, resetForm } = useCategoryForm();
  const [createOpen, setCreateOpen] = useState(false);

  const options = useMemo<DropdownOption[]>(
    () =>
      categories.map((c) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
        icon: c.icon as DropdownOption['icon'],
      })),
    [categories],
  );

  const handleCreate = useCallback(() => {
    resetForm();
    setCreateOpen(true);
  }, [resetForm]);

  const handleClose = useCallback(() => {
    setCreateOpen(false);
  }, []);

  // Local submit state - we deliberately don't use `useFormSubmit` here
  // because that hook calls `router.back()` on success, which would
  // dismiss the enclosing Log Activity sheet instead of just this
  // inner modal.
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const validationError = validateCategoryForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const newId = await addCategory(formData);
      onSelect(newId);
      setCreateOpen(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [addCategory, formData, onSelect]);

  return (
    <>
      <Dropdown
        label={label}
        helpText="What type of activity is this?"
        options={options}
        selected={String(selectedId)}
        onSelect={(v) => onSelect(Number(v))}
        placeholder="Choose a category"
        accessibilityLabel="Select a category"
        onCreate={handleCreate}
        createLabel="Create new category"
      />

      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={handleClose}>
          <View
            style={[styles.sheet, { backgroundColor: theme.cardBackground }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>New category</Text>
              <Pressable onPress={handleClose} accessibilityLabel="Close" hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <CategoryForm
                formData={formData}
                onChangeField={onChangeField}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                submitLabel="Save & select"
                loading={loading}
                error={error}
              />
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '88%',
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 5,
    marginBottom: Spacing.lg,
    width: 40,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
