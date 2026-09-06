import { useApp } from "../context/AppContext";
import SEOHead from "../components/SEOHead";

export default function About() {
  const { navigate } = useApp();

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
      <SEOHead
        title="About Huma | Professional Mehendi Artist & Beauty Specialist"
        description="Learn about Huma Mehendi & Beauty Artist — 10+ years of experience delivering premium bridal mehendi, Arabic henna designs & makeup across Lucknow, Raebareli & UP."
        canonicalUrl="https://humamehendi.in/about"
      />
      {/* Title */}
      <div className="mb-12 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          Our Heritage
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand sm:text-5xl">About Huma</h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-12 items-center">
        <div className="lg:col-span-5 relative aspect-square overflow-hidden rounded-2xl border border-hairline bg-gold-soft/40">
          <img
            src="https://images.unsplash.com/photo-1783495694771-dcbe08f63519?w=800&h=800&fit=crop&auto=format&q=80"
            alt="Intricate bridal mehendi details"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="lg:col-span-7 space-y-6 text-sm text-ink leading-relaxed">
          <h2 className="font-display text-2xl text-brand leading-snug">
            Bridal Artistry Crafted Over a Decade
          </h2>
          <p>
            Welcome to the home of premium beauty and bridal henna. Established in 2016, 
            <strong> Huma Mehendi &amp; Beauty Artist</strong> has been the gold-standard beauty styling 
            partner for brides across Lucknow, Kanpur, Raebareli, and nearby towns.
          </p>
          <p>
            Led by Huma, a certified beauty expert and traditional mehendi designer with over 10 years 
            of hands-on experience, our team specializes in creating gorgeous, memorable moments. 
            From fine bridal detailing to modern occasion makeup, every service is tailored to amplify 
            your natural elegance.
          </p>
          <div className="grid grid-cols-2 gap-4 border-y border-hairline py-6 my-4">
            <div>
              <p className="font-display text-4xl text-brand font-bold">10+ Years</p>
              <p className="text-xs uppercase tracking-wider text-muted font-medium mt-1">Professional Experience</p>
            </div>
            <div>
              <p className="font-display text-4xl text-brand font-bold">500+ Clients</p>
              <p className="text-xs uppercase tracking-wider text-muted font-medium mt-1">Happy Brides &amp; Families</p>
            </div>
          </div>
          <p>
            We take pride in our strict hygiene standards, organic mehendi pastes (chemical-free formulation), 
            and premium makeup products. Best of all, we travel directly to your location with <strong>no separate 
            travel charge</strong>, ensuring a relaxed, stress-free prep on your big day.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate("mehendi")}
              className="rounded-md bg-brand px-6 py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 self-start"
            >
              Browse Catalog &amp; Book
            </button>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <button
                type="button"
                onClick={() => navigate("huma-secret-gate")}
                className="text-[11px] text-muted/50 hover:text-gold uppercase tracking-wider font-semibold transition-colors"
              >
                Portal Login (Admin Access)
              </button>
              <p className="text-[9px] text-muted/40 block sm:hidden">
                Admin: Access workspace portal directly on your mobile device here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
