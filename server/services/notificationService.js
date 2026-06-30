import User from '../models/User.js';
import Task from '../models/Task.js';
import {
  sendTaskReminderEmail,
  sendStreakReminderEmail,
  sendWeeklyDigestEmail,
  sendStreakMilestoneEmail,
} from '../utils/emailService.js';

const STREAK_MILESTONES = [7, 14, 30, 50, 100];

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameCalendarDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const userCompletedTaskToday = (user) => {
  const last = user.streaks?.lastTaskCompletionDate;
  return isSameCalendarDay(last, new Date());
};

const wantsNotifications = (user, type) => {
  if (user.isActive === false) return false;
  const prefs = user.preferences?.notifications;
  if (!prefs) return true;
  return prefs[type] !== false;
};

export const sendTaskDeadlineReminders = async () => {
  const today = startOfDay();
  const tomorrow = startOfDay(addDays(today, 1));
  const tomorrowEnd = endOfDay(tomorrow);

  const users = await User.find({
    isActive: { $ne: false },
    'preferences.notifications.taskReminders': { $ne: false },
  }).select('name email preferences');

  let sentCount = 0;

  for (const user of users) {
    if (!wantsNotifications(user, 'taskReminders')) continue;

    const dueTodayTasks = await Task.find({
      userId: user._id,
      completed: false,
      dueDate: { $gte: today, $lte: endOfDay(today) },
      $or: [
        { 'emailReminders.dueTodaySentAt': null },
        { 'emailReminders.dueTodaySentAt': { $lt: today } },
      ],
    });

    if (dueTodayTasks.length > 0) {
      try {
        await sendTaskReminderEmail(user, dueTodayTasks, 'today');
        const now = new Date();
        await Task.updateMany(
          { _id: { $in: dueTodayTasks.map((t) => t._id) } },
          { $set: { 'emailReminders.dueTodaySentAt': now } }
        );
        sentCount++;
      } catch (err) {
        console.error(`Task reminder (today) failed for ${user.email}:`, err.message);
      }
    }

    const dueTomorrowTasks = await Task.find({
      userId: user._id,
      completed: false,
      dueDate: { $gte: tomorrow, $lte: tomorrowEnd },
      $or: [
        { 'emailReminders.dueTomorrowSentAt': null },
        { 'emailReminders.dueTomorrowSentAt': { $lt: today } },
      ],
    });

    if (dueTomorrowTasks.length > 0) {
      try {
        await sendTaskReminderEmail(user, dueTomorrowTasks, 'tomorrow');
        const now = new Date();
        await Task.updateMany(
          { _id: { $in: dueTomorrowTasks.map((t) => t._id) } },
          { $set: { 'emailReminders.dueTomorrowSentAt': now } }
        );
        sentCount++;
      } catch (err) {
        console.error(`Task reminder (tomorrow) failed for ${user.email}:`, err.message);
      }
    }
  }

  if (sentCount > 0) {
    console.log(`📧 Task deadline reminders sent to ${sentCount} user(s)`);
  }
};

export const sendStreakMaintenanceReminders = async () => {
  const today = startOfDay();
  const users = await User.find({
    isActive: { $ne: false },
    'streaks.currentStreak': { $gt: 0 },
    'preferences.notifications.streakReminders': { $ne: false },
  }).select('name email streaks preferences notificationMeta');

  let sentCount = 0;

  for (const user of users) {
    if (!wantsNotifications(user, 'streakReminders')) continue;
    if (userCompletedTaskToday(user)) continue;

    const lastSent = user.notificationMeta?.lastStreakReminderAt;
    if (isSameCalendarDay(lastSent, today)) continue;

    try {
      await sendStreakReminderEmail(user);
      user.notificationMeta = user.notificationMeta || {};
      user.notificationMeta.lastStreakReminderAt = new Date();
      await user.save({ validateBeforeSave: false });
      sentCount++;
    } catch (err) {
      console.error(`Streak reminder failed for ${user.email}:`, err.message);
    }
  }

  if (sentCount > 0) {
    console.log(`📧 Streak reminders sent to ${sentCount} user(s)`);
  }
};

export const sendWeeklyDigests = async () => {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? -6 : 1 - day;
  const weekStart = startOfDay(addDays(now, daysFromMonday));
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const users = await User.find({
    isActive: { $ne: false },
    'preferences.notifications.emailNotifications': { $ne: false },
  }).select('name email streaks preferences notificationMeta');

  let sentCount = 0;

  for (const user of users) {
    if (!wantsNotifications(user, 'emailNotifications')) continue;

    const lastDigest = user.notificationMeta?.lastWeeklyDigestAt;
    if (lastDigest && lastDigest >= weekStart) continue;

    const userId = user._id;
    const [completedThisWeek, pendingTasks, dueThisWeek] = await Promise.all([
      Task.countDocuments({
        userId,
        completed: true,
        completedAt: { $gte: weekStart, $lte: weekEnd },
      }),
      Task.countDocuments({ userId, completed: false }),
      Task.countDocuments({
        userId,
        completed: false,
        dueDate: { $gte: weekStart, $lte: weekEnd },
      }),
    ]);

    try {
      await sendWeeklyDigestEmail(user, {
        currentStreak: user.streaks?.currentStreak || 0,
        completedThisWeek,
        pendingTasks,
        dueThisWeek,
      });
      user.notificationMeta = user.notificationMeta || {};
      user.notificationMeta.lastWeeklyDigestAt = new Date();
      await user.save({ validateBeforeSave: false });
      sentCount++;
    } catch (err) {
      console.error(`Weekly digest failed for ${user.email}:`, err.message);
    }
  }

  if (sentCount > 0) {
    console.log(`📧 Weekly digests sent to ${sentCount} user(s)`);
  }
};

export const checkAndSendStreakMilestone = async (user) => {
  if (!wantsNotifications(user, 'emailNotifications')) return;

  const streak = user.streaks?.currentStreak || 0;
  if (!STREAK_MILESTONES.includes(streak)) return;

  const tasksToday = user.streaks?.tasksCompletedToday || 0;
  if (tasksToday !== 1) return;

  try {
    await sendStreakMilestoneEmail(user, streak);
    console.log(`📧 Streak milestone email sent to ${user.email} (${streak} days)`);
  } catch (err) {
    console.error(`Streak milestone email failed for ${user.email}:`, err.message);
  }
};
