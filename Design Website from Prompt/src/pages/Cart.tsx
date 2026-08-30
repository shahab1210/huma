import { useApp } from "../context/AppContext";

export default function Cart() {
  const { cart, removeFromCart, cartSubtotal, cartBookingAmount, cartRemainingAmount, navigate, user, showToast } = useApp();

  const handleCheckout = () => {
    if (!user) {
      showToast("Please login or register first to proceed with booking", "warning");
      navigate("auth");
    } else {
      navigate("booking");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <div className="text-5xl text-gold mb-4" aria-hidden>🛒</div>
        <h1 className="font-display text-3xl text-brand">Your Cart is Empty</h1>
        <p className="mt-3 text-sm text-muted">
          Add some bridal mehendi designs, makeup packages, or parlour services to begin your booking.
        </p>
        <button
          type="button"
          onClick={() => navigate("mehendi")}
          className="mt-8 rounded-md bg-brand px-6 py-2.5 text-sm font-medium tracking-wide text-cream transition-colors hover:bg-brand-700"
        >
          Explore Services
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
      {/* Title */}
      <div className="mb-10 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          Your Selection
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand">Shopping Cart</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Selected Services ({cart.length})</h2>
          
          {cart.map((s) => (
            <div
              key={s.id}
              className="flex gap-4 rounded-xl border border-hairline bg-surface p-4 items-center justify-between"
            >
              {/* Product Info */}
              <div className="flex gap-4 items-center">
                <img
                  src={s.image}
                  alt={s.name}
                  className="h-16 w-16 rounded-lg object-cover border border-hairline bg-gold-soft/10"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {s.type} • {s.category}
                  </p>
                  <h3 className="font-display text-md text-brand font-semibold mt-0.5">{s.name}</h3>
                  <p className="text-xs text-muted">{s.duration}</p>
                </div>
              </div>

              {/* Price & Delete */}
              <div className="text-right flex flex-col items-end gap-2">
                <p className="font-semibold text-brand text-sm">
                  ₹{s.startingPrice.toLocaleString("en-IN")}
                </p>
                <button
                  type="button"
                  onClick={() => removeFromCart(s.id)}
                  className="text-xs font-semibold text-muted hover:text-blocked transition-colors"
                  aria-label={`Remove ${s.name} from cart`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Quick Links */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("mehendi")}
              className="text-sm font-medium text-gold hover:underline"
            >
              + Add more services
            </button>
          </div>
        </div>

        {/* Pricing Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-hairline bg-surface p-6 space-y-6">
            <h3 className="font-display text-lg text-brand pb-2 border-b border-hairline">Booking Summary</h3>

            {/* Split Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal Value</span>
                <span className="font-medium text-brand">₹{cartSubtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-muted pt-2 border-t border-dashed border-hairline">
                <span>Online Booking Amount</span>
                <span className="font-semibold text-available text-md">₹{cartBookingAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-muted">
                <span>Remaining Amount</span>
                <span className="font-semibold text-brand">₹{cartRemainingAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Explanatory notes */}
            <div className="rounded-xl bg-cream/50 p-4 space-y-2.5 text-xs text-muted">
              <p className="font-semibold text-brand uppercase tracking-wider text-[9px]">Please Note:</p>
              <p>
                1. You pay only a booking advance of <span className="font-semibold text-brand">₹{cartBookingAmount.toLocaleString("en-IN")}</span> online via UPI now to temporarily hold the slot.
              </p>
              <p>
                2. The remaining <span className="font-semibold text-brand">₹{cartRemainingAmount.toLocaleString("en-IN")}</span> is paid directly to the artist upon service completion.
              </p>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
            >
              Proceed to Booking details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
