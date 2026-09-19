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

  try {
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
  } catch (error) {
    console.error(`✕ WhatsApp sendTemplateMessage error:`);
    console.error(`  - Template: ${templateName}`);
    console.error(`  - Recipient: ${to}`);
    console.error(`  - API URL: ${url}`);
    console.error(`  - HTTP Status: ${error.response?.status || error.status || 'N/A'}`);
    console.error(`  - Response Data:`, JSON.stringify(error.response?.data || error.message, null, 2));
    throw error;
  }
};

/**
 * Send a WhatsApp booking confirmation message.
 * Template: huma_booking_confirmation (6 body params)
 * {{1}} = Customer Name
 * {{2}} = Booking ID
 * {{3}} = Service Name
 * {{4}} = Date
 * {{5}} = Time Slot
 * {{6}} = Advance Paid
 */
const sendBookingConfirmation = async (mobileNumber, { customerName, bookingId, serviceName, date, time, advancePaid }) => {
  const templateName = process.env.WHATSAPP_CONFIRMATION_TEMPLATE_NAME || 'huma_booking_confirmation';
  
  const advancePaidText = advancePaid.toString().startsWith('₹') ? advancePaid.toString() : `₹${advancePaid}`;

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp CONFIRMATION MOCK MODE`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`Customer: ${customerName}`);
    console.log(`HM Booking ID: ${bookingId}`);
    console.log(`Service: ${serviceName}`);
    console.log(`Date: ${date}`);
    console.log(`Time: ${time}`);
    console.log(`Advance Paid: ${advancePaidText}\n`);
    return { success: true, mock: true };
  }
  
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: bookingId },
        { type: 'text', text: serviceName },
        { type: 'text', text: date },
        { type: 'text', text: time },
        { type: 'text', text: advancePaidText },
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

/**
 * Flow 1: Send admin alert when customer submits payment proof for a new booking.
 * Template: huma_admin_new_booking_alert (7 body params)
 * {{1}} = Booking ID
 * {{2}} = Customer
 * {{3}} = Mobile
 * {{4}} = Service
 * {{5}} = Appointment
 * {{6}} = Location
 * {{7}} = Payment Status
 */
const sendAdminNewBookingAlert = async (adminNumber, { bookingId, customerName, customerMobile, serviceName, dateTime, location, paymentStatus }) => {
  const templateName = 'huma_admin_new_booking_alert';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${adminNumber}`);
    console.log(`Booking: ${bookingId}, Customer: ${customerName}, Mobile: ${customerMobile}`);
    console.log(`Service: ${serviceName}, DateTime: ${dateTime}, Location: ${location}, Payment Status: ${paymentStatus}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingId },
        { type: 'text', text: customerName },
        { type: 'text', text: customerMobile },
        { type: 'text', text: serviceName },
        { type: 'text', text: dateTime },
        { type: 'text', text: location },
        { type: 'text', text: paymentStatus },
      ],
    },
  ];

  return sendTemplateMessage(adminNumber, templateName, components);
};

/**
 * Flow 4: Send customer notification when admin approves partial payment.
 * Template: huma_partial_payment_approval (5 body params)
 * {{1}} = Customer name
 * {{2}} = Booking ID
 * {{3}} = Amount Verified
 * {{4}} = Remaining Balance
 * {{5}} = Admin Note
 */
const sendPartialPaymentApproval = async (mobileNumber, { customerName, bookingId, verifiedAmount, remainingAmount, adminNote }) => {
  const templateName = 'huma_partial_payment_approval';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`Customer: ${customerName}, Booking: ${bookingId}, Verified: ${verifiedAmount}, Remaining: ${remainingAmount}, Note: ${adminNote}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: bookingId },
        { type: 'text', text: verifiedAmount },
        { type: 'text', text: remainingAmount },
        { type: 'text', text: adminNote },
      ],
    },
  ];

  return sendTemplateMessage(mobileNumber, templateName, components);
};

/**
 * Flow 5: Send admin alert when customer requests cancellation.
 * Template: huma_admin_cancellation_alert (7 body params)
 * {{1}} = Booking ID
 * {{2}} = Customer
 * {{3}} = Mobile
 * {{4}} = Service
 * {{5}} = Appointment
 * {{6}} = Requested At
 * {{7}} = Reason
 */
const sendAdminCancellationAlert = async (adminNumber, { bookingId, customerName, customerMobile, serviceName, appointmentDateTime, cancellationRequestedAt, cancellationReason }) => {
  const templateName = 'huma_admin_cancellation_alert';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${adminNumber}`);
    console.log(`Booking: ${bookingId}, Customer: ${customerName}, Mobile: ${customerMobile}`);
    console.log(`Service: ${serviceName}, Appointment: ${appointmentDateTime}, RequestedAt: ${cancellationRequestedAt}, Reason: ${cancellationReason}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingId },
        { type: 'text', text: customerName },
        { type: 'text', text: customerMobile },
        { type: 'text', text: serviceName },
        { type: 'text', text: appointmentDateTime },
        { type: 'text', text: cancellationRequestedAt },
        { type: 'text', text: cancellationReason },
      ],
    },
  ];

  return sendTemplateMessage(adminNumber, templateName, components);
};

/**
 * Flow 6: Send admin alert when customer requests reschedule.
 * Template: huma_admin_reschedule_alert (6 body params)
 */
const sendAdminRescheduleAlert = async (adminNumber, { bookingId, customerName, customerMobile, currentDateTime, requestedDateTime, reason }) => {
  const templateName = 'huma_admin_reschedule_alert';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${adminNumber}`);
    console.log(`Booking: ${bookingId}, Customer: ${customerName}, Mobile: ${customerMobile}`);
    console.log(`Current: ${currentDateTime}, Requested: ${requestedDateTime}, Reason: ${reason}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingId },
        { type: 'text', text: customerName },
        { type: 'text', text: customerMobile },
        { type: 'text', text: currentDateTime },
        { type: 'text', text: requestedDateTime },
        { type: 'text', text: reason },
      ],
    },
  ];

  return sendTemplateMessage(adminNumber, templateName, components);
};

/**
 * Flow 7: Send customer notification when admin approves cancellation.
 * Template: huma_cancellation_approved (4 body params)
 * {{1}} = Customer name
 * {{2}} = Booking ID
 * {{3}} = Refund Status
 * {{4}} = Note
 */
const sendCancellationApproved = async (mobileNumber, { customerName, bookingId, refundStatus, adminNote }) => {
  const templateName = 'huma_cancellation_approved';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`Customer: ${customerName}, Booking: ${bookingId}, Refund Status: ${refundStatus}, Note: ${adminNote}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: bookingId },
        { type: 'text', text: refundStatus },
        { type: 'text', text: adminNote },
      ],
    },
  ];

  return sendTemplateMessage(mobileNumber, templateName, components);
};

/**
 * Flow 8: Send customer notification when admin rejects cancellation.
 * Template: huma_cancellation_rejected (4 body params)
 * {{1}} = Customer name
 * {{2}} = Booking ID
 * {{3}} = Appointment
 * {{4}} = Admin Reason
 */
const sendCancellationRejected = async (mobileNumber, { customerName, bookingId, appointmentDateTime, cancellationRejectionReason }) => {
  const templateName = 'huma_cancellation_rejected';

  if (!isWhatsAppConfigured()) {
    console.log(`\n⚠ WhatsApp MOCK — ${templateName}`);
    console.log(`📱 To: ${mobileNumber}`);
    console.log(`Customer: ${customerName}, Booking: ${bookingId}, Appointment: ${appointmentDateTime}, Reason: ${cancellationRejectionReason}\n`);
    return { success: true, mock: true };
  }

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: bookingId },
        { type: 'text', text: appointmentDateTime },
        { type: 'text', text: cancellationRejectionReason },
      ],
    },
  ];

  return sendTemplateMessage(mobileNumber, templateName, components);
};

module.exports = {
  sendWhatsAppOtp,
  sendTemplateMessage,
  sendBookingConfirmation,
  sendPaymentRejection,
  sendAdminNewBookingAlert,
  sendPartialPaymentApproval,
  sendAdminCancellationAlert,
  sendAdminRescheduleAlert,
  sendCancellationApproved,
  sendCancellationRejected,
  isWhatsAppConfigured,
};
