import { env } from './env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: ReturnType<typeof import('nodemailer').createTransport> | null = null;

async function getTransporter() {
  if (transporter) return transporter;
  
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('Email not configured - skipping send');
    return null;
  }
  
  const nodemailer = await import('nodemailer');
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = await getTransporter();
  if (!transport) return false;
  
  try {
    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

export async function sendAdminAlert(subject: string, html: string): Promise<void> {
  const adminEmail = env.ADMIN_ALERT_EMAIL;
  if (adminEmail) {
    await sendEmail({ to: adminEmail, subject, html });
  }
}

export async function sendLoginAlert(email: string, ip: string, userAgent: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'New Login to Business Exchange Admin',
    html: `
      <h2>New Admin Login Detected</h2>
      <p>A new login was detected for your Business Exchange admin account.</p>
      <ul>
        <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Device:</strong> ${userAgent}</li>
      </ul>
      <p>If this was not you, please contact support immediately.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Password Reset - Business Exchange Admin',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Business Exchange admin account.</p>
      <p><a href="${resetUrl}" style="background:#1f6a6a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `,
  });
}