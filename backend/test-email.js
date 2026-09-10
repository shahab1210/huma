/**
 * Test script for Gmail SMTP OTP delivery
 * Usage: node test-email.js your-email@example.com
 */
require('dotenv').config();
const { sendOTPEmail, getEmailCredentials } = require('./utils/emailService');

const targetEmail = process.argv[2] || process.env.EMAIL_USER;

if (!targetEmail) {
  console.error('Usage: node test-email.js <recipient-email@example.com>');
  process.exit(1);
}

const credentials = getEmailCredentials();
console.log('\n--- Email Configuration Check ---');
console.log('EMAIL_USER:', credentials.user || '(not set)');
console.log('EMAIL_APP_PASSWORD:', credentials.pass ? '✓ Configured (' + credentials.pass.length + ' chars)' : '✕ Missing');
console.log('Sending test OTP to:', targetEmail);
console.log('---------------------------------\n');

if (!credentials.user || !credentials.pass) {
  console.error('✕ Please set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env first.');
  process.exit(1);
}

sendOTPEmail(targetEmail, '654321')
  .then((res) => {
    console.log('\n✅ SUCCESS: Test OTP email sent successfully!');
    console.log('Message ID:', res.messageId);
    console.log('Check the inbox of:', targetEmail, '\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ FAILED: Could not send email:');
    console.error(err.message);
    console.log('\nTips:');
    console.log('1. Make sure 2-Step Verification is enabled on your Google Account.');
    console.log('2. Generate a 16-character App Password at: https://myaccount.google.com/apppasswords');
    console.log('3. Put the 16-character password into backend/.env as EMAIL_APP_PASSWORD=xxxx');
    process.exit(1);
  });
