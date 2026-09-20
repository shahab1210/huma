import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import UpiPaymentModal from "../components/UpiPaymentModal";

export default function BookingFlow() {
  const {
    cart,
    user,
    serviceAreas,
    getAvailableSlotsForDate,
    createBooking,
    showToast,
    navigate,
    locations,
    selectedLocation,
    businessSettings,
    bookingMode,
    setBookingMode,
  } = useApp();

  const [step, setStep] = useState<"details" | "schedule" | "checkout" | "confirmed">("details");
  
  // Form States
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [selectedArea, setSelectedArea] = useState(selectedLocation ? selectedLocation.name : "");
  const [address, setAddress] = useState("");
  const [visitMode, setVisitMode] = useState<"HOME_VISIT" | "ARTIST_VISIT">("HOME_VISIT");
  
  // Schedule States
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [latestBooking, setLatestBooking] = useState<any>(null);

  const isOwnDesign = bookingMode === "OWN_DESIGN";

  // Helper to sanitize and normalize Indian mobile inputs
  const sanitizeIndianMobile = (val: string): string => {
    if (!val) return "";
    let digits = val.replace(/[\s\-\(\)\.]/g, "");
    if (digits.startsWith("+91")) {
      digits = digits.slice(3);
    } else if (digits.startsWith("91") && digits.length === 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length === 11) {
      digits = digits.slice(1);
    }
    digits = digits.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  const handleMobileChange = (val: string) => {
    setCustomerMobile(sanitizeIndianMobile(val));
  };

  // Autofill if user logged in
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || "");
      setCustomerMobile(sanitizeIndianMobile(user.mobileNumber || ""));
    }
  }, [user]);

  // Autofill location from selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setSelectedArea(selectedLocation.name);
    }
  }, [selectedLocation]);

  // Find matched Location object
  const matchedLoc = locations.find((l) => l.name.toLowerCase() === (selectedArea || "").toLowerCase()) ||
    (selectedLocation && selectedLocation.name.toLowerCase() === (selectedArea || "").toLowerCase() ? selectedLocation : null);

  const showArtistVisit = matchedLoc ? !!matchedLoc.artistVisitEnabled : false;
  const showHomeVisit = matchedLoc ? (matchedLoc.homeVisitEnabled !== false) : true;
  const isArtistHomeCity = matchedLoc?.slug === "lalganj" || matchedLoc?.slug === "sandila";

  // Auto-adjust visitMode based on matched location
  useEffect(() => {
    if (matchedLoc) {
      if (matchedLoc.homeVisitEnabled && !matchedLoc.artistVisitEnabled) {
        setVisitMode("HOME_VISIT");
      } else if (!matchedLoc.homeVisitEnabled && matchedLoc.artistVisitEnabled) {
        setVisitMode("ARTIST_VISIT");
      }
    }
  }, [matchedLoc]);

  // Load slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slots = getAvailableSlotsForDate(selectedDate);
      setAvailableSlots(slots);
      setSelectedSlot("");
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, getAvailableSlotsForDate]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-28 text-center">
        <h2 className="font-display text-2xl text-brand">Authentication Required</h2>
        <p className="mt-3 text-sm text-muted">You must log in to your account before placing a booking.</p>
        <button
          type="button"
          onClick={() => navigate("auth")}
          className="mt-6 rounded-md bg-brand px-5 py-2 text-sm font-medium text-cream"
        >
          Go to Login / Register
        </button>
      </div>
    );
  }

  if (cart.length === 0 && !isOwnDesign && step !== "confirmed") {
    return (
      <div className="mx-auto max-w-md px-5 py-28 text-center space-y-4">
        <h2 className="font-display text-2xl text-brand">Your Cart is Empty</h2>
        <p className="text-sm text-muted">You can choose a design from our catalog or book an appointment with your own custom design.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate("mehendi")}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-cream hover:bg-brand-700 transition"
          >
            Browse Catalog Designs
          </button>
          <button
            type="button"
            onClick={() => setBookingMode("OWN_DESIGN")}
            className="rounded-md border border-gold bg-gold/10 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-gold/20 transition"
          >
            🎨 Book with Your Own Design (₹899)
          </button>
        </div>
      </div>
    );
  }

  // Subtotal & Fee calculations (dynamic source of truth)
  const subtotal = isOwnDesign ? 899 : cart.reduce((acc, s) => acc + s.startingPrice, 0);
  const advanceDepositSetting = businessSettings?.bookingAmount ?? 1500;

  const isHomeVisitMode = visitMode === "HOME_VISIT";
  const homeVisitMin = matchedLoc?.homeVisitMinimumAmount ?? 999;
  const homeVisitFeeAmount = matchedLoc?.homeVisitFee !== undefined ? matchedLoc.homeVisitFee : 399;
  const homeVisitFreeThreshold = matchedLoc?.homeVisitFreeThreshold ?? 2999;

  let homeVisitFee = 0;
  if (isHomeVisitMode) {
    if (isOwnDesign) {
      // For own-design bookings, travel fee is evaluated on the final quoted price post-service; initial online advance is strictly ₹899
      homeVisitFee = 0;
    } else {
      if (subtotal >= homeVisitFreeThreshold) {
        homeVisitFee = 0;
      } else if (subtotal >= homeVisitMin) {
        homeVisitFee = homeVisitFeeAmount;
      } else {
        homeVisitFee = 0;
      }
    }
  }

  const totalAmount = isOwnDesign ? 899 : (subtotal + homeVisitFee);
  const onlineBookingAmount = isOwnDesign
    ? 899
    : (totalAmount > 0 ? Math.min(advanceDepositSetting, totalAmount) : 0);
  const remainingAmount = isOwnDesign ? 0 : (totalAmount - onlineBookingAmount);

  // Validation checks: Home Visit requires >= homeVisitMin for catalog; Visit the Artist has NO minimum (min ₹0)
  const isHomeVisitBelowMin = !isOwnDesign && isHomeVisitMode && subtotal < homeVisitMin;
  const isArtistVisitBelow999 = !isHomeVisitMode && subtotal < 999; // Strictly < 999

  const handleNextDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerMobile.trim() || !selectedArea || !address.trim()) {
      showToast("Please fill in all details", "warning");
      return;
    }
    const cleanMobile = sanitizeIndianMobile(customerMobile);
    if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      showToast("Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)", "warning");
      return;
    }

    if (isHomeVisitBelowMin) {
      showToast(`Home Visit is available for bookings of ₹${homeVisitMin.toLocaleString("en-IN")} or more.`, "error");
      return;
    }

    setStep("schedule");
  };

  const handleNextSchedule = () => {
    if (!selectedDate || !selectedSlot) {
      showToast("Please select a date and an available slot", "warning");
      return;
    }
    setStep("checkout");
  };

  const handlePlaceOrder = () => {
    // Generate Booking Items
    const items = isOwnDesign
      ? [{
          itemId: "own-custom-design",
          itemType: "DESIGN" as const,
          nameSnapshot: "Custom / Own Mehendi Design (Booking Advance)",
          priceSnapshot: 899,
          durationSnapshot: "Consultation & Service",
          categorySnapshot: "Custom Design",
        }]
      : cart.map((s) => ({
          itemId: s.id,
          itemType: s.type,
          nameSnapshot: s.name,
          priceSnapshot: s.startingPrice,
          durationSnapshot: s.duration,
          categorySnapshot: s.category,
        }));

    const locationId = matchedLoc ? matchedLoc._id : undefined;
    const cleanMobile = sanitizeIndianMobile(customerMobile);
    const normalizedMobile = `+91${cleanMobile}`;

    const effectiveVisitMode = isHomeVisitMode ? "HOME_VISIT" : "ARTIST_VISIT";

    // Create the pending booking record
    const booking = createBooking({
      customerName: customerName.trim(),
      customerMobile: normalizedMobile,
      items,
      serviceArea: selectedArea,
      locationId,
      address: address.trim(),
      visitMode: effectiveVisitMode,
      homeVisitFee: 0,
      bookingDate: selectedDate,
      timeSlot: selectedSlot,
      subtotal: 899,
      totalAmount: 899,
      onlineBookingAmount: 899,
      bookingAdvance: isOwnDesign ? 899 : 0,
      finalDesignPrice: 0,
      bookingType: isOwnDesign ? "OWN_DESIGN" : "CATALOG",
      isOwnDesign,
    } as any);

    setLatestBooking(booking);
    setShowPaymentModal(true);
  };

  const handleProofSubmitted = () => {
    if (!latestBooking) return;
    setShowPaymentModal(false);
    
    setLatestBooking((prev: any) => ({
      ...prev,
      paymentStatus: "PAYMENT_VERIFICATION_PENDING",
      bookingStatus: "PAYMENT_VERIFICATION_PENDING",
      paidAmount: 0,
      remainingAmount,
    }));
    
    setStep("confirmed");
    showToast("Payment proof submitted! Huma will verify your booking shortly.");
  };

  // WhatsApp Message Prefill generator
  const getWhatsAppLink = () => {
    if (!latestBooking) return "";
    const visitModeText = latestBooking.visitMode === "HOME_VISIT" ? "Home Visit" : "Visit the Artist";

    if (latestBooking.bookingType === "OWN_DESIGN" || latestBooking.isOwnDesign) {
      const message = `Hello Huma,%0A%0AI have just placed an Own Design Booking and submitted my ₹${latestBooking.onlineBookingAmount} booking advance online!%0A%0A*Booking ID:* ${latestBooking.bookingId}%0A*Customer Name:* ${latestBooking.customerName}%0A*Contact:* ${latestBooking.customerMobile}%0A*Mode:* ${visitModeText}%0A*Date:* ${latestBooking.bookingDate}%0A*Time Slot:* ${latestBooking.timeSlot}%0A*Area:* ${latestBooking.serviceArea}%0A*Address:* ${latestBooking.address}%0A%0A*Booking Advance Paid:* ₹${latestBooking.onlineBookingAmount} (to be adjusted against final bill)%0A%0A📸 *(Optional)* I am attaching my custom mehendi design image here for your price estimate. Thank you!`;
      return `https://wa.me/918960600371?text=${message}`;
    }

    const feeText = latestBooking.homeVisitFee > 0 ? `%0A*Home Visit Fee:* ₹${latestBooking.homeVisitFee}` : "";
    const itemsStr = latestBooking.items.map((i: any) => `• ${i.nameSnapshot} (₹${i.priceSnapshot})`).join("%0A");
    const message = `Hello Huma,%0A%0AI have just submitted a booking and payment proof online!%0A%0A*Booking ID:* ${latestBooking.bookingId}%0A*Customer Name:* ${latestBooking.customerName}%0A*Contact:* ${latestBooking.customerMobile}%0A*Mode:* ${visitModeText}%0A*Date:* ${latestBooking.bookingDate}%0A*Time Slot:* ${latestBooking.timeSlot}%0A*Area:* ${latestBooking.serviceArea}%0A*Address:* ${latestBooking.address}%0A%0A*Services:*%0A${itemsStr}%0A%0A*Subtotal:* ₹${latestBooking.subtotal || latestBooking.totalAmount}${feeText}%0A*Total Amount:* ₹${latestBooking.totalAmount}%0A*Online Advance Payment (UPI):* ₹${latestBooking.onlineBookingAmount}%0A*Remaining Balance:* ₹${latestBooking.totalAmount - latestBooking.onlineBookingAmount}%0A%0APlease verify my transaction and confirm. Thank you!`;
    
    return `https://wa.me/918960600371?text=${message}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 lg:px-8">
      {/* Progress header (hidden in confirmed step) */}
      {step !== "confirmed" && (
        <div className="mb-10">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className={step === "details" ? "text-gold" : ""}>1. Details</span>
            <span className={step === "schedule" ? "text-gold" : ""}>2. Schedule</span>
            <span className={step === "checkout" ? "text-gold" : ""}>3. Checkout</span>
          </div>
          <div className="mt-3 h-1 w-full bg-hairline rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{
                width: step === "details" ? "33%" : step === "schedule" ? "66%" : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: Details */}
      {step === "details" && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6">
          {/* Mode Switcher Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream/50 border border-hairline">
            <div className="flex items-center gap-2">
              <span className="text-lg">{isOwnDesign ? "🎨" : "📖"}</span>
              <div>
                <p className="text-xs font-bold text-brand">
                  {isOwnDesign ? "Own Design Booking" : "Catalog Design Booking"}
                </p>
                <p className="text-[11px] text-muted">
                  {isOwnDesign
                    ? "Booking appointment with your own custom design (₹899 Advance)"
                    : `${cart.length} item(s) selected from catalog`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isOwnDesign) {
                  setBookingMode("CATALOG");
                  if (cart.length === 0) navigate("mehendi");
                } else {
                  setBookingMode("OWN_DESIGN");
                }
              }}
              className="text-xs font-semibold text-gold hover:underline whitespace-nowrap px-2 py-1"
            >
              {isOwnDesign ? "Browse Catalog →" : "Book with Own Design →"}
            </button>
          </div>

          {/* Own Design Specific Information Banner */}
          {isOwnDesign && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-brand text-sm">
                <span>🎨 Book with Your Own Design</span>
                <span className="rounded-full bg-brand text-cream px-2 py-0.5 text-[10px]">Booking Advance: ₹899</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-amber-900 list-disc list-inside">
                <li>
                  <strong>Booking Advance:</strong> Pay ₹899 now to confirm your booking. The ₹899 advance will be adjusted against your final service amount.
                </li>
                {!isArtistHomeCity && (
                  <li>
                    <strong>Minimum Booking Requirement:</strong> Appointment for booking minimum ₹2,999.
                  </li>
                )}
                <li>
                  <strong>Price Quote (Optional):</strong> Send your design to the artist on WhatsApp to get a better idea of the expected price. <em>(Optional — booking does not require sending design upfront)</em>.
                </li>
              </ul>
            </div>
          )}

          <h2 className="font-display text-2xl text-brand border-b border-hairline pb-2">Customer &amp; Location Details</h2>
          
          <form onSubmit={handleNextDetails} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Priyanshu Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="mt-1 flex rounded-lg border border-hairline bg-cream/30 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all overflow-hidden">
                  <span className="flex items-center gap-1.5 bg-cream/60 px-3 py-2 border-r border-hairline text-xs font-semibold text-slate-700 select-none">
                    <span role="img" aria-label="India flag">🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={customerMobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    onPaste={(e) => {
                      const pasteData = e.clipboardData.getData("text");
                      if (pasteData) {
                        e.preventDefault();
                        handleMobileChange(pasteData);
                      }
                    }}
                    className="w-full bg-transparent px-3 py-2 text-sm text-ink placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  10-digit mobile number (starts with 6, 7, 8, or 9)
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="area" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Service Area</label>
              <select
                id="area"
                required
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              >
                <option value="">-- Select your town/city --</option>
                {locations && locations.length > 0
                  ? locations.map((loc) => (
                      <option key={loc._id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))
                  : serviceAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
              </select>
            </div>

            {/* Visit Mode Selection */}
            <div className="rounded-xl border border-hairline bg-cream/20 p-4 space-y-3">
              <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                How would you like to receive the service?
              </label>
              <div className={`grid gap-3 ${showArtistVisit && showHomeVisit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {showArtistVisit && (
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      visitMode === "ARTIST_VISIT"
                        ? "border-gold bg-gold/10 shadow-sm"
                        : "border-hairline bg-surface hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visitMode"
                      value="ARTIST_VISIT"
                      checked={visitMode === "ARTIST_VISIT"}
                      onChange={() => setVisitMode("ARTIST_VISIT")}
                      className="mt-1 text-gold focus:ring-gold"
                    />
                    <div>
                      <p className="text-xs font-bold text-brand">Visit the Artist</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Come to the artist's home/service location in {matchedLoc?.name || "Lalganj/Sandila"}.
                      </p>
                    </div>
                  </label>
                )}

                {showHomeVisit && (
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      visitMode === "HOME_VISIT"
                        ? "border-gold bg-gold/10 shadow-sm"
                        : "border-hairline bg-surface hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visitMode"
                      value="HOME_VISIT"
                      checked={visitMode === "HOME_VISIT"}
                      onChange={() => setVisitMode("HOME_VISIT")}
                      className="mt-1 text-gold focus:ring-gold"
                    />
                    <div>
                      <p className="text-xs font-bold text-brand">Home Visit</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        The artist comes to your home.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Special warning for Visit the Artist if subtotal < 999 */}
              {visitMode === "ARTIST_VISIT" && isArtistVisitBelow999 && (
                <div className="mt-2 rounded-lg bg-amber-50/80 border border-amber-200/80 p-3 text-[11px] text-amber-900 leading-relaxed">
                  ℹ️ <strong>Note:</strong> For bookings below ₹999, the artist may cancel or reschedule the booking if there is other work or a bridal booking.
                </div>
              )}

              {/* Home Visit fee notification */}
              {isHomeVisitMode && (
                <div className="mt-2 text-xs">
                  {isOwnDesign ? (
                    isArtistHomeCity ? (
                      <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 leading-relaxed space-y-1">
                        <p>
                          ℹ️ <strong>Home Visit in {matchedLoc?.name}:</strong> Pay ₹899 booking advance online now (adjusted in your final bill).
                        </p>
                        <p className="text-[11px] text-amber-800">
                          Standard Home Visit rules apply to your final quoted amount: ₹399 travel fee applies if final service is under ₹2,999; FREE travel fee for orders of ₹2,999 or more.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 leading-relaxed space-y-1">
                        <p>
                          ℹ️ <strong>Home Visit in {matchedLoc?.name || selectedArea}:</strong> Pay ₹899 booking advance online now.
                        </p>
                        <p className="text-[11px] text-blue-800">
                          Appointment for booking minimum ₹2,999. The ₹899 advance will be adjusted against your final service amount. (Optional: send your design to the artist on WhatsApp to get its price).
                        </p>
                      </div>
                    )
                  ) : subtotal < homeVisitMin ? (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      ⚠️ <strong>Home Visit is available for bookings of ₹{homeVisitMin.toLocaleString("en-IN")} or more.</strong> Current cart: ₹{subtotal.toLocaleString("en-IN")}.
                    </div>
                  ) : subtotal >= homeVisitFreeThreshold ? (
                    <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
                      🎉 <strong>Free Home Visit!</strong> Your order value (₹{subtotal.toLocaleString("en-IN")}) meets the ₹{homeVisitFreeThreshold.toLocaleString("en-IN")} threshold. ₹0 home visit fee applied!
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      ℹ️ <strong>Home Visit Fee:</strong> A ₹{homeVisitFeeAmount} travel fee applies for home visits between ₹{homeVisitMin.toLocaleString("en-IN")} and ₹{homeVisitFreeThreshold.toLocaleString("en-IN")}. (Free for orders of ₹{homeVisitFreeThreshold.toLocaleString("en-IN")} or more).
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                {isHomeVisitMode ? "Exact Home / Event Address" : "Customer Address / Landmark"}
              </label>
              <textarea
                id="address"
                required
                rows={3}
                placeholder="Enter complete address (House no., Street, Landmark)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isHomeVisitBelowMin}
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed mt-2"
            >
              Continue to Schedule
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Schedule */}
      {step === "schedule" && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <h2 className="font-display text-2xl text-brand">Select Date &amp; Time Slot</h2>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-xs text-muted hover:text-brand"
            >
              ← Back to Details
            </button>
          </div>

          <div className="space-y-6">
            {/* Date Input */}
            <div>
              <label htmlFor="booking-date" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Select Booking Date</label>
              <input
                id="booking-date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>

            {/* Time Slot Picker */}
            {selectedDate ? (
              <div>
                <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Select Time Slot</label>
                {availableSlots.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-orange-100 bg-orange-50/50 p-4 text-center text-xs text-orange-800">
                    No available time slots on this date. Please select another date.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${
                          selectedSlot === slot
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
            ) : (
              <p className="rounded-lg bg-cream/40 p-6 text-center text-xs text-muted">
                Please pick a booking date to load available time slots.
              </p>
            )}

            <button
              type="button"
              onClick={handleNextSchedule}
              disabled={!selectedDate || !selectedSlot}
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed"
            >
              Continue to Checkout
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Checkout Review */}
      {step === "checkout" && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <h2 className="font-display text-2xl text-brand">Review &amp; Confirm Booking</h2>
            <button
              type="button"
              onClick={() => setStep("schedule")}
              className="text-xs text-muted hover:text-brand"
            >
              ← Back to Schedule
            </button>
          </div>

          <div className="space-y-6 text-sm text-ink">
            {/* Booking Details Grid */}
            <div className="grid gap-4 rounded-xl bg-cream/30 p-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="font-semibold text-gold uppercase tracking-wider text-[10px]">Client Info</p>
                <p className="mt-1 font-medium text-brand">{customerName}</p>
                <p className="text-muted">{customerMobile}</p>
              </div>
              <div>
                <p className="font-semibold text-gold uppercase tracking-wider text-[10px]">Schedule &amp; Mode</p>
                <p className="mt-1 font-medium text-brand">{selectedDate} ({selectedSlot})</p>
                <p className="text-muted font-medium">
                  {isHomeVisitMode ? "🏡 Home Visit" : "🎨 Visit the Artist"}
                </p>
              </div>
              <div className="sm:col-span-2 border-t border-hairline pt-3 mt-1">
                <p className="font-semibold text-gold uppercase tracking-wider text-[10px]">Address</p>
                <p className="mt-1 text-muted">
                  {address}, <span className="font-medium text-brand">{selectedArea}</span>
                </p>
              </div>
            </div>

            {/* Selected Items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {isOwnDesign ? "Selected Booking Option" : "Items"}
              </p>
              <div className="divide-y divide-hairline border-y border-hairline">
                {isOwnDesign ? (
                  <div className="py-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-brand">🎨 Custom / Own Mehendi Design (Booking Advance)</p>
                        <p className="text-xs text-muted">Slot Reservation &amp; Advance Deposit</p>
                      </div>
                      <span className="font-semibold text-base">₹899</span>
                    </div>
                    <div className="rounded-lg bg-amber-50/90 border border-amber-200/80 p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
                      <p>
                        <strong>💡 How this works:</strong> Pay ₹899 now to confirm your booking. The ₹899 advance will be adjusted against your final service amount.
                      </p>
                      <p>
                        Your final design/service price will be confirmed after the artist reviews your requirements/design.
                        {!isArtistHomeCity && (
                          <span> (Appointment for booking minimum ₹2,999).</span>
                        )}
                      </p>
                      <p className="text-[10.5px] text-amber-800">
                        <em>Optional: Send your design to the artist on WhatsApp to get a better idea of the expected price.</em>
                      </p>
                    </div>
                  </div>
                ) : (
                  cart.map((s) => (
                    <div key={s.id} className="flex justify-between py-3">
                      <div>
                        <p className="font-semibold text-brand">{s.name}</p>
                        <p className="text-xs text-muted">{s.duration} • {s.category}</p>
                      </div>
                      <span className="font-semibold">₹{s.startingPrice.toLocaleString("en-IN")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Booking Split Pricing */}
            <div className="space-y-2 border-b border-hairline pb-4">
              <div className="flex justify-between">
                <span>{isOwnDesign ? "Initial Booking Advance" : "Subtotal"}</span>
                <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {!isOwnDesign && isHomeVisitMode && (
                <div className="flex justify-between text-xs">
                  <span>Home Visit Travel Fee</span>
                  <span className={homeVisitFee > 0 ? "font-semibold text-brand" : "font-bold text-green-700"}>
                    {homeVisitFee > 0 ? `+ ₹${homeVisitFee.toLocaleString("en-IN")}` : "FREE (₹0)"}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-brand pt-1 border-t border-dashed border-hairline">
                <span>{isOwnDesign ? "Total Payable Online Now" : "Total Booking Value"}</span>
                <span>₹{isOwnDesign ? "899" : totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-available">
                <span className="font-semibold">
                  {isOwnDesign ? "Booking Advance Paid Online" : "Online Booking Advance (Hold Deposit)"}
                </span>
                <span className="font-bold text-base">₹{onlineBookingAmount.toLocaleString("en-IN")}</span>
              </div>
              {isOwnDesign ? (
                <p className="text-[11px] text-muted pt-1">
                  Remaining amount = (Final Quoted Service Price + Travel Fee - ₹899 Advance Paid). Paid directly to Huma post-service.
                </p>
              ) : (
                <div className="flex justify-between text-muted">
                  <span>Remaining Balance (Pay directly to Huma post-service)</span>
                  <span className="font-semibold">₹{remainingAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="space-y-3 pt-2">
              <p className="text-[11px] text-muted text-center leading-relaxed">
                By clicking the button below, you will open the manual UPI payment gateway to scan the QR code and submit your transaction proof for the ₹899 advance.
              </p>
              
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
              >
                Pay ₹{onlineBookingAmount.toLocaleString("en-IN")} Booking Advance via UPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed Receipt */}
      {step === "confirmed" && latestBooking && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8 text-center space-y-6 animate-fadeIn">
          {/* Awaiting Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white text-3xl font-semibold">
            ⏳
          </div>

          <div>
            <h1 className="font-display text-3xl text-brand">Awaiting Verification!</h1>
            <p className="mt-1.5 text-sm text-gold font-semibold uppercase tracking-wider">
              Booking ID: {latestBooking.bookingId}
            </p>
          </div>

          <p className="mx-auto max-w-md text-sm text-muted leading-relaxed">
            Your appointment request has been scheduled, and your payment proof was submitted. Huma will verify your transaction shortly. You will see the update in your dashboard and receive a WhatsApp message once confirmed.
          </p>

          {/* Own Design Alert in Confirmation */}
          {(latestBooking.bookingType === "OWN_DESIGN" || latestBooking.isOwnDesign) && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 max-w-md mx-auto text-left space-y-1.5">
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🎨</span> Own Design Booking Confirmed
              </p>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Your <strong>₹899 booking advance</strong> has been received and will be deducted from your final bill.
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                <em>Optional: You can click the WhatsApp button below to share your design image with Huma for an advance price estimate.</em>
              </p>
            </div>
          )}

          {/* Booking Summary Card */}
          <div className="rounded-xl border border-hairline bg-cream/30 p-5 text-left text-xs text-ink space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center border-b border-hairline pb-2">
              <h3 className="font-display text-sm text-brand font-semibold">Appointment Details</h3>
              {(latestBooking.bookingType === "OWN_DESIGN" || latestBooking.isOwnDesign) && (
                <span className="rounded-full bg-gold/20 text-brand px-2 py-0.5 text-[10px] font-bold">
                  🎨 Own Design
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gold font-semibold uppercase">Customer</p>
                <p className="font-medium">{latestBooking.customerName}</p>
                <p className="text-muted">{latestBooking.customerMobile}</p>
              </div>
              <div>
                <p className="text-[10px] text-gold font-semibold uppercase">Schedule</p>
                <p className="font-medium">{latestBooking.bookingDate}</p>
                <p className="text-muted">{latestBooking.timeSlot}</p>
              </div>
            </div>

            <div className="border-t border-hairline pt-3">
              <p className="text-[10px] text-gold font-semibold uppercase">Location &amp; Mode</p>
              <p className="text-muted">
                {latestBooking.address}, {latestBooking.serviceArea} (
                <span className="font-medium text-brand">
                  {latestBooking.visitMode === "HOME_VISIT" ? "Home Visit" : "Visit the Artist"}
                </span>
                )
              </p>
            </div>

            <div className="border-t border-hairline pt-3 space-y-1">
              <div className="flex justify-between text-gold">
                <span>Online Advance Paid:</span>
                <span className="font-semibold">₹{latestBooking.onlineBookingAmount.toLocaleString("en-IN")} (Verification Pending)</span>
              </div>
              {latestBooking.bookingType === "OWN_DESIGN" || latestBooking.isOwnDesign ? (
                <div className="text-[10.5px] text-muted pt-1">
                  Remaining amount will be calculated post-quote as (Final Design Price + Travel Fee - ₹899 Advance).
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-muted">
                    <span>Total Booking Value:</span>
                    <span className="font-medium text-brand">₹{latestBooking.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {latestBooking.remainingAmount > 0 && (
                    <div className="flex justify-between text-brand border-t border-dashed border-hairline pt-1 mt-1 font-semibold">
                      <span>Remaining Balance Due:</span>
                      <span>₹{latestBooking.remainingAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-md bg-[#25D366] py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:scale-[1.02] shadow-md"
            >
              💬 (Optional) Message Huma on WhatsApp
            </a>
            
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              className="rounded-md border border-hairline bg-surface py-2.5 text-xs font-semibold text-brand hover:bg-cream/45 transition-colors"
            >
              Go to Customer Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Manual UPI Payment Proof Submission Modal */}
      {latestBooking && (
        <UpiPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSubmitSuccess={handleProofSubmitted}
          bookingId={latestBooking.bookingId}
          onlineBookingAmount={latestBooking.onlineBookingAmount}
        />
      )}
    </div>
  );
}
