import cron from 'node-cron';
import {
  sendTaskDeadlineReminders,
  sendStreakMaintenanceReminders,
  sendWeeklyDigests,
} from '../services/notificationService.js';

const TZ = process.env.NOTIFICATION_TIMEZONE || undefined;

const schedule = (expression, label, handler) => {
  cron.schedule(
    expression,
    async () => {
      try {
        console.log(`⏰ Running scheduled job: ${label}`);
        await handler();
      } catch (err) {
        console.error(`Scheduled job "${label}" failed:`, err);
      }
    },
    { timezone: TZ }
  );
  console.log(`✅ Scheduled: ${label} (${expression}${TZ ? `, ${TZ}` : ''})`);
};

export const startNotificationScheduler = () => {
  if (process.env.DISABLE_NOTIFICATION_SCHEDULER === 'true') {
    console.log('📭 Notification scheduler disabled (DISABLE_NOTIFICATION_SCHEDULER=true)');
    return;
  }

  // Daily at 8:00 AM — task due today / tomorrow reminders
  schedule('0 8 * * *', 'Task deadline reminders', sendTaskDeadlineReminders);

  // Daily at 6:00 PM — streak maintenance reminders
  schedule('0 18 * * *', 'Streak maintenance reminders', sendStreakMaintenanceReminders);

  // Mondays at 9:00 AM — weekly digest
  schedule('0 9 * * 1', 'Weekly email digest', sendWeeklyDigests);
};
