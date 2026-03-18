import { View } from 'react-native';
import { SharedStyles } from '@/constants';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * Wraps multiple buttons with consistent spacing between them.
 * Reuse this anywhere you have stacked buttons instead of
 * manually adding View + buttonSpacing around each one.
 */
export default function ButtonGroup({ children }: Props) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <>
      {items.map((child, index) => (
        <View key={index} style={index > 0 ? SharedStyles.buttonSpacing : undefined}>
          {child}
        </View>
      ))}
    </>
  );
}
