import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/buttons';
import { Colors, Spacing, BorderRadius } from '@/constants';

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
 * Reusable confirmation modal — branded dialog for destructive actions.
 * Replaces accidental single-tap deletes with a two-step confirmation.
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttons}>
            <View style={styles.buttonWrapper}>
              <PrimaryButton label={cancelLabel} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.buttonWrapper}>
              <PrimaryButton label={confirmLabel} variant={variant} onPress={onConfirm} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default memo(ConfirmDialog);

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    maxWidth: 360,
    padding: Spacing.xxl,
    width: '100%',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  message: {
    color: Colors.textSecondary,
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
