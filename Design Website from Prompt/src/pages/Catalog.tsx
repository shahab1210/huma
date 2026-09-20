import { useState } from "react";
import { useApp } from "../context/AppContext";
import { type Service, type ServiceType } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import ShowcaseCard from "../components/ShowcaseCard";
import SEOHead from "../components/SEOHead";
import {
  MAKEUP_SHOWCASE_ITEMS,
  PARLOUR_SHOWCASE_SECTIONS,
  type ShowcaseItem,
} from "../data/showcaseData";

const CATALOG_SEO: Record<ServiceType, { title: string; description: string; keywords: string; path: string }> = {
  MEHENDI: {
    title: "Mehendi Designs & Services | Huma Mehendi",
    description: "Explore our collection of bridal, Arabic, Rajasthani and party mehendi designs. Book professional mehendi artist services in Lucknow, Raebareli, Kanpur, Sandila & Fatehpur.",
    keywords: "mehendi designs, bridal mehendi, arabic mehendi, rajasthani mehendi, henna designs, mehendi artist near me, mehendi booking online",
    path: "/mehendi",
  },
  MAKEUP: {
    title: "Makeup Artist & Makeup Services | Huma Mehendi",
    description: "Professional HD & airbrush bridal makeup, party makeup and occasion styling services. Book your makeup appointment in Lucknow, Raebareli, Kanpur & nearby cities.",
    keywords: "bridal makeup, HD makeup, airbrush makeup, party makeup, makeup artist lucknow, makeup artist raebareli, wedding makeup",
    path: "/makeup",
  },
  PARLOUR: {
    title: "Beauty Parlour Services | Huma Mehendi",
    description: "Professional beauty parlour services including facials, waxing, skin care, hair care and pre-bridal grooming packages in Lucknow, Raebareli, Kanpur & nearby cities.",
    keywords: "beauty parlour, facial, waxing, skin care, hair care, pre-bridal grooming, parlour services lucknow, parlour services raebareli",
    path: "/parlour",
  },
};

interface CatalogProps {
  type: ServiceType;
}

export default function Catalog({ type }: CatalogProps) {
  const { services, addToCart, cart, startOwnDesignBooking } = useApp();
  
  // Mehendi Catalog State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [selectedMehendiService, setSelectedMehendiService] = useState<Service | null>(null);

  // Showcase Detail Modal State (for Makeup & Parlour)
  const [selectedShowcaseItem, setSelectedShowcaseItem] = useState<ShowcaseItem | null>(null);

  // Filter and sort logic for Mehendi
  const filteredMehendiServices = services
    .filter((s) => s.type === "MEHENDI")
    .filter((s) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
      const matchesFeatured = !featuredOnly || !!s.featured;
      const matchesPrice = s.startingPrice <= maxPrice;
      return matchesSearch && matchesCategory && matchesFeatured && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.startingPrice - b.startingPrice;
      if (sortBy === "price-desc") return b.startingPrice - a.startingPrice;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

  const allMehendiCategories = [
    "All",
    ...Array.from(new Set(services.filter((s) => s.type === "MEHENDI").map((s) => s.category))),
  ];

  const isInCart = (id: string) => cart.some((item) => item.id === id);

  return (
    <div className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <SEOHead
        title={CATALOG_SEO[type].title}
        description={CATALOG_SEO[type].description}
        keywords={CATALOG_SEO[type].keywords}
        canonicalUrl={`https://humamehendi.in${CATALOG_SEO[type].path}`}
      />

      {/* Page Header */}
      <div className="mb-10 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          {type === "MEHENDI"
            ? "Artistic Henna"
            : type === "MAKEUP"
            ? "Flawless Makeover Showcase"
            : "Salon & Skin Care Showcase"}
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand sm:text-5xl">
          {type === "MEHENDI"
            ? "Mehendi Designs"
            : type === "MAKEUP"
            ? "Makeup Styles & Looks"
            : "Beauty Parlour Showcase"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted leading-relaxed">
          {type === "MEHENDI"
            ? "Browse our exquisite catalog of custom bridal and occasion henna designs."
            : type === "MAKEUP"
            ? "Explore representative styles of our bridal, reception, and party makeup. Contact the artist directly on WhatsApp for customized looks, availability, and current pricing."
            : "Explore available skin care, hair styling, and parlour grooming services. Contact the artist directly on WhatsApp for personalized consultations, appointments, and current pricing."}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. MEHENDI VIEW (Interactive Bookable Catalog)                            */}
      {/* ========================================================================= */}
      {type === "MEHENDI" && (
        <>
          {/* Own Design CTA Banner */}
          <div className="mb-8 rounded-2xl border border-gold/40 bg-gradient-to-r from-cream/90 via-gold-soft/20 to-cream/90 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-2xl">
                🎨
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-brand sm:text-lg">
                  Have your own custom mehendi design?
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Pay a ₹899 booking advance to confirm your slot (adjusted in your final bill). Optional: share your design on WhatsApp for an advance quote.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startOwnDesignBooking()}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-brand px-5 py-2.5 text-xs sm:text-sm font-semibold text-cream hover:bg-brand-700 transition shadow-sm active:scale-95"
            >
              Book with Your Own Design →
            </button>
          </div>

          {/* Catalog Search & Filters */}
          <div className="mb-10 rounded-2xl border border-hairline bg-surface p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <label htmlFor="search" className="block text-[11px] font-medium uppercase tracking-wider text-gold">
                  Search Designs
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by design name, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label htmlFor="sort" className="block text-[11px] font-medium uppercase tracking-wider text-gold">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                >
                  <option value="featured">Signature &amp; Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <div className="flex justify-between">
                  <label htmlFor="price-range" className="block text-[11px] font-medium uppercase tracking-wider text-gold">
                    Max Price
                  </label>
                  <span className="text-xs font-semibold text-brand">₹{maxPrice.toLocaleString("en-IN")}</span>
                </div>
                <input
                  id="price-range"
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="mt-3.5 w-full accent-gold cursor-pointer"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-center md:pb-2">
                <label className="flex items-center gap-2 text-sm text-brand cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-hairline accent-brand"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">Featured Only</span>
                </label>
              </div>
            </div>

            {/* Category Chips */}
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {allMehendiCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                      selectedCategory === cat
                        ? "bg-brand text-cream"
                        : "border border-hairline bg-surface text-muted hover:border-gold hover:text-gold"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mehendi Grid */}
          {filteredMehendiServices.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-surface p-12 text-center">
              <p className="text-lg text-muted font-display">No designs found matching filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setMaxPrice(15000);
                  setFeaturedOnly(false);
                }}
                className="mt-4 inline-block border-b border-gold pb-0.5 text-sm font-medium text-brand hover:text-gold"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMehendiServices.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedMehendiService(s)}
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <ServiceCard service={s} />
                </div>
              ))}
            </div>
          )}

          {/* Mehendi Product Detail Modal */}
          {selectedMehendiService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl transition-all duration-300 md:grid md:grid-cols-2">
                <div className="relative h-64 bg-gold-soft/20 md:h-full">
                  <img
                    src={selectedMehendiService.image}
                    alt={selectedMehendiService.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">
                    {selectedMehendiService.category}
                  </div>
                </div>

                <div className="flex flex-col p-6 md:p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                        {selectedMehendiService.type}
                      </p>
                      <h3 className="font-display text-2xl text-brand mt-1">{selectedMehendiService.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMehendiService(null)}
                      className="text-muted hover:text-brand text-lg"
                      aria-label="Close detail modal"
                    >
                      ✕
                    </button>
                  </div>

                  <span className="my-4 h-px w-10 bg-gold" aria-hidden />

                  <div className="flex-1 space-y-4">
                    <p className="text-sm leading-relaxed text-muted">{selectedMehendiService.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-xs">
                      <div>
                        <span className="font-semibold text-brand uppercase tracking-wider">Duration</span>
                        <p className="mt-1 text-muted">{selectedMehendiService.duration}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-brand uppercase tracking-wider">Starting Price</span>
                        <p className="mt-1 text-gold font-semibold text-sm">
                          ₹{selectedMehendiService.startingPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-cream/40 p-3 text-[11px] text-muted space-y-1">
                      <p>✓ Minimum booking advance: <span className="font-semibold text-brand">₹899</span></p>
                      <p>✓ Pay balance amount directly to artist post service.</p>
                      <p>✓ Doorstep home visits and local appointments available.</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(selectedMehendiService);
                        setSelectedMehendiService(null);
                      }}
                      disabled={selectedMehendiService.availability !== "AVAILABLE" || isInCart(selectedMehendiService.id)}
                      className={`flex-1 rounded-md py-3 text-sm font-semibold tracking-wide transition-colors ${
                        selectedMehendiService.availability !== "AVAILABLE"
                          ? "bg-hairline text-muted cursor-not-allowed"
                          : isInCart(selectedMehendiService.id)
                          ? "bg-available text-cream cursor-default"
                          : "bg-brand text-cream hover:bg-brand-700"
                      }`}
                    >
                      {selectedMehendiService.availability !== "AVAILABLE"
                        ? "Fully Booked"
                        : isInCart(selectedMehendiService.id)
                        ? "✓ Added in Cart"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. MAKEUP VIEW (Visual Service Showcase)                                   */}
      {/* ========================================================================= */}
      {type === "MAKEUP" && (
        <div className="space-y-10">
          {/* Top Showcase Information Banner */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-cream/90 via-gold-soft/20 to-cream/90 p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                <span>✨</span> Service Showcase &amp; Styles
              </div>
              <h2 className="font-display text-xl text-brand font-bold sm:text-2xl">
                Customized Makeover Looks for Every Occasion
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
                The photographs below are representative examples of our bridal, reception, and party makeup styles. Every look is customized to your outfit, skin tone, and personal preferences. Contact the artist directly on WhatsApp for options, slot availability, and current pricing.
              </p>
            </div>
            <a
              href={`https://wa.me/918960600371?text=${encodeURIComponent(
                "Hi Huma Mehendi, I am interested in Makeup Services. Please share the available options, current price and booking details."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-emerald-700 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-800 transition active:scale-95 flex items-center gap-2"
            >
              <span>💬</span> Inquire on WhatsApp
            </a>
          </div>

          {/* Makeup Showcase Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MAKEUP_SHOWCASE_ITEMS.map((item) => (
              <ShowcaseCard
                key={item.id}
                item={item}
                onOpenDetail={(it) => setSelectedShowcaseItem(it)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PARLOUR VIEW (Visual Service Showcase in 3 Sections)                    */}
      {/* ========================================================================= */}
      {type === "PARLOUR" && (
        <div className="space-y-12">
          {/* Top Showcase Information Banner */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-cream/90 via-gold-soft/20 to-cream/90 p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                <span>🌿</span> Salon &amp; Skin Care Showcase
              </div>
              <h2 className="font-display text-xl text-brand font-bold sm:text-2xl">
                Professional Beauty &amp; Grooming Treatments
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
                Explore our representative beauty treatments across skin care, hair styling, and parlour grooming. Contact the artist directly on WhatsApp for appointment availability, customized packages, and current pricing.
              </p>
            </div>
            <a
              href={`https://wa.me/918960600371?text=${encodeURIComponent(
                "Hi Huma Mehendi, I am interested in Beauty Parlour Services. Please share the available options, current price and booking details."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-emerald-700 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-800 transition active:scale-95 flex items-center gap-2"
            >
              <span>💬</span> Inquire on WhatsApp
            </a>
          </div>

          {/* Grouped Sections */}
          {PARLOUR_SHOWCASE_SECTIONS.filter((section) => section.items && section.items.length > 0).map((section, idx) => (
            <div key={idx} className="space-y-6">
              <div className="border-b border-hairline pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-brand flex items-center gap-3">
                  <span className="text-gold">❦</span> {section.title}
                </h2>
                <p className="text-xs text-muted">{section.description}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <ShowcaseCard
                    key={item.id}
                    item={item}
                    onOpenDetail={(it) => setSelectedShowcaseItem(it)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOWCASE DETAIL MODAL (Makeup & Parlour)                                  */}
      {/* ========================================================================= */}
      {selectedShowcaseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl transition-all duration-300 md:grid md:grid-cols-2">
            <div className="relative h-64 bg-gold-soft/20 md:h-full">
              <img
                src={selectedShowcaseItem.image}
                alt={selectedShowcaseItem.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">
                {selectedShowcaseItem.category}
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                🔥 Special Offer
              </div>
            </div>

            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Visual Showcase
                  </p>
                  <h3 className="font-display text-2xl text-brand mt-1">{selectedShowcaseItem.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShowcaseItem(null)}
                  className="text-muted hover:text-brand text-lg"
                  aria-label="Close detail modal"
                >
                  ✕
                </button>
              </div>

              <span className="my-4 h-px w-10 bg-gold" aria-hidden />

              <div className="flex-1 space-y-4">
                <p className="text-sm leading-relaxed text-muted">{selectedShowcaseItem.description}</p>
                
                <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-brand space-y-1.5">
                  <p className="font-semibold text-amber-800">✨ Style Consultation &amp; Booking</p>
                  <p className="text-muted">✓ Representative style example — exact look customized for your occasion.</p>
                  <p className="text-muted">✓ Contact the artist for available options, slot availability &amp; pricing.</p>
                  <p className="text-muted">✓ Doorstep home visits and parlour appointments available.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-3">
                <a
                  href={`https://wa.me/918960600371?text=${encodeURIComponent(
                    `Hi Huma Mehendi, I am interested in ${selectedShowcaseItem.title}. Please share the available options, current price and booking details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-md bg-emerald-700 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-800 transition-colors"
                >
                  <span>💬</span> Contact Artist on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
