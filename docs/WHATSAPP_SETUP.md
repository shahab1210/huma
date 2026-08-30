# WhatsApp Business Cloud API Setup Guide

## Overview
Huma Mehendi & Beauty Artist uses the Meta WhatsApp Business Cloud API to send OTP verification codes via WhatsApp during customer registration and password recovery.

## Prerequisites
- A Facebook account
- A Meta Business Portfolio (formerly Business Manager)
- A phone number not already registered with WhatsApp or WhatsApp Business

## Step-by-Step Setup

### 1. Create a Meta Business Portfolio
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a new business portfolio or use an existing one
3. Verify your business identity if required

### 2. Set Up WhatsApp Business Account
1. Navigate to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add WhatsApp product to your app
4. A test WhatsApp Business Account and phone number are auto-provisioned

### 3. Get Your Credentials

#### Access Token
1. In the App Dashboard → WhatsApp → API Setup
2. Generate a temporary access token (valid 24h) for testing
3. For production: Create a System User in Business Settings → generate a permanent token

#### Phone Number ID
1. In API Setup, your phone number and its ID are displayed
2. Copy the **Phone number ID** (not the phone number itself)

#### Business Account ID
1. Found in WhatsApp → API Setup → WhatsApp Business Account ID

### 4. Create the OTP Authentication Template

1. Go to WhatsApp → Message Templates
2. Click "Create Template"
3. Category: **Authentication**
4. Template Name: `huma_otp_verification`
5. Language: English
6. Body text:
   ```
   Your Huma Mehendi & Beauty Artist verification code is {{1}}.
   
   This code expires in 5 minutes.
   Do not share this code with anyone.
   ```
7. Add a **Copy Code** button (button type: Copy Code, with {{1}} parameter)
8. Submit for review — Meta typically approves authentication templates within minutes

### 5. Configure Environment Variables

Add these to your backend `.env` file:

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
WHATSAPP_API_VERSION=v21.0
WHATSAPP_OTP_TEMPLATE_NAME=huma_otp_verification
```

### 6. Register Your Production Phone Number
1. In API Setup → Add Phone Number
2. Verify via SMS or voice call
3. Set display name and business profile
4. The phone number must NOT be registered on WhatsApp personal or Business apps

### 7. Going to Production
1. Complete App Review if required
2. Generate a permanent System User token
3. Set up webhook for delivery receipts (optional)
4. Monitor message quality rating in WhatsApp Manager

## Development/Testing Mode
When `WHATSAPP_ACCESS_TOKEN` is empty or contains 'placeholder', the system operates in mock mode:
- OTP codes are logged to the server console
- No actual WhatsApp messages are sent
- All verification logic still works normally

## API Rate Limits
- Meta allows up to 1,000 business-initiated messages per 24 hours on a new number
- Scale up by improving quality rating and requesting higher throughput
- The application enforces its own rate limits (configurable via `OTP_MAX_REQUESTS_PER_NUMBER`)

## Costs
- Meta charges per conversation (24-hour window)
- Authentication conversations have specific pricing per country
- Check [Meta pricing page](https://developers.facebook.com/docs/whatsapp/pricing/) for current rates
- India authentication conversations: approximately $0.004 USD per conversation

## Troubleshooting
| Issue | Solution |
|---|---|
| Template rejected | Ensure category is "Authentication" and content follows Meta guidelines |
| Message not delivered | Check phone number format (must include country code without +) |
| 401 Unauthorized | Regenerate access token; check System User permissions |
| Rate limit exceeded | Wait or request higher throughput tier |
| Phone number quality | Monitor in WhatsApp Manager; respond to quality alerts |
