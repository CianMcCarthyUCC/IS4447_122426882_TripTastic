import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Spacing } from '@/constants';

type Props = {
  children: ReactNode;
  /** Extra offset when a fixed header sits above the form (default 0). */
  keyboardVerticalOffset?: number;
  /** Optional style for the inner ScrollView content container. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Forwarded ScrollView props (ref, onScroll, etc.). */
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
};

/**
 * A wrapper for any screen containing text inputs. Lifts the focused
 * field above the on-screen keyboard and lets the user dismiss it by
 * dragging. Works consistently across full-screen routes, modals, and
 * bottom-sheet presentations.
 */
export default function KeyboardAwareForm({
  children,
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  scrollViewProps,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
});
