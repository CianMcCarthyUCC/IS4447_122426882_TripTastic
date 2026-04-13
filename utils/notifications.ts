import * as Notifications from 'expo-notifications';

/**
 * Requests notification permissions. Call on first launch.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Configures notification handler so foreground notifications are visible.
 * Call once on app startup.
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Schedules a daily reminder to log activities.
 * Fires at 8pm every day.
 */
export async function scheduleDailyReminder(): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'TripTastic',
      body: "Don't forget to log today's holiday activities!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  return id;
}

/**
 * Schedules a goal progress reminder for the next day.
 */
export async function scheduleGoalReminder(goalName: string, remaining: number): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Goal Reminder',
      body: `You still need ${remaining} min for your "${goalName}" goal. Keep going!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 86400,
      repeats: false,
    },
  });

  return id;
}

/**
 * Fires an instant notification when a goal is met or exceeded.
 */
export async function notifyGoalMet(goalName: string, exceeded: boolean): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: exceeded ? 'Goal Exceeded!' : 'Goal Reached!',
      body: exceeded
        ? `You've gone beyond your "${goalName}" goal! Amazing work!`
        : `You've hit your "${goalName}" goal! Well done!`,
      sound: true,
    },
    trigger: null, // fires immediately
  });
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
