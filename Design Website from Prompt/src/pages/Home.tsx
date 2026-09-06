import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import ServiceCard from "../components/ServiceCard";
import SEOHead from "../components/SEOHead";

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1774019410720-3409a533d30b?w=1400&h=1600&fit=crop&auto=format&q=80",
    alt: "Bridal mehendi hands with intricate henna designs",
    displayTitle: "Bridal Mehendi",
    tag: "Mehendi Artistry",
    category: "mehendi",
    icon: "🌿",
    subtitle: "Bridal & Arabic Henna Artistry"
  },
  {
    image: "https://images.unsplash.com/photo-1762162089047-97e09435984d?w=1400&h=1600&fit=crop&auto=format&q=80",
    alt: "Traditional Rajasthani & Arabic mehendi patterns",
    displayTitle: "Arabic & Rajasthani",
    tag: "Rajasthani & Party Henna",
    category: "mehendi",
    icon: "✨",
    subtitle: "Intricate Traditional Henna Crafts"
  },
  {
    image: "https://images.unsplash.com/photo-1610173826014-d131b02d69ca?w=1400&h=1600&fit=crop&auto=format&q=80",
    alt: "Flawless HD bridal makeup transformation",
    displayTitle: "Bridal Makeup",
    tag: "Bridal Makeup",
    category: "makeup",
    icon: "💄",
    subtitle: "Flawless HD & Airbrush Glow"
  },
  {
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&h=1600&fit=crop&auto=format&q=80",
    alt: "Glamour party and occasion beauty styling",
    displayTitle: "Occasion Glamour",
    tag: "Occasion Glamour",
    category: "makeup",
    icon: "👑",
    subtitle: "Reception & Party Hair & Beauty"
  },
  {
    image: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?w=1400&h=1600&fit=crop&auto=format&q=80",
    alt: "Luxury Parlour",
    displayTitle: "Luxury Parlour",
    tag: "Parlour & Grooming",
    category: "parlour",
    icon: "🌸",
    subtitle: "Facials, Waxing & Pre-Bridal Care"
  }
];

const LOCATION_IMAGES: Record<string, string> = {
  lucknow: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdlJShj5I44-Q7xF5QTIrrfrgzjy7-H_u_V1UuR_r-7g&s=10",
  kanpur: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZjbBwGgZIJIoYoHCFUvai_KyVIVESfnWgj8BjLHjQCg&s=10",
  sandila: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-hTqHRSYXcRUqyvitntddCuli06EQZDB2Tb9knciX_A&s=10",
  raebareli: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQ5NxPKEUvBSbAL2LtoUDnHZfLHdzHbZDSXgRlvAPfhQ&s=10",
  fatehpur: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6gexV05gn4QXyRn6C5roTh-H8uULDsozFPau5M85lVg&s=10",
  bachhrawan: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCTrKkDhBR56W3UOJtAeYfia1OLGLRIcOai2bmVsfDPQ&s",
  lalganj: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLidvA7u---RoSHISZcDkz86jjLgVzppOXTuzUtBK2eA&s",
  "lalganj-raebareli": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLidvA7u---RoSHISZcDkz86jjLgVzppOXTuzUtBK2eA&s"
};

const DEFAULT_LOCATIONS = [
  { _id: "loc-1", name: "Lucknow", slug: "lucknow", shortDescription: "Premium mehendi & beauty in Lucknow" },
  { _id: "loc-2", name: "Kanpur", slug: "kanpur", shortDescription: "Professional beauty in Kanpur" },
  { _id: "loc-3", name: "Raebareli", slug: "raebareli", shortDescription: "Expert mehendi in Raebareli" },
  { _id: "loc-4", name: "Bachhrawan", slug: "bachhrawan", shortDescription: "Mehendi & beauty in Bachhrawan" },
  { _id: "loc-5", name: "Lalganj", slug: "lalganj", shortDescription: "Beautiful mehendi in Lalganj" },
  { _id: "loc-6", name: "Fatehpur", slug: "fatehpur", shortDescription: "Mehendi & beauty in Fatehpur" },
  { _id: "loc-7", name: "Sandila", slug: "sandila", shortDescription: "Mehendi & beauty in Sandila" }
];

const CATEGORIES = [
  {
    key: "Mehendi",
    title: "Mehendi",
    desc: "Bridal, Arabic and Rajasthani designs applied with a decade of artistry.",
    image:
      "https://images.unsplash.com/photo-1774019410720-3409a533d30b?w=800&h=900&fit=crop&auto=format&q=80",
    view: "mehendi"
  },
  {
    key: "Makeup",
    title: "Makeup",
    desc: "HD bridal and occasion makeup that lasts from ceremony to reception.",
    image:
      "https://images.unsplash.com/photo-1610173826014-d131b02d69ca?w=800&h=900&fit=crop&auto=format&q=80",
    view: "makeup"
  },
  {
    key: "Parlour",
    title: "Parlour",
    desc: "Facials, waxing and full grooming packages for that bridal glow.",
    image:
      "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?w=800&h=900&fit=crop&auto=format&q=80",
    view: "parlour"
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
      <span className="h-px w-6 bg-gold" aria-hidden />
      {children}
      <span className="h-px w-6 bg-gold" aria-hidden />
    </p>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-gold animate-fadeIn" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const { services, navigate, reviews, locations } = useApp();
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [locationSearch, setLocationSearch] = useState("");

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Auto-play interval for hero image slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (distance < -40) {
      setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
  };

  // Filters featured services (Mehendi / Makeup / Parlour)
  const featuredServices = services.filter((s) => s.featured).slice(0, 3);
  const approvedReviews = reviews.filter((r) => r.status === "APPROVED");

  // Merge backend locations with DEFAULT_LOCATIONS so all 7 target locations (including Fatehpur & Sandila) are always displayed
  const locationMap = new Map<string, any>();
  DEFAULT_LOCATIONS.forEach((loc) => locationMap.set(loc.slug, loc));
  if (locations && locations.length > 0) {
    locations.forEach((loc) => {
      const existing = locationMap.get(loc.slug) || {};
      locationMap.set(loc.slug, { ...existing, ...loc });
    });
  }
  const activeLocationsList = Array.from(locationMap.values());

  const filteredLocations = activeLocationsList.filter((loc) => {
    if (!locationSearch.trim()) return true;
    const q = locationSearch.toLowerCase().trim();
    const matchName = loc.name.toLowerCase().includes(q);
    const matchDesc = loc.shortDescription?.toLowerCase().includes(q);
    const matchAreas = (loc.nearbyAreas || []).some((area: string) => area.toLowerCase().includes(q));
    return matchName || matchDesc || matchAreas;
  });

  const FAQS = [
    {
      q: "How much is the online booking fee?",
      a: "To confirm your slot, we collect a fixed ₹1,500 booking deposit online. If your total service value is ₹1,500 or less, you simply pay the exact total amount — never anything extra."
    },
    {
      q: "Is the remaining balance paid online?",
      a: "No. The remaining balance is paid directly to the service provider after the service is completed. It is never collected online."
    },
    {
      q: "Are there separate travel charges?",
      a: "There are no separate travel charges across our main coverage regions: Raebareli, Lucknow, Kanpur, Bachhrawan, and Lalganj."
    },
    {
      q: "What is your cancellation/refund policy?",
      a: "If we cancel your appointment, you get a 100% refund. If you cancel, a ₹500 cancellation fee applies. Cancellations within 5 days of the booking date are generally non-refundable."
    }
  ];

  return (
    <div className="space-y-4">
      <SEOHead
        title="Huma Mehendi – Professional Mehendi Artist in Lucknow, Raebareli & UP"
        description="Looking for the best mehendi artist in Lucknow, Raebareli, Kanpur, Sandila & Fatehpur? Huma Mehendi offers expert bridal mehendi, Arabic henna, makeup & parlour services."
        keywords="best mehendi artist in lucknow, mehendi artist lucknow, best mehendi lucknow, top mehendi artist lucknow, bridal mehendi lucknow, wedding mehendi lucknow, mehendi designer lucknow, best mehendi artist in raebareli, mehendi artist raebareli, bridal mehendi raebareli"
      />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-14 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-4 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-8 lg:py-20">
          
          {/* HERO IMAGE SLIDER - AT THE VERY TOP ON MOBILE (order-1 on mobile, order-2 on desktop) */}
          <div className="relative order-1 lg:order-2">
            <div
              className="group relative aspect-4/3 sm:aspect-4/5 overflow-hidden rounded-2xl border border-hairline bg-gold-soft/40 shadow-2xl cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="h-full w-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
                  />
                  {/* Subtle overall dark vignette overlay for legibility without a dark box */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
                </div>
              ))}

              {/* CLEAN CENTERED DISPLAY TEXT OVERLAY (No dark box container, direct on image) */}
              <div
                key={`hero-text-${currentSlideIndex}`}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-hero-text pointer-events-none"
              >
                <span className="text-gold-soft text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {HERO_SLIDES[currentSlideIndex].icon} {HERO_SLIDES[currentSlideIndex].tag}
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-wider uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] leading-tight">
                  {HERO_SLIDES[currentSlideIndex].displayTitle}
                </h2>
                <p className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-cream drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {HERO_SLIDES[currentSlideIndex].subtitle}
                </p>
              </div>

              {/* Top Right Floating Star Rating Badge */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10.5px] font-semibold text-gold border border-gold/30">
                <span>★ 4.9</span>
                <span className="text-white text-[9px] hidden sm:inline">(500+ Brides)</span>
              </div>

              {/* Minimal Dot Indicators at Bottom */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 border border-white/10">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlideIndex ? "w-6 bg-gold" : "w-1.5 bg-white/50"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop floating deposit badge */}
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-hairline bg-surface px-5 py-4 shadow-md sm:block z-30">
              <p className="font-display text-sm text-brand font-semibold">Book online from</p>
              <p className="font-display text-2xl text-gold font-bold">₹1,500</p>
              <p className="text-[11px] text-muted">Balance paid after service</p>
            </div>
          </div>

          {/* HEADING & TEXT DETAILS - BELOW HERO BANNER ON MOBILE (order-2 on mobile, order-1 on desktop) */}
          <div className="order-2 lg:order-1 flex flex-col justify-center text-center sm:text-left mt-2 sm:mt-0">
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-full bg-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold w-fit mx-auto sm:mx-0 mb-3">
              <span className="text-gold">❦</span> Lucknow · Kanpur · Raebareli &amp; nearby
            </div>
            
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-brand">
              Huma Mehendi – Professional Mehendi Artist
            </h1>
            
            <p className="mt-2.5 font-italic text-lg sm:text-3xl italic text-brand/90 font-medium">
              Beautiful Art. Beautiful You. Beautiful Moments.
            </p>
            
            <p className="mt-3 max-w-md mx-auto sm:mx-0 text-xs sm:text-[15px] leading-relaxed text-muted">
              Professional Mehendi, Bridal Makeup and Beauty Services for your special occasions —
              crafted with 10+ years of artistry.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => navigate("mehendi")}
                className="w-full sm:w-auto rounded-xl sm:rounded-md bg-brand px-7 py-3 text-sm font-semibold tracking-wide text-cream shadow-md transition-all hover:bg-brand-700 hover:shadow-lg active:scale-95"
              >
                Book Now (From ₹1,500)
              </button>
              <button
                type="button"
                onClick={() => navigate("mehendi")}
                className="border-b border-gold pb-0.5 text-xs sm:text-sm font-semibold tracking-wide text-brand transition-colors hover:text-gold"
              >
                Explore Services &amp; Prices →
              </button>
            </div>

            {/* Experience & Satisfaction Stats Ribbon */}
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-6 border-t border-hairline pt-5 text-center sm:text-left">
              <div>
                <p className="font-display text-2xl sm:text-3xl text-brand font-bold">10+</p>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted">Years experience</p>
              </div>
              <div className="border-x border-hairline sm:border-none px-1">
                <p className="font-display text-2xl sm:text-3xl text-brand font-bold">500+</p>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted">Happy brides</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl text-gold font-bold">4.9 ★</p>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted">Client Rating</p>
              </div>
            </div>
          </div>

        </div>

        {/* MOBILE QUICK CATEGORY EXPLORER STRIP */}
        <div className="mx-auto max-w-6xl px-5 pt-2 pb-6 sm:hidden border-b border-hairline">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold text-center mb-3">
            Quick Category Access
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => navigate("mehendi")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-hairline bg-surface shadow-sm hover:border-gold active:scale-95 transition"
            >
              <span className="text-2xl mb-1">🌿</span>
              <span className="text-xs font-bold text-brand">Mehendi</span>
              <span className="text-[9px] text-muted">Bridal &amp; Party</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("makeup")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-hairline bg-surface shadow-sm hover:border-gold active:scale-95 transition"
            >
              <span className="text-2xl mb-1">💄</span>
              <span className="text-xs font-bold text-brand">Makeup</span>
              <span className="text-[9px] text-muted">HD &amp; Airbrush</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("parlour")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-hairline bg-surface shadow-sm hover:border-gold active:scale-95 transition"
            >
              <span className="text-2xl mb-1">🌸</span>
              <span className="text-xs font-bold text-brand">Parlour</span>
              <span className="text-[9px] text-muted">Facials &amp; Care</span>
            </button>
          </div>
        </div>
      </section>

      {/* LOCATION SELECTOR */}
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="mb-6 text-center">
          <Eyebrow>Select Your Location</Eyebrow>
          <h2 className="mt-2 font-display text-2xl text-brand sm:text-3xl">Find Us in Your City</h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-muted">
            Select your city to view location-specific services, designs and packages.
          </p>
        </div>

        {/* Location Search Bar */}
        <div className="mx-auto mb-8 max-w-md">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-muted text-sm" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search city or area (e.g. Lucknow, Kanpur, Raebareli)..."
              className="w-full rounded-full border border-hairline bg-surface py-2.5 pl-10 pr-10 text-sm text-brand placeholder:text-muted/70 shadow-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition duration-200"
            />
            {locationSearch && (
              <button
                type="button"
                onClick={() => setLocationSearch("")}
                className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-xs text-brand hover:bg-brand hover:text-cream transition"
                aria-label="Clear location search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredLocations.length > 0 ? (
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {filteredLocations.map((loc) => {
              const slugKey = loc.slug.toLowerCase();
              const locImg = LOCATION_IMAGES[slugKey] || loc.heroImage || "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=200&h=200&fit=crop";

              return (
                <button
                  key={loc._id || loc.slug}
                  type="button"
                  onClick={() => navigate(loc.slug)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border border-hairline bg-surface p-4 text-center shadow-sm hover:shadow-md hover:border-gold transition duration-300"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 shadow-md group-hover:border-gold group-hover:scale-105 transition duration-300 bg-gold/10">
                    <img
                      src={locImg}
                      alt={loc.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {/* Red Location Pin Badge Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] shadow border border-white">
                      📍
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-bold text-brand group-hover:text-gold transition line-clamp-1">
                    {loc.name}
                  </h3>
                  {loc.shortDescription && (
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{loc.shortDescription}</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-hairline bg-surface/50 p-8 text-center">
            <p className="text-sm font-semibold text-brand">No locations found matching &quot;{locationSearch}&quot;</p>
            <p className="mt-1 text-xs text-muted">Try searching for Lucknow, Kanpur, Raebareli, Sandila, Fatehpur, Bachhrawan or Lalganj.</p>
            <button
              type="button"
              onClick={() => setLocationSearch("")}
              className="mt-4 rounded-md bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-cream transition"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* CATEGORY STRIP */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="mb-12 text-center">
          <Eyebrow>What we offer</Eyebrow>
          <h2 className="mt-4 font-display text-3xl text-brand sm:text-4xl">Our Services</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => navigate(c.view)}
              className="group overflow-hidden rounded-xl border border-hairline bg-surface text-left"
            >
              <div className="aspect-16/10 overflow-hidden bg-gold-soft/40">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
              </div>
              <div className="px-6 py-6">
                <h3 className="font-display text-2xl text-brand">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-gold transition-transform group-hover:translate-x-1">
                  Explore →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED DESIGNS */}
      <section className="bg-surface/60 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <Eyebrow>Signature work</Eyebrow>
            <h2 className="mt-4 font-display text-3xl text-brand sm:text-4xl">Featured Designs</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              A glimpse of our most-loved mehendi and makeup work. Click to view catalog details.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(s.type.toLowerCase())}
                className="cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT Snippet */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-hairline bg-gold-soft/40 lg:aspect-square">
            <img
              src="https://images.unsplash.com/photo-1783495694771-dcbe08f63519?w=900&h=900&fit=crop&auto=format&q=80"
              alt="Bride in traditional attire and gold jewellery"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="mt-4 font-display text-3xl text-brand sm:text-4xl">
              A decade of bridal artistry, close to home
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted font-medium">
              For over ten years, Huma has been the trusted name for mehendi and bridal beauty across
              Lucknow, Kanpur, Raebareli and the towns around it. Every booking is personal — from the
              first design idea to the final touch on your big day.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              With more than 500 brides and families served, our promise is simple: refined artistry,
              genuine care, and services that come to you — with no separate travel charge.
            </p>
            <button
              type="button"
              onClick={() => navigate("about")}
              className="mt-6 inline-block border-b border-gold pb-0.5 text-sm font-semibold text-brand transition-colors hover:text-gold"
            >
              Learn more about us →
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS CAROUSEL */}
      {approvedReviews.length > 0 && (
        <section className="bg-brand py-16 text-cream lg:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
            <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
              <span className="h-px w-6 bg-gold" aria-hidden />
              Kind words
              <span className="h-px w-6 bg-gold" aria-hidden />
            </p>
            
            <div className="mt-8 flex justify-center">
              <Stars n={approvedReviews[activeReviewIndex].rating} />
            </div>

            <blockquote className="mt-6 font-italic text-2xl italic leading-relaxed text-cream/95 sm:text-3xl min-h-[100px]">
              &ldquo;{approvedReviews[activeReviewIndex].comment}&rdquo;
            </blockquote>
            
            <p className="mt-6 font-display text-lg font-semibold">{approvedReviews[activeReviewIndex].customerName}</p>
            <p className="text-xs text-cream/60 mt-1">Verified Client • {approvedReviews[activeReviewIndex].serviceName}</p>

            <div className="mt-8 flex justify-center gap-2">
              {approvedReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveReviewIndex(i)}
                  aria-label={`Show review ${i + 1}`}
                  className={
                    "h-2 rounded-full transition-all " +
                    (i === activeReviewIndex ? "w-6 bg-gold" : "w-2 bg-cream/30 hover:bg-cream/50")
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ PREVIEW ACCORDION */}
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 text-center">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className="mt-4 font-display text-3xl text-brand sm:text-4xl font-semibold">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="divide-y divide-hairline border-y border-hairline">
          {FAQS.map((f, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg text-brand font-medium">{f.q}</span>
                  <span
                    className={
                      "shrink-0 text-xl text-gold transition-transform " +
                      (isOpen ? "rotate-45" : "")
                    }
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <div
                  className={
                    "grid transition-all duration-300 " +
                    (isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0")
                  }
                >
                  <p className="overflow-hidden text-[15px] leading-relaxed text-muted">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => navigate("faq")}
            className="text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
          >
            View full booking guide &amp; FAQ →
          </button>
        </div>
      </section>
    </div>
  );
}
