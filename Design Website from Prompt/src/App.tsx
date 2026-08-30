import { AppProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileTabBar from "./components/MobileTabBar";
import WhatsAppFab from "./components/WhatsAppFab";

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

function AppContent() {
  const { currentView } = useApp();

  const renderView = () => {
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
      case "huma-secret-gate":
      case "admin-dashboard":
        return <AdminDashboard />;
      case "about":
        return <About />;
      case "faq":
        return <Faq />;
      case "contact":
        return <Contact />;
      default:
        return <Home />;
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
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
