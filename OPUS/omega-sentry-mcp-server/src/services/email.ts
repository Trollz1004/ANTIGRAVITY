/**
 * Email sender via Gmail SMTP (nodemailer).
 * Uses Gmail App Password from env: GMAIL_APP_PASSWORD
 * Zero cost. No third-party ESP needed.
 */

import nodemailer from "nodemailer";
import { EMAIL_CONFIG, PROTOCOL_OMEGA, ROYAL_FLUSH, PAYMENT_LINKS } from "../constants.js";

function getTransporter() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) throw new Error("GMAIL_APP_PASSWORD not set. Generate one at myaccount.google.com/apppasswords");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_CONFIG.FROM_EMAIL,
      pass,
    },
  });
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<string> {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"${EMAIL_CONFIG.FROM_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    replyTo: EMAIL_CONFIG.REPLY_TO,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text ?? stripHtml(payload.html),
  });
  return info.messageId;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ===== EMAIL TEMPLATES =====

export function welcomeEmail(customerEmail: string, customerName?: string): EmailPayload {
  const name = customerName ?? "there";
  return {
    to: customerEmail,
    subject: "You're verified. Welcome to the last dating app you'll ever need.",
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#0d0d1a;padding:30px;text-align:center;">
    <h1 style="color:#fff;font-size:22px;margin:0;">YouAndI<span style="color:#e63946;">Not</span>AI</h1>
    <p style="color:#e63946;font-size:12px;letter-spacing:1px;margin:5px 0 0;">VERIFIED HUMANS ONLY</p>
  </div>
  <div style="padding:30px;line-height:1.7;">
    <p style="font-size:17px;font-weight:600;">You're in, ${name}. For real.</p>
    <p>That $1 you just spent? It wasn't a fee. It was a statement. Bot farms won't pay $1 per fake account — the economics don't work for them. That's the whole point.</p>
    <div style="background:#f8f9fa;border-left:4px solid #e63946;padding:18px;margin:20px 0;border-radius:0 8px 8px 0;">
      <strong style="color:#e63946;">Where your $1 goes:</strong><br>
      60&cent; &rarr; Shriners Children's Hospital<br>
      30&cent; &rarr; V8 Verification Engine & AI Infrastructure<br>
      10&cent; &rarr; Founder Operations<br><br>
      <span style="font-size:13px;color:#888;">Every cent tracked on-chain. Base Mainnet. Gnosis Safe 3-of-5 multisig.</span>
    </div>
    <p>You have a guaranteed spot on launch day — <strong>April 4, 2026</strong>.</p>
    <div style="background:linear-gradient(135deg,#e63946,#d62839);color:#fff;padding:25px;border-radius:10px;text-align:center;margin:20px 0;">
      <div style="font-size:20px;font-weight:800;">Royal Flush Draw</div>
      <div style="font-size:14px;opacity:0.9;margin-top:8px;">Your $1 = 1 entry to win $500 cash + lifetime premium.<br>Share your link — each friend who verifies = 5 bonus entries.</div>
    </div>
    <p>I built this in my garage with AI tools because I was tired of swiping on bots.</p>
    <div style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;">
      <strong>Josh Coleman</strong><br>
      <span style="color:#888;font-size:13px;">Founder & Electrician — YouAndINotAI.com</span>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#999;">
    60% of all revenue goes directly to Shriners Children's Hospital via the FortheKids Endowment.
  </div>
</div>`,
  };
}

export function botShieldEducationEmail(customerEmail: string): EmailPayload {
  return {
    to: customerEmail,
    subject: "Why every other dating app is lying to you about their 'real user' problem",
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#0d0d1a;padding:30px;text-align:center;">
    <h1 style="color:#fff;font-size:22px;margin:0;">YouAndI<span style="color:#e63946;">Not</span>AI</h1>
    <p style="color:#e63946;font-size:12px;letter-spacing:1px;margin:5px 0 0;">BOT-SHIELD V8</p>
  </div>
  <div style="padding:30px;line-height:1.7;">
    <p style="font-size:17px;font-weight:600;">Let's talk about the elephant in every dating app.</p>
    <p>Up to 47% of profiles on major platforms are bots, catfish, or spam. They don't fix it because fake accounts inflate user numbers.</p>
    <div style="background:#f8f9fa;border-left:4px solid #e63946;padding:18px;margin:20px 0;border-radius:0 8px 8px 0;">
      <strong style="color:#e63946;">How Bot-Shield V8 Works:</strong><br><br>
      <strong>Layer 1 — Economic Friction ($1)</strong><br>10,000 fake profiles = $10,000. Not viable.<br><br>
      <strong>Layer 2 — Biometric Liveness</strong><br>Real-time V8 Cloud Engine check. Not a selfie upload.<br><br>
      <strong>Layer 3 — On-Chain Audit Trail</strong><br>Every verification logged to Base Mainnet. Public ledger.
    </div>
    <div style="display:flex;justify-content:space-around;text-align:center;margin:25px 0;">
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">$1</div><div style="font-size:12px;color:#888;">To verify</div></div>
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">$10K</div><div style="font-size:12px;color:#888;">To fake 10K</div></div>
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">60%</div><div style="font-size:12px;color:#888;">To Shriners</div></div>
    </div>
    <p>You're already verified. On April 4th, you'll be in a room where every person proved they're real.</p>
    <div style="text-align:center;margin:25px 0;">
      <a href="${PAYMENT_LINKS.BOT_SHIELD}" style="background:#e63946;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:16px;">Share Your Referral Link</a>
    </div>
    <div style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;">
      <strong>Josh Coleman</strong><br>
      <span style="color:#888;font-size:13px;">Founder — YouAndINotAI.com</span>
    </div>
  </div>
</div>`,
  };
}

export function referralPushEmail(customerEmail: string): EmailPayload {
  return {
    to: customerEmail,
    subject: "Your friend verifies → you get 5 more shots at $500",
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#0d0d1a;padding:30px;text-align:center;">
    <h1 style="color:#fff;font-size:22px;margin:0;">YouAndI<span style="color:#e63946;">Not</span>AI</h1>
    <p style="color:#e63946;font-size:12px;letter-spacing:1px;margin:5px 0 0;">ROYAL FLUSH DRAW</p>
  </div>
  <div style="padding:30px;line-height:1.7;">
    <p style="font-size:17px;font-weight:600;">Quick math on why you should share your link right now.</p>
    <p>Your $1 verification = 1 entry. Prize: <strong>$500 cash + lifetime premium</strong>. Drawn April 4th.</p>
    <div style="background:#f8f9fa;border-left:4px solid #e63946;padding:18px;margin:20px 0;border-radius:0 8px 8px 0;">
      <strong style="color:#e63946;">Every friend who verifies = 5 bonus entries for you.</strong><br><br>
      2 referrals &rarr; 11 total entries<br>
      5 referrals &rarr; 26 total entries<br>
      10 referrals &rarr; 51 total entries<br><br>
      Each friend also funds Shriners Children's Hospital. Not a bad text to send.
    </div>
    <p><strong>Want more than the draw?</strong> Founding Members get $14.99/mo locked in (goes to $24.99 after launch) + priority matching.</p>
    <div style="text-align:center;margin:25px 0;">
      <a href="${PAYMENT_LINKS.MONTHLY}" style="background:#e63946;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;">Become a Founding Member — $14.99/mo</a>
    </div>
    <p style="text-align:center;font-size:13px;color:#888;">Or save with <a href="${PAYMENT_LINKS.THREE_MONTH}" style="color:#e63946;">3 months ($39.99)</a> or <a href="${PAYMENT_LINKS.TWELVE_MONTH}" style="color:#e63946;">12 months ($99.99)</a></p>
    <div style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;">
      <strong>Josh Coleman</strong><br>
      <span style="color:#888;font-size:13px;">Founder — YouAndINotAI.com</span>
    </div>
  </div>
</div>`,
  };
}

export function transparencyReportEmail(
  to: string,
  weekNum: number,
  weekRevenue: number,
  totalRevenue: number,
  totalVerified: number,
  daysToLaunch: number,
  highlight: string
): EmailPayload {
  const shriners = (weekRevenue * 0.60).toFixed(2);
  const infra = (weekRevenue * 0.30).toFixed(2);
  const founder = (weekRevenue * 0.10).toFixed(2);

  return {
    to,
    subject: `Week ${weekNum}: Here's exactly where your money went.`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#0d0d1a;padding:30px;text-align:center;">
    <h1 style="color:#fff;font-size:22px;margin:0;">YouAndI<span style="color:#e63946;">Not</span>AI</h1>
    <p style="color:#e63946;font-size:12px;letter-spacing:1px;margin:5px 0 0;">TRANSPARENCY REPORT — WEEK ${weekNum}</p>
  </div>
  <div style="padding:30px;line-height:1.7;">
    <p style="font-size:17px;font-weight:600;">No spin. Just numbers.</p>
    <div style="background:#0d0d1a;color:#fff;padding:20px;border-radius:8px;font-family:monospace;font-size:13px;margin:20px 0;">
      <div style="color:#e63946;font-size:11px;letter-spacing:1px;margin-bottom:10px;">ON-CHAIN REVENUE — BASE MAINNET (8453)</div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a2e;">
        <span>Total (Week)</span><span>$${weekRevenue.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a2e;">
        <span>&rarr; Shriners (60%)</span><span>$${shriners}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a2e;">
        <span>&rarr; V8 Infra (30%)</span><span>$${infra}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;">
        <span>&rarr; Founder (10%)</span><span>$${founder}</span>
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #333;font-size:11px;">
        <div>Charity Wallet: ${PROTOCOL_OMEGA.wallets.CHARITY_REVENUE}</div>
        <div>DAO Treasury: ${PROTOCOL_OMEGA.wallets.DAO_TREASURY}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-around;text-align:center;margin:25px 0;">
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">${totalVerified}</div><div style="font-size:12px;color:#888;">Verified</div></div>
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">$${totalRevenue.toFixed(2)}</div><div style="font-size:12px;color:#888;">Total</div></div>
      <div><div style="font-size:28px;font-weight:800;color:#e63946;">${daysToLaunch}</div><div style="font-size:12px;color:#888;">Days Left</div></div>
    </div>
    <p>This week: <strong>${highlight}</strong></p>
    <div style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;">
      <strong>Josh Coleman</strong><br>
      <span style="color:#888;font-size:13px;">Founder — YouAndINotAI.com<br>Built with AI. Funded by humans. Verified on-chain.</span>
    </div>
  </div>
</div>`,
  };
}

export function dailyBriefEmail(
  revenue: number,
  customers: number,
  verifications: number,
  subscriptions: number,
  balanceAvailable: number,
  balancePending: number,
  daysToLaunch: number,
  issues: string[]
): EmailPayload {
  const target = PROTOCOL_OMEGA.PRE_ORDER_TARGET;
  const pct = ((revenue / target) * 100).toFixed(1);
  const dailyNeeded = daysToLaunch > 0 ? ((target - revenue) / daysToLaunch).toFixed(2) : "0";

  return {
    to: EMAIL_CONFIG.FROM_EMAIL,
    subject: `SENTRY DAILY: $${revenue.toFixed(2)} revenue | ${daysToLaunch}d to launch | ${pct}% of target`,
    html: `
<div style="font-family:monospace;max-width:600px;margin:0 auto;color:#333;padding:20px;">
  <h2 style="color:#e63946;">OMEGA SENTRY — DAILY BRIEF</h2>
  <pre style="background:#f5f5f5;padding:15px;border-radius:8px;font-size:13px;">
REVENUE:       $${revenue.toFixed(2)} / $${target.toFixed(2)} (${pct}%)
DAILY NEEDED:  $${dailyNeeded}/day
CUSTOMERS:     ${customers}
VERIFICATIONS: ${verifications}
SUBSCRIPTIONS: ${subscriptions}
BALANCE:       $${(balanceAvailable / 100).toFixed(2)} avail / $${(balancePending / 100).toFixed(2)} pending
DAYS LEFT:     ${daysToLaunch}
ISSUES:        ${issues.length > 0 ? issues.join(", ") : "None"}
  </pre>
  <p style="font-size:12px;color:#888;">Protocol Omega | Gospel V1.4.1 | Until no kid is in need</p>
</div>`,
  };
}
