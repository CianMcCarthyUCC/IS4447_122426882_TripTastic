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
