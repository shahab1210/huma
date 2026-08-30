# Free Deployment & Database Optimization Cron Guide

This guide explains how to deploy the **Huma Mehendi & Beauty Artist** full-stack website completely for free, using free cloud hosting platforms, a free database tier, and an automated uptime ping/database footprint optimizer.

---

## 1. Free Database Setup (MongoDB Atlas)

MongoDB Atlas offers a permanent free tier (**M0 Sandbox**) providing 512 MB of storage, which is more than enough for thousands of bookings if optimized.

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and build a database selector using the **M0 Free Tier**.
3. Select your cloud provider (e.g., AWS) and region nearest to your customers (e.g., Mumbai/Singapore).
4. Create a database user (username & password) and save these credentials.
5. In Network Access, whitelist `0.0.0.0/0` (allows connection from free backend hosting providers).
6. Copy your **MongoDB Connection URI** (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/huma_mehendi?retryWrites=true&w=majority`).
7. Paste this connection URI as the `MONGO_URI` in your backend environment configuration.

---

## 2. Free Backend Hosting (Render / Koyeb)

Free cloud hosting platforms (like Render.com or Koyeb.com) spin down/hibernate web servers after 15 minutes of inactivity to conserve resources. We will prevent this using a keep-alive ping.

### Option A: Render.com (Recommended)
1. Sign up for a free account at [Render](https://render.com).
2. Click **New** → **Web Service**.
3. Connect your repository containing the codebase.
4. Configure service settings:
   - **Environment:** `Node`
   - **Root Directory:** `backend` (or leave blank if repository is backend-only)
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add the variables from your `.env` (including `MONGO_URI`, `JWT_SECRET`, and `CRON_SECRET_KEY`).
6. Deploy the service. Copy your public backend URL (e.g., `https://huma-backend.onrender.com`).

---

## 3. Free Frontend Hosting (Vercel / Netlify)

Vercel and Netlify offer excellent free tiers for React/Vite single-page applications.

### Option A: Vercel (Recommended)
1. Sign up at [Vercel](https://vercel.com).
2. Connect your repository.
3. Import the project. Select the **Vite** configuration.
4. Set the Root Directory to `Design Website from Prompt`.
5. Under Environment Variables, add:
   - `VITE_GOOGLE_CLIENT_ID` (if using Google Auth)
6. Note: Vite proxies requests to the backend during local development, but in production, ensure your frontend calls the backend URL. The frontend context automatically calls fetch requests relative to `/api/...`, meaning Vercel's rewrite rule or configuring a base API URL is recommended. 
7. Deploy the frontend and copy your frontend URL.

---

## 4. Free Keep-Alive & Database Size Cron Setup

To prevent the free backend server from sleeping (spinning down) and to keep the free database tier clean from heavy base64 screenshots, set up a free automated cron scheduler.

### Setup using Cron-Job.org (Recommended)

[Cron-Job.org](https://cron-job.org) is a free, reliable cron service that triggers HTTP requests at regular intervals.

1. Go to [Cron-Job.org](https://cron-job.org) and register a free account.
2. Go to the **Cron Jobs** dashboard and click **Create Cron Job**.
3. Configure the cron job settings:
   - **Title:** `Huma Keep-Alive & DB Pruner`
   - **Address (URL):** `https://YOUR_BACKEND_URL/api/cron/cleanup?secret=YOUR_CRON_SECRET_KEY`
     *(Replace `YOUR_BACKEND_URL` with your Render backend URL, and `YOUR_CRON_SECRET_KEY` with the secret configured in your env, e.g., `huma_mehendi_cron_secret_2026`)*
   - **Request Method:** `GET`
   - **Schedule:** Select **User-defined** / every **12 minutes** (this guarantees the server never reaches the 15-minute hibernation threshold).
4. Click **Create**.

### How it optimizes Database Size:
When this cron runs every 12 minutes:
1. It deletes expired/used OTPs from the database.
2. It deletes expired/invalid admin sessions.
3. It prunes heavy base64 payment proof screenshots from completed bookings (older than 15 days) and cancelled bookings. The payment transaction audit records remain intact, but the heavy image files are purged, keeping database utilization tiny forever.
4. It wakes up the free backend container, ensuring your customers never experience slow cold-start loads when visiting the booking site!
