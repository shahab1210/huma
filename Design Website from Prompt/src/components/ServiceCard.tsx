import type { Service } from "../services/api";
import { useApp } from "../context/AppContext";

function AvailabilityPill({ status }: { status: Service["availability"] }) {
  if (status === "AVAILABLE") {
    return (
      <span className="rounded-full bg-[#4c7a5a]/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
        Available
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#b5654a]/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
      {status === "BOOKED" ? "Booked" : "Blocked"}
    </span>
  );
}

/**
 * Single reusable service/design card — used identically across Mehendi,
 * Makeup and Parlour. Browse-level cards show only the starting price, never
 * the ₹1,500 booking split (that appears at Cart/Checkout only).
 */
export default function ServiceCard({ service }: { service: Service }) {
  const { addToCart, cart } = useApp();
  const unavailable = service.availability !== "AVAILABLE";
  const isInCart = cart.some((item) => item.id === service.id);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop opening the details modal
    if (!isInCart && !unavailable) {
      addToCart(service);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-colors duration-300 hover:border-gold">
      <div className="relative aspect-4/5 overflow-hidden bg-gold-soft/40">
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute right-3 top-3">
          <AvailabilityPill status={service.availability} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {service.category}
        </p>
        <h3 className="mt-1 truncate font-display text-xl text-brand" title={service.name}>
          {service.name}
        </h3>

        <span className="my-4 h-px w-10 bg-gold" aria-hidden />

        <p className="text-sm text-muted">{service.duration}</p>
        <p className="mt-1 text-[15px] font-medium text-brand">
          Starting from{" "}
          <span className="text-gold">₹{service.startingPrice.toLocaleString("en-IN")}</span>
        </p>

        <button
          type="button"
          disabled={unavailable}
          onClick={handleCartClick}
          className={
            "mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors " +
            (unavailable
              ? "cursor-not-allowed bg-hairline text-muted"
              : isInCart
              ? "bg-[#4c7a5a] text-cream"
              : "bg-brand text-cream hover:bg-brand-700")
          }
        >
          {unavailable ? "Unavailable" : isInCart ? "✓ Added in Cart" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
