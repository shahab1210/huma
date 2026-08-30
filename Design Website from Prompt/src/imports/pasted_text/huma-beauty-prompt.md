# HUMA MEHENDI & BEAUTY ARTIST — FRONTEND BUILD PROMPT
### (Ready to send to a developer / AI website builder)

---

You are a senior UI/UX designer and React frontend engineer.

Build a production-quality, mobile-first frontend for a premium local bridal beauty booking platform called:

**"Huma Mehendi & Beauty Artist"**

Tagline: **"Beautiful Art. Beautiful You. Beautiful Moments."**

The business provides:
1. Mehendi services
2. Bridal and occasion makeup
3. Parlour/beauty services

Service areas: Lucknow, Kanpur, Raebareli, Bachhrawan, Lalganj, and nearby areas around Raebareli.

Business experience: 10+ years of experience, 500+ customers served.

Contact:
- Phone: 8960600371
- WhatsApp: 8960600371
- Instagram: @huma_mehendi_06
- Email: humamehendi1210@gmail.com

Business hours: 7 days a week, 10:00 AM – 11:00 PM.

There is no separate travel charge. A minimum online booking amount is required.

---

## 1. CORE BUSINESS MODEL (reflect this in the UI everywhere money is shown)

The customer pays a fixed **₹1,500 booking amount** online via Razorpay to confirm a booking.

- ₹1,500 is the online booking amount only.
- Razorpay charges are absorbed by Huma — never shown as an extra charge to the customer.
- The remaining amount is paid directly to the service provider after the service is completed — never collected online.
- If the total booking value is ₹1,500 or less, the customer pays the applicable (lower) amount — never more than the total.
- Example: Total = ₹5,000 → Online Booking Amount = ₹1,500 → Remaining = ₹3,500

Always label these two amounts explicitly and separately:
- **"Online Booking Amount"**
- **"Remaining Amount — Pay directly to the service provider after service."**

Never imply the remaining amount is paid online.

---

## 2. TECHNOLOGY STACK

- React + Vite
- React Router
- Tailwind CSS
- Axios
- Context API or Redux where genuinely useful
- Form validation
- Fully responsive, mobile-first
- Reusable component architecture

The frontend talks to a separate Node.js/Express backend via REST APIs. Do NOT hard-code production services, designs, prices, slots, or bookings — all dynamic business data comes from APIs.

Environment variables required: API base URL, Razorpay public key. Never expose backend secrets in the frontend.

If a backend API isn't available yet, build a clean API service layer (`/src/services/api/...`) and use clearly-labeled temporary mock data for development only — the architecture must connect to the real backend without rewriting components.

---

## 3. VISUAL DESIGN SYSTEM

**Design reference:** the layout rhythm, card structure, and header/hero pattern of the Wix "Pure — Natural Organic Skin Care" template (soft blurred botanical hero, translucent floating header, serif headline pairing, simple bordered product/service cards with image → title → thin divider → duration/price → button). Re-skin this entirely in Huma's own palette, typography, and bridal/mehendi photography — do not reuse the reference's purple/lavender color or spa-product photography.

**Overall tone:** Premium, elegant, clean, Indian bridal aesthetic, modern, warm, trustworthy. Photography is the visual hero — avoid busy patterns and heavy shadows.

### 3.1 Color palette

| Role | Hex | Usage |
|---|---|---|
| Base background | `#FBF7F0` | Page background (light cream) |
| Surface | `#FFFFFF` | Cards, header bar |
| Primary brand | `#2F4B3C` | Headlines, nav text, primary buttons (deep mehendi green) |
| Accent | `#C9A46A` | Dividers, hover states, icons, price highlight (soft gold) |
| Text (body) | `#3A2F28` | Paragraph text (dark brown/charcoal) |
| Text (muted) | `#7A6D63` | Secondary text — duration, category labels |
| Border | `#E7DFD3` | Card borders, hairline dividers |
| Status – available | `#4C7A5A` | "Available" badges |
| Status – blocked/booked | `#B5654A` | "Booked/Blocked" badges (never harsh red) |

### 3.2 Typography

- **Headings / display** (H1–H3, hero headline, card titles): elegant serif — "Playfair Display", "Cormorant Garamond", or "Marcellus" (Google Fonts)
- **Body / UI text** (nav, buttons, descriptions, prices): clean sans-serif — "Inter" or "Poppins", weight 400–500
- Hero headline: large serif, tight leading, brand-green
- Card title: serif, single line, ellipsis-truncate if too long
- Price/duration: sans, muted color, smaller size, placed below a thin gold divider

### 3.3 Header / Navigation

- Sticky header: semi-transparent cream background with blur over hero imagery; solid cream elsewhere and once scrolled
- Logo left: wordmark + small leaf/mehendi-cone icon
- Nav links (desktop): `Home · Mehendi · Makeup · Parlour · About · Contact` — sans-serif, uppercase, letter-spaced, small
- Right icon cluster: Account icon, Cart icon with gold item-count badge, "My Bookings" link
- Mobile: bottom tab bar — `Home · Services · Cart · Bookings · Account` — not a hamburger menu, optimized for thumb reach
- Floating WhatsApp button, bottom-right, on every page

### 3.4 Hero section (Homepage)

- Full-width section, soft-focus bridal mehendi/makeup photography (placeholder initially, swappable via API/admin)
- Text block: optional small gold eyebrow line, large serif H1 "Huma Mehendi & Beauty Artist", serif-italic tagline "Beautiful Art. Beautiful You. Beautiful Moments.", sans-serif supporting line "Professional Mehendi, Bridal Makeup and Beauty Services for your special occasions."
- Two CTAs side by side: solid filled "Book Now" (primary) + outline/text "Explore Services" (secondary)
- Optional carousel arrows if hero rotates multiple photos

### 3.5 Category strip (3 services)

Three equal-width tiles directly below the hero:
- Photo (mehendi hands / bridal makeup / parlour treatment)
- Serif category title: "Mehendi" / "Makeup" / "Parlour"
- One-line sans-serif description
- Gold text link with arrow: "Explore →"
- Hairline border, cream background, no drop shadow

### 3.6 Service / Design card (single reusable component — used identically across Mehendi, Makeup, Parlour)

Top to bottom:
1. Photo — 4:5 or square ratio, full card width, 8–12px corner radius
2. Title — serif, single line
3. Thin gold divider (~40px, centered)
4. Duration — sans, muted, small ("Approx. 1.5 hrs")
5. Price / "Starting from ₹X" — sans, medium weight, brand-green or gold
6. Availability badge, top-right of photo, when relevant
7. CTA button — solid fill: "Add to Cart" (catalog) or "View Details" (detail page)

Grid: 3 columns desktop, 2 columns tablet, 1 column mobile. White card surface on cream page background, hairline borders, no heavy shadows.

Note: browse-level cards show only the service price / "starting from" — never the ₹1,500 booking split. That split only appears at Cart and Checkout.

### 3.7 Buttons

| Type | Style |
|---|---|
| Primary (Book Now, Add to Cart, Pay ₹1,500) | Solid fill, brand-green or gold background, cream/white text, 6–8px radius, no shadow |
| Secondary (Explore Services, View Details) | Outline or text-only, gold or green, underline on hover |
| Disabled (unavailable slot/design) | Muted grey background/text, no hover state |
| Status pill (Available/Booked/Blocked) | Small rounded pill, palette status colors, no icon needed |

### 3.8 Whitespace & spacing rhythm

- Section padding: 80–120px desktop, 40–56px mobile
- Card internal padding: ~20–24px
- Gap between cards: ~24–32px desktop, 16px mobile

---

## 4. USER ROLES

**CUSTOMER**: Register/Login, browse services, view designs, add to cart, select location/date/slot, enter booking info, pay ₹1,500, view bookings/payment status, request reschedule/cancellation, submit reviews, manage profile.

**ADMIN**: Separate protected dashboard — not covered in detail here (see backend PRD), but the frontend must never expose admin routes/functionality to a customer session.

---

## 5. AUTHENTICATION SCREENS

Customer auth uses **Mobile Number + Password**.

- **Register**: Full name, mobile number, password, confirm password → OTP verification screen (6-digit input, resend timer)
- **Login**: Mobile number, password
- No email required for customer registration
- Customers may stay logged in on multiple devices

Design these forms in the same card style: cream background, white form card, hairline border, gold-accented input focus states, solid green submit button.

---

## 6. PAGES TO BUILD

### 6.1 Homepage
Hero (3.4) → Category strip (3.5) → Featured Mehendi designs (card grid, 3.6) → About snippet (10+ years / 500+ customers, with a "Learn more" link) → Testimonials/Reviews carousel → FAQ preview (3–4 items) → Contact strip (phone/WhatsApp/Instagram icons) → Footer.

### 6.2 Mehendi page
Search bar, category filter chips, price filter, sort dropdown, "Featured" toggle, responsive card grid (3.6) pulling from `/api/designs`. Empty state if no results match filters.

### 6.3 Mehendi design details page
Image gallery (swipeable on mobile), design name, category tag, description, price / starting price, duration, coverage, customization availability, "Add to Cart" CTA. Grey out and disable "Add to Cart" if unavailable — never show unavailable designs as bookable.

### 6.4 Makeup page
Same card grid pattern (3.6) pulling from `/api/services?type=MAKEUP`, package-style cards (name, description, price, duration).

### 6.5 Parlour page
Grouped by category (Hair / Skin / Beauty-Grooming) using section headers above each card-grid group, pulling from `/api/services?type=PARLOUR`.

### 6.6 Cart page
Line items (image, name, category, quantity if applicable, price, remove), Subtotal, Online Booking Amount, Remaining Amount — clearly separated. Never compute the final payable booking amount purely client-side; always confirm against the backend response before checkout.

### 6.7 Booking flow (multi-step, mobile-first)
Location (city/area dropdown + address field) → Date (calendar, only backend-available dates selectable) → Slot (time chips, statuses: Available/Booked/Blocked, backend-driven) → Customer details form → Review booking summary → Pay ₹1,500 (Razorpay Checkout) → Confirmation.

Never allow selecting a slot the backend marks unavailable — disable it visually and functionally.

### 6.8 Checkout / booking summary
Customer, services, date, time, location, total value, online booking amount, remaining amount. Explicit copy:
"Pay ₹1,500 online to confirm your booking."
"Remaining amount will be paid directly to the service provider after completion of the service."
If total < ₹1,500, show the actual (lower) amount instead — never exceed total.

### 6.9 Razorpay integration
1. Request order from backend → 2. Receive order info → 3. Open Razorpay Checkout → 4. Pass only public info → 5. Get payment response → 6. Send to backend for verification → 7. Never mark payment successful client-side → 8. Wait for backend confirmation before showing "Booking Confirmed."

### 6.10 Booking confirmation page
"Booking Confirmed" heading, Booking ID, customer name, service(s), date, time, location, amount paid online, remaining amount, booking status, payment status. CTA: "Contact on WhatsApp" — prefill a WhatsApp message with the booking details.

### 6.11 Customer dashboard
Tabs: Profile, My Bookings (Upcoming / Completed / Cancelled). Each booking card: Booking ID, services, date, time, location, total, paid online, remaining, payment status, booking status, plus actions — Request Cancellation, Request Reschedule, Leave a Review (only after completed).

### 6.12 Cancellation policy (shown pre-payment, and referenced in dashboard)
- Admin cancels → full refund of online booking amount
- Customer cancels → ₹500 cancellation charge
- Cancellation within 5 days of the booking date → booking amount generally non-refundable (admin may grant exceptions)
- Rescheduling is request-based, never automatic — admin must approve

### 6.13 Reviews
Only completed-booking customers can submit (rating 1–5, comment, optional photo). Public review list shows only admin-approved reviews.

### 6.14 About page
10+ years of experience, 500+ customers served. Polished copy on professional experience, bridal specialization, personalized service, quality, customer satisfaction, service breadth, and local coverage. No invented awards, certifications, or celebrity claims.

### 6.15 FAQ page
Booking amount, is the remaining amount paid online, how Razorpay works, travel charges, cancellation, rescheduling, slot selection, service areas, design customization, multiple services in one booking, how to contact Huma. Accordion-style UI.

### 6.16 Contact page
Phone, WhatsApp, Instagram, Email, service areas — each with a working call/chat/link button.

---

## 7. UX REQUIREMENTS (apply everywhere)

- Loading states and skeleton loaders for all API-dependent content
- Empty states (no designs match filter, no bookings yet, etc.)
- Error states with retry
- Success toasts/notifications
- Confirmation dialogs before cancel/reschedule submission
- Full form validation with inline error messages
- Accessible buttons (proper contrast, focus states, tap targets ≥44px on mobile)
- Prices and statuses must always be unambiguous — never leave the user wondering whether a payment or booking succeeded

---

## 8. SECURITY / DATA RULES FOR THE FRONTEND

Never trust the frontend as the source of truth for: price, booking amount, availability, payment status, or booking status. Always render what the backend returns; treat any client-side calculation as provisional/display-only until confirmed by the API response.

---

## 9. RESPONSIVENESS

Must work cleanly on mobile, tablet, laptop, and desktop, mobile-first, with the booking flow especially frictionless on a phone (large tap targets, minimal typing, native date/time pickers where sensible).

---

## 10. DELIVERABLE EXPECTATION

Deliver a polished, production-ready frontend — not a demo. Clean folder structure, reusable components (especially one shared `<ServiceCard />` used across Mehendi/Makeup/Parlour), a working API service layer, and the design system in Section 3 applied consistently across every screen listed in Section 6.