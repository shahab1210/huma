/**
 * API service layer for Huma Mehendi & Beauty Artist.
 *
 * All dynamic business data (services, designs, slots, bookings) is meant to
 * come from the Node/Express backend. Until those endpoints exist, each call
 * resolves clearly-labeled TEMPORARY mock data so the UI can be built without
 * rewrites. Swap `MOCK` usage for real `fetch(BASE_URL + ...)` calls later —
 * component contracts stay identical.
 */

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api").trim();
  const cleaned = envUrl.replace(/huma[^.]*\.onrender\.com/g, "huma-1.onrender.com").replace(/\/+$/, "");
  if (!cleaned || cleaned === "/api") return "/api";
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
};

export const BASE_URL = getApiBaseUrl();

// The fixed online booking amount (display-only; backend is source of truth).
export const ONLINE_BOOKING_AMOUNT = 1500;

export type ServiceType = "MEHENDI" | "MAKEUP" | "PARLOUR";
export type Availability = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface Service {
  id: string;
  type: ServiceType;
  name: string;
  category: string;
  description: string;
  duration: string;
  startingPrice: number;
  mrp?: number;
  discountType?: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue?: number;
  image: string;
  featured?: boolean;
  availability: Availability;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface LocationData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  heroImage: string;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  nearbyAreas: string[];
  availableServiceGroups: ServiceGroupData[];
  isActive: boolean;
  displayOrder: number;
}

export interface ServiceGroupData {
  _id: string;
  name: string;
  slug: string;
  parentType: ServiceType;
  shortDescription: string;
  description: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
  displayOrder: number;
  isFeatured: boolean;
}

const img = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

// ---- TEMPORARY MOCK DATA (development only) ---------------------------------

const MOCK_SERVICES: Service[] = [
  {
    id: "meh-bridal-full",
    type: "MEHENDI",
    name: "Bridal Full Hands & Feet",
    category: "Bridal",
    description: "Intricate full-coverage bridal mehendi with fine detailing and hidden initials.",
    duration: "Approx. 4–5 hrs",
    startingPrice: 6000,
    image: img("1762162089047-97e09435984d"),
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "meh-arabic",
    type: "MEHENDI",
    name: "Arabic Trail Design",
    category: "Occasion",
    description: "Flowing floral Arabic patterns — elegant, quick and perfect for functions.",
    duration: "Approx. 1.5 hrs",
    startingPrice: 1200,
    image: img("1774019410720-3409a533d30b"),
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "meh-minimal",
    type: "MEHENDI",
    name: "Minimal Modern Motifs",
    category: "Everyday",
    description: "Delicate contemporary strokes for a subtle, refined finish.",
    duration: "Approx. 45 mins",
    startingPrice: 700,
    image: img("1738849760236-541fcdd3931d"),
    featured: true,
    availability: "BOOKED",
  },
  {
    id: "mk-bridal",
    type: "MAKEUP",
    name: "HD Bridal Makeup",
    category: "Bridal",
    description: "Complete bridal look with HD base, lashes, and draping.",
    duration: "Approx. 2.5 hrs",
    startingPrice: 8000,
    image: img("1783495687666-ca55fe595de4"),
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "mk-party",
    type: "MAKEUP",
    name: "Party & Occasion Glam",
    category: "Occasion",
    description: "Camera-ready glam for receptions, sangeet and celebrations.",
    duration: "Approx. 1.5 hrs",
    startingPrice: 2500,
    image: img("1610173826014-d131b02d69ca"),
    availability: "AVAILABLE",
  },
  {
    id: "par-facial",
    type: "PARLOUR",
    name: "Radiance Facial",
    category: "Skin",
    description: "Deep-cleanse facial that brightens and softens the skin.",
    duration: "Approx. 1 hr",
    startingPrice: 900,
    image: img("1761718210089-ba3bb5ccb54f"),
    availability: "AVAILABLE",
  },
];

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Ananya Srivastava",
    location: "Lucknow",
    rating: 5,
    comment:
      "Huma did my bridal mehendi and makeup both. The detailing was stunning and the colour came out so deep. Everyone kept asking who my artist was!",
  },
  {
    id: "t2",
    name: "Priya Tiwari",
    location: "Raebareli",
    rating: 5,
    comment:
      "So professional and patient. She travelled to our home and made my whole family feel comfortable. Booking online was simple and safe.",
  },
  {
    id: "t3",
    name: "Sneha Verma",
    location: "Kanpur",
    rating: 5,
    comment:
      "My reception makeup lasted the entire night. Genuinely 10+ years of skill — worth every rupee.",
  },
];

const MOCK_FAQS: Faq[] = [
  {
    q: "How much do I pay online to book?",
    a: "A fixed ₹1,500 online booking amount confirms your booking. If your total is ₹1,500 or less, you simply pay that lower total — never more.",
  },
  {
    q: "Is the remaining amount paid online?",
    a: "No. The remaining amount is paid directly to the service provider after the service is completed. It is never collected online.",
  },
  {
    q: "Are there any travel charges?",
    a: "There is no separate travel charge across our service areas around Raebareli, Lucknow and Kanpur.",
  },
  {
    q: "How does the payment work?",
    a: "Payments are handled securely through Razorpay. Any Razorpay fees are absorbed by us and never added to your bill.",
  },
];

// ---- Public API (returns promises, backend-ready) --------------------------

const delay = <T>(data: T, ms = 350) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(data), ms));

export const api = {
  getServices: (type?: ServiceType) =>
    delay(type ? MOCK_SERVICES.filter((s) => s.type === type) : MOCK_SERVICES),
  getFeatured: () => delay(MOCK_SERVICES.filter((s) => s.featured)),
  getTestimonials: () => delay(MOCK_TESTIMONIALS),
  getFaqs: () => delay(MOCK_FAQS),
};
