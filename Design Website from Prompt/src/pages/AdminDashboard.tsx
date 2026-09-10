import { useState, useEffect, useRef } from "react";
import { useApp, type Booking, type Review } from "../context/AppContext";
import { type Service, BASE_URL } from "../services/api";

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
    adminPartialPayment,
    adminProcessRefund,
    setAdminPin,
    verifyAdminPin,
    locations,
    serviceGroups,
    categories,
    fetchLocations,
    fetchServiceGroups,
    fetchCategories,
    fetchCatalog,
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
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "slots" | "catalog" | "reviews" | "areas" | "payments" | "settings" | "locations" | "servicegroups">("overview");

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
  const [crudMrp, setCrudMrp] = useState<number>(1000);
  const [crudDiscountType, setCrudDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE");
  const [crudDiscountValue, setCrudDiscountValue] = useState<number>(0);
  const [crudDuration, setCrudDuration] = useState("Approx. 1.5 hrs");
  const [crudType, setCrudType] = useState<Service["type"]>("MEHENDI");
  const [crudFeatured, setCrudFeatured] = useState(false);
  const [crudAvailability, setCrudAvailability] = useState<Service["availability"]>("AVAILABLE");
  const [crudImage, setCrudImage] = useState("");

  // Locations CRUD states
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locName, setLocName] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [locShortDesc, setLocShortDesc] = useState("");
  const [locDesc, setLocDesc] = useState("");
  const [locHeroImage, setLocHeroImage] = useState("");
  const [locSeoTitle, setLocSeoTitle] = useState("");
  const [locSeoDesc, setLocSeoDesc] = useState("");
  const [locNearbyAreas, setLocNearbyAreas] = useState("");
  const [locGroups, setLocGroups] = useState<string[]>([]);
  const [locActive, setLocActive] = useState(true);

  // Service Groups CRUD states
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [groupParentType, setGroupParentType] = useState<"MEHENDI" | "MAKEUP" | "PARLOUR">("MEHENDI");
  const [groupShortDesc, setGroupShortDesc] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupHeroImage, setGroupHeroImage] = useState("");
  const [groupSeoTitle, setGroupSeoTitle] = useState("");
  const [groupSeoDesc, setGroupSeoDesc] = useState("");
  const [groupActive, setGroupActive] = useState(true);
  const [groupFeatured, setGroupFeatured] = useState(false);

  // Service Area Form
  const [newAreaInput, setNewAreaInput] = useState("");

  // Payment Verification Tab States
  const [paymentFilter, setPaymentFilter] = useState<"PENDING" | "PAID" | "REJECTED" | "CANCELLED" | "ALL">("PENDING");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Dialog / Modal states for action details
  const [activeDialogBooking, setActiveDialogBooking] = useState<Booking | null>(null);
  const [dialogAction, setDialogAction] = useState<"APPROVE" | "REJECT" | "PARTIAL" | "REFUND" | null>(null);
  const [dialogReason, setDialogReason] = useState("");
  const [dialogNote, setDialogNote] = useState("");
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [partialAmountInput, setPartialAmountInput] = useState<number>(1500);
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundTxInput, setRefundTxInput] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Settings Tab States
  const [settingsAdvance, setSettingsAdvance] = useState(1500);
  const [settingsUpiId, setSettingsUpiId] = useState("demo@upi");
  const [settingsQrPreview, setSettingsQrPreview] = useState("");
  const [settingsQrBase64, setSettingsQrBase64] = useState("");
  const [settingsWhatsApp, setSettingsWhatsApp] = useState("+918960600371");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const settingsQrInputRef = useRef<HTMLInputElement>(null);

  // Security PIN Settings state
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

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
      if (paymentFilter === "PENDING") {
        return b.bookingStatus !== "CANCELLED" && b.paymentStatus === "PAYMENT_VERIFICATION_PENDING";
      }
      if (paymentFilter === "PAID") {
        return b.bookingStatus !== "CANCELLED" && (b.paymentStatus === "BOOKED_AMOUNT_PAID" || b.paymentStatus === "PARTIAL_PAYMENT");
      }
      if (paymentFilter === "REJECTED") {
        return b.bookingStatus !== "CANCELLED" && b.paymentStatus === "REJECTED";
      }
      if (paymentFilter === "CANCELLED") {
        return b.bookingStatus === "CANCELLED" || b.refundStatus === "PENDING" || b.refundStatus === "PROCESSED";
      }
      if (paymentFilter === "ALL") {
        return true;
      }
      return false;
    });
  };

  const triggerApproveDialog = (booking: Booking) => {
    setActiveDialogBooking(booking);
    setDialogAction("APPROVE");
    setConfirmStep(1);
    setAdminPinInput("");
    setDialogNote("");
  };

  const triggerPartialDialog = (booking: Booking) => {
    setActiveDialogBooking(booking);
    setDialogAction("PARTIAL");
    setPartialAmountInput(booking.remainingAmount || booking.onlineBookingAmount || 1500);
    setDialogNote("");
  };

  const triggerRejectDialog = (booking: Booking) => {
    setActiveDialogBooking(booking);
    setDialogAction("REJECT");
    setDialogReason("");
    setDialogNote("");
  };

  const triggerRefundDialog = (booking: Booking) => {
    const paid = booking.paidAmount || booking.onlineBookingAmount || 0;
    const suggestedRefund = Math.max(0, paid - 500);
    setActiveDialogBooking(booking);
    setDialogAction("REFUND");
    setConfirmStep(1);
    setAdminPinInput("");
    setRefundAmountInput(suggestedRefund);
    setDialogNote("");
    setRefundTxInput("");
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDialogBooking) return;

    // For Approve or Refund action: Step 1 moves to Step 2 (PIN entry)
    if ((dialogAction === "APPROVE" || dialogAction === "REFUND") && confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    setIsProcessingAction(true);
    try {
      const targetId = (activeDialogBooking as any)._id || activeDialogBooking.bookingId;
      if (dialogAction === "APPROVE") {
        if (!adminPinInput || adminPinInput.length < 4) {
          showToast("Please enter your 4–6 digit Admin Security PIN", "warning");
          setIsProcessingAction(false);
          return;
        }
        const res = await adminConfirmPayment(targetId, dialogNote, adminPinInput);
        if (res.success) {
          showToast(`Successfully confirmed order & payment for booking ${activeDialogBooking.bookingId}`);
          setActiveDialogBooking(null);
          setDialogAction(null);
          setConfirmStep(1);
          setAdminPinInput("");
        } else {
          showToast(res.message || "Failed to confirm payment", "error");
        }
      } else if (dialogAction === "PARTIAL") {
        if (!partialAmountInput || partialAmountInput <= 0) {
          showToast("Please enter a valid partial payment amount", "warning");
          setIsProcessingAction(false);
          return;
        }
        const res = await adminPartialPayment(targetId, partialAmountInput, dialogNote);
        if (res.success) {
          showToast(res.message || `Recorded partial payment for booking ${activeDialogBooking.bookingId}`);
          setActiveDialogBooking(null);
          setDialogAction(null);
        } else {
          showToast(res.message || "Failed to process partial payment", "error");
        }
      } else if (dialogAction === "REFUND") {
        if (!adminPinInput || adminPinInput.length < 4) {
          showToast("Please enter your 4–6 digit Admin Security PIN", "warning");
          setIsProcessingAction(false);
          return;
        }
        const res = await adminProcessRefund(targetId, refundAmountInput, dialogNote, refundTxInput, adminPinInput);
        if (res.success) {
          showToast(res.message || `Processed refund for booking ${activeDialogBooking.bookingId}`);
          setActiveDialogBooking(null);
          setDialogAction(null);
          setConfirmStep(1);
          setAdminPinInput("");
        } else {
          showToast(res.message || "Failed to process refund", "error");
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

  const handlePinSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinNew || pinNew.length < 4 || pinNew.length > 6 || !/^\d+$/.test(pinNew)) {
      showToast("PIN must be 4–6 numeric digits", "warning");
      return;
    }
    if (pinNew !== pinConfirm) {
      showToast("PIN confirmation does not match", "warning");
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await setAdminPin(pinNew, pinCurrent);
      if (res.success) {
        showToast("Security PIN updated successfully!");
        setPinCurrent("");
        setPinNew("");
        setPinConfirm("");
      } else {
        showToast(res.message || "Failed to set PIN", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsSavingPin(false);
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
    setCrudMrp(1500);
    setCrudDiscountType("NONE");
    setCrudDiscountValue(0);
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
    setCrudMrp(item.mrp || item.startingPrice);
    setCrudDiscountType(item.discountType || "NONE");
    setCrudDiscountValue(item.discountValue || 0);
    setCrudDuration(item.duration);
    setCrudFeatured(!!item.featured);
    setCrudAvailability(item.availability);
    setCrudImage(item.image);
    setIsAddingNew(true);
  };

  const handleSaveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id : `custom-${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-calculate final selling price
    let finalPrice = Number(crudMrp);
    if (crudDiscountType === "PERCENTAGE") {
      finalPrice = Math.round(crudMrp * (1 - crudDiscountValue / 100));
    } else if (crudDiscountType === "FIXED") {
      finalPrice = Math.max(0, crudMrp - crudDiscountValue);
    }

    const savedItem: any = {
      id,
      type: crudType,
      name: crudName,
      category: crudCategory,
      description: crudDesc,
      startingPrice: finalPrice,
      mrp: Number(crudMrp),
      discountType: crudDiscountType,
      discountValue: Number(crudDiscountValue),
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

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocName("");
    setLocSlug("");
    setLocShortDesc("");
    setLocDesc("");
    setLocHeroImage("");
    setLocSeoTitle("");
    setLocSeoDesc("");
    setLocNearbyAreas("");
    setLocGroups([]);
    setLocActive(true);
    setIsAddingLocation(true);
  };

  const handleOpenEditLocation = (loc: any) => {
    setEditingLocation(loc);
    setLocName(loc.name);
    setLocSlug(loc.slug);
    setLocShortDesc(loc.shortDescription || "");
    setLocDesc(loc.description || "");
    setLocHeroImage(loc.heroImage || "");
    setLocSeoTitle(loc.seoTitle || "");
    setLocSeoDesc(loc.seoDescription || "");
    setLocNearbyAreas((loc.nearbyAreas || []).join(", "));
    setLocGroups((loc.availableServiceGroups || []).map((g: any) => g._id || g));
    setLocActive(!!loc.isActive);
    setIsAddingLocation(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("huma_admin_token");
      const url = editingLocation 
        ? `${BASE_URL}/admin/locations/${editingLocation._id}`
        : `${BASE_URL}/admin/locations`;
      
      const payload = {
        name: locName,
        slug: locSlug,
        shortDescription: locShortDesc,
        description: locDesc,
        heroImage: locHeroImage,
        seoTitle: locSeoTitle,
        seoDescription: locSeoDesc,
        nearbyAreas: locNearbyAreas.split(",").map(s => s.trim()).filter(Boolean),
        availableServiceGroups: locGroups,
        isActive: locActive,
      };

      const res = await fetch(url, {
        method: editingLocation ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Location "${locName}" saved successfully.`);
        fetchLocations();
        setIsAddingLocation(false);
        setEditingLocation(null);
      } else {
        showToast(data.message || "Failed to save location.", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this location?")) return;
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/admin/locations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Location deactivated.");
        fetchLocations();
      } else {
        showToast(data.message || "Failed to delete.", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
  };

  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupSlug("");
    setGroupParentType("MEHENDI");
    setGroupShortDesc("");
    setGroupDesc("");
    setGroupHeroImage("");
    setGroupSeoTitle("");
    setGroupSeoDesc("");
    setGroupActive(true);
    setGroupFeatured(false);
    setIsAddingGroup(true);
  };

  const handleOpenEditGroup = (g: any) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupSlug(g.slug);
    setGroupParentType(g.parentType);
    setGroupShortDesc(g.shortDescription || "");
    setGroupDesc(g.description || "");
    setGroupHeroImage(g.heroImage || "");
    setGroupSeoTitle(g.seoTitle || "");
    setGroupSeoDesc(g.seoDescription || "");
    setGroupActive(!!g.isActive);
    setGroupFeatured(!!g.isFeatured);
    setIsAddingGroup(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("huma_admin_token");
      const url = editingGroup 
        ? `${BASE_URL}/admin/service-groups/${editingGroup._id}`
        : `${BASE_URL}/admin/service-groups`;
      
      const payload = {
        name: groupName,
        slug: groupSlug,
        parentType: groupParentType,
        shortDescription: groupShortDesc,
        description: groupDesc,
        heroImage: groupHeroImage,
        seoTitle: groupSeoTitle,
        seoDescription: groupSeoDesc,
        isActive: groupActive,
        isFeatured: groupFeatured,
      };

      const res = await fetch(url, {
        method: editingGroup ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Service group "${groupName}" saved successfully.`);
        fetchServiceGroups();
        setIsAddingGroup(false);
        setEditingGroup(null);
      } else {
        showToast(data.message || "Failed to save group.", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Deactivate this service group?")) return;
    try {
      const token = localStorage.getItem("huma_admin_token");
      const res = await fetch(`${BASE_URL}/admin/service-groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Group deactivated.");
        fetchServiceGroups();
      } else {
        showToast(data.message || "Failed to delete.", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
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
          { key: "locations", label: `Locations (${locations.length})` },
          { key: "servicegroups", label: `Service Groups (${serviceGroups.length})` },
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
                    <select
                      id="crud-cat"
                      required
                      value={crudCategory}
                      onChange={(e) => setCrudCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.filter(c => c.serviceType === crudType).map((c) => (
                        <option key={c._id} value={c._id || c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="crud-mrp" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">MRP (₹)</label>
                    <input
                      id="crud-mrp"
                      type="number"
                      required
                      min={100}
                      value={crudMrp}
                      onChange={(e) => setCrudMrp(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="crud-discount-type" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Discount Type</label>
                    <select
                      id="crud-discount-type"
                      value={crudDiscountType}
                      onChange={(e) => setCrudDiscountType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  {crudDiscountType !== "NONE" && (
                    <div>
                      <label htmlFor="crud-discount-value" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                        Discount Value {crudDiscountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                      </label>
                      <input
                        id="crud-discount-value"
                        type="number"
                        min={0}
                        max={crudDiscountType === "PERCENTAGE" ? 100 : crudMrp}
                        value={crudDiscountValue}
                        onChange={(e) => setCrudDiscountValue(parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <span className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Final Selling Price (Auto)</span>
                    <div className="mt-2 text-md font-bold text-brand">
                      ₹{(() => {
                        let final = Number(crudMrp);
                        if (crudDiscountType === "PERCENTAGE") {
                          final = Math.round(crudMrp * (1 - crudDiscountValue / 100));
                        } else if (crudDiscountType === "FIXED") {
                          final = Math.max(0, crudMrp - crudDiscountValue);
                        }
                        return final.toLocaleString("en-IN");
                      })()}
                    </div>
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
                            deleteService(item.id, item.type);
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

        {/* LOCATIONS MANAGER */}
        {activeTab === "locations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h2 className="font-display text-2xl text-brand">Locations CMS</h2>
              {!isAddingLocation && (
                <button
                  type="button"
                  onClick={handleOpenAddLocation}
                  className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-cream"
                >
                  + Add Location
                </button>
              )}
            </div>

            {isAddingLocation ? (
              <form onSubmit={handleSaveLocation} className="rounded-2xl border border-hairline bg-surface p-6 space-y-6 max-w-xl">
                <h3 className="font-display text-lg text-brand border-b border-hairline pb-2 font-semibold">
                  {editingLocation ? `Edit Location: ${editingLocation.name}` : "Add New Location"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <label htmlFor="loc-name" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">City Name</label>
                    <input
                      id="loc-name"
                      type="text"
                      required
                      placeholder="e.g. Lucknow"
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="loc-slug" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">URL Slug</label>
                    <input
                      id="loc-slug"
                      type="text"
                      placeholder="e.g. lucknow (auto-generated if empty)"
                      value={locSlug}
                      onChange={(e) => setLocSlug(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="loc-sdesc" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Short Description</label>
                    <input
                      id="loc-sdesc"
                      type="text"
                      placeholder="e.g. Premium mehendi & beauty services in Lucknow"
                      value={locShortDesc}
                      onChange={(e) => setLocShortDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="loc-desc" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Body Description</label>
                    <textarea
                      id="loc-desc"
                      rows={4}
                      placeholder="Rich content about services, landmarks, travel..."
                      value={locDesc}
                      onChange={(e) => setLocDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="loc-hero" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Hero Image URL</label>
                    <input
                      id="loc-hero"
                      type="url"
                      placeholder="Hero banner image link"
                      value={locHeroImage}
                      onChange={(e) => setLocHeroImage(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="loc-seot" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">SEO Title</label>
                    <input
                      id="loc-seot"
                      type="text"
                      placeholder="Custom <title> tag"
                      value={locSeoTitle}
                      onChange={(e) => setLocSeoTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="loc-seod" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">SEO Description</label>
                    <input
                      id="loc-seod"
                      type="text"
                      placeholder="Meta description"
                      value={locSeoDesc}
                      onChange={(e) => setLocSeoDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="loc-nearby" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Nearby Areas (comma-separated)</label>
                    <input
                      id="loc-nearby"
                      type="text"
                      placeholder="e.g. Gomti Nagar, Hazratganj, Alambagh"
                      value={locNearbyAreas}
                      onChange={(e) => setLocNearbyAreas(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider mb-1">Available Service Groups</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border border-hairline bg-cream/20 p-3">
                      {serviceGroups.map(sg => (
                        <label key={sg._id} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={locGroups.includes(sg._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLocGroups([...locGroups, sg._id]);
                              } else {
                                setLocGroups(locGroups.filter(id => id !== sg._id));
                              }
                            }}
                            className="accent-brand"
                          />
                          <span>{sg.name} ({sg.parentType})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={locActive}
                        onChange={(e) => setLocActive(e.target.checked)}
                        className="accent-brand"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold font-display">Is Active / Visible</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 border-t border-hairline pt-4">
                  <button type="submit" className="rounded bg-brand px-6 py-2 text-xs font-semibold text-cream hover:bg-brand-700">Save Location</button>
                  <button type="button" onClick={() => setIsAddingLocation(false)} className="rounded border border-hairline px-6 py-2 text-xs font-semibold text-brand bg-white hover:bg-slate-50">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map(loc => (
                  <div key={loc._id} className="rounded-xl border border-hairline bg-surface p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg text-brand font-semibold">{loc.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${loc.isActive ? "bg-available/10 text-available" : "bg-blocked/10 text-blocked"}`}>
                          {loc.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-muted mt-0.5">/{loc.slug}</p>
                      <p className="text-xs text-muted mt-2 line-clamp-2">{loc.shortDescription}</p>
                    </div>
                    <div className="mt-4 flex gap-2 justify-end border-t border-hairline/60 pt-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEditLocation(loc)}
                        className="rounded border border-hairline px-3 py-1 text-[10px] font-semibold text-brand bg-white hover:border-gold hover:text-gold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc._id)}
                        className="rounded border border-blocked/30 px-3 py-1 text-[10px] font-semibold text-blocked hover:bg-blocked/5"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERVICE GROUPS MANAGER */}
        {activeTab === "servicegroups" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h2 className="font-display text-2xl text-brand">Service Groups CMS</h2>
              {!isAddingGroup && (
                <button
                  type="button"
                  onClick={handleOpenAddGroup}
                  className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-cream"
                >
                  + Add Service Group
                </button>
              )}
            </div>

            {isAddingGroup ? (
              <form onSubmit={handleSaveGroup} className="rounded-2xl border border-hairline bg-surface p-6 space-y-6 max-w-xl">
                <h3 className="font-display text-lg text-brand border-b border-hairline pb-2 font-semibold">
                  {editingGroup ? `Edit Service Group: ${editingGroup.name}` : "Add New Service Group"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <label htmlFor="sg-name" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Group Name</label>
                    <input
                      id="sg-name"
                      type="text"
                      required
                      placeholder="e.g. Bridal Mehendi"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="sg-slug" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">URL Slug</label>
                    <input
                      id="sg-slug"
                      type="text"
                      placeholder="e.g. bridal-mehendi (auto-generated if empty)"
                      value={groupSlug}
                      onChange={(e) => setGroupSlug(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="sg-type" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Parent Service Type</label>
                    <select
                      id="sg-type"
                      value={groupParentType}
                      onChange={(e: any) => setGroupParentType(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="MEHENDI">Mehendi</option>
                      <option value="MAKEUP">Makeup</option>
                      <option value="PARLOUR">Parlour</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="sg-sdesc" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Short Description</label>
                    <input
                      id="sg-sdesc"
                      type="text"
                      placeholder="One-liner for cards"
                      value={groupShortDesc}
                      onChange={(e) => setGroupShortDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="sg-desc" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Body Description</label>
                    <textarea
                      id="sg-desc"
                      rows={4}
                      placeholder="Rich content about this category packages..."
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="sg-hero" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Hero Banner URL</label>
                    <input
                      id="sg-hero"
                      type="url"
                      placeholder="Banner image link"
                      value={groupHeroImage}
                      onChange={(e) => setGroupHeroImage(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="sg-seot" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">SEO Title</label>
                    <input
                      id="sg-seot"
                      type="text"
                      placeholder="SEO <title>"
                      value={groupSeoTitle}
                      onChange={(e) => setGroupSeoTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="sg-seod" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">SEO Description</label>
                    <input
                      id="sg-seod"
                      type="text"
                      placeholder="Meta description"
                      value={groupSeoDesc}
                      onChange={(e) => setGroupSeoDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-4 sm:col-span-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupActive}
                        onChange={(e) => setGroupActive(e.target.checked)}
                        className="accent-brand"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold font-display">Is Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupFeatured}
                        onChange={(e) => setGroupFeatured(e.target.checked)}
                        className="accent-brand"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold font-display">Feature on Homepage</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 border-t border-hairline pt-4">
                  <button type="submit" className="rounded bg-brand px-6 py-2 text-xs font-semibold text-cream hover:bg-brand-700">Save Group</button>
                  <button type="button" onClick={() => setIsAddingGroup(false)} className="rounded border border-hairline px-6 py-2 text-xs font-semibold text-brand bg-white hover:bg-slate-50">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {serviceGroups.map(g => (
                  <div key={g._id} className="rounded-xl border border-hairline bg-surface p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg text-brand font-semibold">{g.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${g.isActive ? "bg-available/10 text-available" : "bg-blocked/10 text-blocked"}`}>
                          {g.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded bg-gold/10 px-2 py-0.5 text-[9px] font-semibold text-gold tracking-wide uppercase">{g.parentType}</span>
                        {g.isFeatured && <span className="rounded bg-brand/10 px-2 py-0.5 text-[9px] font-semibold text-brand tracking-wide uppercase">Featured</span>}
                      </div>
                      <p className="text-[10px] font-mono text-muted mt-1.5">/{g.slug}</p>
                      <p className="text-xs text-muted mt-2 line-clamp-2">{g.shortDescription}</p>
                    </div>
                    <div className="mt-4 flex gap-2 justify-end border-t border-hairline/60 pt-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEditGroup(g)}
                        className="rounded border border-hairline px-3 py-1 text-[10px] font-semibold text-brand bg-white hover:border-gold hover:text-gold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(g._id)}
                        className="rounded border border-blocked/30 px-3 py-1 text-[10px] font-semibold text-blocked hover:bg-blocked/5"
                      >
                        Deactivate
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
                {(["PENDING", "PAID", "REJECTED", "CANCELLED", "ALL"] as const).map((st) => (
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
                    {st === "PENDING"
                      ? "Pending Verification"
                      : st === "PAID"
                      ? "Approved"
                      : st === "REJECTED"
                      ? "Rejected"
                      : st === "CANCELLED"
                      ? "Cancelled / Refunds"
                      : "All"}
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
                            b.bookingStatus === "CANCELLED"
                              ? "bg-blocked/15 text-blocked border border-blocked/25"
                              : b.paymentStatus === "PAYMENT_VERIFICATION_PENDING"
                              ? "bg-gold/15 text-gold border border-gold/25"
                              : b.paymentStatus === "BOOKED_AMOUNT_PAID"
                              ? "bg-available/15 text-available border border-available/25"
                              : b.paymentStatus === "REJECTED"
                              ? "bg-blocked/15 text-blocked border border-blocked/25"
                              : "bg-muted/15 text-muted border border-muted/25"
                          }`}>
                            {b.bookingStatus === "CANCELLED" ? "CANCELLED" : b.paymentStatus === "PAYMENT_VERIFICATION_PENDING" ? "Pending Verification" : b.paymentStatus}
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

                    {/* Cancellation Warning Banner */}
                    {(b.bookingStatus === "CANCELLED" || b.refundStatus === "PENDING") && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 mt-3 space-y-1">
                        <p className="font-bold text-red-950 uppercase tracking-wider text-[10px]">⚠️ Order Cancelled by Customer</p>
                        <p>Reason: <strong>{b.cancellationReason || "Customer requested cancellation"}</strong></p>
                        {b.customerUpiId && (
                          <p>Customer Payout UPI: <strong className="font-mono text-xs bg-red-100/80 px-1.5 py-0.5 rounded text-red-950 select-all font-bold">{b.customerUpiId}</strong> {b.customerUpiName ? `(${b.customerUpiName})` : ""}</p>
                        )}
                        <p className="text-[11px] text-red-800">
                          {b.refundStatus === "PROCESSED"
                            ? `✓ Refund of ₹${b.refundAmount || 0} processed.`
                            : `Refund review is pending. Click Process Refund to process customer payout.`}
                        </p>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {b.bookingStatus === "CANCELLED" || b.refundStatus === "PENDING" ? (
                      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-hairline pt-4 mt-3">
                        <button
                          type="button"
                          onClick={() => triggerRefundDialog(b)}
                          className="rounded bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-bold transition-colors shadow-sm"
                        >
                          {b.refundStatus === "PROCESSED" ? "View / Edit Refund" : "Process Refund"}
                        </button>
                      </div>
                    ) : (b.paymentStatus === "PAYMENT_VERIFICATION_PENDING" || b.bookingStatus === "AWAITING_REMAINING_PAYMENT") && (
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
                          onClick={() => triggerPartialDialog(b)}
                          className="rounded border border-amber-600 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          Partial Payment
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

            {/* Security PIN Control Card */}
            <div className="max-w-xl rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6 mt-6">
              <h3 className="font-display text-2xl text-brand border-b border-hairline pb-2 font-semibold">Admin Security PIN</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                The Security PIN is required to authorize final order confirmations. Keep this PIN private.
              </p>

              <form onSubmit={handlePinSave} className="space-y-4 text-sm text-ink">
                <div>
                  <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    Current PIN (If already set)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter current PIN"
                    value={pinCurrent}
                    onChange={(e) => setPinCurrent(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    New Security PIN (4–6 numeric digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="Enter 4-6 digit PIN"
                    value={pinNew}
                    onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    Confirm New Security PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="Re-enter new PIN"
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs text-brand focus:border-gold focus:outline-none font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="w-full rounded bg-brand py-3 text-xs font-bold text-cream hover:bg-brand-700 disabled:opacity-50 transition-colors uppercase tracking-wider"
                >
                  {isSavingPin ? "Saving PIN..." : "Save Security PIN"}
                </button>
              </form>
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

      {/* Confirm / Partial / Reject Modal Dialog */}
      {activeDialogBooking && dialogAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[440px] rounded-2xl bg-surface border border-hairline p-6 shadow-2xl text-sm text-ink space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-xl text-brand font-semibold">
                {dialogAction === "APPROVE"
                  ? confirmStep === 1
                    ? "Order Confirmation (Step 1 of 2)"
                    : "Enter Security PIN (Step 2 of 2)"
                  : dialogAction === "REFUND"
                  ? confirmStep === 1
                    ? "Process Refund (Step 1 of 2)"
                    : "Enter Security PIN (Step 2 of 2)"
                  : dialogAction === "PARTIAL"
                  ? "Verify Partial Payment"
                  : "Reject Payment"}
              </h3>
              <button
                type="button"
                onClick={() => { setActiveDialogBooking(null); setDialogAction(null); setConfirmStep(1); setAdminPinInput(""); }}
                className="text-muted hover:text-brand"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleDialogSubmit} className="space-y-4">
              
              {/* APPROVE STEP 1: Confirmation Summary */}
              {dialogAction === "APPROVE" && confirmStep === 1 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold text-amber-950 uppercase tracking-wider text-[10px]">Booking Confirmation Summary:</p>
                    <p>• <strong>Client:</strong> {activeDialogBooking.customerName} ({activeDialogBooking.customerMobile})</p>
                    <p>• <strong>Booking ID:</strong> {activeDialogBooking.bookingId}</p>
                    <p>• <strong>Schedule:</strong> {activeDialogBooking.bookingDate} at {activeDialogBooking.timeSlot}</p>
                    <p>• <strong>Total Order:</strong> ₹{activeDialogBooking.totalAmount.toLocaleString("en-IN")}</p>
                    <p>• <strong>Required Deposit:</strong> ₹{activeDialogBooking.onlineBookingAmount.toLocaleString("en-IN")}</p>
                    <p>• <strong>Paid Amount:</strong> ₹{(activeDialogBooking.paidAmount || 0).toLocaleString("en-IN")}</p>
                    <p>• <strong>Remaining:</strong> ₹{(activeDialogBooking.remainingAmount || activeDialogBooking.onlineBookingAmount).toLocaleString("en-IN")}</p>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    Are you sure you want to confirm this order? Click <strong>Continue</strong> to verify your Admin Security PIN.
                  </p>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Internal Admin Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified full deposit in bank statement"
                      value={dialogNote}
                      onChange={(e) => setDialogNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* APPROVE STEP 2: Security PIN Entry */}
              {dialogAction === "APPROVE" && confirmStep === 2 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-stone-900 text-white p-4 space-y-2">
                    <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Security PIN Required</p>
                    <p className="text-xs text-stone-300">
                      Enter your 4–6 digit Admin Security PIN to finalize order confirmation for <strong>{activeDialogBooking.bookingId}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Admin Security PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="Enter 4-6 digit PIN"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full text-center text-lg tracking-widest rounded-lg border border-hairline bg-cream/20 px-3 py-2.5 font-bold text-brand focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* REFUND MODAL STEP 1 */}
              {dialogAction === "REFUND" && confirmStep === 1 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold text-amber-950 uppercase tracking-wider text-[10px]">Cancellation & Refund Breakdown:</p>
                    <p>• Client: <strong>{activeDialogBooking.customerName}</strong> ({activeDialogBooking.customerMobile})</p>
                    <p>• Booking ID: <strong>{activeDialogBooking.bookingId}</strong></p>
                    <p>• Paid Deposit: <strong>₹{(activeDialogBooking.paidAmount || activeDialogBooking.onlineBookingAmount || 0).toLocaleString("en-IN")}</strong></p>
                    <p>• Customer Reason: <em>"{activeDialogBooking.cancellationReason || "Not provided"}"</em></p>
                  </div>

                  {/* Customer Payout Account Info Box */}
                  <div className="rounded-xl bg-stone-900 text-white p-3.5 text-xs space-y-1 shadow-inner border border-stone-800">
                    <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Customer Requested Payout Account:</p>
                    <p>• UPI ID: <span className="font-mono text-xs text-amber-300 bg-stone-800 px-2 py-0.5 rounded select-all font-bold">{activeDialogBooking.customerUpiId || "Not specified"}</span></p>
                    <p>• Account Name: <strong className="text-stone-200">{activeDialogBooking.customerUpiName || "Not specified"}</strong></p>
                    <p className="text-[10px] text-stone-400 pt-0.5">ℹ️ Must match original payment account. If different, contact customer on WhatsApp.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Refund Amount to Payout (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={activeDialogBooking.paidAmount || activeDialogBooking.onlineBookingAmount || 1500}
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-sm font-semibold text-brand focus:outline-none focus:border-gold"
                    />
                    <p className="text-[10px] text-muted mt-1">Calculated as deposit minus ₹500 cancellation fee, or adjust manually.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Refund UTR / Reference ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref #9876543210"
                      value={refundTxInput}
                      onChange={(e) => setRefundTxInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Admin Refund Note / Comments (Sent to Customer)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Refund of ₹1000 sent via GPay. ₹500 fee deducted."
                      value={dialogNote}
                      onChange={(e) => setDialogNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* REFUND MODAL STEP 2 */}
              {dialogAction === "REFUND" && confirmStep === 2 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-stone-900 text-white p-4 space-y-2">
                    <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Confirm Refund with Security PIN</p>
                    <p className="text-xs text-stone-300">
                      You are processing a refund of <strong>₹{refundAmountInput}</strong> for booking <strong>{activeDialogBooking.bookingId}</strong>. Enter your Admin Security PIN to confirm payout.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Admin Security PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="Enter 4-6 digit PIN"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full text-center text-lg tracking-widest rounded-lg border border-hairline bg-cream/20 px-3 py-2.5 font-bold text-brand focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* PARTIAL PAYMENT MODAL */}
              {dialogAction === "PARTIAL" && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
                    <p className="font-bold text-amber-950 uppercase tracking-wider text-[10px]">Partial Payment Review:</p>
                    <p>• Client: <strong>{activeDialogBooking.customerName}</strong> ({activeDialogBooking.customerMobile})</p>
                    <p>• Required Deposit: <strong>₹{activeDialogBooking.onlineBookingAmount.toLocaleString("en-IN")}</strong></p>
                    <p>• Transaction ID / UTR: <strong className="font-mono">{activeDialogBooking.transactionId || "None"}</strong></p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Verified Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={activeDialogBooking.onlineBookingAmount}
                      value={partialAmountInput}
                      onChange={(e) => setPartialAmountInput(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-sm font-semibold text-brand focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="rounded-lg bg-stone-100 p-2.5 text-xs text-stone-700 space-y-0.5 font-medium">
                    <p>Remaining Amount Required: <strong className="text-amber-700">₹{Math.max(0, activeDialogBooking.onlineBookingAmount - (partialAmountInput || 0)).toLocaleString("en-IN")}</strong></p>
                    <p className="text-[10px] text-stone-500">Status will update to: Awaiting Remaining Payment</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Internal Admin Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Received partial advance ₹500 via GPay"
                      value={dialogNote}
                      onChange={(e) => setDialogNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* REJECT MODAL */}
              {dialogAction === "REJECT" && (
                <div className="space-y-3">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Are you sure you want to reject the payment for booking <strong>{activeDialogBooking.bookingId}</strong>? This will release the time slot back to AVAILABLE.
                  </p>

                  <div>
                    <label className="block text-[10px] font-semibold text-gold uppercase tracking-wider">
                      Rejection Reason (Sent to Customer)
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Transaction ID was not found in bank statements / invalid proof."
                      value={dialogReason}
                      onChange={(e) => setDialogReason(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>

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
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3 mt-4">
                {(dialogAction === "APPROVE" || dialogAction === "REFUND") && confirmStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setConfirmStep(1)}
                    className="mr-auto text-xs text-stone-500 hover:text-stone-800 font-semibold"
                  >
                    ← Back to Summary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveDialogBooking(null); setDialogAction(null); setConfirmStep(1); setAdminPinInput(""); }}
                  className="rounded border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-brand hover:bg-cream/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className={`rounded px-4 py-2 text-xs font-bold text-cream transition-colors ${
                    dialogAction === "APPROVE"
                      ? "bg-brand hover:bg-brand-700"
                      : dialogAction === "REFUND"
                      ? "bg-amber-700 hover:bg-amber-800"
                      : dialogAction === "PARTIAL"
                      ? "bg-amber-700 hover:bg-amber-800"
                      : "bg-blocked hover:bg-red-800"
                  }`}
                >
                  {isProcessingAction
                    ? "Processing..."
                    : dialogAction === "APPROVE"
                    ? confirmStep === 1
                      ? "Continue to PIN →"
                      : "Confirm Order (PIN)"
                    : dialogAction === "REFUND"
                    ? confirmStep === 1
                      ? "Continue to PIN →"
                      : "Confirm & Process Refund (PIN)"
                    : dialogAction === "PARTIAL"
                    ? "Confirm Partial Payment"
                    : "Reject Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
