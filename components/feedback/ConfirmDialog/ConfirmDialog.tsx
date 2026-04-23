import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/buttons';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A small modal that asks the user to confirm before a destructive action
 * goes through (e.g. deleting a trip or account). Comes with a clear title,
 * message, and a pair of confirm/cancel buttons.
 */
function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onCancel}>
        <View
          style={[styles.dialog, { backgroundColor: theme.cardBackground }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

          <View style={styles.buttons}>
            <View style={styles.buttonWrapper}>
              <PrimaryButton label={cancelLabel} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.buttonWrapper}>
              <PrimaryButton label={confirmLabel} variant={variant} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default memo(ConfirmDialog);

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    borderRadius: BorderRadius.lg,
    maxWidth: 360,
    padding: Spacing.xxl,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
