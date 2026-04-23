import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * The small hook every screen uses to add a haptic buzz to taps and
 * confirmations. Offers named levels (light, medium, success, warning,
 * error) so the feel of the app stays consistent.
 */
export function useHaptics() {
  const success = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const warning = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const error = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const light = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return { success, warning, error, light, medium };
}
