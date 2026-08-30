/**
 * @file googleAuthService.js
 * @description Google token verification service.
 */
const { OAuth2Client } = require('google-auth-library');

let client = null;

/**
 * Get or create the Google OAuth2 client.
 * @returns {OAuth2Client|null} The initialized OAuth2Client or null if not configured
 */
const getGoogleClient = () => {
  if (client) return client;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn('⚠ GOOGLE_CLIENT_ID not configured — Google auth disabled');
    return null;
  }
  client = new OAuth2Client(clientId);
  return client;
};

/**
 * Check whether Google auth is configured.
 * @returns {boolean} True if configured, false otherwise
 */
const isGoogleConfigured = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  return clientId && clientId.length > 10 && !clientId.includes('placeholder');
};

/**
 * Verify a Google ID token server-side.
 * @param {string} idToken - The token from Google Identity Services
 * @returns {Promise<{googleId: string, email: string, name: string, emailVerified: boolean, picture: string}>}
 * @throws {Error} If verification fails
 */
const verifyGoogleToken = async (idToken) => {
  const googleClient = getGoogleClient();
  if (!googleClient) {
    throw new Error('Google authentication is not configured.');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload.');
    }

    return {
      googleId: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      emailVerified: payload.email_verified || false,
      picture: payload.picture || '',
    };
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new Error('Failed to verify Google identity. Please try again.');
  }
};

module.exports = { verifyGoogleToken, isGoogleConfigured };
