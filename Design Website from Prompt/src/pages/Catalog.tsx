import { useState } from "react";
import { useApp } from "../context/AppContext";
import { type Service, type ServiceType } from "../services/api";
import ServiceCard from "../components/ServiceCard";

interface CatalogProps {
  type: ServiceType;
}

export default function Catalog({ type }: CatalogProps) {
  const { services, addToCart, cart } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  // Detail Modal State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Filter and sort logic
  const filteredServices = services
    .filter((s) => s.type === type)
    .filter((s) => {
      // Search query
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query);

      // Category filter
      const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;

      // Featured filter
      const matchesFeatured = !featuredOnly || !!s.featured;

      // Price filter
      const matchesPrice = s.startingPrice <= maxPrice;

      return matchesSearch && matchesCategory && matchesFeatured && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.startingPrice - b.startingPrice;
      if (sortBy === "price-desc") return b.startingPrice - a.startingPrice;
      // Default: featured first, then name
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

  // Get unique categories for filter chips (specifically for Mehendi/Parlour)
  const allCategories = [
    "All",
    ...Array.from(new Set(services.filter((s) => s.type === type).map((s) => s.category))),
  ];

  // Group Parlour services by category
  const parlourGroups = filteredServices.reduce((groups, service) => {
    const category = service.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, Service[]>);

  const handleOpenDetail = (service: Service) => {
    setSelectedService(service);
    setActiveImageIndex(0);
  };

  const handleCloseDetail = () => {
    setSelectedService(null);
  };

  const isInCart = (id: string) => cart.some((item) => item.id === id);

  return (
    <div className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          {type === "MEHENDI" ? "Artistic Henna" : type === "MAKEUP" ? "Flawless Makeover" : "Salon & Skin Care"}
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand sm:text-5xl">
          {type === "MEHENDI" ? "Mehendi Designs" : type === "MAKEUP" ? "Makeup Packages" : "Parlour Services"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          {type === "MEHENDI"
            ? "Browse our exquisite catalog of custom bridal and occasion henna designs."
            : type === "MAKEUP"
            ? "Premium HD and Airbrush makeup tailored for your special days."
            : "Pamper yourself with our professional skin and hair grooming treatments."}
        </p>
      </div>

      {/* Catalog Search & Filters (Mainly for Mehendi, optional for others) */}
      {type === "MEHENDI" && (
        <div className="mb-10 rounded-2xl border border-hairline bg-surface p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            {/* Search */}
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

            {/* Sort */}
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

            {/* Max Price Slider */}
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
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="mt-3.5 w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Featured toggle */}
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
              {allCategories.map((cat) => (
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
      )}

      {/* Catalog Render Lists */}
      {type === "PARLOUR" ? (
        // Grouped Parlour Layout
        <div className="space-y-12">
          {Object.keys(parlourGroups).length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-surface p-12 text-center">
              <p className="text-lg text-muted font-display">No services found matching filters.</p>
            </div>
          ) : (
            Object.entries(parlourGroups).map(([category, items]) => (
              <div key={category} className="space-y-6">
                <h2 className="font-display text-2xl text-brand border-b border-hairline pb-2 flex items-center gap-3">
                  <span className="text-gold">❦</span> {category}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className="cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      <ServiceCard service={s} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Standard Grid for Mehendi and Makeup
        <div>
          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-surface p-12 text-center">
              <p className="text-lg text-muted font-display">No designs found matching filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setMaxPrice(10000);
                  setFeaturedOnly(false);
                }}
                className="mt-4 inline-block border-b border-gold pb-0.5 text-sm font-medium text-brand hover:text-gold"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleOpenDetail(s)}
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <ServiceCard service={s} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Modal Overlay */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl transition-all duration-300 md:grid md:grid-cols-2">
            
            {/* Left: Image Swiper Simulation */}
            <div className="relative h-64 bg-gold-soft/20 md:h-full">
              <img
                src={selectedService.image}
                alt={selectedService.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">
                {selectedService.category}
              </div>
            </div>

            {/* Right: Info Area */}
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {selectedService.type}
                  </p>
                  <h3 className="font-display text-2xl text-brand mt-1">{selectedService.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="text-muted hover:text-brand text-lg"
                  aria-label="Close detail modal"
                >
                  ✕
                </button>
              </div>

              <span className="my-4 h-px w-10 bg-gold" aria-hidden />

              <div className="flex-1 space-y-4">
                <p className="text-sm leading-relaxed text-muted">{selectedService.description}</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-xs">
                  <div>
                    <span className="font-semibold text-brand uppercase tracking-wider">Duration</span>
                    <p className="mt-1 text-muted">{selectedService.duration}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-brand uppercase tracking-wider">Starting Price</span>
                    <p className="mt-1 text-gold font-semibold text-sm">
                      ₹{selectedService.startingPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-cream/40 p-3 text-[11px] text-muted space-y-1">
                  <p>✓ Minimum online booking confirmation required: <span className="font-semibold text-brand">₹1,500</span></p>
                  <p>✓ Pay balance amount directly to artist post service.</p>
                  <p>✓ No travel charge applied in service regions.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(selectedService);
                    handleCloseDetail();
                  }}
                  disabled={selectedService.availability !== "AVAILABLE" || isInCart(selectedService.id)}
                  className={`flex-1 rounded-md py-3 text-sm font-semibold tracking-wide transition-colors ${
                    selectedService.availability !== "AVAILABLE"
                      ? "bg-hairline text-muted cursor-not-allowed"
                      : isInCart(selectedService.id)
                      ? "bg-available text-cream cursor-default"
                      : "bg-brand text-cream hover:bg-brand-700"
                  }`}
                >
                  {selectedService.availability !== "AVAILABLE"
                    ? "Fully Booked"
                    : isInCart(selectedService.id)
                    ? "✓ Added in Cart"
                    : "Add to Cart"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
