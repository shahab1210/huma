import React, { createContext, useContext, useState, useEffect } from "react";
import { type Service, type ServiceType, type Availability, type LocationData, type ServiceGroupData, BASE_URL } from "../services/api";

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
  paymentStatus: "PENDING" | "PAYMENT_VERIFICATION_PENDING" | "BOOKED_AMOUNT_PAID" | "PARTIAL_PAYMENT" | "FAILED" | "REFUNDED" | "REJECTED";
  bookingStatus: "PENDING_PAYMENT" | "PAYMENT_VERIFICATION_PENDING" | "CONFIRMED" | "AWAITING_REMAINING_PAYMENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "PAYMENT_REJECTED";
  cancellationReason?: string;
  cancelledBy?: "CUSTOMER" | "ADMIN";
  paymentMethod?: "RAZORPAY" | "UPI_MANUAL";
  transactionId?: string;
  paymentScreenshot?: string;
  rejectionReason?: string;
  adminNote?: string;
  refundStatus?: "NONE" | "PENDING" | "PROCESSED" | "REJECTED";
  refundAmount?: number;
  adminRefundNote?: string;
  refundProcessedAt?: string;
  refundTransactionId?: string;
  customerUpiId?: string;
  customerUpiName?: string;
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
  categories: any[];
  addOrUpdateService: (service: any) => Promise<void>;
  deleteService: (id: string, type: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCatalog: () => Promise<void>;

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
  cancelBooking: (bookingId: string, reason: string, isCustomer: boolean, customerUpiId?: string, customerUpiName?: string) => Promise<{ success: boolean; message?: string }>;
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
  adminConfirmPayment: (paymentId: string, adminNote?: string, pin?: string) => Promise<{ success: boolean; message?: string }>;
  adminRejectPayment: (paymentId: string, rejectionReason: string, adminNote?: string) => Promise<{ success: boolean; message?: string }>;
  adminPartialPayment: (paymentId: string, verifiedAmount: number, adminNote?: string) => Promise<{ success: boolean; message?: string }>;
  adminProcessRefund: (bookingId: string, refundAmount: number, adminRefundNote?: string, refundTransactionId?: string, pin?: string) => Promise<{ success: boolean; message?: string }>;
  setAdminPin: (pin: string, currentPin?: string) => Promise<{ success: boolean; message?: string }>;
  verifyAdminPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  locations: LocationData[];
  serviceGroups: ServiceGroupData[];
  selectedLocation: LocationData | null;
  setSelectedLocation: (location: LocationData | null) => void;
  fetchLocations: () => Promise<void>;
  fetchServiceGroups: () => Promise<void>;
  loadingStates: Record<string, boolean>;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>(["Lucknow", "Kanpur", "Raebareli", "Bachhrawan", "Lalganj"]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [businessSettings, setBusinessSettings] = useState<AppContextType["businessSettings"]>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  // Listen to path changes for routing (SEO-friendly)
  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname.replace(/^\//, '') || 'home';
      setCurrentView(path);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePathChange);
    handlePathChange(); // Trigger on mount

    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const navigate = (view: string) => {
    const url = view === 'home' ? '/' : `/${view}`;
    window.history.pushState({}, '', url);
    setCurrentView(view === 'home' ? 'home' : view);
    window.scrollTo(0, 0);
  };

  // Load from local storage on mount
  useEffect(() => {
    fetchBusinessSettings();
    fetchLocations();
    fetchServiceGroups();
    fetchCategories();
    fetchCatalog();
    
    const storedLocation = localStorage.getItem('huma_selected_location');
    if (storedLocation) setSelectedLocation(JSON.parse(storedLocation));

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

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('huma_selected_location', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

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

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${BASE_URL}/locations`);
      const data = await res.json();
      if (data.success) {
        setLocations(data.data.locations);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchServiceGroups = async () => {
    try {
      const res = await fetch(`${BASE_URL}/service-groups`);
      const data = await res.json();
      if (data.success) {
        setServiceGroups(data.data.serviceGroups);
      }
    } catch (err) {
      console.error('Failed to fetch service groups:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`);
      const data = await res.json();
      if (data.success && data.data?.categories) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const [resServices, resDesigns] = await Promise.all([
        fetch(`${BASE_URL}/services`),
        fetch(`${BASE_URL}/designs`),
      ]);
      const dataServices = await resServices.json();
      const dataDesigns = await resDesigns.json();

      let merged: Service[] = [];

      if (dataServices.success && dataServices.data?.services) {
        const mappedServices = dataServices.data.services.map((s: any) => ({
          id: s._id,
          type: s.serviceType,
          name: s.name,
          category: s.category?.name || s.category || '',
          description: s.description || '',
          duration: s.duration || '',
          startingPrice: s.price || 0,
          mrp: s.mrp || 0,
          discountType: s.discountType || 'NONE',
          discountValue: s.discountValue || 0,
          image: s.images?.[0]?.url || s.image || '',
          featured: !!s.isFeatured,
          availability: s.isAvailable ? 'AVAILABLE' : 'BLOCKED',
        }));
        merged = [...merged, ...mappedServices];
      }

      if (dataDesigns.success && dataDesigns.data?.designs) {
        const mappedDesigns = dataDesigns.data.designs.map((d: any) => ({
          id: d._id,
          type: 'MEHENDI',
          name: d.name,
          category: d.category?.name || d.category || '',
          description: d.description || '',
          duration: d.duration || '',
          startingPrice: d.price || 0,
          mrp: d.mrp || 0,
          discountType: d.discountType || 'NONE',
          discountValue: d.discountValue || 0,
          image: d.images?.[0]?.url || d.image || '',
          featured: !!d.isFeatured,
          availability: d.isAvailable ? 'AVAILABLE' : 'BLOCKED',
        }));
        merged = [...merged, ...mappedDesigns];
      }

      if (merged.length > 0) {
        setServices(merged);
        localStorage.setItem("huma_services", JSON.stringify(merged));
      }
    } catch (e) {
      console.error("Failed to fetch catalog from backend", e);
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

  const adminConfirmPayment = async (paymentId: string, adminNote?: string, pin?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading('adminConfirmPayment', true);
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/payments/${paymentId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ adminNote, pin }),
      });
      const data = await res.json();
      if (data.success) {
        // Sync local bookings list
        const updated = bookings.map((b) => {
          if (b.bookingId === data.data?.booking?.bookingId || (b as any)._id === data.data?.booking?._id) {
            return {
              ...b,
              paymentStatus: data.data.booking.paymentStatus || ("BOOKED_AMOUNT_PAID" as const),
              bookingStatus: data.data.booking.bookingStatus || ("CONFIRMED" as const),
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
    } finally {
      setLoading('adminConfirmPayment', false);
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

  const adminPartialPayment = async (
    paymentId: string,
    verifiedAmount: number,
    adminNote?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading('adminPartialPayment', true);
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/payments/${paymentId}/partial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ verifiedAmount, adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = bookings.map((b) => {
          if (b.bookingId === data.data?.booking?.bookingId || (b as any)._id === data.data?.booking?._id) {
            return {
              ...b,
              paymentStatus: data.data.booking.paymentStatus,
              bookingStatus: data.data.booking.bookingStatus,
              paidAmount: data.data.booking.paidAmount,
              remainingAmount: data.data.booking.remainingAmount,
            };
          }
          return b;
        });
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to process partial payment" };
      }
    } catch {
      return { success: false, message: "Failed to connect to server" };
    } finally {
      setLoading('adminPartialPayment', false);
    }
  };

  const adminProcessRefund = async (
    bookingId: string,
    refundAmount: number,
    adminRefundNote?: string,
    refundTransactionId?: string,
    pin?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading('adminProcessRefund', true);
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/payments/${bookingId}/process-refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ refundAmount, adminRefundNote, refundTransactionId, pin }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = bookings.map((b) => {
          if (b.bookingId === data.data?.booking?.bookingId || (b as any)._id === data.data?.booking?._id) {
            return {
              ...b,
              bookingStatus: "CANCELLED" as const,
              paymentStatus: "REFUNDED" as const,
              refundStatus: "PROCESSED" as const,
              refundAmount: data.data.booking.refundAmount,
              adminRefundNote: data.data.booking.adminRefundNote,
              refundTransactionId: data.data.booking.refundTransactionId,
            };
          }
          return b;
        });
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to process refund" };
      }
    } catch {
      return { success: false, message: "Failed to connect to server" };
    } finally {
      setLoading('adminProcessRefund', false);
    }
  };

  const setAdminPin = async (pin: string, currentPin?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading('setAdminPin', true);
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/auth/admin/set-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ pin, currentPin }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: "Failed to connect to server" };
    } finally {
      setLoading('setAdminPin', false);
    }
  };

  const verifyAdminPin = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/auth/admin/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
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
        if (res.status === 401) {
          setAdminLoggedIn(false);
          localStorage.removeItem("huma_admin_logged_in");
          localStorage.removeItem("huma_admin_token");
          return;
        }
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
        if (res.status === 401) {
          setUser(null);
          localStorage.removeItem("huma_user");
          localStorage.removeItem("huma_token");
          return;
        }
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

  const cancelBooking = async (
    bookingId: string,
    reason: string,
    isCustomer: boolean,
    customerUpiId?: string,
    customerUpiName?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading('cancelBooking', true);
      const token = localStorage.getItem("huma_token") || localStorage.getItem("huma_admin_token");
      
      const bObj = bookings.find((b) => b.bookingId === bookingId || (b as any)._id === bookingId);
      const targetId = (bObj as any)?._id || bookingId;

      const res = await fetch(`${BASE_URL}/bookings/${targetId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ reason, customerUpiId, customerUpiName }),
      });
      const data = await res.json();

      const updated = bookings.map((b) => {
        if (b.bookingId === bookingId || (b as any)._id === targetId) {
          const bkData = data.data?.booking;
          return {
            ...b,
            bookingStatus: "CANCELLED" as const,
            paymentStatus: (bkData?.paymentStatus || "REFUNDED") as any,
            refundStatus: (bkData?.refundStatus || "PENDING") as any,
            refundAmount: bkData?.refundAmount ?? 0,
            cancellationReason: reason,
            cancelledBy: isCustomer ? ("CUSTOMER" as const) : ("ADMIN" as const),
            customerUpiId: customerUpiId || bkData?.customerUpiId || b.customerUpiId,
            customerUpiName: customerUpiName || bkData?.customerUpiName || b.customerUpiName,
          };
        }
        return b;
      });
      setBookings(updated);
      localStorage.setItem("huma_bookings", JSON.stringify(updated));
      showToast(data.message || "Booking cancelled successfully.");
      return { success: data.success ?? true, message: data.message };
    } catch {
      const updated = bookings.map((b) => {
        if (b.bookingId === bookingId) {
          return {
            ...b,
            bookingStatus: "CANCELLED" as const,
            paymentStatus: "REFUNDED" as const,
            refundStatus: "PENDING" as const,
            cancellationReason: reason,
            cancelledBy: isCustomer ? ("CUSTOMER" as const) : ("ADMIN" as const),
            customerUpiId,
            customerUpiName,
          };
        }
        return b;
      });
      setBookings(updated);
      localStorage.setItem("huma_bookings", JSON.stringify(updated));
      showToast("Booking cancelled.");
      return { success: true };
    } finally {
      setLoading('cancelBooking', false);
    }
  };

  const requestReschedule = async (bookingId: string, date: string, slot: string, reason: string) => {
    try {
      setLoading('requestReschedule', true);
      const token = localStorage.getItem("huma_token");
      const bObj = bookings.find((b) => b.bookingId === bookingId || (b as any)._id === bookingId);
      const targetId = (bObj as any)?._id || bookingId;

      const res = await fetch(`${BASE_URL}/bookings/${targetId}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ requestedDate: date, requestedSlot: slot, reason }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = bookings.map((b) => {
          if (b.bookingId === bookingId || (b as any)._id === targetId) {
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
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        showToast("Reschedule request submitted to Admin.");
      } else {
        showToast(data.message || "Failed to submit reschedule request", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading('requestReschedule', false);
    }
  };

  const respondToReschedule = async (bookingId: string, approve: boolean) => {
    try {
      setLoading('respondToReschedule', true);
      const token = localStorage.getItem("huma_admin_token");
      const bObj = bookings.find((b) => b.bookingId === bookingId || (b as any)._id === bookingId);
      const targetId = (bObj as any)?._id || bookingId;

      const res = await fetch(`${BASE_URL}/admin/bookings/${targetId}/respond-reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = bookings.map((b) => {
          if ((b.bookingId === bookingId || (b as any)._id === targetId) && b.rescheduleRequest) {
            if (approve) {
              return {
                ...b,
                bookingDate: b.rescheduleRequest.requestedDate,
                timeSlot: b.rescheduleRequest.requestedSlot,
                bookingStatus: "CONFIRMED" as const,
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
        setBookings(updated);
        localStorage.setItem("huma_bookings", JSON.stringify(updated));
        showToast(`Reschedule request ${approve ? "approved" : "rejected"}.`);
      } else {
        showToast(data.message || "Failed to respond to reschedule", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading('respondToReschedule', false);
    }
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
  const addOrUpdateService = async (service: any) => {
    try {
      const adminToken = localStorage.getItem("huma_admin_token");
      const isEdit = service.id && !service.id.startsWith("custom-");
      
      const endpoint = service.type === "MEHENDI" ? "designs" : "services";
      const url = isEdit 
        ? `${BASE_URL}/admin/${endpoint}/${service.id}`
        : `${BASE_URL}/admin/${endpoint}`;
      
      // Resolve category: if it's an ObjectId, send it directly, otherwise try to find matching category by name
      let categoryId = service.category;
      const matchedCat = categories.find(c => c._id === categoryId || c.name === categoryId);
      if (matchedCat) {
        categoryId = matchedCat._id;
      } else if (categories.length > 0) {
        // Fallback to first matching category
        const fallback = categories.find(c => c.serviceType === service.type);
        categoryId = fallback ? fallback._id : categories[0]._id;
      }

      const bodyPayload = {
        name: service.name,
        category: categoryId,
        description: service.description || '',
        price: Number(service.startingPrice || 0),
        mrp: Number(service.mrp || service.startingPrice || 0),
        discountType: service.discountType || "NONE",
        discountValue: Number(service.discountValue || 0),
        duration: service.duration || '',
        images: [{ url: service.image || "https://images.unsplash.com/photo-1762162089047-97e09435984d?w=800&h=1000" }],
        isFeatured: !!service.featured,
        isAvailable: service.availability === "AVAILABLE",
        // for designs
        startingPrice: Number(service.startingPrice || 0),
        coverage: service.coverage || "Full hands",
        customizationAvailable: true,
        // for services
        serviceType: service.type,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Catalog item "${service.name}" saved successfully.`);
        fetchCatalog(); // Refresh catalog
      } else {
        showToast(data.message || "Failed to save item.", "error");
      }
    } catch (err) {
      console.error("Failed to save catalog item:", err);
      showToast("Error connecting to server", "error");
    }
  };

  const deleteService = async (id: string, type: string) => {
    try {
      const adminToken = localStorage.getItem("huma_admin_token");
      const endpoint = type === "MEHENDI" ? "designs" : "services";
      
      const res = await fetch(`${BASE_URL}/admin/${endpoint}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        showToast("Item deleted from catalog.");
        fetchCatalog(); // Refresh catalog
      } else {
        showToast(data.message || "Failed to delete item.", "error");
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      showToast("Error connecting to server", "error");
    }
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
        adminPartialPayment,
        adminProcessRefund,
        setAdminPin,
        verifyAdminPin,
        fetchMyBookings,
        verifyAdminSecurityAnswer,
        refreshAdminToken,
        requestAdminCredentialsChange,
        verifyAdminCredentialsChange,
        locations,
        serviceGroups,
        selectedLocation,
        setSelectedLocation,
        fetchLocations,
        fetchServiceGroups,
        categories,
        fetchCategories,
        fetchCatalog,
        loadingStates,
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

// Alias for components that use this name
export const useAppContext = useApp;
