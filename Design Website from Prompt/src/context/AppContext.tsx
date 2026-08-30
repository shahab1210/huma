import React, { createContext, useContext, useState, useEffect } from "react";
import { type Service, type ServiceType, type Availability, BASE_URL } from "../services/api";

// --- TYPES ---
export interface CartItem {
  service: Service;
  quantity: number;
}

export interface BookingItem {
  itemId: string;
  itemType: ServiceType;
  nameSnapshot: string;
  priceSnapshot: number;
  durationSnapshot: string;
  categorySnapshot: string;
}

export interface Booking {
  bookingId: string;
  customerName: string;
  customerMobile: string;
  items: BookingItem[];
  serviceArea: string;
  address: string;
  bookingDate: string;
  timeSlot: string;
  subtotal: number;
  totalAmount: number;
  onlineBookingAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: "PENDING" | "PAYMENT_VERIFICATION_PENDING" | "BOOKED_AMOUNT_PAID" | "FAILED" | "REFUNDED" | "REJECTED";
  bookingStatus: "PENDING_PAYMENT" | "PAYMENT_VERIFICATION_PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "PAYMENT_REJECTED";
  cancellationReason?: string;
  cancelledBy?: "CUSTOMER" | "ADMIN";
  paymentMethod?: "RAZORPAY" | "UPI_MANUAL";
  transactionId?: string;
  paymentScreenshot?: string;
  rejectionReason?: string;
  adminNote?: string;
  rescheduleRequest?: {
    requestedDate: string;
    requestedSlot: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  };
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Availability;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  serviceName: string;
  status: "PENDING" | "APPROVED" | "HIDDEN";
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  text: string;
}

export interface AppContextType {
  // Navigation
  currentView: string;
  navigate: (view: string) => void;

  // Authentication
  user: { fullName: string; mobileNumber: string; email?: string; authProviders?: string[]; isMobileVerified?: boolean } | null;
  adminLoggedIn: boolean;
  loginCustomer: (mobile: string, pass: string) => Promise<boolean>;
  registerCustomer: (name: string, mobile: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loginAdmin: (user: string, pass: string) => Promise<{ success: boolean; awaitingSecurityAnswer?: boolean; tempToken?: string; question?: string; message?: string }>;
  verifyAdminSecurityAnswer: (tempToken: string, securityAnswer: string) => Promise<boolean>;
  logoutAdmin: () => void;
  refreshAdminToken: () => Promise<boolean>;
  requestAdminCredentialsChange: (newMobile: string, newPass?: string, newQuestion?: string, newAnswer?: string) => Promise<{ success: boolean; updateToken?: string; message?: string }>;
  verifyAdminCredentialsChange: (updateToken: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  sendWhatsAppOtp: (mobileNumber: string, purpose: string) => Promise<{ success: boolean; message?: string }>;
  verifyWhatsAppOtp: (mobileNumber: string, otp: string, purpose: string) => Promise<{ success: boolean; token?: string; user?: any; message?: string; resetToken?: string }>;
  googleAuth: (idToken: string) => Promise<{ success: boolean; requiresMobile?: boolean; googleProfile?: any; token?: string; user?: any; message?: string }>;
  completeGoogleRegistration: (data: { idToken: string; mobileNumber: string; password: string; fullName: string }) => Promise<{ success: boolean; message?: string }>;
  linkGoogleAccount: (idToken: string) => Promise<{ success: boolean; user?: any; message?: string }>;
  forgotPasswordSendOtp: (mobileNumber: string) => Promise<{ success: boolean; message?: string }>;
  forgotPasswordVerifyOtp: (mobileNumber: string, otp: string) => Promise<{ success: boolean; resetToken?: string; message?: string }>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;

  // Catalog
  services: Service[];
  addOrUpdateService: (service: Service) => void;
  deleteService: (id: string) => void;

  // Cart
  cart: Service[];
  addToCart: (service: Service) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartBookingAmount: number;
  cartRemainingAmount: number;

  // Bookings
  bookings: Booking[];
  createBooking: (bookingData: Omit<Booking, "bookingId" | "paymentStatus" | "bookingStatus" | "createdAt" | "paidAmount" | "remainingAmount">) => Booking;
  confirmBookingPayment: (bookingId: string, paymentId: string) => void;
  cancelBooking: (bookingId: string, reason: string, isCustomer: boolean) => void;
  requestReschedule: (bookingId: string, date: string, slot: string, reason: string) => void;
  respondToReschedule: (bookingId: string, approve: boolean) => void;
  updateBookingStatus: (bookingId: string, status: Booking["bookingStatus"]) => void;
  fetchMyBookings: () => Promise<void>;

  // Timeslots & Availability
  blockedDates: string[];
  blockDate: (date: string) => void;
  unblockDate: (date: string) => void;
  getAvailableSlotsForDate: (date: string) => string[];
  blockSlot: (date: string, time: string) => void;

  // Reviews
  reviews: Review[];
  submitReview: (rating: number, comment: string, serviceName: string, customerName: string) => void;
  moderateReview: (id: string, status: Review["status"]) => void;

  // Toast notifications
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;

  // Settings
  serviceAreas: string[];
  addServiceArea: (area: string) => void;
  removeServiceArea: (area: string) => void;
  businessSettings: {
    businessName: string;
    phone: string;
    whatsapp: string;
    bookingAmount: number;
    upiId: string;
    upiQrImage: string;
    paymentWhatsApp: string;
    cancellationCharge: number;
    cancellationWindowDays: number;
    reservationExpiryMinutes: number;
    aboutText: string;
  } | null;
  fetchBusinessSettings: () => Promise<void>;
  updateBusinessSettings: (settingsData: any) => Promise<boolean>;
  submitPaymentProof: (bookingId: string, transactionId: string, paymentScreenshot: string) => Promise<{ success: boolean; message?: string }>;
  adminConfirmPayment: (paymentId: string, adminNote?: string) => Promise<{ success: boolean; message?: string }>;
  adminRejectPayment: (paymentId: string, rejectionReason: string, adminNote?: string) => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_SERVICES: Service[] = [
  {
    id: "meh-bridal-full",
    type: "MEHENDI",
    name: "Bridal Full Hands & Feet",
    category: "Bridal",
    description: "Intricate full-coverage bridal mehendi with fine detailing and custom figures.",
    duration: "Approx. 4–5 hrs",
    startingPrice: 6000,
    image: "https://images.unsplash.com/photo-1762162089047-97e09435984d?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "meh-arabic",
    type: "MEHENDI",
    name: "Arabic Trail Design",
    category: "Occasion",
    description: "Flowing floral Arabic patterns — elegant, quick, and perfect for guest styling.",
    duration: "Approx. 1.5 hrs",
    startingPrice: 1200,
    image: "https://images.unsplash.com/photo-1774019410720-3409a533d30b?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "meh-minimal",
    type: "MEHENDI",
    name: "Minimal Modern Motifs",
    category: "Occasion",
    description: "Delicate contemporary lines and geometric patterns for a clean finish.",
    duration: "Approx. 45 mins",
    startingPrice: 700,
    image: "https://images.unsplash.com/photo-1738849760236-541fcdd3931d?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "mk-bridal",
    type: "MAKEUP",
    name: "HD Bridal Makeup",
    category: "Bridal",
    description: "Complete bridal makeover with premium HD base, lashes, hair styling, and draping.",
    duration: "Approx. 2.5 hrs",
    startingPrice: 8000,
    image: "https://images.unsplash.com/photo-1783495687666-ca55fe595de4?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: true,
    availability: "AVAILABLE",
  },
  {
    id: "mk-party",
    type: "MAKEUP",
    name: "Party & Occasion Glam",
    category: "Occasion",
    description: "Camera-ready soft or bold glam for sangeet, reception, and celebrations.",
    duration: "Approx. 1.5 hrs",
    startingPrice: 2500,
    image: "https://images.unsplash.com/photo-1610173826014-d131b02d69ca?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: false,
    availability: "AVAILABLE",
  },
  {
    id: "par-facial",
    type: "PARLOUR",
    name: "Radiance Gold Facial",
    category: "Skin",
    description: "Multi-step hydrating gold facial that deep cleanses and brightens the skin.",
    duration: "Approx. 1 hr",
    startingPrice: 900,
    image: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: false,
    availability: "AVAILABLE",
  },
  {
    id: "par-wax",
    type: "PARLOUR",
    name: "Honey Waxing Full Body",
    category: "Grooming",
    description: "Full body waxing using gentle honey wax, leaving skin smooth and hydrated.",
    duration: "Approx. 1.5 hrs",
    startingPrice: 1500,
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&h=1000&fit=crop&auto=format&q=80",
    featured: false,
    availability: "AVAILABLE",
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    customerName: "Ananya Srivastava",
    rating: 5,
    comment: "Huma did my bridal mehendi and makeup. The detailing was breathtaking and the henna color turned out dark mahogany. Highly recommend her!",
    serviceName: "Bridal Full Hands & Feet",
    status: "APPROVED",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev-2",
    customerName: "Priya Tiwari",
    rating: 5,
    comment: "Super professional. She arrived on time with her assistant in Raebareli. Very fast work and neat patterns. Extremely happy!",
    serviceName: "Arabic Trail Design",
    status: "APPROVED",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_SLOTS = ["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM", "07:00 PM", "08:30 PM", "10:00 PM"];

export function AppProvider({ children }: { children: React.ReactNode }) {
// Navigation
  const [currentView, setCurrentView] = useState("home");

  // Auth State
  const [user, setUser] = useState<{ fullName: string; mobileNumber: string; email?: string; authProviders?: string[]; isMobileVerified?: boolean } | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Core Data
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>(["Lucknow", "Kanpur", "Raebareli", "Bachhrawan", "Lalganj"]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [businessSettings, setBusinessSettings] = useState<AppContextType["businessSettings"]>(null);

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#/", "");
      if (!hash) {
        setCurrentView("home");
      } else {
        setCurrentView(hash);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Trigger on mount

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (view: string) => {
    window.location.hash = `/${view}`;
  };

  // Load from local storage on mount
  useEffect(() => {
    fetchBusinessSettings();
    const storedUser = localStorage.getItem("huma_user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const storedAdmin = localStorage.getItem("huma_admin_logged");
    if (storedAdmin) setAdminLoggedIn(JSON.parse(storedAdmin));

    const storedServices = localStorage.getItem("huma_services");
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      setServices(INITIAL_SERVICES);
      localStorage.setItem("huma_services", JSON.stringify(INITIAL_SERVICES));
    }

    const storedCart = localStorage.getItem("huma_cart");
    if (storedCart) setCart(JSON.parse(storedCart));

    const storedBookings = localStorage.getItem("huma_bookings");
    if (storedBookings) setBookings(JSON.parse(storedBookings));

    const storedReviews = localStorage.getItem("huma_reviews");
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    } else {
      setReviews(INITIAL_REVIEWS);
      localStorage.setItem("huma_reviews", JSON.stringify(INITIAL_REVIEWS));
    }

    const storedBlockedDates = localStorage.getItem("huma_blocked_dates");
    if (storedBlockedDates) setBlockedDates(JSON.parse(storedBlockedDates));

    const storedAreas = localStorage.getItem("huma_service_areas");
    if (storedAreas) setServiceAreas(JSON.parse(storedAreas));
  }, []);

  // Fetch bookings when user or admin logs in/out
  useEffect(() => {
    fetchMyBookings();
  }, [user, adminLoggedIn]);

  // Periodic token refresh for admin session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adminLoggedIn) {
      // Refresh token every 10 minutes
      interval = setInterval(() => {
        refreshAdminToken();
      }, 10 * 60 * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adminLoggedIn]);

  // Sync states to local storage
  const saveServices = (newServices: Service[]) => {
    setServices(newServices);
    localStorage.setItem("huma_services", JSON.stringify(newServices));
  };

  const saveCart = (newCart: Service[]) => {
    setCart(newCart);
    localStorage.setItem("huma_cart", JSON.stringify(newCart));
  };

  const saveBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    localStorage.setItem("huma_bookings", JSON.stringify(newBookings));
  };

  const saveReviews = (newReviews: Review[]) => {
    setReviews(newReviews);
    localStorage.setItem("huma_reviews", JSON.stringify(newReviews));
  };

  const saveBlockedDates = (dates: string[]) => {
    setBlockedDates(dates);
    localStorage.setItem("huma_blocked_dates", JSON.stringify(dates));
  };

  // Toast Utility
  const showToast = (text: string, type: ToastMessage["type"] = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Customer Authentication API integration
  const loginCustomer = async (mobile: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        const sessionUser = {
          fullName: data.data.user.fullName,
          mobileNumber: data.data.user.mobileNumber,
          email: data.data.user.email || '',
          authProviders: data.data.user.authProviders || ['PASSWORD'],
          isMobileVerified: data.data.user.isMobileVerified ?? true,
        };
        setUser(sessionUser);
        localStorage.setItem("huma_user", JSON.stringify(sessionUser));
        localStorage.setItem("huma_token", data.data.token);
        showToast(`Welcome back, ${data.data.user.fullName}!`);
        return true;
      } else {
        showToast(data.message || "Invalid mobile number or password", "error");
        return false;
      }
    } catch (e) {
      showToast("Failed to connect to server", "error");
      return false;
    }
  };

  const registerCustomer = async (
    nameOrData: string | { fullName: string; mobileNumber: string; password?: string },
    mobile?: string,
    pass?: string
  ): Promise<boolean> => {
    let nameStr = "";
    let mobileStr = "";
    let passStr = "";

    if (typeof nameOrData === "object" && nameOrData !== null) {
      nameStr = nameOrData.fullName;
      mobileStr = nameOrData.mobileNumber;
      passStr = nameOrData.password || "";
    } else {
      nameStr = nameOrData;
      mobileStr = mobile || "";
      passStr = pass || "";
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: nameStr, mobileNumber: mobileStr, password: passStr }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Registration successful!");
        return true;
      } else {
        showToast(data.message || "Registration failed", "error");
        return false;
      }
    } catch (e) {
      showToast("Failed to connect to server", "error");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("huma_user");
    localStorage.removeItem("huma_token");
    saveCart([]);
    showToast("Logged out successfully");
    navigate("home");
  };

  // Admin Authentication API integration
  const loginAdmin = async (user: string, pass: string): Promise<{ success: boolean; awaitingSecurityAnswer?: boolean; tempToken?: string; question?: string; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: user, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.awaitingSecurityAnswer) {
          return {
            success: true,
            awaitingSecurityAnswer: true,
            tempToken: data.data.tempToken,
            question: data.data.question,
            message: data.message,
          };
        }
        return { success: false, message: "Invalid server response shape." };
      } else {
        showToast(data.message || "Incorrect Admin credentials", "error");
        return { success: false, message: data.message || "Incorrect credentials." };
      }
    } catch (error) {
      showToast("Failed to connect to server", "error");
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const verifyAdminSecurityAnswer = async (tempToken: string, securityAnswer: string): Promise<boolean> => {
    try {
      const fingerprint = navigator.userAgent;
      const res = await fetch(`${BASE_URL}/auth/admin/verify-security-answer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-Fingerprint": fingerprint
        },
        body: JSON.stringify({ tempToken, securityAnswer }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        setAdminLoggedIn(true);
        localStorage.setItem("huma_admin_logged", "true");
        localStorage.setItem("huma_admin_token", data.data.token);
        localStorage.setItem("huma_admin_refresh_token", data.data.refreshToken || "");
        showToast("Admin access granted.");
        navigate("admin-dashboard");
        return true;
      } else {
        showToast(data.message || "Verification failed", "error");
        return false;
      }
    } catch {
      showToast("Failed to connect to server", "error");
      return false;
    }
  };

  const logoutAdmin = () => {
    setAdminLoggedIn(false);
    localStorage.removeItem("huma_admin_logged");
    localStorage.removeItem("huma_admin_token");
    localStorage.removeItem("huma_admin_refresh_token");
    showToast("Admin logged out");
    navigate("home");
  };

  const refreshAdminToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("huma_admin_refresh_token");
      if (!refreshToken) return false;

      const fingerprint = navigator.userAgent;
      const res = await fetch(`${BASE_URL}/auth/admin/refresh-token`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Device-Fingerprint": fingerprint
        },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem("huma_admin_token", data.data.token);
        localStorage.setItem("huma_admin_refresh_token", data.data.refreshToken);
        return true;
      } else {
        logoutAdmin();
        return false;
      }
    } catch {
      return false;
    }
  };

  const requestAdminCredentialsChange = async (
    newMobileNumber: string,
    newPassword?: string,
    newQuestion?: string,
    newAnswer?: string
  ): Promise<{ success: boolean; updateToken?: string; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/auth/admin/update-credentials-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newMobileNumber,
          newPassword,
          newSecurityQuestion: newQuestion,
          newSecurityAnswer: newAnswer,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.updateToken) {
        return { success: true, updateToken: data.data.updateToken, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to initiate credentials change." };
      }
    } catch {
      return { success: false, message: "Failed to connect to server." };
    }
  };

  const verifyAdminCredentialsChange = async (updateToken: string, otpCode: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/auth/admin/update-credentials-verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ updateToken, otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Admin credentials updated successfully!");
        return { success: true };
      } else {
        return { success: false, message: data.message || "Invalid OTP code." };
      }
    } catch {
      return { success: false, message: "Failed to connect to server." };
    }
  };

  // ── WhatsApp OTP Functions ──

  const sendWhatsAppOtp = async (mobileNumber: string, purpose: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/send-whatsapp-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, purpose }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const verifyWhatsAppOtp = async (
    mobileNumber: string,
    otp: string,
    purpose: string
  ): Promise<{ success: boolean; token?: string; user?: any; message?: string; resetToken?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-whatsapp-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, otp, purpose }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        // Auto-login after successful registration verification
        const sessionUser = {
          fullName: data.data.user.fullName,
          mobileNumber: data.data.user.mobileNumber,
          email: data.data.user.email || "",
          authProviders: data.data.user.authProviders || ["PASSWORD"],
          isMobileVerified: true,
        };
        setUser(sessionUser);
        localStorage.setItem("huma_user", JSON.stringify(sessionUser));
        localStorage.setItem("huma_token", data.data.token);
      }
      return {
        success: data.success,
        token: data.data?.token,
        user: data.data?.user,
        resetToken: data.data?.resetToken,
        message: data.message,
      };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  // ── Google Authentication Functions ──

  const googleAuth = async (
    idToken: string
  ): Promise<{ success: boolean; requiresMobile?: boolean; googleProfile?: any; token?: string; user?: any; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        // Existing Google user — auto-login
        const sessionUser = {
          fullName: data.data.user.fullName,
          mobileNumber: data.data.user.mobileNumber,
          email: data.data.user.email || "",
          authProviders: data.data.user.authProviders || ["GOOGLE"],
          isMobileVerified: true,
        };
        setUser(sessionUser);
        localStorage.setItem("huma_user", JSON.stringify(sessionUser));
        localStorage.setItem("huma_token", data.data.token);
      }
      return {
        success: data.success,
        requiresMobile: data.data?.requiresMobileVerification,
        googleProfile: data.data?.googleProfile,
        token: data.data?.token,
        user: data.data?.user,
        message: data.message,
      };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const completeGoogleRegistration = async (data: {
    idToken: string;
    mobileNumber: string;
    password: string;
    fullName: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/google/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return { success: result.success, message: result.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const linkGoogleAccount = async (idToken: string): Promise<{ success: boolean; user?: any; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_token");
      const res = await fetch(`${BASE_URL}/auth/google/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        const sessionUser = {
          fullName: data.data.user.fullName,
          mobileNumber: data.data.user.mobileNumber,
          email: data.data.user.email || "",
          authProviders: data.data.user.authProviders || [],
          isMobileVerified: true,
        };
        setUser(sessionUser);
        localStorage.setItem("huma_user", JSON.stringify(sessionUser));
      }
      return { success: data.success, user: data.data?.user, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  // ── Forgot Password Functions ──

  const forgotPasswordSendOtp = async (mobileNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const forgotPasswordVerifyOtp = async (
    mobileNumber: string,
    otp: string
  ): Promise<{ success: boolean; resetToken?: string; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, otp }),
      });
      const data = await res.json();
      return { success: data.success, resetToken: data.data?.resetToken, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  // ── Business Settings & Manual UPI Payment Functions ──

  const fetchBusinessSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/settings`);
      const data = await res.json();
      if (data.success && data.data?.settings) {
        setBusinessSettings(data.data.settings);
      }
    } catch (e) {
      console.error("Failed to fetch settings from backend", e);
    }
  };

  const updateBusinessSettings = async (settingsData: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      });
      const data = await res.json();
      if (data.success && data.data?.settings) {
        setBusinessSettings(data.data.settings);
        showToast("Business settings updated successfully.");
        return true;
      } else {
        showToast(data.message || "Failed to update business settings.", "error");
        return false;
      }
    } catch {
      showToast("Failed to connect to server", "error");
      return false;
    }
  };

  const submitPaymentProof = async (
    bookingId: string,
    transactionId: string,
    paymentScreenshot: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_token");
      const bookingObj = bookings.find((b) => b.bookingId === bookingId || b._id === bookingId);

      const res = await fetch(`${BASE_URL}/payments/submit-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          transactionId,
          paymentScreenshot,
          bookingDetails: bookingObj,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Sync local bookings list
        const updated = bookings.map((b) => {
          if (b.bookingId === bookingId || b._id === bookingId) {
            return {
              ...b,
              paymentStatus: "PAYMENT_VERIFICATION_PENDING" as const,
              bookingStatus: "PAYMENT_VERIFICATION_PENDING" as const,
              transactionId,
              paymentScreenshot,
            };
          }
          return b;
        });
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        clearCart();
        return { success: true };
      } else {
        return { success: false, message: data.message || "Failed to submit payment proof" };
      }
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const adminConfirmPayment = async (paymentId: string, adminNote?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/payments/${paymentId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        // Sync local bookings list
        const updated = bookings.map((b) => {
          if (b.bookingId === data.data.booking.bookingId || b._id === data.data.booking._id) {
            return {
              ...b,
              paymentStatus: "BOOKED_AMOUNT_PAID" as const,
              bookingStatus: "CONFIRMED" as const,
              paidAmount: data.data.booking.paidAmount,
              remainingAmount: data.data.booking.remainingAmount,
              adminNote,
            };
          }
          return b;
        });
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        return { success: true };
      } else {
        return { success: false, message: data.message || "Failed to verify payment" };
      }
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  const adminRejectPayment = async (
    paymentId: string,
    rejectionReason: string,
    adminNote?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/payments/${paymentId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason, adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        // Sync local bookings list
        const updated = bookings.map((b) => {
          if (b.bookingId === data.data.booking.bookingId || b._id === data.data.booking._id) {
            return {
              ...b,
              paymentStatus: "REJECTED" as const,
              bookingStatus: "PAYMENT_REJECTED" as const,
              rejectionReason,
              adminNote,
            };
          }
          return b;
        });
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        return { success: true };
      } else {
        return { success: false, message: data.message || "Failed to reject payment" };
      }
    } catch {
      return { success: false, message: "Failed to connect to server" };
    }
  };

  // Cart operations
  const addToCart = (service: Service) => {
    if (cart.some((item) => item.id === service.id)) {
      showToast(`${service.name} is already in your cart!`, "warning");
      return;
    }
    const updated = [...cart, service];
    saveCart(updated);
    showToast(`${service.name} added to cart!`);
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCart(updated);
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartSubtotal = cart.reduce((acc, s) => acc + s.startingPrice, 0);
  const cartBookingAmount = cartSubtotal > 0 ? Math.min(1500, cartSubtotal) : 0;
  const cartRemainingAmount = cartSubtotal - cartBookingAmount;

  // Booking operations
  const createBooking = (bookingData: Omit<Booking, "bookingId" | "paymentStatus" | "bookingStatus" | "createdAt" | "paidAmount" | "remainingAmount">) => {
    const bookingId = `HM-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBooking: Booking = {
      ...bookingData,
      bookingId,
      paidAmount: 0,
      remainingAmount: bookingData.totalAmount,
      paymentStatus: "PENDING",
      bookingStatus: "PENDING_PAYMENT",
      createdAt: new Date().toISOString(),
    };
    const updated = [newBooking, ...bookings];
    saveBookings(updated);
    return newBooking;
  };

  const fetchMyBookings = async () => {
    try {
      const adminToken = localStorage.getItem("huma_admin_token");
      const customerToken = localStorage.getItem("huma_token");

      if (adminLoggedIn && adminToken) {
        const res = await fetch(`${BASE_URL}/admin/bookings`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data?.bookings) {
          const mapped = data.data.bookings.map((b: any) => ({
            ...b,
            customerName: b.customer?.fullName || "",
            customerMobile: b.customer?.mobileNumber || "",
            bookingDate: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : "",
          }));
          setBookings(mapped);
          localStorage.setItem("huma_bookings", JSON.stringify(mapped));
        }
      } else if (user && customerToken) {
        const res = await fetch(`${BASE_URL}/bookings`, {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data?.bookings) {
          const mapped = data.data.bookings.map((b: any) => ({
            ...b,
            customerName: b.customer?.fullName || "",
            customerMobile: b.customer?.mobileNumber || "",
            bookingDate: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : "",
          }));
          setBookings(mapped);
          localStorage.setItem("huma_bookings", JSON.stringify(mapped));
        }
      }
    } catch (e) {
      console.error("Failed to fetch bookings from server", e);
    }
  };

  const confirmBookingPayment = (bookingId: string, paymentId: string) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          paidAmount: b.onlineBookingAmount,
          remainingAmount: b.totalAmount - b.onlineBookingAmount,
          paymentStatus: "BOOKED_AMOUNT_PAID" as const,
          bookingStatus: "CONFIRMED" as const,
        };
      }
      return b;
    });
    saveBookings(updated);
    clearCart();
    showToast("Payment verified! Booking confirmed successfully.");
  };

  const cancelBooking = (bookingId: string, reason: string, isCustomer: boolean) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        // Calculate refund details based on 5-day policy
        const bookingDate = new Date(b.bookingDate);
        const today = new Date();
        const diffTime = bookingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let refundAmount = b.onlineBookingAmount;
        if (isCustomer) {
          // ₹500 cancellation fee applies
          refundAmount = Math.max(0, b.onlineBookingAmount - 500);
          // If within 5 days, generally non-refundable
          if (diffDays <= 5) {
            refundAmount = 0;
          }
        }

        return {
          ...b,
          bookingStatus: "CANCELLED" as const,
          paymentStatus: refundAmount === b.onlineBookingAmount ? ("REFUNDED" as const) : b.paymentStatus,
          cancellationReason: reason,
          cancelledBy: isCustomer ? ("CUSTOMER" as const) : ("ADMIN" as const),
        };
      }
      return b;
    });
    saveBookings(updated);
    showToast("Booking cancelled successfully.");
  };

  const requestReschedule = (bookingId: string, date: string, slot: string, reason: string) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          rescheduleRequest: {
            requestedDate: date,
            requestedSlot: slot,
            reason,
            status: "PENDING" as const,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
    showToast("Reschedule request submitted to Admin.");
  };

  const respondToReschedule = (bookingId: string, approve: boolean) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId && b.rescheduleRequest) {
        if (approve) {
          return {
            ...b,
            bookingDate: b.rescheduleRequest.requestedDate,
            timeSlot: b.rescheduleRequest.requestedSlot,
            bookingStatus: "RESCHEDULED" as const,
            rescheduleRequest: {
              ...b.rescheduleRequest,
              status: "APPROVED" as const,
            },
          };
        } else {
          return {
            ...b,
            rescheduleRequest: {
              ...b.rescheduleRequest,
              status: "REJECTED" as const,
            },
          };
        }
      }
      return b;
    });
    saveBookings(updated);
    showToast(approve ? "Reschedule request approved." : "Reschedule request rejected.");
  };

  const updateBookingStatus = (bookingId: string, status: Booking["bookingStatus"]) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          bookingStatus: status,
        };
      }
      return b;
    });
    saveBookings(updated);
    showToast(`Booking status updated to ${status}`);
  };

  // Slots & Availability
  const blockDate = (date: string) => {
    if (blockedDates.includes(date)) return;
    const updated = [...blockedDates, date];
    saveBlockedDates(updated);
    showToast(`Date ${date} marked unavailable`);
  };

  const unblockDate = (date: string) => {
    const updated = blockedDates.filter((d) => d !== date);
    saveBlockedDates(updated);
    showToast(`Date ${date} marked available`);
  };

  const blockSlot = (date: string, time: string) => {
    // Create a special dummy booking that blocks the slot
    const dummyBooking: Booking = {
      bookingId: `BLOCK-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: "ADMIN BLOCK",
      customerMobile: "0000000000",
      items: [],
      serviceArea: "",
      address: "Admin blocked slot",
      bookingDate: date,
      timeSlot: time,
      subtotal: 0,
      totalAmount: 0,
      onlineBookingAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: "PENDING",
      bookingStatus: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    saveBookings([dummyBooking, ...bookings]);
    showToast(`Slot at ${time} on ${date} blocked.`);
  };

  const getAvailableSlotsForDate = (date: string): string[] => {
    if (blockedDates.includes(date)) return [];
    // Filter bookings that match the date and are active (Confirmed/Pending Payment)
    const reservedSlots = bookings
      .filter((b) => b.bookingDate === date && b.bookingStatus !== "CANCELLED")
      .map((b) => b.timeSlot);
    return DEFAULT_SLOTS.filter((slot) => !reservedSlots.includes(slot));
  };

  // Review Operations
  const submitReview = (rating: number, comment: string, serviceName: string, customerName: string) => {
    const newReview: Review = {
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      customerName,
      rating,
      comment,
      serviceName,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    const updated = [newReview, ...reviews];
    saveReviews(updated);
    showToast("Thank you! Review submitted for Admin approval.");
  };

  const moderateReview = (id: string, status: Review["status"]) => {
    const updated = reviews.map((r) => (r.id === id ? { ...r, status } : r));
    saveReviews(updated);
    showToast(`Review status updated to ${status}`);
  };

  // Catalog Settings CRUD
  const addOrUpdateService = (service: Service) => {
    const exists = services.some((s) => s.id === service.id);
    let updated;
    if (exists) {
      updated = services.map((s) => (s.id === service.id ? service : s));
    } else {
      updated = [...services, service];
    }
    saveServices(updated);
    showToast(`Service "${service.name}" saved.`);
  };

  const deleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    saveServices(updated);
    showToast("Service deleted from catalog");
  };

  const addServiceArea = (area: string) => {
    if (serviceAreas.includes(area)) return;
    const updated = [...serviceAreas, area];
    setServiceAreas(updated);
    localStorage.setItem("huma_service_areas", JSON.stringify(updated));
    showToast(`Service area "${area}" added.`);
  };

  const removeServiceArea = (area: string) => {
    const updated = serviceAreas.filter((a) => a !== area);
    setServiceAreas(updated);
    localStorage.setItem("huma_service_areas", JSON.stringify(updated));
    showToast(`Service area "${area}" removed.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        navigate,
        user,
        adminLoggedIn,
        loginCustomer,
        registerCustomer,
        logout,
        loginAdmin,
        logoutAdmin,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        googleAuth,
        completeGoogleRegistration,
        linkGoogleAccount,
        forgotPasswordSendOtp,
        forgotPasswordVerifyOtp,
        resetPassword,
        services,
        addOrUpdateService,
        deleteService,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartBookingAmount,
        cartRemainingAmount,
        bookings,
        createBooking,
        confirmBookingPayment,
        cancelBooking,
        requestReschedule,
        respondToReschedule,
        updateBookingStatus,
        blockedDates,
        blockDate,
        unblockDate,
        getAvailableSlotsForDate,
        blockSlot,
        reviews,
        submitReview,
        moderateReview,
        toasts,
        showToast,
        removeToast,
        serviceAreas,
        addServiceArea,
        removeServiceArea,
        businessSettings,
        fetchBusinessSettings,
        updateBusinessSettings,
        submitPaymentProof,
        adminConfirmPayment,
        adminRejectPayment,
        fetchMyBookings,
        verifyAdminSecurityAnswer,
        refreshAdminToken,
        requestAdminCredentialsChange,
        verifyAdminCredentialsChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
