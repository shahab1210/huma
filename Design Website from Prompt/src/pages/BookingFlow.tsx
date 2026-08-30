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
  } = useApp();

  const [step, setStep] = useState<"details" | "schedule" | "checkout" | "confirmed">("details");
  
  // Form States
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [address, setAddress] = useState("");
  
  // Schedule States
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [latestBooking, setLatestBooking] = useState<any>(null);

  // Autofill if user logged in
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName);
      setCustomerMobile(user.mobileNumber);
    }
  }, [user]);

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

  if (cart.length === 0 && step !== "confirmed") {
    return (
      <div className="mx-auto max-w-md px-5 py-28 text-center">
        <h2 className="font-display text-2xl text-brand">No Services in Cart</h2>
        <p className="mt-3 text-sm text-muted">Please add services before checking out.</p>
        <button
          type="button"
          onClick={() => navigate("mehendi")}
          className="mt-6 rounded-md bg-brand px-5 py-2 text-sm font-medium text-cream"
        >
          Browse Designs
        </button>
      </div>
    );
  }

  // Subtotal calculations
  const subtotal = cart.reduce((acc, s) => acc + s.startingPrice, 0);
  const onlineBookingAmount = subtotal > 0 ? Math.min(1500, subtotal) : 0;
  const remainingAmount = subtotal - onlineBookingAmount;

  const handleNextDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile || !selectedArea || !address) {
      showToast("Please fill in all details", "warning");
      return;
    }
    if (customerMobile.length < 10) {
      showToast("Please enter a valid mobile number", "warning");
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
    const items = cart.map((s) => ({
      itemId: s.id,
      itemType: s.type,
      nameSnapshot: s.name,
      priceSnapshot: s.startingPrice,
      durationSnapshot: s.duration,
      categorySnapshot: s.category,
    }));

    // Create the pending booking record
    const booking = createBooking({
      customerName,
      customerMobile,
      items,
      serviceArea: selectedArea,
      address,
      bookingDate: selectedDate,
      timeSlot: selectedSlot,
      subtotal,
      totalAmount: subtotal,
      onlineBookingAmount,
    });

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
      remainingAmount: subtotal,
    }));
    
    setStep("confirmed");
    showToast("Payment proof submitted! Huma will verify your booking shortly.");
  };

  // WhatsApp Message Prefill generator
  const getWhatsAppLink = () => {
    if (!latestBooking) return "";
    const itemsStr = latestBooking.items.map((i: any) => `• ${i.nameSnapshot} (₹${i.priceSnapshot})`).join("%0A");
    
    const message = `Hello Huma,%0A%0AI have just submitted a booking and payment proof online!%0A%0A*Booking ID:* ${latestBooking.bookingId}%0A*Customer Name:* ${latestBooking.customerName}%0A*Contact:* ${latestBooking.customerMobile}%0A*Date:* ${latestBooking.bookingDate}%0A*Time Slot:* ${latestBooking.timeSlot}%0A*Area:* ${latestBooking.serviceArea}%0A*Address:* ${latestBooking.address}%0A%0A*Services:*%0A${itemsStr}%0A%0A*Total Amount:* ₹${latestBooking.totalAmount}%0A*Online Advance Payment (UPI):* ₹${latestBooking.onlineBookingAmount}%0A*Remaining Balance:* ₹${latestBooking.totalAmount - latestBooking.onlineBookingAmount}%0A%0APlease verify my transaction and confirm. Thank you!`;
    
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
                <label htmlFor="mobile" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Mobile Number</label>
                <input
                  id="mobile"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
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
                {serviceAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">Exact Address (House, Landmark, Street)</label>
              <textarea
                id="address"
                required
                rows={3}
                placeholder="Enter complete address where Huma should provide the service"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 mt-2"
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
                <p className="font-semibold text-gold uppercase tracking-wider text-[10px]">Schedule</p>
                <p className="mt-1 font-medium text-brand">{selectedDate}</p>
                <p className="text-muted">{selectedSlot}</p>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Items</p>
              <div className="divide-y divide-hairline border-y border-hairline">
                {cart.map((s) => (
                  <div key={s.id} className="flex justify-between py-3">
                    <div>
                      <p className="font-semibold text-brand">{s.name}</p>
                      <p className="text-xs text-muted">{s.duration} • {s.category}</p>
                    </div>
                    <span className="font-semibold">₹{s.startingPrice.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Split Pricing */}
            <div className="space-y-2 border-b border-hairline pb-4">
              <div className="flex justify-between">
                <span>Total Booking Value</span>
                <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-available">
                <span className="font-semibold">Online Booking Amount (To Pay Now)</span>
                <span className="font-bold text-base">₹{onlineBookingAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Remaining Amount (Pay directly to Huma post-service)</span>
                <span className="font-semibold">₹{remainingAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-3 pt-2">
              <p className="text-[11px] text-muted text-center leading-relaxed">
                By clicking the button below, you will open the manual UPI payment gateway to scan the QR code and submit your transaction proof.
              </p>
              
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
              >
                Pay ₹{onlineBookingAmount.toLocaleString("en-IN")} via UPI &amp; Submit Proof
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

          {/* Booking Summary Card */}
          <div className="rounded-xl border border-hairline bg-cream/30 p-5 text-left text-xs text-ink space-y-4 max-w-md mx-auto">
            <h3 className="font-display text-sm text-brand border-b border-hairline pb-2 font-semibold">Appointment Details</h3>
            
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
              <p className="text-[10px] text-gold font-semibold uppercase">Location</p>
              <p className="text-muted">{latestBooking.address}, {latestBooking.serviceArea}</p>
            </div>

            <div className="border-t border-hairline pt-3 space-y-1">
              <div className="flex justify-between text-muted">
                <span>Total Amount:</span>
                <span className="font-medium text-brand">₹{latestBooking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gold">
                <span>Online Advance Amount:</span>
                <span className="font-semibold">₹{latestBooking.onlineBookingAmount.toLocaleString("en-IN")} (Verification Pending)</span>
              </div>
              <div className="flex justify-between text-brand border-t border-dashed border-hairline pt-1 mt-1 font-semibold">
                <span>Remaining Balance Due:</span>
                <span>₹{latestBooking.remainingAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
            
            <div className="text-[10px] text-muted text-center pt-1">
              Remaining balance is paid directly to the artist post-service.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-md bg-[#25D366] py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:scale-[1.02]"
            >
              Message Huma on WhatsApp
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
