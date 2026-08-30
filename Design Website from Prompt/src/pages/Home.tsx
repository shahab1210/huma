import { useState } from "react";
import { useApp } from "../context/AppContext";
import ServiceCard from "../components/ServiceCard";

const HERO_IMG =
  "https://images.unsplash.com/photo-1762162089047-97e09435984d?w=1400&h=1600&fit=crop&auto=format&q=80";

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
  const { services, navigate, reviews } = useApp();
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filters featured services (Mehendi / Makeup / Parlour)
  const featuredServices = services.filter((s) => s.featured).slice(0, 3);
  const approvedReviews = reviews.filter((r) => r.status === "APPROVED");

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
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
          <div className="order-2 lg:order-1">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              Lucknow · Kanpur · Raebareli &amp; nearby
            </p>
            <h1 className="font-display text-4xl leading-[1.08] text-brand sm:text-5xl lg:text-6xl">
              Huma Mehendi &amp; Beauty Artist
            </h1>
            <p className="mt-4 font-italic text-2xl italic text-ink/80 sm:text-3xl">
              Beautiful Art. Beautiful You. Beautiful Moments.
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Professional Mehendi, Bridal Makeup and Beauty Services for your special occasions —
              crafted with 10+ years of experience.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("mehendi")}
                className="rounded-md bg-brand px-7 py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => navigate("mehendi")}
                className="border-b border-gold pb-0.5 text-sm font-semibold tracking-wide text-brand transition-colors hover:text-gold"
              >
                Explore Services →
              </button>
            </div>

            <div className="mt-10 flex gap-10 border-t border-hairline pt-6">
              <div>
                <p className="font-display text-3xl text-brand">10+</p>
                <p className="text-xs uppercase tracking-wider text-muted">Years experience</p>
              </div>
              <div>
                <p className="font-display text-3xl text-brand">500+</p>
                <p className="text-xs uppercase tracking-wider text-muted">Happy customers</p>
              </div>
              <div>
                <p className="font-display text-3xl text-brand">7 Days</p>
                <p className="text-xs uppercase tracking-wider text-muted">10 AM – 11 PM</p>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-hairline bg-gold-soft/40">
              <img
                src={HERO_IMG}
                alt="Bridal hands adorned with intricate mehendi and gold jewellery"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-hairline bg-surface px-5 py-4 shadow-md sm:block">
              <p className="font-display text-sm text-brand font-semibold">Book online from</p>
              <p className="font-display text-2xl text-gold font-bold">₹1,500</p>
              <p className="text-[11px] text-muted">Balance paid after service</p>
            </div>
          </div>
        </div>
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
