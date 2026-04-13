import { StyleSheet, View } from 'react-native';
import { PlaneLoader } from '@/components/feedback/PlaneLoader';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * Auth index — shows plane loader while session is restoring.
 * Redirected away from by AuthGuard once auth state is resolved.
 */
export default function AuthIndex() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
      <PlaneLoader message="Preparing your trip..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
