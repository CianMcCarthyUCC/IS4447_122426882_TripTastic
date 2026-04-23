import { StyleSheet, View } from 'react-native';
import { PlaneLoader } from '@/components/feedback/PlaneLoader';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * A brief landing page shown while the app is restoring the user's
 * session. Displays the plane loader and then hands off automatically
 * to either the main app or the login screen.
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
