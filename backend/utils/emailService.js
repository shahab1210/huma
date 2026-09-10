/**
 * @file emailService.js
 * @description Real Email OTP delivery service supporting Gmail SMTP (primary) and Resend.
 * Strictly enforces real email delivery and returns clear errors when delivery fails.
 */

/**
 * Retrieve and sanitize email credentials from environment variables.
 * Checks EMAIL_USER, EMAIL_APP_PASSWORD and common fallback aliases.
 */
const getEmailCredentials = () => {
  const user = (
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    ''
  ).trim();

  const pass = (
    process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    ''
  ).replace(/\s+/g, '').trim();

  const resendKey = (process.env.RESEND_API_KEY || '').trim();

  return { user, pass, resendKey };
};

/**
 * Check whether email sending is configured with valid credentials.
 * @returns {boolean}
 */
const isEmailConfigured = () => {
  const { user, pass, resendKey } = getEmailCredentials();
  if (user && pass && user.length > 3 && pass.length > 3 && !pass.includes('placeholder')) {
    return true;
  }
  if (resendKey && resendKey.length > 5 && !resendKey.includes('placeholder')) {
    return true;
  }
  return false;
};

/** Lazily created Resend client */
let resendClient = null;
const getResendClient = () => {
  if (resendClient) return resendClient;
  const { Resend } = require('resend');
  const { resendKey } = getEmailCredentials();
  resendClient = new Resend(resendKey);
  return resendClient;
};

/** Create Nodemailer transporter for Gmail SMTP */
const getNodemailerTransporter = () => {
  const nodemailer = require('nodemailer');
  const { user, pass } = getEmailCredentials();

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send a branded OTP email via real Gmail SMTP.
 * @param {string} email - Recipient email address
 * @param {string} otpCode - 6-digit OTP
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendOTPEmail = async (email, otpCode) => {
  const { user: emailUser, pass: emailPass, resendKey } = getEmailCredentials();

  const hasGmailConfig = Boolean(
    emailUser &&
    emailPass &&
    emailUser.length > 3 &&
    emailPass.length > 3 &&
    !emailPass.includes('placeholder')
  );

  const hasResendConfig = Boolean(
    resendKey &&
    resendKey.length > 5 &&
    !resendKey.includes('placeholder')
  );

  // If no email delivery credentials are set, fail immediately
  if (!hasGmailConfig && !hasResendConfig) {
    const errorMsg = 'Email service is not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD in environment variables.';
    console.error(`✕ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FBF7F0; }
        .container { max-width: 480px; margin: 0 auto; padding: 32px 24px; }
        .card { background: #FFFFFF; border-radius: 12px; padding: 32px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .brand { color: #2F4B3C; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px; font-family: Georgia, 'Times New Roman', serif; }
        .tagline { color: #C9A46A; font-size: 12px; text-align: center; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px; }
        .text { color: #3A2F28; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .otp-box { background: #F5F0E8; border: 2px solid #C9A46A; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2F4B3C; font-family: 'Courier New', monospace; }
        .expiry { color: #C9A46A; font-size: 12px; margin-top: 8px; font-weight: 600; }
        .warning { background: #FFF8E1; border-left: 3px solid #C9A46A; padding: 12px 16px; margin-top: 20px; border-radius: 0 8px 8px 0; }
        .warning-text { color: #8B7355; font-size: 12px; line-height: 1.5; margin: 0; }
        .footer { text-align: center; margin-top: 24px; color: #9E9E9E; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">Huma Mehendi</div>
          <div class="tagline">Professional Mehendi &amp; Beauty Artist</div>
          
          <p class="text">Hello,</p>
          <p class="text">Here is your verification code for Huma Mehendi:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="expiry">Expires in 5 minutes</div>
          </div>
          
          <div class="warning">
            <p class="warning-text">
              ⚠️ Never share this code with anyone. Huma Mehendi will never ask for your OTP via phone, WhatsApp, or email.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>If you did not request this code, please ignore this email.</p>
          <p>&copy; Huma Mehendi &amp; Beauty Artist</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Primary: Try Gmail SMTP via Nodemailer
  if (hasGmailConfig) {
    try {
      const transporter = getNodemailerTransporter();
      const info = await transporter.sendMail({
        from: `"Huma Mehendi" <${emailUser}>`,
        to: email,
        subject: 'Your Huma Mehendi verification code',
        html: htmlContent,
        text: `Your Huma Mehendi verification code is ${otpCode}. It expires in 5 minutes. Do not share this code with anyone.`,
      });

      console.log(`✓ Email OTP sent to ${email} via Gmail SMTP (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`✕ Gmail SMTP failed for ${email}: ${error.message}`);
      if (!hasResendConfig) {
        throw new Error(`Gmail SMTP delivery failed: ${error.message}`);
      }
      console.log(`Attempting fallback to Resend for ${email}...`);
    }
  }

  // 2. Secondary: Try Resend if configured
  if (hasResendConfig) {
    try {
      const fromAddress = process.env.EMAIL_FROM || 'Huma Mehendi <noreply@humamehendi.in>';
      const { data, error } = await getResendClient().emails.send({
        from: fromAddress,
        to: [email],
        subject: 'Your Huma Mehendi verification code',
        html: htmlContent,
        text: `Your Huma Mehendi verification code is ${otpCode}. It expires in 5 minutes. Do not share this code with anyone.`,
      });

      if (error) {
        console.error(`✕ Resend email error for ${email}:`, error);
        throw new Error(error.message || 'Resend delivery failed');
      }

      console.log(`✓ Email OTP sent to ${email} via Resend (messageId: ${data?.id || 'unknown'})`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`✕ Resend failed for ${email}: ${err.message}`);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  throw new Error('Email service failed to deliver OTP.');
};

module.exports = { sendOTPEmail, isEmailConfigured, getEmailCredentials };
