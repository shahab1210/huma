import { useApp } from "../context/AppContext";

export default function MobileTabBar() {
  const { currentView, navigate, cart, user } = useApp();

  const tabs = [
    { label: "Home", view: "home", icon: "🏠" },
    { label: "Services", view: "mehendi", icon: "🌸" },
    { label: "Cart", view: "cart", icon: "🛒", badge: cart.length },
    { label: "Bookings", view: user ? "dashboard" : "auth", icon: "📅" },
    { label: "Account", view: user ? "dashboard" : "auth", icon: "👤" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hairline bg-cream/95 backdrop-blur py-2 shadow-lg lg:hidden">
      {tabs.map((t) => {
        const isActive = currentView === t.view || (t.view === "mehendi" && ["mehendi", "makeup", "parlour"].includes(currentView));
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => navigate(t.view)}
            className={`relative flex flex-col items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              isActive ? "text-gold" : "text-brand/70"
            }`}
          >
            {/* Tab Icon */}
            <span className="text-base" role="img" aria-label={t.label}>
              {t.icon}
            </span>

            {/* Badge Indicator */}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="absolute left-[54%] top-[1px] flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-white shadow">
                {t.badge}
              </span>
            )}

            {/* Dot indicator */}
            {isActive && <span className="h-1 w-1 rounded-full bg-gold" aria-hidden />}
            <span className="mt-0.5">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
