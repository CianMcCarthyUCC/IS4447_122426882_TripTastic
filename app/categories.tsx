import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useCategories,
  useActivities,
  useTargets,
  useToast,
  useHaptics,
  useAppTheme,
} from '@/hooks';
import { PressableOpacity } from '@/components/buttons';
import { CategoryIcon } from '@/components/cards';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenContainer, PageHeader, DecorativeCircles } from '@/components/layout';
import { Spacing } from '@/constants';
import type { Category } from '@/types';

/**
 * Screen for managing the app's category list. Shows each category as a
 * flat row (matching the Settings look) with edit and delete actions, plus
 * an "Add category" row at the bottom. Editing reuses the existing
 * /category/[id]/edit screen so the icon + colour picker stays one source
 * of truth.
 */
export default function CategoriesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { toast, showToast, hideToast } = useToast();
  const { categories, deleteCategory } = useCategories();
  const { refreshActivities } = useActivities();
  const { refreshTargets } = useTargets();

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    router.push({ pathname: '/category/[id]/edit', params: { id: category.id.toString() } });
  };

  const handleAdd = () => router.push('/category/add');

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteCategory(target.id);
      // Activities + goals that referenced this category were reassigned
      // to the Unspecified fallback inside the same transaction; re-pull
      // both caches so any screen still mounted reflects the new category.
      await Promise.all([refreshActivities(), refreshTargets()]);
      haptics.success();
      showToast(`Deleted "${target.name}", items moved to Unspecified`, 'success');
    } catch {
      haptics.error();
      showToast('Failed to delete category', 'error');
    }
  };

  return (
    <ScreenContainer>
      <DecorativeCircles opacity={0.06} />
      <Toast {...toast} onHide={hideToast} />
      <PageHeader title="Categories" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Your Categories
        </Text>

        {categories.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            No categories yet. Add one to get started.
          </Text>
        ) : (
          categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onEdit={() => handleEdit(category)}
              onDelete={() => {
                haptics.warning();
                setPendingDelete(category);
              }}
            />
          ))
        )}

        <PressableOpacity
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add new category"
          style={[styles.rowWrap, { borderBottomColor: theme.cardBorder }]}
        >
          <View style={styles.row}>
            <View style={[styles.iconBubble, { backgroundColor: theme.tagBackground }]}>
              <Ionicons name="add" size={20} color={theme.accentAction} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Add category</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Create a new category with its own icon and colour
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </View>
        </PressableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete category?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed. Any activities and goals that used it will move to Unspecified.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </ScreenContainer>
  );
}

type CategoryRowProps = {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
};

function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const theme = useAppTheme();
  const locked = category.isSystem;

  if (locked) {
    // System row: no press handler, no edit/delete icons, lock glyph + hint
    // so it's visually obvious this category is the fallback and can't be
    // modified. Still selectable by screen readers for context.
    return (
      <View
        style={[styles.rowWrap, styles.rowLocked, { borderBottomColor: theme.cardBorder }]}
        accessibilityRole="text"
        accessibilityLabel={`${category.name}, locked system category`}
      >
        <View style={styles.row}>
          <CategoryIcon category={category} size={32} variant="bubble" />
          <View style={styles.textCol}>
            <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
              {category.name}
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Fallback for activities without a category
            </Text>
          </View>
          <View style={styles.actionIcon}>
            <Ionicons name="lock-closed" size={18} color={theme.textSecondary} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <PressableOpacity
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${category.name}`}
      style={[styles.rowWrap, { borderBottomColor: theme.cardBorder }]}
    >
      <View style={styles.row}>
        <CategoryIcon category={category} size={32} variant="bubble" />
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
        <PressableOpacity
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${category.name}`}
          style={styles.actionIcon}
        >
          <Ionicons name="create-outline" size={20} color={theme.textPrimary} />
        </PressableOpacity>
        <PressableOpacity
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${category.name}`}
          style={styles.actionIcon}
        >
          <Ionicons name="trash-outline" size={20} color={theme.dangerAction} />
        </PressableOpacity>
      </View>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    textTransform: 'uppercase',
  },
  rowWrap: {
    borderBottomWidth: 1,
  },
  rowLocked: {
    opacity: 0.85,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  actionIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  empty: {
    fontSize: 14,
    paddingVertical: Spacing.xl,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
