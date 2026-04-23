import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How faded the control looks while pressed. Defaults to 0.6. */
  pressedOpacity?: number;
};

/**
 * A small wrapper around Pressable that fades the content while the user
 * holds it. Used for tappable cards, icon buttons and inline text links so
 * every tap target gives the same visual feedback.
 */
export function PressableOpacity({ style, pressedOpacity = 0.6, disabled, ...rest }: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [style, { opacity: pressed || disabled ? pressedOpacity : 1 }]}
      {...rest}
    />
  );
}
