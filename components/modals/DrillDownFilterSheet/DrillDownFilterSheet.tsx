import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDraftState } from '@/hooks/useDraftState';
import type { ReactNode } from 'react';

const FADE_MS = 140;

/**
 * The shape of a single row inside the drill-down filter sheet. Each row
 * holds a label, an icon and a sub-view that opens when tapped, so the
 * same sheet can host any kind of filter without needing a new component
 * each time.
 */
export type DrillDownFilterConfig = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subViewTitle: string;
  value: unknown;
  defaultValue: unknown;
  describe: (v: unknown) => string;
  isActive: (v: unknown) => boolean;
  disabled?: boolean;
  disabledHint?: string;
  renderPicker: (ctx: {
    value: unknown;
    setValue: (v: unknown) => void;
    close: () => void;
    toast: (message: string) => void;
  }) => ReactNode;
  onApply: (v: unknown) => void;
};

/**
 * One-tap preset that bypasses the draft/commit loop - the caller is
 * expected to update parent state in `onApply`, after which the sheet
 * closes. Shaped generically (label + optional icon + optional remove
 * action) so both saved-filter presets and hard-coded quick-picks can
 * coexist on the same chip row.
 */
export type DrillDownPreset = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onApply: () => void;
  onRemove?: () => void;
};

export type DrillDownFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  filters: ReadonlyArray<DrillDownFilterConfig>;
  presets?: ReadonlyArray<DrillDownPreset>;
  presetsTitle?: string;
  onSaveCurrent?: () => void;
  saveCurrentLabel?: string;
  onShowToast?: (message: string, variant?: 'success' | 'error' | 'info') => void;
};

/**
 * Reusable drill-down filter sheet. Renders a root list of filter rows,
 * each of which drills into a sub-view supplied by the caller. Pending
 * selections are held in local draft state (via `useDraftState`) and only
 * flushed through each filter's `onApply` on any close path - Show results,
 * backdrop tap, or X button - matching iOS Settings behaviour so a visible
 * selection in the root list always reflects what was actually applied.
 */
export function DrillDownFilterSheet({
  visible,
  onClose,
  filters,
  presets,
  presetsTitle = 'Presets',
  onSaveCurrent,
  saveCurrentLabel = 'Save current filter',
  onShowToast,
}: DrillDownFilterSheetProps) {
  const theme = useAppTheme();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Committed snapshot keyed by filter config. Re-seeded each open.
  const committed = useMemo(
    () => Object.fromEntries(filters.map((f) => [f.key, f.value])),
    [filters],
  );
  const { draft, setDraft } = useDraftState<Record<string, unknown>>(committed, visible);

  // Crossfade between root and any sub-view for a smoother transition than
  // an instant content swap.
  const fade = useRef(new Animated.Value(1)).current;
  const transitionTo = useCallback(
    (next: string | null) => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setActiveKey(next);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    },
    [fade],
  );
  const resetView = useCallback(() => transitionTo(null), [transitionTo]);

  // iOS Settings-style dismiss: tapping backdrop, X, or Show results all
  // commit the draft. Dropping edits on backdrop-close led users to think
  // the filter "didn't apply" when the selection was visibly highlighted
  // in the root list - so we flush on every exit path.
  const commitAndClose = useCallback(() => {
    filters.forEach((f) => f.onApply(draft[f.key]));
    resetView();
    onClose();
  }, [filters, draft, resetView, onClose]);

  const handleClearAll = () => {
    setDraft(Object.fromEntries(filters.map((f) => [f.key, f.defaultValue])));
    resetView();
  };

  const draftFilterCount = useMemo(
    () => filters.reduce((n, f) => n + (f.isActive(draft[f.key]) ? 1 : 0), 0),
    [filters, draft],
  );

  const activeFilter = activeKey ? filters.find((f) => f.key === activeKey) ?? null : null;

  const setDraftValue = useCallback(
    (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value })),
    [setDraft],
  );

  const toast = useCallback(
    (message: string) => onShowToast?.(message, 'info'),
    [onShowToast],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={commitAndClose}>
      <Pressable
        style={styles.backdrop}
        onPress={commitAndClose}
        accessibilityLabel="Close filters"
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: theme.cardBackground }]}
      >
        <View style={styles.grabber} />

        <View style={styles.header}>
          {activeFilter ? (
            <Pressable
              onPress={resetView}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back to filters"
              style={[styles.headerIconBtn, { backgroundColor: theme.tagBackground }]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </Pressable>
          ) : null}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {activeFilter
              ? activeFilter.subViewTitle
              : `Filters${draftFilterCount > 0 ? ` · ${draftFilterCount}` : ''}`}
          </Text>
          <Pressable
            onPress={commitAndClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.headerIconBtn, { backgroundColor: theme.tagBackground }]}
          >
            <Ionicons name="close" size={18} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Animated.View style={{ opacity: fade }}>
            {!activeFilter ? (
              <View>
                {presets && presets.length > 0 ? (
                  <View style={styles.presetsBlock}>
                    <Text style={[styles.presetsTitle, { color: theme.textSecondary }]}>
                      {presetsTitle.toUpperCase()}
                    </Text>
                    <View style={styles.presetsRow}>
                      {presets.map((p) => (
                        <View
                          key={p.id}
                          style={[
                            styles.presetChip,
                            { backgroundColor: theme.tagBackground },
                          ]}
                        >
                          <Pressable
                            onPress={() => {
                              p.onApply();
                              resetView();
                              onClose();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Apply preset ${p.label}`}
                            style={({ pressed }) => [
                              styles.presetChipBody,
                              pressed && styles.rowPressed,
                            ]}
                          >
                            {p.icon ? (
                              <Ionicons
                                name={p.icon}
                                size={14}
                                color={theme.accentAction}
                              />
                            ) : null}
                            <Text
                              style={[styles.presetChipText, { color: theme.textPrimary }]}
                              numberOfLines={1}
                            >
                              {p.label}
                            </Text>
                          </Pressable>
                          {p.onRemove ? (
                            <Pressable
                              onPress={p.onRemove}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove preset ${p.label}`}
                              style={styles.presetChipRemove}
                            >
                              <Ionicons
                                name="close"
                                size={14}
                                color={theme.textSecondary}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {filters.map((f) => {
                  const v = draft[f.key];
                  const active = f.isActive(v);
                  return (
                    <Pressable
                      key={f.key}
                      onPress={f.disabled ? undefined : () => transitionTo(f.key)}
                      disabled={f.disabled}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: f.disabled }}
                      accessibilityLabel={`${f.label}, ${f.disabled ? f.disabledHint ?? 'unavailable' : f.describe(v)}`}
                      style={({ pressed }) => [
                        styles.row,
                        { borderColor: theme.cardBorder },
                        pressed && !f.disabled && styles.rowPressed,
                        f.disabled && styles.rowDisabled,
                      ]}
                    >
                      <View style={[styles.rowIcon, { backgroundColor: theme.tagBackground }]}>
                        <Ionicons name={f.icon} size={18} color={theme.textPrimary} />
                      </View>
                      <View style={styles.rowBody}>
                        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                          {f.label}
                        </Text>
                        <Text
                          style={[
                            styles.rowValue,
                            { color: active ? Palette.coral : theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {f.disabled ? f.disabledHint ?? f.describe(v) : f.describe(v)}
                        </Text>
                      </View>
                      {!f.disabled ? (
                        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                      ) : null}
                    </Pressable>
                  );
                })}
                {onSaveCurrent && draftFilterCount > 0 ? (
                  <Pressable
                    onPress={onSaveCurrent}
                    accessibilityRole="button"
                    accessibilityLabel={saveCurrentLabel}
                    style={({ pressed }) => [
                      styles.saveCurrentRow,
                      { backgroundColor: theme.tagBackground },
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Ionicons name="bookmark-outline" size={14} color={theme.accentAction} />
                    <Text style={[styles.saveCurrentText, { color: theme.textPrimary }]}>
                      {saveCurrentLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              activeFilter.renderPicker({
                value: draft[activeFilter.key],
                setValue: (v) => setDraftValue(activeFilter.key, v),
                close: resetView,
                toast,
              })
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { borderColor: theme.cardBorder }]}>
          <Pressable
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            style={[styles.clearBtn, { borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.clearText, { color: theme.textPrimary }]}>Clear all</Text>
          </Pressable>
          <Pressable
            onPress={commitAndClose}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
            style={[styles.applyBtn, { backgroundColor: Palette.coral }]}
          >
            <Text style={styles.applyText}>Show results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Shadows.lg,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: Palette.grey300,
    borderRadius: 3,
    height: 5,
    marginBottom: Spacing.sm,
    opacity: 0.6,
    width: 40,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerIconBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  body: {
    paddingBottom: Spacing.lg,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  clearBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.md,
  },
  clearText: { fontSize: 14, fontWeight: '700' },
  applyBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flex: 2,
    paddingVertical: Spacing.md,
  },
  applyText: { color: Palette.white, fontSize: 14, fontWeight: '800' },
  presetsBlock: {
    marginBottom: Spacing.sm,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  presetChipBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 180,
  },
  presetChipRemove: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  saveCurrentRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveCurrentText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
