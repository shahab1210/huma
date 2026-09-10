/**
 * @file whatsappService.js
 * @description WhatsApp Cloud API integration service with dev mock mode.
 */
const axios = require('axios');

/**
 * WhatsApp Business Cloud API Service
 * Uses Meta Graph API to send template messages.
 * 
 * In dev mode (when WHATSAPP_ACCESS_TOKEN is empty/placeholder),
 * falls back to console logging (mirrors Razorpay mock pattern).
 */

const isWhatsAppConfigured = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  return token && !token.includes('placeholder') && token.length > 10;
};

/**
 * Send an OTP via WhatsApp authentication template.
 * @param {string} mobileNumber - Normalized phone number (+91XXXXXXXXXX)
 * @param {string} otpCode - The 6-digit OTP code
 * @returns {Promise<{success: boolean, messageId?: string, mock?: boolean}>}
 */
const sendWhatsAppOtp = async (mobileNumber, otpCode) => {
  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK MODE`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`🔑 OTP: ${otpCode}`);
    console.log(`(Configure WHATSAPP_ACCESS_TOKEN for real delivery)\n`);
    return { success: true, mock: true };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v26.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'huma_otp_verification';
  const langCode = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const cleanTo = mobileNumber.replace('+', '');

  // Helper to try sending with specific button component structure
  const trySend = async (buttonSubType, paramType, paramKey) => {
    return axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: langCode },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otpCode,
                },
              ],
            },
            {
              type: 'button',
              sub_type: buttonSubType,
              index: '0',
              parameters: [
                {
                  type: paramType,
                  [paramKey]: otpCode,
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
  };

  try {
    // Primary: Meta auth template with copy_code / text parameter
    let response;
    try {
      response = await trySend('copy_code', 'text', 'text');
    } catch (primaryErr) {
      // If copy_code fails, try url button type fallback
      try {
        response = await trySend('url', 'text', 'text');
      } catch (fallbackErr) {
        // If that fails, try coupon_code param fallback
        try {
          response = await trySend('copy_code', 'coupon_code', 'coupon_code');
        } catch {
          // Throw original primary error for clarity
          throw primaryErr;
        }
      }
    }

    const messageId = response.data?.messages?.[0]?.id;
    console.log(`✓ WhatsApp OTP sent to ${mobileNumber} (message: ${messageId})`);
    return { success: true, messageId };
  } catch (error) {
    const dataErr = error.response?.data?.error;
    const errMsg = dataErr?.message || dataErr?.error_user_msg || error.message;
    console.error(`✕ WhatsApp OTP failed for ${mobileNumber}:`, JSON.stringify(error.response?.data || error.message));
    throw new Error(errMsg);
  }
};

/**
 * Send a generic WhatsApp template message.
 * For future use: booking confirmations, reminders, etc.
 * @param {string} to - The recipient's phone number
 * @param {string} templateName - The name of the template to send
 * @param {Array} components - Optional components for the template
 * @returns {Promise<{success: boolean, messageId?: string, mock?: boolean}>}
 */
const sendTemplateMessage = async (to, templateName, components = []) => {
  if (!isWhatsAppConfigured()) {
    console.log(`⚠ WhatsApp MOCK — template "${templateName}" to ${to}`);
    return { success: true, mock: true };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v26.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: to.replace('+', ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return { success: true, messageId: response.data?.messages?.[0]?.id };
};

/**
 * Send a WhatsApp booking confirmation message.
 */
const sendBookingConfirmation = async (mobileNumber, { bookingId, serviceName, date, time, advancePaid }) => {
  const templateName = process.env.WHATSAPP_CONFIRMATION_TEMPLATE_NAME || 'huma_booking_confirmation';
  
  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp CONFIRMATION MOCK MODE`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`HM Booking ID: ${bookingId}`);
    console.log(`Service: ${serviceName}`);
    console.log(`Date: ${date}`);
    console.log(`Time: ${time}`);
    console.log(`Advance Paid: ₹${advancePaid}\n`);
    return { success: true, mock: true };
  }
  
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingId },
        { type: 'text', text: serviceName },
        { type: 'text', text: date },
        { type: 'text', text: time },
        { type: 'text', text: advancePaid.toString() }
      ]
    }
  ];
  
  return sendTemplateMessage(mobileNumber, templateName, components);
};

/**
 * Send a WhatsApp payment rejection message.
 */
const sendPaymentRejection = async (mobileNumber, { bookingId, rejectionReason }) => {
  const templateName = process.env.WHATSAPP_REJECTION_TEMPLATE_NAME || 'huma_payment_rejection';
  
  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp REJECTION MOCK MODE`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`HM Booking ID: ${bookingId}`);
    console.log(`Reason: ${rejectionReason}\n`);
    return { success: true, mock: true };
  }
  
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingId },
        { type: 'text', text: rejectionReason }
      ]
    }
  ];
  
  return sendTemplateMessage(mobileNumber, templateName, components);
};

module.exports = {
  sendWhatsAppOtp,
  sendTemplateMessage,
  sendBookingConfirmation,
  sendPaymentRejection,
  isWhatsAppConfigured,
};
