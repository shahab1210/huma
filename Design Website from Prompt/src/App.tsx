import { AppProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileTabBar from "./components/MobileTabBar";
import WhatsAppFab from "./components/WhatsAppFab";
import AdminLayout from "./components/AdminLayout";

// Page Views
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import BookingFlow from "./pages/BookingFlow";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import LocationPage from "./pages/LocationPage";
import ServiceGroupPage from "./pages/ServiceGroupPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const VALID_STATIC_VIEWS = new Set([
  "home",
  "mehendi",
  "makeup",
  "parlour",
  "cart",
  "booking",
  "auth",
  "dashboard",
  "about",
  "faq",
  "contact",
]);

/** Client-side fallback so location routes resolve even when the API is unavailable */
const KNOWN_LOCATION_SLUGS = new Set([
  "lucknow",
  "kanpur",
  "raebareli",
  "bachhrawan",
  "lalganj",
  "fatehpur",
  "sandila",
  "lalganj-raebareli",
]);

/** Client-side fallback so service group routes resolve even when the API is unavailable */
const KNOWN_SERVICE_GROUP_SLUGS = new Set([
  "bridal-mehendi",
  "arabic-mehendi",
  "traditional-mehendi",
  "bridal-makeup",
  "party-makeup",
  "skin-care",
  "hair-care",
]);

function ToastContainer() {
  const { toasts, removeToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-5 right-5 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-xs font-semibold text-white shadow-lg transition-transform duration-300 ${
            t.type === "success"
              ? "bg-[#4c7a5a]"
              : t.type === "error"
              ? "bg-[#b5654a]"
              : t.type === "warning"
              ? "bg-amber-600"
              : "bg-[#2f4b3c]"
          }`}
        >
          <span>{t.text}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="font-bold opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/** Redirects legacy admin URLs to the new /admin/ namespace */
function LegacyRedirector() {
  const { currentView, navigate } = useApp();

  useEffect(() => {
    if (currentView === "admin-dashboard" || currentView === "huma-secret-gate") {
      navigate("admin/login");
    }
  }, [currentView]);

  return null;
}

function AdminContent() {
  const { currentView } = useApp();

  // Extract the admin sub-path: "admin/login" -> "login", "admin/dashboard" -> "dashboard"
  const adminPath = currentView.startsWith("admin/")
    ? currentView.slice(6)
    : currentView === "admin"
    ? "login"
    : "login";

  // AdminDashboard handles its own login/dashboard state internally
  return <AdminDashboard adminPath={adminPath} />;
}

function CustomerContent() {
  const { currentView, locations, serviceGroups } = useApp();

  const renderView = () => {
    // Check if currentView is a dynamic location slug (API data OR client-side fallback)
    const isLocation = locations.some((loc) => loc.slug === currentView) || KNOWN_LOCATION_SLUGS.has(currentView);
    if (isLocation) {
      return <LocationPage slug={currentView} />;
    }

    // Check if currentView is a dynamic service group slug (API data OR client-side fallback)
    const isServiceGroup = serviceGroups.some((sg) => sg.slug === currentView) || KNOWN_SERVICE_GROUP_SLUGS.has(currentView);
    if (isServiceGroup) {
      return <ServiceGroupPage slug={currentView} />;
    }

    switch (currentView) {
      case "home":
        return <Home />;
      case "mehendi":
        return <Catalog type="MEHENDI" />;
      case "makeup":
        return <Catalog type="MAKEUP" />;
      case "parlour":
        return <Catalog type="PARLOUR" />;
      case "cart":
        return <Cart />;
      case "booking":
        return <BookingFlow />;
      case "auth":
        return <Auth />;
      case "dashboard":
        return <Dashboard />;
      case "about":
        return <About />;
      case "faq":
        return <Faq />;
      case "contact":
        return <Contact />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main className="pb-16 lg:pb-0">
        {renderView()}
      </main>
      <Footer />
      <WhatsAppFab />
      <MobileTabBar />
    </div>
  );
}

function AppContent() {
  const { currentView } = useApp();

  const isAdminRoute =
    currentView.startsWith("admin") ||
    currentView === "admin-dashboard" ||
    currentView === "huma-secret-gate";

  return (
    <>
      <LegacyRedirector />
      {isAdminRoute && currentView !== "admin-dashboard" && currentView !== "huma-secret-gate" ? (
        <AdminLayout>
          <AdminContent />
        </AdminLayout>
      ) : (
        !isAdminRoute && <CustomerContent />
      )}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
