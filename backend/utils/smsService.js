/**
 * @file smsService.js
 * @description SMS OTP delivery service with pluggable provider support.
 * Supports Fast2SMS (default), Twilio, and MSG91.
 * Mirrors the WhatsApp service pattern with a mock mode fallback.
 */
const axios = require('axios');

/**
 * Check whether SMS sending is configured.
 * @returns {boolean}
 */
const isSmsConfigured = () => {
  const apiKey = process.env.SMS_API_KEY;
  return apiKey && apiKey.length > 5 && !apiKey.includes('placeholder');
};

/**
 * Get the configured SMS provider name.
 * @returns {string} Provider name (fast2sms, twilio, msg91)
 */
const getSmsProvider = () => {
  return (process.env.SMS_PROVIDER || 'fast2sms').toLowerCase();
};

/**
 * Send OTP via Fast2SMS (Indian SMS gateway).
 * @param {string} mobileNumber - 10-digit Indian mobile number (without +91)
 * @param {string} otpCode - 6-digit OTP
 */
const sendViaFast2SMS = async (mobileNumber, otpCode) => {
  const phone = mobileNumber.replace('+91', '').replace(/\D/g, '');
  
  const response = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      variables_values: otpCode,
      route: 'otp',
      numbers: phone,
    },
    {
      headers: {
        authorization: process.env.SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  if (!response.data?.return) {
    throw new Error(response.data?.message?.[0] || 'Fast2SMS delivery failed');
  }

  return { success: true, requestId: response.data.request_id };
};

/**
 * Send OTP via Twilio.
 * @param {string} mobileNumber - Full E.164 number (+91XXXXXXXXXX)
 * @param {string} otpCode - 6-digit OTP
 */
const sendViaTwilio = async (mobileNumber, otpCode) => {
  const accountSid = process.env.SMS_TWILIO_SID;
  const authToken = process.env.SMS_TWILIO_AUTH_TOKEN;
  const from = process.env.SMS_TWILIO_FROM;

  const response = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({
      To: mobileNumber,
      From: from,
      Body: `Your Huma Mehendi verification code is ${otpCode}. It expires in 5 minutes. Do not share this code.`,
    }),
    {
      auth: { username: accountSid, password: authToken },
      timeout: 10000,
    }
  );

  return { success: true, sid: response.data.sid };
};

/**
 * Send OTP via MSG91.
 * @param {string} mobileNumber - Full E.164 number (+91XXXXXXXXXX)
 * @param {string} otpCode - 6-digit OTP
 */
const sendViaMSG91 = async (mobileNumber, otpCode) => {
  const authKey = process.env.SMS_MSG91_AUTH_KEY || process.env.SMS_API_KEY;
  const templateId = process.env.SMS_MSG91_TEMPLATE_ID;

  const response = await axios.post(
    'https://control.msg91.com/api/v5/otp',
    {
      template_id: templateId,
      mobile: mobileNumber.replace('+', ''),
      otp: otpCode,
    },
    {
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  if (response.data.type !== 'success') {
    throw new Error(response.data.message || 'MSG91 delivery failed');
  }

  return { success: true, requestId: response.data.request_id };
};

/**
 * Send an SMS OTP via the configured provider.
 * @param {string} mobileNumber - Normalized phone number (+91XXXXXXXXXX)
 * @param {string} otpCode - The 6-digit OTP code
 * @returns {Promise<{success: boolean, mock?: boolean}>}
 */
const sendSMSOTP = async (mobileNumber, otpCode) => {
  // Feature flag: SMS OTP can be temporarily disabled via environment variable
  const smsEnabled = process.env.SMS_OTP_ENABLED;
  if (smsEnabled === 'false' || smsEnabled === '0') {
    console.log(`⚠ SMS OTP is temporarily disabled (SMS_OTP_ENABLED=${smsEnabled})`);
    throw new Error('SMS OTP is temporarily unavailable. Please use WhatsApp or Email verification.');
  }

  if (!isSmsConfigured()) {
    console.log(`\n⚠ SMS MOCK MODE`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`🔑 OTP: ${otpCode}`);
    console.log(`(Configure SMS_API_KEY and SMS_PROVIDER for real delivery)\n`);
    return { success: true, mock: true };
  }

  const provider = getSmsProvider();

  try {
    let result;

    switch (provider) {
      case 'twilio':
        result = await sendViaTwilio(mobileNumber, otpCode);
        break;
      case 'msg91':
        result = await sendViaMSG91(mobileNumber, otpCode);
        break;
      case 'fast2sms':
      default:
        result = await sendViaFast2SMS(mobileNumber, otpCode);
        break;
    }

    console.log(`✓ SMS OTP sent to ${mobileNumber} via ${provider}`);
    return result;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error(`✕ SMS OTP failed for ${mobileNumber} via ${provider}: ${errMsg}`);
    throw new Error(`SMS delivery failed: ${errMsg}`);
  }
};

module.exports = { sendSMSOTP, isSmsConfigured, getSmsProvider };
