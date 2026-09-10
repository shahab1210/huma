/**
 * @file emailService.js
 * @description Email OTP delivery service supporting Resend and Gmail SMTP.
 * Mirrors the WhatsApp service pattern with a mock mode fallback.
 */

/**
 * Check whether email sending is configured.
 * @returns {boolean}
 */
const isEmailConfigured = () => {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey.length > 5 && !resendKey.includes('placeholder')) {
    return true;
  }
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  return Boolean(user && pass && user.length > 3 && pass.length > 3 && !pass.includes('placeholder'));
};

/** Lazily created Resend client */
let resendClient = null;
const getResendClient = () => {
  if (resendClient) return resendClient;
  const { Resend } = require('resend');
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

/** Lazily created Nodemailer transporter */
let nodemailerTransporter = null;
const getNodemailerTransporter = () => {
  if (nodemailerTransporter) return nodemailerTransporter;
  const nodemailer = require('nodemailer');
  nodemailerTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return nodemailerTransporter;
};

/**
 * Send a branded OTP email.
 * @param {string} email - Recipient email address
 * @param {string} otpCode - 6-digit OTP
 * @returns {Promise<{success: boolean, messageId?: string, mock?: boolean}>}
 */
const sendOTPEmail = async (email, otpCode) => {
  if (!isEmailConfigured()) {
    console.log(`\n⚠ Email MOCK MODE`);
    console.log(`📧 To: ${email}`);
    console.log(`🔑 OTP: ${otpCode}`);
    console.log(`(Configure RESEND_API_KEY or EMAIL_USER & EMAIL_APP_PASSWORD for real delivery)\n`);
    return { success: true, mock: true };
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

  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
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

  // 2. Fallback to Nodemailer / Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    try {
      const info = await getNodemailerTransporter().sendMail({
        from: `"Huma Mehendi" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Huma Mehendi verification code',
        html: htmlContent,
        text: `Your Huma Mehendi verification code is ${otpCode}. It expires in 5 minutes. Do not share this code with anyone.`,
      });

      console.log(`✓ Email OTP sent to ${email} via Gmail SMTP (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`✕ Gmail SMTP failed for ${email}: ${error.message}`);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  return { success: true, mock: true };
};

module.exports = { sendOTPEmail, isEmailConfigured };
