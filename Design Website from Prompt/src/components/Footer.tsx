import { useApp } from "../context/AppContext";

export default function Footer() {
  const { navigate, serviceAreas } = useApp();
  const phone = "8960600371";
  const email = "humamehendi1210@gmail.com";

  return (
    <footer className="border-t border-hairline bg-cream py-12 text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-4 lg:px-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <p className="font-display text-xl text-brand">
            <span className="text-gold">❦ </span>Huma Mehendi &amp; Beauty
          </p>
          <p className="font-italic text-lg italic text-muted leading-snug">
            Beautiful Art. Beautiful You. Beautiful Moments.
          </p>
          <p className="text-xs text-muted">
            Premium bridal makeup and mehendi artistry services backed by 10+ years of local experience.
          </p>
        </div>

        {/* Quick Links Column */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Explore</p>
          <ul className="space-y-1.5 text-xs text-muted font-medium">
            <li>
              <button type="button" onClick={() => navigate("mehendi")} className="hover:text-gold">
                Mehendi Catalog
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("makeup")} className="hover:text-gold">
                Makeup Packages
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("parlour")} className="hover:text-gold">
                Parlour Services
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("faq")} className="hover:text-gold">
                FAQ &amp; Booking Guide
              </button>
            </li>
          </ul>
        </div>

        {/* Coverage Column */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Service Areas</p>
          <p className="text-xs leading-relaxed text-muted font-medium">
            {serviceAreas.join(" · ")} and nearby towns around Raebareli. No travel fees.
          </p>
        </div>

        {/* Hours & Contact */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Business Hours</p>
          <p className="text-xs text-muted leading-relaxed font-medium">
            Open 7 days a week
            <br />
            10:00 AM – 11:00 PM
          </p>
          <div className="pt-2 text-xs text-muted space-y-1">
            <p>📞 Phone: {phone}</p>
            <p>✉ Email: {email}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-hairline pt-6 px-5 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted lg:px-8">
        <p>© {new Date().getFullYear()} Huma Mehendi &amp; Beauty Artist. All rights reserved.</p>

      </div>
    </footer>
  );
}
