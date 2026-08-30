/**
 * @file phoneUtils.js
 * @description Utilities for normalizing and manipulating phone numbers.
 */
const { ApiError } = require('../middleware/errorHandler');

/**
 * Normalize an Indian mobile number to +91XXXXXXXXXX format.
 * Strips spaces, dashes, dots, parentheses.
 * Accepts: 8960600371, 08960600371, 918960600371, +918960600371, 91-8960600371
 * Returns: +918960600371
 * Throws ApiError if invalid.
 * 
 * @param {string} input - The raw phone number input.
 * @returns {string} The normalized phone number.
 */
const normalizeMobile = (input) => {
  if (!input || typeof input !== 'string') {
    throw new ApiError(400, 'Mobile number is required.');
  }

  // Strip all non-digit characters
  let digits = input.replace(/[^\d]/g, '');

  // Remove leading 0
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Remove leading 91 country code if present (and resulting number is 10 digits)
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Validate: must be exactly 10 digits, starting with 6-9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new ApiError(400, 'Please enter a valid 10-digit Indian mobile number.');
  }

  return `+91${digits}`;
};

/**
 * Extract the 10-digit local number from a normalized +91XXXXXXXXXX number.
 * 
 * @param {string} normalizedNumber - The normalized phone number.
 * @returns {string} The 10-digit local number.
 */
const getLocalNumber = (normalizedNumber) => {
  return normalizedNumber.replace('+91', '');
};

module.exports = { normalizeMobile, getLocalNumber };
