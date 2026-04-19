import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  withTabs?: boolean;
  style?: ViewStyle;
};

/**
 * Screen wrapper — applies screen-level theme background + spacing.
 *
 * Previous revisions wrapped children in a `TouchableWithoutFeedback`
 * (and before that, a `Pressable`) that dismissed the keyboard when the
 * user tapped empty background. Both captured empty-space touches via
 * Pressability's press-classification window, which stalled pan gestures
 * that started on background and made vertical scroll feel like it "only
 * worked on cards." Removed — keyboard dismissal now flows through
 * `keyboardDismissMode="on-drag"` on the scrollables themselves, which
 * is the native iOS/Android pattern (scrolling dismisses the keyboard)
 * and adds no gesture interception.
 */
export default function ScreenContainer({ children, withTabs = false, style }: Props) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      style={[
        {
          backgroundColor: theme.screenBackground,
          flex: 1,
          ...(withTabs
            ? { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }
            : { padding: Spacing.xxl }),
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
