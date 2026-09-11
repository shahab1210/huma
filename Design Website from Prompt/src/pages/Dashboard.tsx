import { useState } from "react";
import { useApp, type Booking } from "../context/AppContext";
import ReviewModal from "../components/ReviewModal";
import UpiPaymentModal from "../components/UpiPaymentModal";

export default function Dashboard() {
  const {
    user,
    bookings,
    cancelBooking,
    requestReschedule,
    submitReview,
    getAvailableSlotsForDate,
    logout,
    navigate,
    showToast,
    linkGoogleAccount,
    fetchMyBookings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Pay Remaining Modal State
  const [payRemainingBooking, setPayRemainingBooking] = useState<Booking | null>(null);

  // Reschedule Modal State
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Cancel Confirmation Popup
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customerUpiId, setCustomerUpiId] = useState("");
  const [customerUpiName, setCustomerUpiName] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-28 text-center space-y-5">
        <h2 className="font-display text-2xl text-brand">Access Required</h2>
        <p className="text-sm text-muted">
          Please register or log in to view your bookings and manage your profile.
        </p>
        <button
          type="button"
          onClick={() => navigate("auth")}
          className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-cream hover:bg-brand-700 transition-colors"
        >
          Login / Register
        </button>
      </div>
    );
  }

  // Filter client bookings
  const clientBookings = bookings.filter((b) => b.customerMobile === user.mobileNumber);

  const filteredBookings = clientBookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "upcoming") {
      return (
        b.bookingStatus === "CONFIRMED" ||
        b.bookingStatus === "AWAITING_REMAINING_PAYMENT" ||
        b.bookingStatus === "CANCELLATION_REQUESTED" ||
        b.bookingStatus === "RESCHEDULED" ||
        b.bookingStatus === "PENDING_PAYMENT" ||
        b.bookingStatus === "PAYMENT_VERIFICATION_PENDING"
      );
    }
    if (bookingFilter === "completed") return b.bookingStatus === "COMPLETED";
    if (bookingFilter === "cancelled") {
      return b.bookingStatus === "CANCELLED" || b.bookingStatus === "PAYMENT_REJECTED";
    }
    return true;
  });

  const getStatusBadge = (status: Booking["bookingStatus"]) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="rounded-full bg-available/10 px-2.5 py-1 text-[10px] font-semibold text-available uppercase">Confirmed</span>;
      case "AWAITING_REMAINING_PAYMENT":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800 uppercase">Awaiting Remaining Payment</span>;
      case "PENDING_PAYMENT":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800 uppercase">Pending Payment</span>;
      case "PAYMENT_VERIFICATION_PENDING":
        return <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold text-gold uppercase border border-gold/25">Verification Pending</span>;
      case "CANCELLATION_REQUESTED":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900 uppercase border border-amber-300">Cancellation Requested</span>;
      case "RESCHEDULED":
        return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-800 uppercase">Rescheduled</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 uppercase">Completed</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-blocked/10 px-2.5 py-1 text-[10px] font-semibold text-blocked uppercase">Cancelled</span>;
      case "PAYMENT_REJECTED":
        return <span className="rounded-full bg-blocked/10 px-2.5 py-1 text-[10px] font-bold text-blocked uppercase">Payment Rejected</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-800 uppercase">{status}</span>;
    }
  };

  const getPaymentBadge = (status: Booking["paymentStatus"]) => {
    switch (status) {
      case "BOOKED_AMOUNT_PAID":
        return <span className="text-[11px] font-medium text-available">✓ Booking Fee Paid</span>;
      case "PARTIAL_PAYMENT":
        return <span className="text-[11px] font-medium text-amber-700">⏳ Partial Payment Verified</span>;
      case "REFUNDED":
        return <span className="text-[11px] font-medium text-blue-600">↺ Refunded</span>;
      case "FAILED":
        return <span className="text-[11px] font-medium text-blocked">✕ Payment Failed</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-500">Unpaid</span>;
    }
  };

  // Reschedule actions
  const handleOpenReschedule = (b: Booking) => {
    setRescheduleBookingId(b.bookingId);
    setRescheduleDate("");
    setRescheduleSlot("");
    setRescheduleReason("");
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBookingId || !rescheduleDate || !rescheduleSlot || !rescheduleReason) return;
    requestReschedule(rescheduleBookingId, rescheduleDate, rescheduleSlot, rescheduleReason);
    setRescheduleBookingId(null);
  };

  // Cancel actions
  const handleCancelClick = (b: Booking) => {
    setCancelBookingId(b.bookingId);
    setCancelReason("");
    setCustomerUpiId("");
    setCustomerUpiName("");
  };

  const handleConfirmCancel = async () => {
    if (!cancelBookingId || !cancelReason.trim()) return;
    await cancelBooking(cancelBookingId, cancelReason, true, customerUpiId, customerUpiName);
    setCancelBookingId(null);
  };

  // Review actions
  const handleOpenReview = (b: Booking) => {
    setReviewBooking(b);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!reviewBooking) return;
    const serviceName = reviewBooking.items.map((i) => i.nameSnapshot).join(", ");
    submitReview(rating, comment, serviceName, user.fullName);
    showToast("Review submitted successfully");
  };

  // Availability timeslots for rescheduled date
  const availableSlots = rescheduleDate ? getAvailableSlotsForDate(rescheduleDate) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-brand">My Dashboard</h1>
          <p className="text-sm text-muted mt-1">Hello, {user.fullName} • {user.mobileNumber}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "bookings" ? "bg-brand text-cream" : "border border-hairline text-brand hover:bg-cream/45"
            }`}
          >
            My Bookings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "profile" ? "bg-brand text-cream" : "border border-hairline text-brand hover:bg-cream/45"
            }`}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="mt-8">
        
        {/* TAB 1: BOOKINGS LIST */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 border-b border-hairline pb-4">
              {(["all", "upcoming", "completed", "cancelled"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setBookingFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                    bookingFilter === filter
                      ? "bg-gold text-white"
                      : "border border-hairline bg-surface text-muted hover:border-gold hover:text-gold"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-12 text-center space-y-4">
                <p className="text-lg text-muted font-display">No bookings found in this filter.</p>
                <button
                  type="button"
                  onClick={() => navigate("mehendi")}
                  className="rounded-md bg-brand px-5 py-2 text-xs font-semibold text-cream"
                >
                  Book a Service
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBookings.map((b) => {
                  const itemsList = b.items.map((i) => i.nameSnapshot).join(", ");
                  const isCancelable = b.bookingStatus !== "CANCELLED" && b.bookingStatus !== "COMPLETED" && b.bookingStatus !== "CANCELLATION_REQUESTED";
                  const isReschedulable = b.bookingStatus !== "CANCELLED" && b.bookingStatus !== "COMPLETED" && b.bookingStatus !== "CANCELLATION_REQUESTED" && !b.rescheduleRequest;
                  const isReviewable = b.bookingStatus === "COMPLETED";

                  return (
                    <div
                      key={b.bookingId}
                      className="rounded-2xl border border-hairline bg-surface p-5 md:p-6 space-y-4"
                    >
                      {/* Top Header Card Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">
                            Booking ID: {b.bookingId}
                          </p>
                          <p className="text-xs text-muted">Created: {new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getPaymentBadge(b.paymentStatus)}
                          {getStatusBadge(b.bookingStatus)}
                        </div>
                      </div>

                      {/* Middle description info */}
                      <div className="grid gap-4 sm:grid-cols-2 text-xs text-ink">
                        <div>
                          <p className="font-semibold text-brand uppercase tracking-wider text-[10px]">Services</p>
                          <p className="mt-1 font-medium">{itemsList || "Custom blocked time"}</p>
                          <p className="text-muted mt-1 font-semibold text-gold">
                            ₹{b.totalAmount.toLocaleString("en-IN")} Total
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-brand uppercase tracking-wider text-[10px]">Schedule &amp; Address</p>
                          <p className="mt-1 font-medium">{b.bookingDate} at {b.timeSlot}</p>
                          <p className="text-muted mt-1">{b.address}, {b.serviceArea}</p>
                        </div>
                      </div>

                      {/* Partial payment details banner */}
                      {(b.bookingStatus === "AWAITING_REMAINING_PAYMENT" || b.paymentStatus === "PARTIAL_PAYMENT") && (
                        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
                          <p className="font-bold text-amber-950 uppercase tracking-wider text-[10px]">Partial Payment Received:</p>
                          <p className="leading-relaxed">
                            Received: <strong>₹{(b.paidAmount || 0).toLocaleString("en-IN")}</strong> • Remaining Required: <strong>₹{(b.remainingAmount || (b.onlineBookingAmount - (b.paidAmount || 0))).toLocaleString("en-IN")}</strong>
                          </p>
                          <p className="text-[11px] text-amber-800">
                            Please complete the remaining amount so your booking can be fully confirmed.
                          </p>
                          <button
                            type="button"
                            onClick={() => setPayRemainingBooking(b)}
                            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 font-semibold text-xs transition-colors shadow-sm"
                          >
                            Pay Remaining ₹{(b.remainingAmount || (b.onlineBookingAmount - (b.paidAmount || 0))).toLocaleString("en-IN")}
                          </button>
                        </div>
                      )}

                      {/* Reschedule Pending Request Notice */}
                      {b.rescheduleRequest && b.rescheduleRequest.status === "PENDING" && (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                          <strong>Pending Reschedule Request:</strong> Asks for {b.rescheduleRequest.requestedDate} at {b.rescheduleRequest.requestedSlot}. Waiting for Admin approval.
                        </div>
                      )}

                      {/* Cancellation Requested Banner */}
                      {b.bookingStatus === "CANCELLATION_REQUESTED" && (
                        <div className="rounded-xl bg-amber-50/90 border border-amber-300 p-4 text-xs text-amber-950 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-amber-950">Cancellation Request Status</p>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                              ⏳ Request Sent • Waiting for Approval
                            </span>
                          </div>
                          <p className="font-medium text-amber-900">
                            Cancellation request sent to admin. Waiting for approval.
                          </p>
                          {b.cancellationReason && (
                            <p className="text-[11px] text-amber-800">
                              <strong>Reason:</strong> {b.cancellationReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Cancellation Request Rejected Notice */}
                      {b.cancellationDecision === "REJECTED" && b.bookingStatus !== "CANCELLED" && b.bookingStatus !== "CANCELLATION_REQUESTED" && (
                        <div className="rounded-xl bg-stone-100 border border-stone-300 p-3 text-xs text-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-stone-900 uppercase tracking-wider text-[10px]">Cancellation Request Rejected</p>
                            <span className="text-[10px] text-stone-600 font-semibold">Booking Active</span>
                          </div>
                          <p>Your previous cancellation request was reviewed and rejected by admin. Your booking remains active and confirmed.</p>
                          {b.cancellationRejectionReason && (
                            <p className="text-[11px] text-stone-700 italic">Note from Admin: "{b.cancellationRejectionReason}"</p>
                          )}
                        </div>
                      )}

                      {/* Cancellation & Refund details info banner (ONLY if CANCELLED) */}
                      {b.bookingStatus === "CANCELLED" && (
                        <div className="rounded-xl bg-red-50/90 border border-red-200 p-4 text-xs text-red-900 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-red-950 uppercase tracking-wider text-[10px]">Order Cancellation &amp; Refund Status</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              b.refundStatus === "PROCESSED" || b.paymentStatus === "REFUNDED"
                                ? "bg-green-100 text-green-800"
                                : b.refundStatus === "PENDING"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-stone-200 text-stone-700"
                            }`}>
                              {b.refundStatus === "PROCESSED" || b.paymentStatus === "REFUNDED"
                                ? "✓ Refund Processed"
                                : b.refundStatus === "PENDING"
                                ? "⏳ Refund Pending"
                                : "Cancelled"}
                            </span>
                          </div>

                          <p><strong>Reason:</strong> {b.cancellationReason || "Cancelled by customer"}</p>
                          
                          {(b.paidAmount > 0 || b.onlineBookingAmount > 0 || b.refundAmount !== undefined) && (
                            <div className="rounded-lg bg-white/80 border border-red-100 p-2.5 space-y-1 text-stone-800 font-medium">
                              <p>• Original Advance Paid: <strong>₹{(b.paidAmount || b.onlineBookingAmount || 0).toLocaleString("en-IN")}</strong></p>
                              <p>• Refund Amount: <strong className="text-green-700">₹{(b.refundAmount || 0).toLocaleString("en-IN")}</strong></p>
                              {b.customerUpiId && (
                                <p>• Submitted Payout UPI: <span className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 font-semibold">{b.customerUpiId}</span> {b.customerUpiName ? `(${b.customerUpiName})` : ""}</p>
                              )}
                              {b.refundTransactionId && (
                                <p>• Refund Reference / UTR: <span className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 select-all font-semibold">{b.refundTransactionId}</span></p>
                              )}
                              {b.adminRefundNote && (
                                <p>• Admin Note: <em>"{b.adminRefundNote}"</em></p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom actions */}
                      {(isCancelable || isReschedulable || isReviewable) && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-hairline">
                          {isReschedulable && (
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(b)}
                              className="rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-brand hover:bg-cream/45 transition-colors"
                            >
                              Request Reschedule
                            </button>
                          )}
                          {isCancelable && (
                            <button
                              type="button"
                              onClick={() => handleCancelClick(b)}
                              className="rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-blocked hover:bg-blocked/5 transition-colors"
                            >
                              Cancel Order
                            </button>
                          )}
                          {isReviewable && (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(b)}
                              className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                              Write a Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PROFILE DETAILS */}
        {activeTab === "profile" && (
          <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6">
            <h2 className="font-display text-2xl text-brand border-b border-hairline pb-2">Your Profile</h2>

            <div className="space-y-4 text-sm text-ink max-w-md">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-hairline">
                <span className="font-semibold text-gold uppercase tracking-wider text-[10px] self-center">Name</span>
                <span className="col-span-2 font-medium text-brand">{user.fullName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-hairline">
                <span className="font-semibold text-gold uppercase tracking-wider text-[10px] self-center">Mobile</span>
                <span className="col-span-2 font-medium text-brand">
                  {user.mobileNumber}{" "}
                  {user.isMobileVerified !== false && (
                    <span className="ml-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Verified</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-hairline">
                <span className="font-semibold text-gold uppercase tracking-wider text-[10px] self-center">Email</span>
                <span className="col-span-2 text-muted">{user.email || "Not provided (optional)"}</span>
              </div>
            </div>

            {/* ── Login Methods Section ── */}
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-lg text-brand border-b border-hairline pb-2">Login Methods</h3>

              <div className="space-y-3 max-w-md">
                {/* Mobile + Password */}
                <div className="flex items-center justify-between rounded-xl border border-hairline bg-cream/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📱</span>
                    <div>
                      <p className="text-xs font-semibold text-brand">Mobile + Password</p>
                      <p className="text-[10px] text-muted">Primary login method</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Enabled</span>
                </div>

                {/* Google */}
                <div className="flex items-center justify-between rounded-xl border border-hairline bg-cream/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-brand">Google Authentication</p>
                      <p className="text-[10px] text-muted">
                        {user.authProviders?.includes("GOOGLE") ? "Linked to your account" : "Optional sign-in method"}
                      </p>
                    </div>
                  </div>
                  {user.authProviders?.includes("GOOGLE") ? (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Connected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
                        if (!clientId || !window.google) {
                          showToast("Google authentication is not configured.", "warning");
                          return;
                        }
                        window.google.accounts.id.initialize({
                          client_id: clientId,
                          callback: async (response: any) => {
                            const result = await linkGoogleAccount(response.credential);
                            if (result.success) {
                              showToast("Google account linked successfully!");
                            } else {
                              showToast(result.message || "Failed to link Google account", "error");
                            }
                          },
                        });
                        window.google.accounts.id.prompt();
                      }}
                      className="rounded-md border border-gold px-3 py-1.5 text-[10px] font-semibold text-gold hover:bg-gold hover:text-white transition-colors"
                    >
                      Connect Google
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-blocked px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95 transition-opacity"
              >
                Logout Customer Session
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Reschedule Request Modal Dialog */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-lg text-brand">Reschedule Appointment</h3>
              <button
                type="button"
                onClick={() => setRescheduleBookingId(null)}
                className="text-muted hover:text-brand"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="res-date" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Select New Date</label>
                <input
                  id="res-date"
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Select Available Slot</label>
                  {availableSlots.length === 0 ? (
                    <p className="mt-2 text-xs text-blocked bg-red-50 p-3 rounded-lg border border-red-100">
                      No slots available on this date.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setRescheduleSlot(slot)}
                          className={`rounded border py-2 text-xs font-semibold transition-colors ${
                            rescheduleSlot === slot
                              ? "border-brand bg-brand text-cream"
                              : "border-hairline bg-surface text-brand hover:border-gold hover:text-gold"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="res-reason" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Reason for rescheduling</label>
                <textarea
                  id="res-reason"
                  required
                  rows={2}
                  placeholder="Tell us why you are rescheduling..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRescheduleBookingId(null)}
                  className="flex-1 rounded-md border border-hairline py-2.5 text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rescheduleDate || !rescheduleSlot}
                  className="flex-1 rounded-md bg-brand py-2.5 font-semibold text-cream disabled:bg-hairline disabled:text-muted"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Policy Popup Dialog */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-lg text-brand">Cancel Appointment</h3>
              <button
                type="button"
                onClick={() => setCancelBookingId(null)}
                className="text-muted hover:text-brand"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Cancellation Policy warning box */}
              <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-xs text-orange-800 space-y-2">
                <p className="font-bold uppercase tracking-wider text-[9px] text-orange-900">Cancellation Policy Warning:</p>
                <p>1. A ₹500 cancellation charge will be deducted from your online booking fee.</p>
                <p>2. Appointments cancelled within 5 days of booking date are non-refundable.</p>
                <p>3. If applicable, refund processing will take 5-7 business days.</p>
              </div>

              <div>
                <label htmlFor="cancel-reason" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Reason for Cancellation</label>
                <textarea
                  id="cancel-reason"
                  required
                  rows={2}
                  placeholder="Provide reason for cancelling appointment..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cancel-upi-id" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Your UPI ID for Refund Payout</label>
                <input
                  id="cancel-upi-id"
                  type="text"
                  placeholder="e.g. 9876543210@paytm or name@upi"
                  value={customerUpiId}
                  onChange={(e) => setCustomerUpiId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none font-mono"
                />
              </div>

              <div>
                <label htmlFor="cancel-upi-name" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Account Holder Name on UPI Account</label>
                <input
                  id="cancel-upi-name"
                  type="text"
                  placeholder="Full name registered on UPI account..."
                  value={customerUpiName}
                  onChange={(e) => setCustomerUpiName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 leading-relaxed space-y-1 font-medium">
                <p className="font-bold text-amber-950 uppercase tracking-wider text-[9px]">⚠️ Important Payout Notice:</p>
                <p>• The UPI ID and Account Holder Name MUST match the original account/UPI used during payment verification.</p>
                <p>• If you need to request payout to a different UPI account, please contact Admin directly via WhatsApp.</p>
              </div>

              <div className="flex gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCancelBookingId(null)}
                  className="flex-1 rounded-md border border-hairline py-2.5 text-muted font-semibold"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim()}
                  onClick={handleConfirmCancel}
                  className="flex-1 rounded-md bg-blocked py-2.5 font-semibold text-white disabled:bg-hairline disabled:text-muted transition-colors"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Dialog Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
          serviceName={reviewBooking.items.map((i) => i.nameSnapshot).join(", ")}
        />
      )}

      {/* Pay Remaining UpiPaymentModal */}
      {payRemainingBooking && (
        <UpiPaymentModal
          isOpen={Boolean(payRemainingBooking)}
          onClose={() => setPayRemainingBooking(null)}
          onSubmitSuccess={() => {
            setPayRemainingBooking(null);
            fetchMyBookings();
          }}
          bookingId={payRemainingBooking._id || payRemainingBooking.bookingId}
          onlineBookingAmount={payRemainingBooking.remainingAmount || (payRemainingBooking.onlineBookingAmount - (payRemainingBooking.paidAmount || 0))}
        />
      )}
    </div>
  );
}
