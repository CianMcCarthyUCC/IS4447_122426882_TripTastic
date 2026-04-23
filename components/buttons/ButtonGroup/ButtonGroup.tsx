import { View } from 'react-native';
import { SharedStyles } from '@/constants';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * A tidy stack of buttons with matching gaps between them. Handy anywhere
 * two or more buttons sit on top of each other, so the spacing stays the
 * same across the app without re-adding margins by hand each time.
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
