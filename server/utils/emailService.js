import nodemailer from 'nodemailer';

const getPurposeLabel = (purpose) => {
  switch (purpose) {
    case 'register':
      return 'Email Verification — Registration';
    case 'login':
      return 'Login Verification';
    case 'reset_password':
      return 'Password Reset';
    default:
      return 'Verification';
  }
};

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    pool: true,
    maxConnections: 1,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS.replace(/\s/g, ''),
    },
  });
};

let cachedTransporter = null;

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
};

export const warmUpSmtp = async () => {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.verify();
    console.log(' Email: SMTP connection verified');
  } catch (error) {
    console.error(' Email: SMTP connection failed —', error.message);
  }
};

export const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());

const getFromAddress = () =>
  process.env.EMAIL_FROM || `VidyaSaathi <${process.env.SMTP_USER}>`;

const emailWrapper = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #3B82F6; margin-bottom: 4px;">VidyaSaathi</h2>
    <p style="color: #6B7280; font-size: 13px; margin-top: 0; margin-bottom: 20px;">${title}</p>
    ${bodyHtml}
    <p style="color: #9CA3AF; font-size: 12px; margin-top: 28px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
      You received this because notification preferences are enabled in your VidyaSaathi account.
      Update them anytime in Profile → Preferences.
    </p>
  </div>
`;

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n📧 [DEV MODE] Email to ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   ${text || '(HTML body)'}\n`);
    return { sent: true, devMode: true };
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error(`📧 Email failed to ${to}:`, error.message);
    throw new Error(
      'Failed to send email. Check SMTP_USER and SMTP_PASS (use a Gmail App Password).'
    );
  }
};

export const sendOtpEmail = async (email, otp, purpose) => {
  const label = getPurposeLabel(purpose);

  return sendEmail({
    to: email,
    subject: `${label} — VidyaSaathi`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #3B82F6; margin-bottom: 8px;">VidyaSaathi</h2>
        <p style="color: #374151; margin-bottom: 16px;">Your verification code for <strong>${label}</strong>:</p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your VidyaSaathi verification code is: ${otp}. It expires in 10 minutes.`,
  });
};

const formatDueDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const sendTaskReminderEmail = async (user, tasks, reminderType) => {
  const isToday = reminderType === 'today';
  const title = isToday ? 'Tasks Due Today' : 'Tasks Due Tomorrow';
  const intro = isToday
    ? `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today.`
    : `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due tomorrow.`;

  const taskList = tasks
    .map(
      (t) =>
        `<li style="margin-bottom: 8px;"><strong>${t.title}</strong> — due ${formatDueDate(t.dueDate)}${t.priority !== 'medium' ? ` (${t.priority} priority)` : ''}</li>`
    )
    .join('');

  const bodyHtml = `
    <p style="color: #374151;">Hi ${user.name},</p>
    <p style="color: #374151;">${intro}</p>
    <ul style="color: #374151; padding-left: 20px;">${taskList}</ul>
    <p style="color: #374151;">Log in to VidyaSaathi to review and complete your tasks.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `${title} — VidyaSaathi`,
    html: emailWrapper(title, bodyHtml),
    text: `Hi ${user.name}, ${intro} Open VidyaSaathi to view your tasks.`,
  });
};

export const sendStreakReminderEmail = async (user) => {
  const streak = user.streaks?.currentStreak || 0;
  const bodyHtml = `
    <p style="color: #374151;">Hi ${user.name},</p>
    <p style="color: #374151;">Your <strong>${streak}-day streak</strong> is at risk! You haven't completed a task today yet.</p>
    <p style="color: #374151;">Complete at least one task before midnight to keep your streak alive.</p>
    <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
      <span style="font-size: 28px; font-weight: bold; color: #D97706;">🔥 ${streak} days</span>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Don't lose your ${streak}-day streak! — VidyaSaathi`,
    html: emailWrapper('Streak Reminder', bodyHtml),
    text: `Hi ${user.name}, your ${streak}-day streak is at risk. Complete a task today to keep it going!`,
  });
};

export const sendWeeklyDigestEmail = async (user, stats) => {
  const bodyHtml = `
    <p style="color: #374151;">Hi ${user.name},</p>
    <p style="color: #374151;">Here's your weekly VidyaSaathi summary:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #6B7280;">Current streak</td><td style="padding: 8px 0; font-weight: bold; color: #1F2937;">${stats.currentStreak} days</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Tasks completed this week</td><td style="padding: 8px 0; font-weight: bold; color: #1F2937;">${stats.completedThisWeek}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Pending tasks</td><td style="padding: 8px 0; font-weight: bold; color: #1F2937;">${stats.pendingTasks}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Due this week</td><td style="padding: 8px 0; font-weight: bold; color: #1F2937;">${stats.dueThisWeek}</td></tr>
    </table>
    <p style="color: #374151;">Keep up the great work!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Your Weekly VidyaSaathi Summary',
    html: emailWrapper('Weekly Summary', bodyHtml),
    text: `Hi ${user.name}, your weekly summary: ${stats.currentStreak}-day streak, ${stats.completedThisWeek} tasks completed this week, ${stats.pendingTasks} pending.`,
  });
};

export const sendStreakMilestoneEmail = async (user, milestone) => {
  const bodyHtml = `
    <p style="color: #374151;">Hi ${user.name},</p>
    <p style="color: #374151;">Congratulations! You've reached a <strong>${milestone}-day streak</strong>! 🎉</p>
    <div style="background: #DBEAFE; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
      <span style="font-size: 36px; font-weight: bold; color: #2563EB;">${milestone} days</span>
    </div>
    <p style="color: #374151;">Consistency is the key to success. Keep going!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `🎉 ${milestone}-Day Streak Milestone! — VidyaSaathi`,
    html: emailWrapper('Streak Milestone', bodyHtml),
    text: `Congratulations ${user.name}! You've reached a ${milestone}-day streak on VidyaSaathi!`,
  });
};
