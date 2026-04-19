import { memo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { BorderRadius, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';
import type { Notification } from '@/hooks/useNotifications';

type Props = {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  /** Hide a single notification for the rest of the session. */
  onDismiss: (id: string) => void;
  /** Hide every currently visible notification. */
  onClearAll: () => void;
};

/**
 * Slide-down modal that surfaces the in-app notification feed computed
 * by `useNotifications`. Rows are pressable and navigate to the most
 * relevant screen for the notification kind. Each row has an X to
 * dismiss individually, and the header exposes a "Clear all" control
 * whenever the list is non-empty.
 */
function NotificationsPanel({ visible, notifications, onClose, onDismiss, onClearAll }: Props) {
  const theme = useAppTheme();
  const router = useRouter();
  const haptics = useHaptics();

  const handleRowPress = (item: Notification) => {
    haptics.light();
    // Close first so the navigation transition isn't covered by the modal.
    onClose();
    // Route shapes come straight from the hook — just forward them.
    router.push(item.href as Href);
  };

  const handleClearAll = () => {
    haptics.light();
    onClearAll();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Tap-outside to dismiss. Inner card stops the responder so taps on
          list items don't accidentally close the panel. */}
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
        accessibilityLabel="Close notifications"
      >
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Notifications
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {notifications.length === 0
                  ? "You're all caught up."
                  : `${notifications.length} update${notifications.length === 1 ? '' : 's'} for you`}
              </Text>
            </View>
            {notifications.length > 0 ? (
              <Pressable
                onPress={handleClearAll}
                style={({ pressed }) => [
                  styles.clearAllBtn,
                  { backgroundColor: theme.tagBackground, opacity: pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
                hitSlop={6}
              >
                <Text style={[styles.clearAllLabel, { color: theme.textPrimary }]}>
                  Clear all
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.tagBackground, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyBubble, { backgroundColor: theme.tagBackground }]}>
                <Ionicons name="notifications-off-outline" size={28} color={theme.accentAction} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No notifications
              </Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                Streaks, goal milestones, and trip reminders will show up here as you plan
                and log activities.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
              )}
              renderItem={({ item }) => (
                <NotificationRow
                  item={item}
                  theme={theme}
                  onPress={() => handleRowPress(item)}
                  onDismiss={() => onDismiss(item.id)}
                />
              )}
              bounces={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

type RowProps = {
  item: Notification;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
  onDismiss: () => void;
};

function NotificationRow({ item, theme, onPress, onDismiss }: RowProps) {
  // Pick a tint per notification kind so the row carries meaning at a
  // glance. All colours come from the theme so dark mode stays coherent.
  const tint = (() => {
    switch (item.kind) {
      case 'goal-met':
        return theme.successAction;
      case 'goal-close':
        return theme.accentAction;
      case 'streak':
        return theme.accentAction;
      case 'trip-now':
        return theme.successAction;
      case 'trip-soon':
      default:
        return theme.primaryAction;
    }
  })();

  return (
    <View style={styles.rowWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.body}. Tap to open.`}
      >
        <View style={[styles.rowIconBubble, { backgroundColor: theme.tagBackground }]}>
          <Ionicons name={item.icon} size={18} color={tint} />
        </View>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.rowBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.textSecondary}
          style={styles.chevron}
        />
      </Pressable>
      {/* Separate dismiss target so tapping X doesn't also navigate. */}
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss ${item.title}`}
        hitSlop={10}
      >
        <Ionicons name="close" size={14} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

export default memo(NotificationsPanel);

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    // Slight top-bias so the panel feels anchored to the bell that
    // opened it, not floating in the middle of the screen.
    paddingTop: '12%',
  },
  panel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    maxHeight: '75%',
    maxWidth: 420,
    padding: Spacing.lg,
    width: '90%',
    ...Shadows.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  clearAllBtn: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  clearAllLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  listContent: {
    paddingVertical: Spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  rowWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  rowIconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  chevron: {
    marginLeft: Spacing.xs,
    opacity: 0.6,
  },
  dismissBtn: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptyBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 64,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    width: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
