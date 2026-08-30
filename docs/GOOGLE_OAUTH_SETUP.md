# Google OAuth Setup Guide

## Overview
Huma Mehendi & Beauty Artist uses Google Identity Services (GIS) for optional "Continue with Google" authentication. Google authentication is supplementary — every customer account still requires a verified mobile number.

## Prerequisites
- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Huma Mehendi Auth" (or similar)
3. Ensure billing is enabled (OAuth itself is free)

### 2. Configure OAuth Consent Screen
1. Navigate to APIs & Services → OAuth consent screen
2. User Type: **External** (for customer-facing app)
3. Fill in:
   - App name: "Huma Mehendi & Beauty Artist"
   - User support email: humamehendi1210@gmail.com
   - Developer contact: humamehendi1210@gmail.com
4. Scopes: Add `email`, `profile`, `openid`
5. Test users: Add your test accounts during development
6. Submit for verification before production launch

### 3. Create OAuth 2.0 Client ID
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: "Huma Mehendi Web Client"
5. Authorized JavaScript origins:
   - Development: `http://localhost:8443`
   - Production: `https://yourdomain.com`
6. Authorized redirect URIs:
   - Not required for GIS (popup/one-tap mode)
7. Click Create

### 4. Get Credentials
- **Client ID**: `xxxxxxxxx.apps.googleusercontent.com` (safe for frontend)
- **Client Secret**: `GOCSPX-xxxxxxx` (BACKEND ONLY — never expose)

### 5. Configure Environment Variables

Backend `.env`:
```env
GOOGLE_CLIENT_ID=xxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxx
```

Frontend (create `.env` or `.env.local` in frontend root):
```env
VITE_GOOGLE_CLIENT_ID=xxxxxxxxx.apps.googleusercontent.com
```

> ⚠️ NEVER put GOOGLE_CLIENT_SECRET in frontend code or environment variables prefixed with VITE_.

### 6. How It Works in Huma

1. Frontend loads Google Identity Services script
2. Customer clicks "Continue with Google"
3. Google popup authenticates the user
4. Frontend receives an `id_token` (JWT)
5. Frontend sends `id_token` to backend `POST /api/auth/google`
6. Backend verifies the token using `google-auth-library`
7. Backend checks for existing linked account
8. If new customer: requires mobile number + WhatsApp OTP verification

### 7. Production Checklist
- [ ] OAuth consent screen verified by Google
- [ ] Production domain added to authorized origins
- [ ] Client secret stored securely (environment variables only)
- [ ] HTTPS enforced in production
- [ ] Rate limiting on Google auth endpoint

### 8. Security Notes
- The `id_token` is verified server-side using Google's public keys
- Frontend never sends or stores user credentials
- Google Client Secret is only used server-side for token verification
- Tokens are single-use and short-lived

## Troubleshooting
| Issue | Solution |
|---|---|
| Popup blocked | Ensure popup is triggered by user click, not auto-opened |
| origin_mismatch | Add exact origin (including port) to authorized origins |
| Invalid client ID | Verify GOOGLE_CLIENT_ID matches in both frontend and backend |
| Token verification fails | Ensure backend GOOGLE_CLIENT_ID matches the one used to generate the token |
