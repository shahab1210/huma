import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function Header() {
  const { currentView, navigate, cart, user, adminLoggedIn } = useApp();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Home", view: "home" },
    { label: "Mehendi", view: "mehendi" },
    { label: "Makeup", view: "makeup" },
    { label: "Parlour", view: "parlour" },
    { label: "About", view: "about" },
    { label: "Contact", view: "contact" },
  ];

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300 " +
        (scrolled
          ? "border-b border-hairline bg-cream/95 backdrop-blur"
          : "bg-cream/60 backdrop-blur-md")
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("home")}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-lg text-gold" aria-hidden>
            ❦
          </span>
          <span className="font-display text-lg leading-none text-brand">
            Huma
            <span className="ml-1 hidden text-sm text-muted sm:inline">Mehendi &amp; Beauty</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => navigate(item.view)}
              className={`text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-gold ${
                currentView === item.view ? "text-gold" : "text-brand/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action icons / CTA */}
        <div className="flex items-center gap-4">
          {/* Cart Icon Link */}
          <button
            type="button"
            onClick={() => navigate("cart")}
            className="relative p-1.5 text-brand/80 hover:text-gold transition-colors"
            aria-label="View shopping cart"
          >
            <span className="text-lg">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white">
                {cart.length}
              </span>
            )}
          </button>

          {/* User Session Link */}
          {user ? (
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              className={`hidden text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-gold sm:inline ${
                currentView === "dashboard" ? "text-gold" : "text-brand/80"
              }`}
            >
              My Bookings
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("auth")}
              className={`hidden text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-gold sm:inline ${
                currentView === "auth" ? "text-gold" : "text-brand/80"
              }`}
            >
              Sign In
            </button>
          )}

          {/* Admin link if logged in */}
          {adminLoggedIn && (
            <button
              type="button"
              onClick={() => navigate("admin-dashboard")}
              className="hidden rounded border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gold hover:bg-gold/5 sm:inline"
            >
              Admin Workspace
            </button>
          )}

          {/* Book Now Button */}
          <button
            type="button"
            onClick={() => navigate("mehendi")}
            className="rounded-md bg-brand px-4 py-2 text-xs font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </header>
  );
}
