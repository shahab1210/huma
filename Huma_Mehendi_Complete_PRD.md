# HUMA MEHENDI & BEAUTY ARTIST
## Complete Product Requirements Document (Frontend + Backend + Design System)
### Ready-to-send build prompt

---

# PROMPT 1 — FRONTEND PRD

You are a senior UI/UX designer and React frontend engineer.

Build a production-quality, mobile-first frontend for a premium local bridal beauty booking platform called:

**"Huma Mehendi & Beauty Artist"**

Tagline:
**"Beautiful Art. Beautiful You. Beautiful Moments."**

The business provides:
1. Mehendi services
2. Bridal and occasion makeup
3. Parlour/beauty services

Service areas:
- Lucknow
- Kanpur
- Raebareli
- Bachhrawan
- Lalganj
- Nearby areas around Raebareli

Business experience:
- 10+ years of experience
- 500+ customers served

Contact:
- Phone: 8960600371
- WhatsApp: 8960600371
- Instagram: @huma_mehendi_06
- Email: humamehendi1210@gmail.com

Business hours:
7 days a week, 10:00 AM – 11:00 PM

There is no separate travel charge.
A minimum online booking amount is required.

==================================================
## 1. CORE BUSINESS MODEL
==================================================

Customers browse services/designs and make bookings.

The customer must pay a fixed **₹1,500 booking amount** online through Razorpay to confirm a booking.

Important:
- ₹1,500 is the online booking amount.
- Razorpay charges are paid by Huma and must NOT be added to the customer amount.
- Remaining amount is paid directly to the service provider after the service is completed.
- If the total booking value is ₹1,500 or less, customer pays the applicable booking amount, but never more than the total.
- Example: Total = ₹5,000 → Online booking payment = ₹1,500 → Remaining = ₹3,500

The frontend must clearly display:
"Online Booking Amount" and "Remaining Amount — Pay directly to the service provider after service."

Do not describe the remaining amount as an online payment requirement.

==================================================
## 2. TECHNOLOGY
==================================================

Use:
- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Modern component architecture
- Context API or Redux where genuinely useful
- Form validation
- Responsive design
- Reusable components

The frontend must communicate with a separate Node.js/Express backend through REST APIs.

Do NOT hard-code production services, designs, prices, slots, or bookings. All dynamic business information must come from APIs.

Use environment variables for:
- API base URL
- Razorpay public key

Never expose backend secrets.

==================================================
## 3. USER ROLES
==================================================

**CUSTOMER**
- Register / Login
- Browse services / View designs
- Add items to cart
- Select location, date, available slot
- Enter booking information
- Pay ₹1,500 booking amount
- View bookings, payment status, remaining amount
- Request rescheduling / cancellation
- Submit reviews
- Manage profile

**ADMIN**
- Separate protected dashboard
- Manage designs, categories, makeup services, parlour services, prices, images, bookings, customers, availability, time slots
- Block dates
- Manage service areas, homepage content, reviews, business settings

==================================================
## 4. AUTHENTICATION
==================================================

Customer authentication uses **Mobile Number + Password**.

Registration: Full name, mobile number, password, confirm password, OTP verification.
Login: Mobile number, password.

OTP is used for mobile-number verification. Do not require email for customer registration.

Customers may remain logged in on multiple devices if the backend supports multiple valid sessions.

Admin authentication must be completely separate and protected. Never expose admin functionality to customers.

==================================================
## 5. GLOBAL NAVIGATION
==================================================

**Desktop navigation:**
Logo · Home · Mehendi · Makeup · Parlour · About · Contact · Cart · My Bookings · Account

Admin has a separate dashboard layout.

**Mobile navigation** should be optimized for thumb usage. Use a mobile bottom navigation:
Home · Services · Cart · Bookings · Account

Include a floating WhatsApp button.

==================================================
## 6. HOMEPAGE
==================================================

Create a premium hero section.

**Hero content:**
- "Huma Mehendi & Beauty Artist"
- "Beautiful Art. Beautiful You. Beautiful Moments."
- Supporting text: "Professional Mehendi, Bridal Makeup and Beauty Services for your special occasions."
- Primary CTA: "Book Now"
- Secondary CTA: "Explore Services"

Show elegant bridal/mehendi imagery. Use replaceable placeholder images initially. Do not hard-code final images.

==================================================
## 7. SERVICES SECTION
==================================================

Show three primary service categories: **Mehendi, Makeup, Parlour**.

Each should have: Image, Title, Short description, Explore button.

==================================================
## 8. MEHENDI PAGE
==================================================

Create a searchable/filterable design catalog.

Initial sample categories: Bridal Mehendi, Arabic Mehendi, Indo-Arabic Mehendi, Rajasthani Mehendi, Pakistani Mehendi, Minimal Mehendi, Simple Mehendi, Engagement Mehendi, Party Mehendi, Festival Mehendi, Full Hand Mehendi, Half Hand Mehendi, Feet Mehendi, Kids Mehendi.

These are only initial sample categories. Admin must be able to add/edit/delete categories later.

Design cards should show: Image, Design name, Category, Price or "Starting from", Duration, Availability, View Details, Add to Cart.

Provide: Search, Category filter, Price filter, Sorting, Featured designs.

==================================================
## 9. MEHENDI DESIGN DETAILS
==================================================

Show: Multiple images, Design name, Category, Description, Price, Starting price where applicable, Approximate duration, Coverage, Customization availability, Service availability.

CTA: "Add to Cart"

Do not display unavailable designs as bookable.

==================================================
## 10. MAKEUP PAGE
==================================================

Makeup should be service/package based rather than only a photo gallery.

Initial sample services: Bridal Makeup, Engagement Makeup, Party Makeup, HD Makeup, Airbrush Makeup, Reception Makeup, Bride + Family Makeup Package.

All are sample data. Admin must be able to modify them.

Each card: Image, Service name, Description, Price, Duration, Add to Cart.

==================================================
## 11. PARLOUR PAGE
==================================================

Initial sample categories:
- **Hair**: Hair Styling, Hair Spa, Haircut
- **Skin**: Facial, Cleanup, Bleach
- **Beauty/Grooming**: Threading, Waxing, Manicure, Pedicure

These are sample data. Admin can add/edit/remove everything.

==================================================
## 12. CART
==================================================

Customer can add multiple services/designs.

Cart displays: Image, Name, Category, Quantity where applicable, Price, Remove, Total.

Show: Subtotal, Booking Amount, Remaining Amount.

Example: Total: ₹5,000 → Online Booking Amount: ₹1,500 → Remaining: ₹3,500

Important: Do not calculate the final payable booking amount only on the frontend. The backend is the source of truth.

==================================================
## 13. BOOKING FLOW
==================================================

Browse → Select service → Add to cart → Login/register if required → Select location → Select date → Select available slot → Enter customer details → Review booking → Pay booking amount → Booking confirmed.

Customer must NOT be able to select unavailable slots. Slots must be retrieved from backend.

==================================================
## 14. LOCATION
==================================================

Customer selects City/Area and Full service address.

Initial service areas: Lucknow, Kanpur, Raebareli, Bachhrawan, Lalganj, Nearby Raebareli areas.

No separate travel charge. Admin can modify service areas later.

==================================================
## 15. DATE AND SLOT SELECTION
==================================================

Create a clean calendar UI. Only show available dates/slots received from backend.

Business hours: 10 AM – 11 PM. Do not hard-code hourly slots.

Admin controls: Available slots, Blocked slots, Booked slots, Working hours.

Display statuses: Available, Booked, Blocked.

Never allow a customer to book a slot that is no longer available.

==================================================
## 16. CHECKOUT
==================================================

Show a final booking summary: Customer, Service(s), Date, Time, Location, Total service value, Online booking amount, Remaining amount.

Clearly display:
"Pay ₹1,500 online to confirm your booking."
"Remaining amount will be paid directly to the service provider after completion of the service."

If total amount is less than ₹1,500: booking payment should not exceed total booking value.

==================================================
## 17. RAZORPAY
==================================================

Use Razorpay Checkout. Frontend should:
1. Request booking/payment order from backend.
2. Receive Razorpay order information.
3. Open Razorpay Checkout.
4. Pass only required public information.
5. Receive payment response.
6. Send response to backend for verification.
7. Never independently mark payment as successful.
8. Wait for backend confirmation.

Never put Razorpay secret key in frontend.

==================================================
## 18. BOOKING CONFIRMATION
==================================================

After backend confirms payment, show "Booking Confirmed" with: Booking ID, Customer name, Service, Date, Time, Location, Online amount paid, Remaining amount, Booking status, Payment status.

CTA: "Contact on WhatsApp" — create a WhatsApp message using booking information.

==================================================
## 19. CUSTOMER DASHBOARD
==================================================

Profile · My Bookings · Upcoming Bookings · Completed Bookings · Cancelled Bookings

Booking details should show: Booking ID, Services, Date, Time, Location, Total, Paid online, Remaining, Payment status, Booking status.

Allow: Cancellation request per policy, Rescheduling request, Review submission after completion.

==================================================
## 20. CANCELLATION POLICY UI
==================================================

Display before payment.

- If Huma/Admin cancels: Full online booking amount is refunded.
- If customer cancels: ₹500 cancellation charge applies.
- If cancellation is made within 5 days of the booking date: the online booking amount is generally non-refundable.
- Admin may approve an exception or compromise at their discretion.

Rescheduling: Customer can request; Admin must approve. Do not make rescheduling automatic.

==================================================
## 21. REVIEWS
==================================================

Only customers with completed bookings should be allowed to submit reviews.

Review: Rating 1–5, Comment, Optional photo.

Admin can: Approve, Hide, Delete. Only approved reviews appear publicly.

==================================================
## 22. CONTACT
==================================================

Display: Phone (8960600371), WhatsApp (8960600371), Instagram (@huma_mehendi_06), Email (humamehendi1210@gmail.com), Service areas.

Include: Call button, WhatsApp button, Instagram link, Email link.

==================================================
## 23. ABOUT PAGE
==================================================

Show: 10+ years of experience, 500+ customers served.

Create polished business copy emphasizing: Professional experience, Bridal specialization, Personalized service, Quality work, Customer satisfaction, Multiple service categories, Local service coverage.

Do not invent awards, certifications, celebrities, or false claims.

==================================================
## 24. FAQ
==================================================

Create initial FAQs around: booking amount, whether the remaining amount is paid online, how Razorpay payment works, travel charges, cancellation, rescheduling, time slot selection, service areas, design customization, booking multiple services, contacting Huma.

Admin should eventually be able to manage FAQs.

==================================================
## 25. ADMIN FRONTEND
==================================================

Create a separate protected Admin Dashboard.

Dashboard overview: Today's bookings, Upcoming bookings, Pending requests, Today's revenue/booking payments, Total customers, Available slots, Booked slots.

Admin navigation: Dashboard · Bookings · Calendar · Time Slots · Mehendi Designs · Mehendi Categories · Makeup Services · Makeup Categories · Parlour Services · Parlour Categories · Customers · Payments · Reviews · Service Areas · FAQs · Homepage Content · Settings.

==================================================
## 26. ADMIN BOOKING MANAGEMENT
==================================================

Admin can: View bookings, Filter by date, Search customer, Search booking ID, View customer phone/address/services/total amount/booking amount paid/remaining amount/payment status, Change booking status, Approve rescheduling requests, Handle cancellation requests.

==================================================
## 27. ADMIN DESIGN MANAGEMENT
==================================================

Admin can: Create, Read, Update, Delete, Hide/show.

Design fields: Name, Category, Description, Images, Price, Starting price, Duration, Coverage, Customization, Availability, Featured status.

==================================================
## 28. ADMIN SERVICE MANAGEMENT
==================================================

Admin can manage Mehendi, Makeup, Parlour. Every service can be Added, Edited, Hidden, Deleted, Repriced, Categorized.

==================================================
## 29. ADMIN SLOT MANAGEMENT
==================================================

Admin can: Create slots, Edit slots, Block/Unblock slots, View bookings, Mark dates unavailable, Configure working hours.

When a confirmed booking exists, the relevant slot must automatically become unavailable.

==================================================
## 30. ADMIN PRICE RULE
==================================================

When an admin changes a service/design price, existing confirmed bookings MUST retain their original booked price. Do not recalculate historical bookings.

==================================================
## 31. UI DESIGN SYSTEM (reference: Wix "Pure" template adapted to Huma branding)
==================================================

**Overall visual style:** Premium, elegant, clean, Indian bridal aesthetic, modern, warm, trustworthy. Photography is the visual focus. Do not overuse patterns.

### 31.1 Color palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Base background | Light cream / off-white | `#FBF7F0` | Page background |
| Surface | Warm white | `#FFFFFF` | Cards, header bar |
| Primary brand | Deep mehendi green | `#2F4B3C` | Headlines, nav text, primary buttons |
| Accent | Soft gold | `#C9A46A` | Dividers, hover states, icons, price highlight |
| Text (body) | Dark brown/charcoal | `#3A2F28` | Paragraph text |
| Text (muted) | Warm grey-brown | `#7A6D63` | Secondary text (duration, category labels) |
| Border | Hairline neutral | `#E7DFD3` | Card borders, dividers |
| Status – available | Muted green | `#4C7A5A` | "Available" badges |
| Status – blocked/booked | Warm terracotta | `#B5654A` | "Booked/Blocked" badges (never harsh red) |

### 31.2 Typography

- **Display/Headings**: elegant serif — "Playfair Display", "Cormorant Garamond", or "Marcellus" (Google Fonts)
- **Body/UI**: clean sans-serif — "Inter" or "Poppins", weight 400–500
- Hero headline: large serif, tight leading, brand-green
- Card titles: serif, single line, ellipsis-truncate if long
- Price/duration: sans, muted color, smaller size, below a thin gold divider

### 31.3 Header / Navigation

- Sticky header, semi-transparent cream with blur over hero imagery; solid cream elsewhere/on scroll
- Logo left (wordmark + small leaf/mehendi-cone icon)
- Nav links center/right, sans-serif, uppercase, letter-spaced, small
- Right icon cluster: Account, Cart (gold badge for item count)
- Mobile: bottom tab bar (Section 5), not a hamburger menu

### 31.4 Hero section

- Full-width section with soft-focus bridal mehendi/makeup photography
- Text block: optional gold eyebrow line, large serif H1, serif-italic sub-line for the tagline, sans-serif supporting paragraph, two CTAs side by side (solid "Book Now" + outline/text "Explore Services")
- Optional carousel arrows if hero rotates multiple photos

### 31.5 Category strip (3 services)

- 3 equal-width tiles: photo, serif category title, one-line description, gold text link with arrow ("Explore →")
- Hairline border, cream background, no drop shadow

### 31.6 Service / Design card (core reusable component — used identically for Mehendi, Makeup, Parlour)

Top to bottom:
1. Photo — 4:5 or square, full card width, 8–12px corner radius
2. Title — serif, one line
3. Thin gold divider rule (~40px, centered)
4. Duration — sans, muted, small
5. Price / "Starting from ₹X" — sans, medium weight, brand-green or gold
6. Availability badge (top-right of photo) when relevant
7. CTA button — solid fill, "Add to Cart" / "View Details" per context

Grid: 3 columns desktop, 2 columns tablet, 1 column mobile. Hairline card borders, white surface on cream background, no heavy shadows.

Note: browse-level cards show only service price/"starting from" — the ₹1,500 booking-amount / remaining-amount split appears only at cart and checkout (Sections 12, 16), never on browse cards.

### 31.7 Buttons

| Type | Style |
|---|---|
| Primary (Book Now, Add to Cart, Pay ₹1,500) | Solid fill, brand-green or gold background, cream/white text, 6–8px radius, no shadow |
| Secondary (Explore Services, View Details) | Outline or text-only, gold or green, underline-on-hover |
| Disabled (unavailable) | Muted grey background/text, no hover |
| Status pills | Small rounded pill, colored per palette table, no icon needed |

### 31.8 Whitespace & rhythm

- Section padding: 80–120px desktop, 40–56px mobile
- Card internal padding ~20–24px; gap between cards ~24–32px desktop, 16px mobile

==================================================
## 32. RESPONSIVENESS
==================================================

Must work perfectly on Mobile, Tablet, Laptop, Desktop. Mobile-first. Booking must be extremely easy on mobile.

==================================================
## 33. UX REQUIREMENTS
==================================================

Use: Loading states, Skeletons where appropriate, Empty states, Error states, Success notifications, Confirmation dialogs, Form validation, Accessible buttons, Clear prices, Clear booking statuses.

Never leave users wondering whether payment or booking succeeded.

==================================================
## 34. IMPORTANT SECURITY RULE
==================================================

Frontend must never be trusted for: Price, Booking amount, Availability, Payment status, Booking status. All sensitive business logic belongs to backend.

==================================================
## 35. DEVELOPMENT RULE
==================================================

Do not build fake static functionality where backend integration is expected. If an API is not yet implemented, create a clean API service layer and clearly marked temporary mock data only for development. Keep the frontend architecture ready to connect to the backend without rewriting components. Use reusable components and clean folder structure.

Deliver a polished production-ready frontend, not a simple demo.

---

# PROMPT 2 — HUMA BACKEND PRD

Use this alongside the frontend prompt. It intentionally uses the same names and rules so both systems connect cleanly.

You are a senior Node.js, Express and MongoDB backend engineer.

Build a production-ready REST API for **"Huma Mehendi & Beauty Artist"**.

The platform provides: Mehendi, Bridal/occasion Makeup, Parlour/Beauty services.

Service areas: Lucknow, Kanpur, Raebareli, Bachhrawan, Lalganj, Nearby Raebareli areas.

Business: 10+ years experience, 500+ customers served.

Contact: Phone 8960600371 · WhatsApp 8960600371 · Instagram huma_mehendi_06 · Email humamehendi1210@gmail.com

Business hours: 7 days/week, 10 AM – 11 PM.

==================================================
## 1. TECHNOLOGY
==================================================

Use: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, dotenv, Razorpay SDK/API, Cloudinary for images if configured, Express validation, proper error handling, security middleware, CORS, rate limiting where appropriate.

Use clean MVC/service architecture:
```
controllers/
models/
routes/
middleware/
services/
utils/
config/
```

==================================================
## 2. USER ROLES
==================================================

**CUSTOMER**: Register, OTP verify mobile, Login, Browse services, Create cart, Create booking, Pay booking amount, View bookings, Cancel/request cancellation, Request rescheduling, Submit reviews.

**ADMIN**: Protected admin login, Manage all business content, services, designs, categories, prices, slots, bookings, customers, reviews, service areas, FAQs, settings.

==================================================
## 3. CUSTOMER AUTHENTICATION
==================================================

Registration: fullName, mobileNumber, password. Optional email. Mobile number must be unique. OTP verification is required. Password must be hashed with bcrypt. Never store plain passwords.

Login: mobileNumber + password. Return JWT securely. Use role-based authorization.

==================================================
## 4. ADMIN AUTHENTICATION
==================================================

Admin login must be protected. Admin credentials must never be exposed. Admin routes require valid JWT + ADMIN role. Customers must receive 403 when attempting admin APIs.

==================================================
## 5. MODELS
==================================================

Create at minimum: User, Category, Service, Design, Booking, BookingItem, Payment, TimeSlot, Review, ServiceArea, FAQ, BusinessSettings.

Provider should be designed as an extensible model if required later.

==================================================
## 6. USER MODEL
==================================================

Fields: fullName, mobileNumber, email, passwordHash, role, isMobileVerified, isActive, createdAt, updatedAt.

Roles: CUSTOMER, ADMIN. Do not allow public registration as ADMIN.

==================================================
## 7. CATEGORY MODEL
==================================================

Fields: name, serviceType, description, image, isActive, sortOrder, createdAt, updatedAt.

serviceType: MEHENDI, MAKEUP, PARLOUR. Admin can CRUD categories.

==================================================
## 8. SERVICE MODEL
==================================================

For makeup/parlour and other service-based offerings: name, category, serviceType, description, images, price, duration, isAvailable, isFeatured, createdAt, updatedAt. Admin CRUD.

==================================================
## 9. DESIGN MODEL
==================================================

Fields: name, category, description, images, price, startingPrice, duration, coverage, customizationAvailable, isAvailable, isFeatured, createdAt, updatedAt. Admin CRUD.

==================================================
## 10. BOOKING MODEL
==================================================

Fields: bookingId, customer, items, serviceArea, address, bookingDate, timeSlot, subtotal, totalAmount, onlineBookingAmount, paidAmount, remainingAmount, paymentStatus, bookingStatus, cancellationReason, rescheduleRequest, createdAt, updatedAt.

IMPORTANT: When a booking is confirmed, store the actual prices at booking time. If admin later changes the service price, historical bookings must not change.

==================================================
## 11. BOOKING ITEM
==================================================

Each item should preserve: itemType, itemId, nameSnapshot, priceSnapshot, quantity, durationSnapshot, categorySnapshot. This prevents future service edits from modifying historical bookings.

==================================================
## 12. PAYMENT MODEL
==================================================

Fields: booking, amount, currency, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentType, status, createdAt, updatedAt.

paymentType: BOOKING_AMOUNT. Do not automatically collect remaining service payment through this system. The remaining amount is paid directly to the service provider after service.

==================================================
## 13. PAYMENT BUSINESS RULE
==================================================

Default online booking amount: ₹1,500.

If total booking amount is below ₹1,500: online amount = total booking amount. Otherwise: online amount = ₹1,500.

Razorpay processing charges are absorbed by Huma. Never add Razorpay charges to customer payable amount.

Example: Total = ₹5,000 → Customer pays online: ₹1,500 → Remaining: ₹3,500

==================================================
## 14. RAZORPAY FLOW
==================================================

1. Customer creates booking request.
2. Backend validates: Customer, Services, Prices, Date, Slot, Availability.
3. Backend calculates total.
4. Backend calculates booking amount.
5. Backend creates Razorpay order.
6. Return required order information to frontend.
7. Frontend opens Razorpay Checkout.
8. Customer pays.
9. Frontend sends payment response to backend.
10. Backend verifies Razorpay signature.
11. Backend verifies payment/order information.
12. Only then mark payment successful.
13. Mark booking confirmed.
14. Mark selected slot unavailable.
15. Save payment record.

Never trust frontend payment success.

==================================================
## 15. DOUBLE BOOKING PREVENTION
==================================================

Two customers must never successfully book the same slot. Implement server-side availability validation. Use appropriate MongoDB indexes/atomic operations/transactions where required. Booking flow should handle concurrent requests safely.

Preferred lifecycle: AVAILABLE → TEMPORARILY RESERVED → PAYMENT → CONFIRMED.

If payment fails or reservation expires: TEMPORARILY RESERVED → AVAILABLE. Do not permanently block slots for abandoned payments. Reservation expiry should be configurable.

==================================================
## 16. TIMESLOT MODEL
==================================================

Fields: date, startTime, endTime, isAvailable, status, booking, createdAt, updatedAt.

Status: AVAILABLE, RESERVED, BOOKED, BLOCKED. Admin can create/edit/block/unblock slots. Business hours: 10 AM – 11 PM. Do not hard-code fixed hourly slots.

==================================================
## 17. DATE AVAILABILITY
==================================================

Admin can: Add available date, Block date, Create slots, Modify slots, View bookings. Customer can only see available slots.

==================================================
## 18. SERVICE AREAS
==================================================

Initial areas: Lucknow, Kanpur, Raebareli, Bachhrawan, Lalganj, Nearby Raebareli areas. No separate travel charge.

Admin can: Add area, Edit area, Disable area, Delete area, Configure booking requirements if needed.

==================================================
## 19. BOOKING STATUS
==================================================

Booking status: PENDING_PAYMENT, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED.

Payment status: PENDING, BOOKING_AMOUNT_PAID, FAILED, REFUNDED.

Keep booking status and payment status separate.

==================================================
## 20. CANCELLATION POLICY
==================================================

- Admin cancellation: Full online booking amount should be refunded.
- Customer cancellation: ₹500 cancellation charge applies.
- If cancellation is within 5 days of appointment: booking amount is generally non-refundable.
- Admin may manually approve an exception.

The backend must record: who cancelled, reason, timestamp, refund amount, admin decision.

==================================================
## 21. RESCHEDULING
==================================================

Customer submits a reschedule request. Do not automatically change the booking.

Admin reviews: requested date, requested slot, reason. Admin can APPROVE or REJECT.

If approved: release old slot, reserve new slot, update booking. Ensure the new slot is available.

==================================================
## 22. CUSTOMER CONTACT
==================================================

Admin must be able to see customer: Full name, Mobile number, Email if provided, Address, Booking history. Customer mobile number must be part of booking information.

==================================================
## 23. REVIEWS
==================================================

Only customers with COMPLETED bookings can submit reviews.

Fields: booking, customer, rating, comment, images, status.

Status: PENDING, APPROVED, HIDDEN. Only approved reviews are public. Admin controls moderation.

==================================================
## 24. ADMIN SERVICE MANAGEMENT
==================================================

Admin CRUD APIs for: Mehendi designs, Mehendi categories, Makeup services, Makeup categories, Parlour services, Parlour categories.

Admin can: Add, Edit, Hide, Delete, Change price, Upload images, Feature items.

==================================================
## 25. PRICE RULE
==================================================

Never modify the price stored in an existing booking. Current service price belongs to Service/Design. Historical price belongs to BookingItem.priceSnapshot.

Example: Current price ₹4,000 → Existing booking ₹3,500 → Existing booking remains ₹3,500.

==================================================
## 26. ADMIN DASHBOARD APIs
==================================================

Provide dashboard statistics: Today's bookings, Upcoming bookings, Completed bookings, Cancelled bookings, Customers, Booking amount revenue, Pending payments, Available slots, Booked slots. Provide date filtering.

==================================================
## 27. API STRUCTURE
==================================================

RESTful APIs, e.g.:

```
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/login
POST /api/auth/logout

GET  /api/services
GET  /api/services/:id
GET  /api/designs
GET  /api/designs/:id
GET  /api/categories

POST   /api/cart
GET    /api/cart
PUT    /api/cart
DELETE /api/cart/:itemId

GET /api/availability
GET /api/slots

POST /api/bookings
GET  /api/bookings
GET  /api/bookings/:id

POST /api/payments/create-order
POST /api/payments/verify

POST /api/bookings/:id/cancel
POST /api/bookings/:id/reschedule

POST /api/reviews
```

Admin:
```
GET /api/admin/dashboard

GET /api/admin/bookings
PUT /api/admin/bookings/:id

POST   /api/admin/designs
PUT    /api/admin/designs/:id
DELETE /api/admin/designs/:id

POST   /api/admin/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id

POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

POST   /api/admin/slots
PUT    /api/admin/slots/:id
DELETE /api/admin/slots/:id

POST   /api/admin/service-areas
PUT    /api/admin/service-areas/:id
DELETE /api/admin/service-areas/:id

GET /api/admin/customers
GET /api/admin/payments
PUT /api/admin/reviews/:id
```

==================================================
## 28. IMAGE MANAGEMENT
==================================================

Use Cloudinary or equivalent image storage. Do not store large image binaries directly in MongoDB. Store secure URL, public ID, metadata where required. Admin can upload/delete images.

==================================================
## 29. SECURITY
==================================================

Implement: bcrypt password hashing, JWT authentication, Role-based authorization, Input validation, Rate limiting, CORS, Helmet/security headers, Environment variables, Secure error responses, Request sanitization where appropriate.

Never return: passwordHash, Razorpay secret, sensitive internal credentials.

==================================================
## 30. ENVIRONMENT VARIABLES
==================================================

Use `.env` for: MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLOUDINARY credentials, OTP provider credentials, FRONTEND_URL.

Never commit `.env`. Provide `.env.example`.

==================================================
## 31. ERROR HANDLING
==================================================

Create centralized error handling. Return consistent API responses.

Example error:
```json
{ "success": false, "message": "Slot is no longer available" }
```

Example success:
```json
{ "success": true, "message": "...", "data": {} }
```

Use correct HTTP status codes.

==================================================
## 32. ADMIN BUSINESS SETTINGS
==================================================

Create configurable settings for: Business name, Tagline, Phone, WhatsApp, Instagram, Email, Business hours, Booking amount, Cancellation policy, Service areas, About text, FAQs.

Default booking amount: ₹1,500. Admin can modify business settings.

==================================================
## 33. IMPORTANT BUSINESS RULE
==================================================

Do NOT build a system where the customer pays the complete service amount online by default.

The business model is: Customer pays ₹1,500 online to confirm booking. Huma absorbs Razorpay charges. Remaining amount is paid directly to the service provider after service completion.

==================================================
## 34. FRONTEND COMPATIBILITY
==================================================

The backend API names, response structures and field names must remain consistent with the frontend PRD. Do not invent incompatible field names.

Frontend expects: bookingId, totalAmount, onlineBookingAmount, paidAmount, remainingAmount, paymentStatus, bookingStatus, bookingDate, timeSlot, serviceArea, address.

==================================================
## 35. TESTING
==================================================

Test: Customer registration, OTP, Login, Admin login, Unauthorized admin access, Service retrieval, Design retrieval, Cart, Booking, Slot availability, Concurrent booking, Razorpay order creation, Payment verification, Failed payment, Duplicate payment, Cancellation, Refund, Rescheduling, Admin price change, Historical booking price preservation, Review authorization, Admin CRUD, Image upload, Mobile-number visibility to admin.

==================================================
## 36. FINAL REQUIREMENT
==================================================

Build this as a real production-oriented backend, not a tutorial/demo backend. Keep business logic in backend services/controllers.

Never trust frontend-provided: price, availability, payment status, booking status, booking amount. The backend/database is the source of truth.

The system must be scalable so Huma can later add: multiple artists, different artist availability, multiple branches, coupons, notifications, loyalty programs — without rebuilding the entire backend.

---

## HOW THESE CONNECT

```
                 HUMA WEBSITE
                      │
          ┌───────────┴───────────┐
          │                       │
      CUSTOMER                 ADMIN
      FRONTEND                 PANEL
          │                       │
          └───────────┬───────────┘
                      │
                  REST API
                      │
                NODE + EXPRESS
                      │
          ┌───────────┼───────────┐
          │           │           │
       MongoDB     Razorpay    Cloudinary
          │           │           │
          └───────────┴───────────┘
```

Treat these as one project, not two separate ones. Field names, statuses, and amounts (`bookingId`, `totalAmount`, `onlineBookingAmount`, `paidAmount`, `remainingAmount`, `paymentStatus`, `bookingStatus`) must match exactly between frontend and backend. The Section 31 design system (colors, typography, header, hero, card component) governs how every frontend screen described in Sections 1–30 should look.
