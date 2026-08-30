const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'Huma Mehendi & Beauty Artist',
    },
    tagline: {
      type: String,
      default: 'Professional Mehendi, Bridal Makeup & Beauty Services',
    },
    phone: {
      type: String,
      default: '8960600371',
    },
    whatsapp: {
      type: String,
      default: '8960600371',
    },
    instagram: {
      type: String,
      default: 'huma_mehendi_06',
    },
    email: {
      type: String,
      default: 'humamehendi1210@gmail.com',
    },
    businessHours: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '23:00' },
      daysOpen: { type: String, default: '7 days/week' },
    },
    bookingAmount: {
      type: Number,
      default: 1500,
    },
    cancellationCharge: {
      type: Number,
      default: 500,
    },
    cancellationWindowDays: {
      type: Number,
      default: 5,
    },
    reservationExpiryMinutes: {
      type: Number,
      default: 15,
    },
    aboutText: {
      type: String,
      default:
        'With over 10 years of experience and 500+ happy customers, Huma Mehendi & Beauty Artist provides premium bridal and occasion services across Lucknow, Kanpur, Raebareli and nearby areas.',
    },
    upiId: {
      type: String,
      default: 'demo@upi',
    },
    upiQrImage: {
      type: String,
      default: '/demo/demo-upi-qr.png',
    },
    paymentWhatsApp: {
      type: String,
      default: '8960600371',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
