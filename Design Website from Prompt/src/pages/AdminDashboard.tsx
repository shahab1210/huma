import { useState, useEffect, useRef } from "react";
import { useApp, type Booking, type Review } from "../context/AppContext";
import { type Service } from "../services/api";

export default function AdminDashboard() {
  const {
    adminLoggedIn,
    loginAdmin,
    verifyAdminSecurityAnswer,
    logoutAdmin,
    requestAdminCredentialsChange,
    verifyAdminCredentialsChange,
    bookings,
    services,
    addOrUpdateService,
    deleteService,
    blockedDates,
    blockDate,
    unblockDate,
    blockSlot,
    reviews,
    moderateReview,
    respondToReschedule,
    updateBookingStatus,
    serviceAreas,
    addServiceArea,
    removeServiceArea,
    showToast,
    businessSettings,
    updateBusinessSettings,
    adminConfirmPayment,
    adminRejectPayment,
  } = useApp();

  // Admin Login Credentials & Security Question
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [awaitingSecurityAnswer, setAwaitingSecurityAnswer] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [tempLoginToken, setTempLoginToken] = useState("");

  // Admin Credentials Update Settings
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newSecurityQuestion, setNewSecurityQuestion] = useState("");
  const [newSecurityAnswer, setNewSecurityAnswer] = useState("");
  const [credsOtp, setCredsOtp] = useState("");
  const [credsUpdateToken, setCredsUpdateToken] = useState("");
  const [awaitingCredsChangeMfa, setAwaitingCredsChangeMfa] = useState(false);
  const [isSubmittingCreds, setIsSubmittingCreds] = useState(false);

  // Tab control
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "slots" | "catalog" | "reviews" | "areas" | "payments" | "settings">("overview");

  // Slot management forms
  const [blockDateInput, setBlockDateInput] = useState("");
  const [blockSlotDate, setBlockSlotDate] = useState("");
  const [blockSlotTime, setBlockSlotTime] = useState("10:00 AM");

  // Catalog item CRUD states
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [crudName, setCrudName] = useState("");
  const [crudCategory, setCrudCategory] = useState("");
  const [crudDesc, setCrudDesc] = useState("");
  const [crudPrice, setCrudPrice] = useState<number>(1000);
  const [crudDuration, setCrudDuration] = useState("Approx. 1.5 hrs");
  const [crudType, setCrudType] = useState<Service["type"]>("MEHENDI");
  const [crudFeatured, setCrudFeatured] = useState(false);
  const [crudAvailability, setCrudAvailability] = useState<Service["availability"]>("AVAILABLE");
  const [crudImage, setCrudImage] = useState("");

  // Service Area Form
  const [newAreaInput, setNewAreaInput] = useState("");

  // Payment Verification Tab States
  const [paymentFilter, setPaymentFilter] = useState<"PENDING" | "PAID" | "REJECTED" | "ALL">("PENDING");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Dialog / Modal states for action details
  const [activeDialogBooking, setActiveDialogBooking] = useState<Booking | null>(null);
  const [dialogAction, setDialogAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [dialogReason, setDialogReason] = useState("");
  const [dialogNote, setDialogNote] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Settings Tab States
  const [settingsAdvance, setSettingsAdvance] = useState(1500);
  const [settingsUpiId, setSettingsUpiId] = useState("demo@upi");
  const [settingsQrPreview, setSettingsQrPreview] = useState("");
  const [settingsQrBase64, setSettingsQrBase64] = useState("");
  const [settingsWhatsApp, setSettingsWhatsApp] = useState("+918960600371");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const settingsQrInputRef = useRef<HTMLInputElement>(null);

  // Sync settings when loaded
  useEffect(() => {
    if (businessSettings) {
      setSettingsAdvance(businessSettings.bookingAmount || 1500);
      setSettingsUpiId(businessSettings.upiId || "demo@upi");
      setSettingsQrPreview(businessSettings.upiQrImage || "");
      setSettingsQrBase64(businessSettings.upiQrImage || "");
      setSettingsWhatsApp(businessSettings.paymentWhatsApp || "+918960600371");
    }
  }, [businessSettings]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginAdmin(adminUser, adminPass);
    if (result.success && result.awaitingSecurityAnswer && result.tempToken) {
      setAwaitingSecurityAnswer(true);
      setTempLoginToken(result.tempToken);
      setSecurityQuestion(result.question || "What is your husband's school name?");
      showToast("Please verify security answer.", "info");
    }
  };

  const handleSecurityAnswerVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer) return;
    const success = await verifyAdminSecurityAnswer(tempLoginToken, securityAnswer);
    if (success) {
      setAwaitingSecurityAnswer(false);
      setTempLoginToken("");
      setSecurityAnswer("");
    }
  };

  const handleCredsChangeRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser && !newAdminPass && !newSecurityQuestion && !newSecurityAnswer) {
      showToast("Please enter updates to save.", "warning");
      return;
    }
    setIsSubmittingCreds(true);
    const result = await requestAdminCredentialsChange(
      newAdminUser,
      newAdminPass || undefined,
      newSecurityQuestion || undefined,
      newSecurityAnswer || undefined
    );
    setIsSubmittingCreds(false);
    if (result.success && result.updateToken) {
      setCredsUpdateToken(result.updateToken);
      setAwaitingCredsChangeMfa(true);
      showToast("Security OTP sent to Huma's WhatsApp to confirm changes.", "info");
    } else {
      showToast(result.message || "Failed to request credentials change.", "error");
    }
  };

  const handleCredsChangeVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credsOtp) return;
    setIsSubmittingCreds(true);
    const result = await verifyAdminCredentialsChange(credsUpdateToken, credsOtp);
    setIsSubmittingCreds(false);
    if (result.success) {
      setNewAdminUser("");
      setNewAdminPass("");
      setNewSecurityQuestion("");
      setNewSecurityAnswer("");
      setCredsOtp("");
      setCredsUpdateToken("");
      setAwaitingCredsChangeMfa(false);
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter((b) => {
      if (paymentFilter === "ALL") {
        return (
          b.paymentStatus === "PAYMENT_VERIFICATION_PENDING" ||
          b.paymentStatus === "BOOKED_AMOUNT_PAID" ||
          b.paymentStatus === "REJECTED"
        );
      }
      if (paymentFilter === "PENDING") {
        return b.paymentStatus === "PAYMENT_VERIFICATION_PENDING";
      }
      if (paymentFilter === "PAID") {
        return b.paymentStatus === "BOOKED_AMOUNT_PAID";
      }
      if (paymentFilter === "REJECTED") {
        return b.paymentStatus === "REJECTED";
      }
      return false;
    });
  };

  const triggerApproveDialog = (booking: Booking) => {
    setActiveDialogBooking(booking);
    setDialogAction("APPROVE");
    setDialogNote("");
  };

  const triggerRejectDialog = (booking: Booking) => {
    setActiveDialogBooking(booking);
    setDialogAction("REJECT");
    setDialogReason("");
    setDialogNote("");
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDialogBooking) return;

    setIsProcessingAction(true);
    try {
      const targetId = activeDialogBooking._id || activeDialogBooking.bookingId;
      if (dialogAction === "APPROVE") {
        const res = await adminConfirmPayment(targetId, dialogNote);
        if (res.success) {
          showToast(`Successfully confirmed payment for booking ${activeDialogBooking.bookingId}`);
          setActiveDialogBooking(null);
          setDialogAction(null);
        } else {
          showToast(res.message || "Failed to confirm payment", "error");
        }
      } else {
        const res = await adminRejectPayment(targetId, dialogReason, dialogNote);
        if (res.success) {
          showToast(`Successfully rejected payment for booking ${activeDialogBooking.bookingId}`);
          setActiveDialogBooking(null);
          setDialogAction(null);
        } else {
          showToast(res.message || "Failed to reject payment", "error");
        }
      }
    } catch {
      showToast("Network error occurred", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSettingsQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSettingsQrPreview(reader.result);
        setSettingsQrBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const success = await updateBusinessSettings({
        bookingAmount: settingsAdvance,
        upiId: settingsUpiId,
        upiQrImage: settingsQrBase64,
        paymentWhatsApp: settingsWhatsApp,
      });
      if (success) {
        showToast("Payment configurations updated successfully!");
      }
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenAddForm = (type: Service["type"]) => {
    setEditingItem(null);
    setCrudType(type);
    setCrudName("");
    setCrudCategory(type === "MEHENDI" ? "Bridal" : type === "MAKEUP" ? "Bridal" : "Skin");
    setCrudDesc("");
    setCrudPrice(1500);
    setCrudDuration("Approx. 1.5 hrs");
    setCrudFeatured(false);
    setCrudAvailability("AVAILABLE");
    setCrudImage("https://images.unsplash.com/photo-1610173826014-d131b02d69ca?w=800&h=1000&fit=crop&auto=format&q=80");
    setIsAddingNew(true);
  };

  const handleOpenEditForm = (item: Service) => {
    setEditingItem(item);
    setCrudType(item.type);
    setCrudName(item.name);
    setCrudCategory(item.category);
    setCrudDesc(item.description);
    setCrudPrice(item.startingPrice);
    setCrudDuration(item.duration);
    setCrudFeatured(!!item.featured);
    setCrudAvailability(item.availability);
    setCrudImage(item.image);
    setIsAddingNew(true);
  };

  const handleSaveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id : `custom-${Math.random().toString(36).substr(2, 9)}`;
    const savedItem: Service = {
      id,
      type: crudType,
      name: crudName,
      category: crudCategory,
      description: crudDesc,
      startingPrice: Number(crudPrice),
      duration: crudDuration,
      featured: crudFeatured,
      availability: crudAvailability,
      image: crudImage,
    };
    addOrUpdateService(savedItem);
    setIsAddingNew(false);
    setEditingItem(null);
  };

  const handleAddAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaInput.trim()) return;
    addServiceArea(newAreaInput.trim());
    setNewAreaInput("");
  };

  // Auth Guard: Admin login page
  if (!adminLoggedIn) {
    if (awaitingSecurityAnswer) {
      return (
        <div className="mx-auto max-w-sm px-5 py-28">
          <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-md md:p-8">
            <div className="text-center mb-6">
              <span className="text-2xl text-gold">❦</span>
              <h2 className="font-display text-2xl text-brand mt-2 font-semibold">Security Verification</h2>
              <p className="text-xs text-muted mt-2">
                Please answer the security question to complete your admin login.
              </p>
            </div>

            <form onSubmit={handleSecurityAnswerVerifySubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-security-ans" className="block text-[11px] font-semibold text-gold uppercase tracking-wider leading-relaxed">
                  {securityQuestion}
                </label>
                <input
                  id="admin-security-ans"
                  type="text"
                  required
                  placeholder="Enter your security answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 mt-2"
              >
                Verify &amp; Login
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAwaitingSecurityAnswer(false);
                  setSecurityAnswer("");
                }}
                className="w-full text-center text-xs text-muted hover:text-brand transition-colors font-medium mt-2 block"
              >
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-sm px-5 py-28">
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-md md:p-8">
          <div className="text-center mb-6">
            <span className="text-2xl text-gold">❦</span>
            <h2 className="font-display text-2xl text-brand mt-2 font-semibold">Admin Panel Portal</h2>
            <p className="text-xs text-muted mt-1">Huma Mehendi &amp; Beauty Artist</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-user" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Username</label>
              <input
                id="admin-user"
                type="text"
                required
                placeholder="Enter admin username"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Password</label>
              <input
                id="admin-pass"
                type="password"
                required
                placeholder="Enter password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 mt-2"
            >
              Access Dashboard
            </button>
            <p className="text-[10px] text-center text-muted">Use credentials username: admin / password: admin for local testing.</p>
          </form>
        </div>
      </div>
    );
  }

  // Analytics helper variables
  const activeBookings = bookings.filter((b) => b.bookingStatus !== "CANCELLED");
  const salesRevenue = activeBookings.reduce((sum, b) => sum + b.onlineBookingAmount, 0);
  const totalBookingsCount = bookings.length;
  const completedBookingsCount = bookings.filter((b) => b.bookingStatus === "COMPLETED").length;
  const cancelledBookingsCount = bookings.filter((b) => b.bookingStatus === "CANCELLED").length;
  const pendingRescheduleCount = bookings.filter((b) => b.rescheduleRequest && b.rescheduleRequest.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      {/* Admin dashboard header */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-brand flex items-center gap-2">
            Admin Workspace <span className="rounded bg-gold/15 px-2 py-0.5 text-xs text-gold">Controls</span>
          </h1>
          <p className="text-xs text-muted mt-1">Manage designs, services, timeslot allocations, and customer orders.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={logoutAdmin}
            className="rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-semibold uppercase text-blocked hover:bg-blocked/5 transition-colors"
          >
            Logout Workspace
          </button>
        </div>
      </div>

      {/* Admin Menu Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-hairline pb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        {[
          { key: "overview", label: "Overview" },
          { key: "bookings", label: `Bookings (${bookings.length})` },
          { key: "payments", label: `Payments (${bookings.filter((b) => b.paymentStatus === "PAYMENT_VERIFICATION_PENDING").length})` },
          { key: "slots", label: "Slots / Calendar" },
          { key: "catalog", label: "Catalog Editor" },
          { key: "reviews", label: `Reviews (${reviews.length})` },
          { key: "areas", label: "Service Areas" },
          { key: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            className={`rounded px-4 py-2 transition-colors ${
              activeTab === t.key
                ? "bg-brand text-cream"
                : "bg-surface border border-hairline text-brand hover:border-gold hover:text-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 text-ink">
        {/* TABS 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metric Blocks Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-hairline bg-surface p-5">
                <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Total Sales (Paid Booking Fees)</p>
                <p className="font-display text-3xl text-brand mt-2 font-semibold">₹{salesRevenue.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted mt-1">Absorbed Razorpay fees included</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface p-5">
                <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Confirmed Appointments</p>
                <p className="font-display text-3xl text-brand mt-2 font-semibold">
                  {bookings.filter((b) => b.bookingStatus === "CONFIRMED" || b.bookingStatus === "RESCHEDULED").length}
                </p>
                <p className="text-[10px] text-muted mt-1">Pending servicing</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface p-5">
                <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Completed Sessions</p>
                <p className="font-display text-3xl text-brand mt-2 font-semibold">{completedBookingsCount}</p>
                <p className="text-[10px] text-muted mt-1">Reviews unlocked for clients</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface p-5">
                <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Alerts &amp; Cancellations</p>
                <p className="font-display text-3xl text-blocked mt-2 font-semibold">{cancelledBookingsCount}</p>
                <p className="text-[10px] text-muted mt-1">{pendingRescheduleCount} reschedule requests pending</p>
              </div>
            </div>

            {/* Quick Actions / Notices */}
            {pendingRescheduleCount > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 flex items-center justify-between">
                <div className="text-sm text-blue-900">
                  <strong>Pending Requests:</strong> You have {pendingRescheduleCount} pending reschedule requests waiting for response.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("bookings")}
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Review Requests
                </button>
              </div>
            )}

            {/* Recent Bookings Overview List */}
            <div className="rounded-2xl border border-hairline bg-surface p-6 space-y-4">
              <h3 className="font-display text-xl text-brand font-semibold border-b border-hairline pb-2">Recent Customer Activity</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No client appointments recorded yet.</p>
              ) : (
                <div className="divide-y divide-hairline text-xs">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.bookingId} className="flex flex-wrap items-center justify-between py-3 gap-2">
                      <div>
                        <p className="font-bold text-brand">{b.customerName} ({b.customerMobile})</p>
                        <p className="text-muted mt-0.5">ID: {b.bookingId} • Servicing on {b.bookingDate} at {b.timeSlot}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gold">₹{b.totalAmount.toLocaleString("en-IN")}</p>
                        <span className="mt-1 inline-block text-[9px] uppercase tracking-wider font-bold">
                          {b.bookingStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABS 2: BOOKINGS MANAGER */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-brand border-b border-hairline pb-2">Appointments Masterlist</h2>
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-12 text-center text-muted font-display text-lg">
                No customer bookings recorded.
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((b) => {
                  const servicesList = b.items.map((i) => i.nameSnapshot).join(", ");
                  return (
                    <div key={b.bookingId} className="rounded-2xl border border-hairline bg-surface p-5 md:p-6 space-y-4">
                      {/* Booking Metadata Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                        <div>
                          <h4 className="font-display text-md text-brand font-semibold flex items-center gap-2">
                            {b.customerName} <span className="text-[10px] text-gold tracking-widest font-sans font-bold uppercase">ID: {b.bookingId}</span>
                          </h4>
                          <p className="text-xs text-muted">Phone: {b.customerMobile} • Logged: {new Date(b.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={b.bookingStatus}
                            onChange={(e: any) => updateBookingStatus(b.bookingId, e.target.value)}
                            className="rounded border border-hairline bg-cream/45 px-3 py-1.5 text-xs text-brand focus:outline-none"
                          >
                            <option value="PENDING_PAYMENT">Pending Payment</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="RESCHEDULED">Rescheduled</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Summary Pricing details */}
                      <div className="grid gap-4 sm:grid-cols-3 text-xs">
                        <div>
                          <p className="font-semibold text-gold uppercase tracking-wider text-[9px]">Servicing Package</p>
                          <p className="mt-1 font-medium">{servicesList || "Custom blocked Slot"}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gold uppercase tracking-wider text-[9px]">Logistics</p>
                          <p className="mt-1 font-medium">{b.bookingDate} at {b.timeSlot}</p>
                          <p className="text-muted mt-1">{b.address}, {b.serviceArea}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gold uppercase tracking-wider text-[9px]">Receipt Financials</p>
                          <div className="mt-1 space-y-1">
                            <p>Total: <span className="font-semibold">₹{b.totalAmount.toLocaleString("en-IN")}</span></p>
                            <p className="text-available">Paid Online: <span className="font-semibold">₹{b.onlineBookingAmount.toLocaleString("en-IN")}</span></p>
                            <p className="text-brand">Remaining Due: <span className="font-semibold">₹{b.remainingAmount.toLocaleString("en-IN")}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Reschedule Requests handler */}
                      {b.rescheduleRequest && b.rescheduleRequest.status === "PENDING" && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                          <div>
                            <strong className="text-blue-900">Rescheduling Requested by Client:</strong>
                            <p className="mt-1 text-slate-700">Wants to move appointment from {b.bookingDate} at {b.timeSlot} → <span className="font-semibold text-blue-900">{b.rescheduleRequest.requestedDate} at {b.rescheduleRequest.requestedSlot}</span></p>
                            <p className="text-slate-600 mt-1 italic">Reason: "{b.rescheduleRequest.reason}"</p>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => respondToReschedule(b.bookingId, true)}
                              className="rounded bg-available px-3 py-1.5 font-semibold text-white hover:opacity-90"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => respondToReschedule(b.bookingId, false)}
                              className="rounded bg-blocked px-3 py-1.5 font-semibold text-white hover:opacity-90"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TABS 3: SLOTS & CALENDAR BLOCK */}
        {activeTab === "slots" && (
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Block Entire Date */}
            <div className="lg:col-span-6 rounded-2xl border border-hairline bg-surface p-6 space-y-6">
              <h3 className="font-display text-xl text-brand border-b border-hairline pb-2 font-semibold">Block/Mark Date Unavailable</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="block-date" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Select Date to Block</label>
                  <input
                    id="block-date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={blockDateInput}
                    onChange={(e) => setBlockDateInput(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!blockDateInput) return;
                    blockDate(blockDateInput);
                    setBlockDateInput("");
                  }}
                  disabled={!blockDateInput}
                  className="w-full rounded-md bg-blocked py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed"
                >
                  Block Complete Date
                </button>
              </div>

              {/* Blocked Dates List */}
              <div className="pt-4 border-t border-hairline space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currently Blocked Dates ({blockedDates.length})</p>
                {blockedDates.length === 0 ? (
                  <p className="text-xs text-muted">All dates are currently open for bookings.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blockedDates.map((date) => (
                      <span
                        key={date}
                        className="flex items-center gap-2 rounded-full border border-blocked/20 bg-blocked/5 px-3 py-1 text-xs text-blocked font-medium"
                      >
                        {date}
                        <button
                          type="button"
                          onClick={() => unblockDate(date)}
                          className="hover:text-black font-bold font-sans"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Block Specific Slot */}
            <div className="lg:col-span-6 rounded-2xl border border-hairline bg-surface p-6 space-y-6">
              <h3 className="font-display text-xl text-brand border-b border-hairline pb-2 font-semibold">Block Specific Time Slot</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="slot-date" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Date</label>
                  <input
                    id="slot-date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={blockSlotDate}
                    onChange={(e) => setBlockSlotDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label htmlFor="slot-time" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Time Slot</label>
                  <select
                    id="slot-time"
                    value={blockSlotTime}
                    onChange={(e) => setBlockSlotTime(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                  >
                    {["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM", "07:00 PM", "08:30 PM", "10:00 PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!blockSlotDate || !blockSlotTime) return;
                    blockSlot(blockSlotDate, blockSlotTime);
                    setBlockSlotDate("");
                  }}
                  disabled={!blockSlotDate}
                  className="w-full rounded-md bg-brand py-2.5 text-xs font-semibold text-cream hover:opacity-90 disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed"
                >
                  Block Selected Slot
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TABS 4: CATALOG MANAGER */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h2 className="font-display text-2xl text-brand">Catalog Editor</h2>
              {!isAddingNew && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm("MEHENDI")}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-cream"
                  >
                    + Add Mehendi Design
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm("MAKEUP")}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-cream"
                  >
                    + Add Makeup Package
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm("PARLOUR")}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-cream"
                  >
                    + Add Parlour Service
                  </button>
                </div>
              )}
            </div>

            {/* CRUD Form overlay or inline */}
            {isAddingNew ? (
              <form onSubmit={handleSaveCatalogItem} className="rounded-2xl border border-hairline bg-surface p-6 space-y-6 max-w-xl">
                <h3 className="font-display text-lg text-brand border-b border-hairline pb-2 font-semibold">
                  {editingItem ? `Edit Item: ${editingItem.name}` : `Add New ${crudType} Item`}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <label htmlFor="crud-name" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Item Name</label>
                    <input
                      id="crud-name"
                      type="text"
                      required
                      placeholder="e.g. Arabic Motif Trail"
                      value={crudName}
                      onChange={(e) => setCrudName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="crud-cat" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Category</label>
                    <input
                      id="crud-cat"
                      type="text"
                      required
                      placeholder="e.g. Bridal, Occasion, Skin, Hair"
                      value={crudCategory}
                      onChange={(e) => setCrudCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="crud-price" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Starting Price (₹)</label>
                    <input
                      id="crud-price"
                      type="number"
                      required
                      min={100}
                      value={crudPrice}
                      onChange={(e) => setCrudPrice(parseInt(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="crud-dur" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Duration Estimate</label>
                    <input
                      id="crud-dur"
                      type="text"
                      required
                      placeholder="e.g. Approx. 1.5 hrs"
                      value={crudDuration}
                      onChange={(e) => setCrudDuration(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="crud-desc" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Item Description</label>
                    <textarea
                      id="crud-desc"
                      required
                      rows={3}
                      placeholder="Brief details about materials, coverage, skin suitability..."
                      value={crudDesc}
                      onChange={(e) => setCrudDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="crud-img" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Photo URL</label>
                    <input
                      id="crud-img"
                      type="url"
                      required
                      placeholder="Image address (from unsplash, etc.)"
                      value={crudImage}
                      onChange={(e) => setCrudImage(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-4 items-center sm:col-span-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={crudFeatured}
                        onChange={(e) => setCrudFeatured(e.target.checked)}
                        className="accent-brand"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold">Feature on Homepage</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold">Availability:</span>
                      <select
                        value={crudAvailability}
                        onChange={(e: any) => setCrudAvailability(e.target.value)}
                        className="rounded border border-hairline bg-cream/45 px-2 py-1 text-xs"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="BOOKED">Booked</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 rounded border border-hairline py-2.5 text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded bg-brand py-2.5 font-semibold text-cream"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            ) : (
              // Items Grid list for CRUD
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((item) => (
                  <div key={item.id} className="rounded-xl border border-hairline bg-surface p-4 flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0">
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded object-cover border border-hairline shrink-0" />
                      <div className="min-w-0">
                        <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[8px] font-bold text-gold uppercase tracking-wider">{item.type}</span>
                        <h4 className="font-semibold text-brand text-xs mt-1 truncate" title={item.name}>{item.name}</h4>
                        <p className="text-[10px] text-muted">₹{item.startingPrice.toLocaleString("en-IN")} • {item.availability}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(item)}
                        className="rounded border border-hairline px-2 py-1 text-[10px] font-medium text-brand hover:border-gold hover:text-gold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete service "${item.name}" from catalog?`)) {
                            deleteService(item.id);
                          }
                        }}
                        className="rounded border border-blocked/25 px-2 py-1 text-[10px] font-medium text-blocked hover:bg-blocked/5 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 5: CLIENT REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-brand border-b border-hairline pb-2">Client Reviews Moderation</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No reviews submitted yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-hairline bg-surface p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-hairline pb-2">
                      <div>
                        <p className="font-bold text-brand">{r.customerName}</p>
                        <p className="text-[10px] text-muted">Reviewed: {r.serviceName}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        r.status === "APPROVED" ? "bg-available/10 text-available" : r.status === "HIDDEN" ? "bg-blocked/10 text-blocked" : "bg-amber-100 text-amber-800"
                      } uppercase`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex gap-0.5 text-gold text-sm">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} className={idx < r.rating ? "opacity-100" : "opacity-20"}>★</span>
                      ))}
                    </div>

                    <p className="text-muted leading-relaxed italic">"{r.comment}"</p>
                    
                    <div className="flex gap-2 pt-2 border-t border-hairline">
                      <button
                        type="button"
                        onClick={() => moderateReview(r.id, "APPROVED")}
                        disabled={r.status === "APPROVED"}
                        className="rounded bg-available px-3 py-1 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve &amp; Show Publicly
                      </button>
                      <button
                        type="button"
                        onClick={() => moderateReview(r.id, "HIDDEN")}
                        disabled={r.status === "HIDDEN"}
                        className="rounded bg-blocked px-3 py-1 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 6: SERVICE AREAS */}
        {activeTab === "areas" && (
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Areas list manager */}
            <div className="lg:col-span-6 rounded-2xl border border-hairline bg-surface p-6 space-y-6">
              <h3 className="font-display text-xl text-brand border-b border-hairline pb-2 font-semibold">Service Coverage Regions</h3>
              
              <form onSubmit={handleAddAreaSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Add new area, e.g. Bachhrawan"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  className="flex-1 rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="rounded bg-brand px-4 py-2 text-xs font-semibold text-cream"
                >
                  Add Area
                </button>
              </form>

              <div className="divide-y divide-hairline text-sm">
                {serviceAreas.map((area) => (
                  <div key={area} className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-brand">{area}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${area}" from service areas?`)) {
                          removeServiceArea(area);
                        }
                      }}
                      className="text-xs font-bold text-blocked hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Policies Details Card */}
            <div className="lg:col-span-6 rounded-2xl border border-hairline bg-surface p-6 space-y-4">
              <h3 className="font-display text-xl text-brand border-b border-hairline pb-2 font-semibold">Business Info &amp; Settings</h3>
              
              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <p><strong>Travel Charge Rule:</strong> Currently set to <em>No Separate Travel Charge</em>. Huma travels to all coverage areas for free.</p>
                <p><strong>Minimum Booking Amount:</strong> Set to a fixed <em>₹1,500</em> deposit. This is processed securely via Razorpay to block calendar slots.</p>
                <p><strong>Business Hours:</strong> 10:00 AM to 11:00 PM, 7 days a week.</p>
                
                <div className="rounded-lg bg-cream/45 p-4 border border-hairline text-slate-600 mt-2 space-y-1">
                  <p className="font-bold text-brand uppercase text-[9px] tracking-wider">Live Hotline Details:</p>
                  <p>• Phone: +91 8960600371</p>
                  <p>• WhatsApp: +91 8960600371</p>
                  <p>• Email: humamehendi1210@gmail.com</p>
                  <p>• Instagram: @huma_mehendi_06</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TABS 7: PAYMENTS (Manual Verification Section) */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
              <h3 className="font-display text-2xl text-brand font-semibold">Payment Verifications</h3>
              <div className="flex gap-2">
                {(["PENDING", "PAID", "REJECTED", "ALL"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPaymentFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-colors border ${
                      paymentFilter === st
                        ? "bg-brand border-brand text-cream"
                        : "bg-surface border-hairline text-brand hover:border-gold"
                    }`}
                  >
                    {st === "PENDING" ? "Pending Verification" : st === "PAID" ? "Approved" : st === "REJECTED" ? "Rejected" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {getFilteredBookings().length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-8 text-center text-muted">
                <span className="text-3xl">📭</span>
                <p className="mt-2 text-sm">No payment records match the current filter.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {getFilteredBookings().map((b) => (
                  <div key={b.bookingId} className="rounded-2xl border border-hairline bg-surface p-5 md:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-lg text-brand font-semibold">{b.bookingId}</h4>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            b.paymentStatus === "PAYMENT_VERIFICATION_PENDING"
                              ? "bg-gold/15 text-gold border border-gold/25"
                              : b.paymentStatus === "BOOKED_AMOUNT_PAID"
                              ? "bg-available/15 text-available border border-available/25"
                              : b.paymentStatus === "REJECTED"
                              ? "bg-blocked/15 text-blocked border border-blocked/25"
                              : "bg-muted/15 text-muted border border-muted/25"
                          }`}>
                            {b.paymentStatus === "PAYMENT_VERIFICATION_PENDING" ? "Pending Verification" : b.paymentStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">Submitted on: {new Date(b.createdAt || Date.now()).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">Online Advance Due</p>
                        <p className="font-semibold text-brand">₹{b.onlineBookingAmount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="grid md:grid-cols-12 gap-6">
                      {/* Customer Details */}
                      <div className="md:col-span-4 space-y-2 text-xs">
                        <p className="font-bold text-gold uppercase tracking-wider text-[10px]">Client &amp; Schedule</p>
                        <p><strong className="text-brand font-medium">Name:</strong> {b.customerName}</p>
                        <p><strong className="text-brand font-medium">Mobile:</strong> {b.customerMobile}</p>
                        <p><strong className="text-brand font-medium">Date:</strong> {b.bookingDate}</p>
                        <p><strong className="text-brand font-medium">Time:</strong> {b.timeSlot}</p>
                        <p><strong className="text-brand font-medium">Area:</strong> {b.serviceArea}</p>
                        <p className="truncate"><strong className="text-brand font-medium">Address:</strong> {b.address}</p>
                      </div>

                      {/* Transaction Details */}
                      <div className="md:col-span-5 space-y-2 text-xs border-t md:border-t-0 md:border-l border-hairline pt-3 md:pt-0 md:pl-6">
                        <p className="font-bold text-gold uppercase tracking-wider text-[10px]">Submitted Proof</p>
                        <p>
                          <strong className="text-brand font-medium">Transaction ID / UTR:</strong>{" "}
                          <span className="font-mono text-sm bg-cream/25 border border-hairline px-2 py-0.5 rounded select-all font-semibold text-brand">
                            {b.transactionId || "Not Provided"}
                          </span>
                        </p>
                        {b.rejectionReason && (
                          <div className="rounded-lg bg-blocked/5 border border-blocked/10 p-2.5 text-blocked mt-2">
                            <p className="font-semibold text-[9px] uppercase tracking-wider">Rejection Reason:</p>
                            <p className="mt-0.5 text-xs font-medium">{b.rejectionReason}</p>
                          </div>
                        )}
                        {b.adminNote && (
                          <div className="rounded-lg bg-cream/35 border border-hairline p-2.5 text-brand mt-2">
                            <p className="font-semibold text-[9px] uppercase tracking-wider text-gold">Admin Notes:</p>
                            <p className="mt-0.5 text-xs font-medium">{b.adminNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Screenshot Thumbnail */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-hairline pt-3 md:pt-0 md:pl-6">
                        <p className="font-bold text-gold uppercase tracking-wider text-[10px] self-start mb-2">Screenshot</p>
                        {b.paymentScreenshot ? (
                          <div className="relative group cursor-pointer border border-hairline rounded-lg overflow-hidden max-w-[150px] bg-black/5" onClick={() => setSelectedScreenshot(b.paymentScreenshot || null)}>
                            <img src={b.paymentScreenshot} alt="UTR Proof" className="max-h-24 object-contain group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-semibold text-white px-2 py-1 bg-brand/85 rounded">View Full</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-muted text-xs">
                            <span className="text-xl">📷</span>
                            <p className="mt-1 text-[10px]">No image proof</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {b.paymentStatus === "PAYMENT_VERIFICATION_PENDING" && (
                      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-hairline pt-4 mt-3">
                        <button
                          type="button"
                          onClick={() => triggerRejectDialog(b)}
                          className="rounded border border-blocked px-4 py-2 text-xs font-bold text-blocked hover:bg-blocked/5 transition-colors"
                        >
                          Reject Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerApproveDialog(b)}
                          className="rounded bg-brand px-4 py-2 text-xs font-bold text-cream hover:bg-brand-700 transition-colors"
                        >
                          Confirm &amp; Book
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 8: SETTINGS (Admin settings page) */}
        {activeTab === "settings" && (
          <div className="max-w-xl rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6">
            <h3 className="font-display text-2xl text-brand border-b border-hairline pb-2 font-semibold">Payment Settings</h3>
            
            <form onSubmit={handleSettingsSave} className="space-y-5 text-sm text-ink">
              {/* Advance Amount */}
              <div>
                <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Booking Advance Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  max={10000}
                  value={settingsAdvance}
                  onChange={(e) => setSettingsAdvance(parseInt(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-semibold"
                />
                <p className="mt-1 text-[10px] text-muted">Fixed advance amount required to confirm any booking.</p>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  UPI ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. merchant@upi"
                  value={settingsUpiId}
                  onChange={(e) => setSettingsUpiId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-mono"
                />
                <p className="mt-1 text-[10px] text-muted">Your business UPI ID / VPA for customer scans.</p>
              </div>

              {/* QR Code image upload */}
              <div>
                <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider mb-1">
                  UPI QR Code Image
                </label>
                
                {settingsQrPreview ? (
                  <div className="rounded-xl border border-hairline bg-cream/5 p-3 space-y-3 max-w-[200px]">
                    <img src={settingsQrPreview} alt="Settings QR Preview" className="h-32 w-32 mx-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => { setSettingsQrPreview(""); setSettingsQrBase64(""); }}
                      className="w-full text-center text-[10px] text-red-700 font-semibold uppercase hover:underline"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => settingsQrInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-cream/10 p-6 text-center hover:bg-cream/20 transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <p className="mt-2 text-xs font-semibold text-brand">Upload QR Image</p>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={settingsQrInputRef}
                  onChange={handleSettingsQrChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* Payment WhatsApp Number */}
              <div>
                <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Payment Notification WhatsApp Number (with country code, e.g., +91XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  required
                  value={settingsWhatsApp}
                  onChange={(e) => setSettingsWhatsApp(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full rounded bg-brand py-3 text-xs font-bold text-cream hover:bg-brand-700 disabled:opacity-50 transition-colors uppercase tracking-wider"
              >
                {isSavingSettings ? "Saving Settings..." : "Save Configuration"}
              </button>
            </form>

            {/* Admin Credentials Panel */}
            <div className="max-w-xl rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6 mt-6">
              <h3 className="font-display text-2xl text-brand border-b border-hairline pb-2 font-semibold">Admin Credentials Control</h3>
              
              {!awaitingCredsChangeMfa ? (
                <form onSubmit={handleCredsChangeRequestSubmit} className="space-y-5 text-sm text-ink">
                  <div>
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                      New Username (Admin Mobile)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter new admin username/mobile"
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password (optional)"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                      New Security Question
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. What is your husband's school name?"
                      value={newSecurityQuestion}
                      onChange={(e) => setNewSecurityQuestion(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                      New Security Answer
                    </label>
                    <input
                      type="text"
                      placeholder="Enter answer (optional)"
                      value={newSecurityAnswer}
                      onChange={(e) => setNewSecurityAnswer(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCreds}
                    className="w-full rounded bg-brand py-3 text-xs font-bold text-cream hover:bg-brand-700 disabled:opacity-50 transition-colors uppercase tracking-wider font-semibold"
                  >
                    {isSubmittingCreds ? "Processing..." : "Update Credentials"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCredsChangeVerifySubmit} className="space-y-5 text-sm text-ink">
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">
                      A 6-digit verification code has been sent to Huma's WhatsApp (+91 8960600371). Please enter it below to confirm credentials changes.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                      WhatsApp OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={credsOtp}
                      onChange={(e) => setCredsOtp(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full text-center tracking-widest rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-sm text-brand focus:border-gold focus:outline-none font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCreds}
                    className="w-full rounded bg-brand py-3 text-xs font-bold text-cream hover:bg-brand-700 disabled:opacity-50 transition-colors uppercase tracking-wider"
                  >
                    {isSubmittingCreds ? "Confirming..." : "Confirm & Apply Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingCredsChangeMfa(false);
                      setCredsOtp("");
                    }}
                    className="w-full text-center text-xs text-muted hover:text-brand font-medium uppercase tracking-wider mt-2 block"
                  >
                    Cancel Update
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Screenshot Overlay Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setSelectedScreenshot(null)}>
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedScreenshot} alt="Full payment proof screenshot" className="max-h-[85vh] max-w-full object-contain rounded-lg border border-hairline shadow-2xl" />
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute -top-12 right-0 rounded-md bg-surface p-2 text-brand border border-hairline hover:bg-cream transition-colors text-xs font-semibold px-3"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Confirm/Reject Modal Dialog */}
      {activeDialogBooking && dialogAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[400px] rounded-2xl bg-surface border border-hairline p-6 shadow-2xl text-sm text-ink space-y-4">
            <h3 className="font-display text-xl text-brand font-semibold border-b border-hairline pb-2">
              {dialogAction === "APPROVE" ? "Approve Payment" : "Reject Payment"}
            </h3>
            
            <form onSubmit={handleDialogSubmit} className="space-y-4">
              <p className="text-xs text-muted">
                {dialogAction === "APPROVE"
                  ? `Are you sure you want to approve the advance payment for booking ${activeDialogBooking.bookingId}? This will mark the booking as CONFIRMED.`
                  : `Are you sure you want to reject the payment for booking ${activeDialogBooking.bookingId}? This will release the time slot back to AVAILABLE.`}
              </p>

              {dialogAction === "REJECT" && (
                <div>
                  <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                    Rejection Reason (Sent to Customer via WhatsApp)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Transaction ID was not found in bank statements / incorrect amount paid."
                    value={dialogReason}
                    onChange={(e) => setDialogReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                  Internal Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified with bank statement"
                  value={dialogNote}
                  onChange={(e) => setDialogNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-hairline pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setActiveDialogBooking(null); setDialogAction(null); }}
                  className="rounded border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-brand hover:bg-cream/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className={`rounded px-4 py-2 text-xs font-bold text-cream transition-colors ${
                    dialogAction === "APPROVE" ? "bg-brand hover:bg-brand-700" : "bg-blocked hover:bg-red-800"
                  }`}
                >
                  {isProcessingAction ? "Processing..." : dialogAction === "APPROVE" ? "Confirm Payment" : "Reject Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
