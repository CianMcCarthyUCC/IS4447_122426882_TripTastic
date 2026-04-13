import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  message?: string;
  size?: 'small' | 'large';
};

/**
 * Animated plane loader using Lottie.
 * Uses free Lottie JSON animation (see references.txt for attribution).
 * Two sizes: large (full screen loading) and small (inline in buttons).
 */
function PlaneLoader({ message = 'Loading...', size = 'large' }: Props) {
  const theme = useAppTheme();
  const dimensions = size === 'large' ? 120 : 32;

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <LottieView
        source={require('@/assets/animations/plane-loading.json')}
        autoPlay
        loop
        style={{ width: dimensions, height: dimensions }}
      />
      {size === 'large' && message ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      ) : null}
    </View>
  );
}

export default memo(PlaneLoader);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  containerSmall: {
    flexDirection: 'row',
    paddingVertical: 0,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
});
