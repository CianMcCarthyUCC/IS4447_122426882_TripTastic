import { SafeAreaView } from 'react-native-safe-area-context';
import { SharedStyles } from '@/constants';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  withTabs?: boolean;
  style?: ViewStyle;
};

export default function ScreenContainer({ children, withTabs = false, style }: Props) {
  return (
    <SafeAreaView
      style={[
        withTabs ? SharedStyles.screenContainerWithTabs : SharedStyles.screenContainer,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
