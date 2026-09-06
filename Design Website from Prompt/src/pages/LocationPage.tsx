import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BASE_URL, type LocationData, type ServiceGroupData } from '../services/api';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import ServiceCard from '../components/ServiceCard';

interface LocationPageProps {
  slug: string;
}

const FALLBACK_LOCATIONS: Record<string, Partial<LocationData>> = {
  lalganj: {
    name: "Lalganj",
    slug: "lalganj",
    shortDescription: "Beautiful mehendi artistry in Lalganj, Raebareli",
    seoTitle: "Mehendi Artist in Lalganj, Raebareli | Huma Mehendi",
    seoDescription: "Expert mehendi artist in Lalganj, Raebareli. Professional bridal henna, Arabic designs, makeup & beauty services.",
    seoKeywords: "mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj",
    nearbyAreas: ["Raebareli", "Bachhrawan"],
  },
  "lalganj-raebareli": {
    name: "Lalganj",
    slug: "lalganj",
    shortDescription: "Beautiful mehendi artistry in Lalganj, Raebareli",
    seoTitle: "Mehendi Artist in Lalganj, Raebareli | Huma Mehendi",
    seoDescription: "Expert mehendi artist in Lalganj, Raebareli. Professional bridal henna, Arabic designs, makeup & beauty services.",
    seoKeywords: "mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj",
    nearbyAreas: ["Raebareli", "Bachhrawan"],
  },
  fatehpur: {
    name: "Fatehpur",
    slug: "fatehpur",
    shortDescription: "Professional mehendi & beauty services in Fatehpur",
    seoTitle: "Best Mehendi Artist in Fatehpur | Huma Mehendi",
    seoDescription: "Professional mehendi artist in Fatehpur. Bridal mehendi, Arabic henna, makeup & beauty services.",
    seoKeywords: "mehendi artist fatehpur, best mehendi fatehpur, bridal mehendi fatehpur",
    nearbyAreas: ["Bindki", "Khaga"],
  },
  sandila: {
    name: "Sandila",
    slug: "sandila",
    shortDescription: "Mehendi & beauty services in Sandila, Hardoi (near Lucknow)",
    seoTitle: "Mehendi Artist in Sandila, Hardoi | Huma Mehendi",
    seoDescription: "Expert mehendi artist in Sandila, Hardoi district near Lucknow. Professional bridal mehendi, Arabic henna, makeup & parlour services.",
    seoKeywords: "mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila",
    nearbyAreas: ["Hardoi", "Lucknow", "Shahjahanpur"],
  },
};

export default function LocationPage({ slug }: LocationPageProps) {
  const { navigate, setSelectedLocation, services } = useApp();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/locations/${slug}`);
        const data = await res.json();
        if (data.success) {
          setLocation(data.data.location);
          setSelectedLocation(data.data.location);
        } else if (FALLBACK_LOCATIONS[slug]) {
          const fallbackLoc = FALLBACK_LOCATIONS[slug] as LocationData;
          setLocation(fallbackLoc);
          setSelectedLocation(fallbackLoc);
        } else {
          setError('Location not found');
        }
      } catch {
        if (FALLBACK_LOCATIONS[slug]) {
          const fallbackLoc = FALLBACK_LOCATIONS[slug] as LocationData;
          setLocation(fallbackLoc);
          setSelectedLocation(fallbackLoc);
        } else {
          setError('Failed to load location');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <section className="px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-ink">Location Not Found</h1>
        <p className="mt-3 text-muted">The location you're looking for doesn't exist.</p>
        <button onClick={() => navigate('home')} className="mt-6 rounded-full bg-brand px-6 py-2 text-sm text-white hover:bg-brand/90 transition">
          Back to Home
        </button>
      </section>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `https://humamehendi.in/${location.slug}#service`,
    name: `Huma Mehendi – Best Mehendi Artist in ${location.name}`,
    description: location.seoDescription || location.shortDescription || `Professional bridal mehendi, Arabic henna, makeup & beauty services in ${location.name}.`,
    url: `https://humamehendi.in/${location.slug}`,
    telephone: '+918960600371',
    priceRange: '₹₹',
    areaServed: {
      '@type': 'City',
      name: location.name,
    },
    provider: {
      '@type': 'Person',
      name: 'Huma',
      jobTitle: 'Professional Mehendi Artist',
    },
  };

  return (
    <>
      <SEOHead
        title={location.seoTitle || `Best Mehendi Artist in ${location.name} | Huma Mehendi`}
        description={location.seoDescription || location.shortDescription || `Top-rated mehendi artist in ${location.name}. Book professional bridal mehendi, Arabic henna designs, makeup & parlour services.`}
        keywords={location.seoKeywords || `mehendi artist ${location.name}, best mehendi ${location.name}, bridal mehendi ${location.name}, henna artist ${location.name}`}
        canonicalUrl={`https://humamehendi.in/${location.slug}`}
        structuredData={structuredData}
      />
      <Breadcrumbs items={[{ label: 'Locations', path: 'home' }, { label: location.name }]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand/5 px-6 py-16 text-center sm:px-12 lg:px-24">
        {location.heroImage && (
          <img
            src={location.heroImage}
            alt={`Best mehendi artist in ${location.name} - Huma Mehendi`}
            className="absolute inset-0 w-full h-full object-cover opacity-15"
          />
        )}
        <div className="relative">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-6 bg-gold" aria-hidden />
            Our Services
            <span className="h-px w-6 bg-gold" aria-hidden />
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            Best Mehendi Artist in {location.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {location.shortDescription || `Premium mehendi, bridal makeup and beauty services available in ${location.name} and nearby areas.`}
          </p>
          <button
            onClick={() => navigate('booking')}
            className="mt-8 rounded-full bg-brand px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-md hover:bg-brand/90 transition"
          >
            Book Now
          </button>
        </div>
      </section>

      {/* About this location */}
      {location.description && (
        <section className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
          <h2 className="font-serif text-2xl text-ink">About Our Services in {location.name}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{location.description}</p>
        </section>
      )}

      {/* Available Service Groups */}
      {location.availableServiceGroups && location.availableServiceGroups.length > 0 && (
        <section className="px-6 py-12 sm:px-12 lg:px-24">
          <h2 className="text-center font-serif text-2xl text-ink">Services Available in {location.name}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(location.availableServiceGroups as ServiceGroupData[]).filter(g => g.isActive).map((group) => (
              <button
                key={group._id}
                onClick={() => navigate(group.slug)}
                className="group rounded-xl border border-gold/20 bg-white p-6 text-left shadow-sm transition hover:shadow-md hover:border-gold/40"
              >
                {group.heroImage && (
                  <img src={group.heroImage} alt={group.name} className="mb-4 h-40 w-full rounded-lg object-cover" />
                )}
                <p className="text-[10px] font-medium uppercase tracking-wider text-gold">{group.parentType}</p>
                <h3 className="mt-1 font-serif text-lg text-ink group-hover:text-brand transition-colors">
                  {group.name}
                </h3>
                {group.shortDescription && (
                  <p className="mt-2 text-xs text-muted line-clamp-2">{group.shortDescription}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Nearby Areas */}
      {location.nearbyAreas && location.nearbyAreas.length > 0 && (
        <section className="px-6 py-12 text-center sm:px-12">
          <h2 className="font-serif text-xl text-ink">Also Serving Nearby Areas</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {location.nearbyAreas.map((area, i) => (
              <span key={i} className="rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs text-ink">
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand/5 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-ink">Ready to Book in {location.name}?</h2>
        <p className="mt-3 text-sm text-muted">Book your appointment today. No extra travel charges.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('booking')}
            className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand/90 transition"
          >
            Book Appointment
          </button>
          <a
            href="https://wa.me/918960600371"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand px-8 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white transition"
          >
            WhatsApp Us
          </a>
        </div>
      </section>
    </>
  );
}
