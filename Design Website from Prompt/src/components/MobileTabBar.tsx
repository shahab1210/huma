import { useApp } from "../context/AppContext";
import { HomeIcon, FlowerIcon, CartIcon, CalendarIcon, UserIcon } from "./icons";

export default function MobileTabBar() {
  const { currentView, navigate, cart, user } = useApp();

  const tabs = [
    { label: "Home", view: "home", icon: HomeIcon },
    { label: "Services", view: "mehendi", icon: FlowerIcon },
    { label: "Cart", view: "cart", icon: CartIcon, badge: cart.length },
    { label: "Bookings", view: user ? "dashboard" : "auth", icon: CalendarIcon },
    { label: "Account", view: user ? "dashboard" : "auth", icon: UserIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hairline bg-cream/95 backdrop-blur py-2 shadow-lg lg:hidden">
      {tabs.map((t) => {
        const isActive = currentView === t.view || (t.view === "mehendi" && ["mehendi", "makeup", "parlour"].includes(currentView));
        const IconComponent = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => navigate(t.view)}
            className={`relative flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              isActive ? "text-gold" : "text-brand/70"
            }`}
          >
            {/* Tab Icon */}
            <span className="relative">
              <IconComponent size={20} className={isActive ? "text-gold" : "text-brand/70"} />
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-white shadow">
                  {t.badge}
                </span>
              )}
            </span>

            {/* Dot indicator */}
            {isActive && <span className="h-1 w-1 rounded-full bg-gold" aria-hidden />}
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
