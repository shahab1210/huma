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
  lucknow: {
    name: "Lucknow",
    slug: "lucknow",
    shortDescription: "Bridal mehendi, bespoke Arabic henna, and occasion styling delivered directly to your doorstep across Lucknow.",
    description: `Huma Mehendi provides bridal mehendi and beauty services delivered to your doorstep across Lucknow, including Gomti Nagar, Hazratganj, Alambagh, and Indira Nagar. From detailed bridal artwork to contemporary Arabic floral patterns, our services are customized for weddings, engagements, and special occasions. Each design is applied with precision to complement your celebratory attire.\n\nWe offer dedicated Home Visit appointments throughout Lucknow, allowing brides and family members to receive services comfortably at home or their event venue. Browse our online collection of bridal and occasion designs, or book an appointment using your own custom design. Secure your preferred date through our online advance reservation for organized, punctual service on your special day.`,
    seoTitle: "Mehendi Artist in Lucknow | Huma Mehendi",
    seoDescription: "Book mehendi artist services in Lucknow with Huma Mehendi. Bridal henna, Arabic designs, makeup & beauty services delivered through home visits across Lucknow.",
    seoKeywords: "mehendi artist lucknow, bridal mehendi lucknow, wedding mehendi lucknow, henna artist lucknow, home visit mehendi lucknow",
    nearbyAreas: ["Gomti Nagar", "Hazratganj", "Aminabad", "Alambagh", "Indira Nagar", "Aliganj"],
  },
  kanpur: {
    name: "Kanpur",
    slug: "kanpur",
    shortDescription: "Bridal henna designs, Arabic patterns, and occasion beauty services with home visits across Kanpur.",
    description: `Huma Mehendi provides henna artistry and occasion beauty services across Kanpur, including Civil Lines, Swaroop Nagar, Kidwai Nagar, and Kakadeo. We offer comprehensive bridal mehendi, traditional motifs, shaded florals, and modern patterns for engagement ceremonies and wedding celebrations. Each design is tailored to the preferences and style of the client.\n\nOur Home Visit service brings mehendi and beauty services directly to your residence or venue in Kanpur. Whether booking full bridal application or occasion henna for family members, you can explore designs online or book with your own design image. Confirm your date with a secure online advance payment for reliable scheduling.`,
    seoTitle: "Mehendi Artist in Kanpur | Huma Mehendi",
    seoDescription: "Mehendi artist services in Kanpur by Huma Mehendi. Bridal henna, Arabic designs, makeup & beauty packages delivered directly to your doorstep across Kanpur.",
    seoKeywords: "mehendi artist kanpur, bridal mehendi kanpur, henna artist kanpur, home visit mehendi kanpur, mehendi designs kanpur",
    nearbyAreas: ["Civil Lines", "Swaroop Nagar", "Kidwai Nagar", "Kakadeo"],
  },
  raebareli: {
    name: "Raebareli",
    slug: "raebareli",
    shortDescription: "Bridal mehendi, festive henna patterns, and complete makeover services at your doorstep across Raebareli.",
    description: `Huma Mehendi offers mehendi and bridal beauty services throughout Raebareli, including Civil Lines, Station Road, and surrounding localities. Our work ranges from full bridal coverage to lightweight Arabic and geometric patterns suitable for sangeet nights, receptions, and festive celebrations. Every design is drawn with attention to symmetry and clean detailing.\n\nAll services in Raebareli are provided through our Home Visit booking service. Our artist travels directly to your home address, helping you save time and prepare comfortably for your event. You can easily view our design catalog online, request appointments for custom designs, and confirm your booking date with an online advance deposit.`,
    seoTitle: "Mehendi Artist in Raebareli | Huma Mehendi",
    seoDescription: "Professional mehendi artist in Raebareli, Uttar Pradesh. Bridal mehendi, Arabic henna designs, makeup, and parlour services with home visits from Huma Mehendi.",
    seoKeywords: "mehendi artist raebareli, bridal mehendi raebareli, henna artist raebareli, home visit mehendi raebareli",
    nearbyAreas: ["City Center", "Station Road", "Civil Lines"],
  },
  bachhrawan: {
    name: "Bachhrawan",
    slug: "bachhrawan",
    shortDescription: "Bridal mehendi, Arabic henna art, and grooming packages with doorstep service across Bachhrawan.",
    description: `Huma Mehendi offers mehendi and beauty services in Bachhrawan and nearby connecting areas of Raebareli district. We provide bridal mehendi with traditional patterns, as well as Arabic henna for family members and festive celebrations. Each design is crafted with attention to detail to suit your event.\n\nOur Home Visit service allows clients in Bachhrawan to receive mehendi services comfortably at home. Browse our online collection, select your preferred bridal or occasion package, or book using your own custom design reference. Confirm your appointment online with an advance booking for prompt and organized service on your event day.`,
    seoTitle: "Mehendi Artist in Bachhrawan, Raebareli | Huma Mehendi",
    seoDescription: "Book a mehendi artist in Bachhrawan, Raebareli with Huma Mehendi. Bridal henna, Arabic designs, makeup & parlour services delivered directly to your doorstep.",
    seoKeywords: "mehendi artist bachhrawan, mehendi bachhrawan raebareli, bridal mehendi bachhrawan, henna artist bachhrawan, home visit mehendi bachhrawan",
    nearbyAreas: ["Raebareli", "Lalganj"],
  },
  lalganj: {
    name: "Lalganj",
    slug: "lalganj",
    shortDescription: "Professional bridal mehendi and occasion henna artistry in Lalganj with Home Visit and Visit the Artist booking options.",
    description: `Huma Mehendi provides mehendi and bridal beauty services across Lalganj and nearby areas in Raebareli. Specializing in intricate bridal patterns, delicate Arabic designs, and festive henna, our artistry is tailored for weddings, engagements, and special family celebrations. Every design is crafted with care to ensure elegant presentation for your occasion.\n\nFor clients in Lalganj, booking is flexible. You can choose a Home Visit appointment where the artist travels directly to your address, or select Visit the Artist to receive your service locally. Explore our catalog of mehendi designs, or book an appointment with your own custom design reference. With straightforward online booking and advance confirmation, planning your mehendi in Lalganj is simple and dependable.`,
    seoTitle: "Mehendi Artist in Lalganj, Raebareli | Huma Mehendi",
    seoDescription: "Bridal mehendi, Arabic henna, and beauty services in Lalganj, Raebareli, Uttar Pradesh. Home Visit and Visit the Artist booking options with Huma Mehendi.",
    seoKeywords: "mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj, henna artist lalganj, home visit mehendi lalganj",
    nearbyAreas: ["Raebareli", "Bachhrawan"],
  },
  "lalganj-raebareli": {
    name: "Lalganj",
    slug: "lalganj",
    shortDescription: "Professional bridal mehendi and occasion henna artistry in Lalganj with Home Visit and Visit the Artist booking options.",
    description: `Huma Mehendi provides mehendi and bridal beauty services across Lalganj and nearby areas in Raebareli. Specializing in intricate bridal patterns, delicate Arabic designs, and festive henna, our artistry is tailored for weddings, engagements, and special family celebrations. Every design is crafted with care to ensure elegant presentation for your occasion.\n\nFor clients in Lalganj, booking is flexible. You can choose a Home Visit appointment where the artist travels directly to your address, or select Visit the Artist to receive your service locally. Explore our catalog of mehendi designs, or book an appointment with your own custom design reference. With straightforward online booking and advance confirmation, planning your mehendi in Lalganj is simple and dependable.`,
    seoTitle: "Mehendi Artist in Lalganj, Raebareli | Huma Mehendi",
    seoDescription: "Bridal mehendi, Arabic henna, and beauty services in Lalganj, Raebareli, Uttar Pradesh. Home Visit and Visit the Artist booking options with Huma Mehendi.",
    seoKeywords: "mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj, henna artist lalganj, home visit mehendi lalganj",
    nearbyAreas: ["Raebareli", "Bachhrawan"],
  },
  fatehpur: {
    name: "Fatehpur",
    slug: "fatehpur",
    shortDescription: "Bridal henna art, Arabic designs, and beauty packages delivered to your home across Fatehpur.",
    description: `Huma Mehendi provides henna application and bridal makeover services across Fatehpur, including Bindki, Khaga, and nearby areas. Our services cover bridal mehendi with detailed motifs, floral mandalas, and Arabic trails suitable for engagements, sangeet functions, and festival gatherings. Each pattern is carefully drawn to match your occasion requirements.\n\nWith our Home Visit service, an artist travels directly to your home in Fatehpur, providing convenient on-site application. You can view our design catalog, compare options, or upload your own preferred design for booking. Reserve your appointment online with an advance deposit for organized and timely service.`,
    seoTitle: "Mehendi Artist in Fatehpur | Huma Mehendi",
    seoDescription: "Professional mehendi artist in Fatehpur, Uttar Pradesh. Intricate bridal mehendi, Arabic henna, makeup & beauty services delivered right to your home.",
    seoKeywords: "mehendi artist fatehpur, bridal mehendi fatehpur, henna artist fatehpur, home visit mehendi fatehpur",
    nearbyAreas: ["Bindki", "Khaga"],
  },
  sandila: {
    name: "Sandila",
    slug: "sandila",
    shortDescription: "Bridal mehendi and beauty services in Sandila, Hardoi with both Home Visit and Visit the Artist booking options.",
    description: `Huma Mehendi offers bridal henna, festive patterns, and parlour grooming services for clients in Sandila and surrounding areas of Hardoi district. Our designs include traditional bridal cuffs, paisley motifs, and contemporary Arabic patterns suitable for weddings, parties, and festive occasions. We focus on clean lines and balanced compositions for every client.\n\nClients in Sandila can choose between Home Visit appointments at their doorstep or selecting Visit the Artist to receive services locally. You can review available packages, check starting prices, or schedule an appointment with your own custom design. Confirm your booking online with an advance deposit for dependable service.`,
    seoTitle: "Mehendi Artist in Sandila, Hardoi | Huma Mehendi",
    seoDescription: "Mehendi artist in Sandila, Hardoi. Huma Mehendi provides bridal henna, Arabic designs, makeup & beauty services with Home Visit and Visit the Artist options.",
    seoKeywords: "mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila, henna artist sandila, home visit mehendi sandila",
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

  const LOCATION_TARGET_NAMES: Record<string, string> = {
    lalganj: "Lalganj, Raebareli",
    "lalganj-raebareli": "Lalganj, Raebareli",
    bachhrawan: "Bachhrawan, Raebareli",
    sandila: "Sandila, Hardoi",
    raebareli: "Raebareli",
    lucknow: "Lucknow",
    kanpur: "Kanpur",
    fatehpur: "Fatehpur",
  };

  const locationDisplayName = LOCATION_TARGET_NAMES[location.slug] || location.name;
  const isBaseLocation = location.slug === 'lalganj' || location.slug === 'lalganj-raebareli';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `https://humamehendi.in/${location.slug}#service`,
    name: 'Huma Mehendi & Beauty Artist',
    description: location.seoDescription || location.shortDescription || `Professional bridal mehendi, Arabic henna, makeup & beauty services in ${locationDisplayName}.`,
    url: `https://humamehendi.in/${location.slug}`,
    telephone: '+918960600371',
    priceRange: '₹₹',
    ...(isBaseLocation
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Lalganj',
            addressRegion: 'Uttar Pradesh',
            addressCountry: 'IN',
          },
        }
      : {}),
    areaServed: {
      '@type': 'City',
      name: locationDisplayName,
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
        title={location.seoTitle || `Mehendi Artist in ${locationDisplayName} | Huma Mehendi`}
        description={location.seoDescription || location.shortDescription || `Professional mehendi artist in ${locationDisplayName}. Book bridal mehendi, Arabic henna designs, makeup & parlour services.`}
        keywords={location.seoKeywords || `mehendi artist ${location.name}, bridal mehendi ${location.name}, henna artist ${location.name}`}
        canonicalUrl={`https://humamehendi.in/${location.slug}`}
        structuredData={structuredData}
      />
      <Breadcrumbs items={[{ label: 'Locations', path: 'home' }, { label: location.name }]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand/5 px-6 py-16 text-center sm:px-12 lg:px-24">
        {location.heroImage && (
          <img
            src={location.heroImage}
            alt={`Mehendi artist in ${locationDisplayName} - Huma Mehendi`}
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
            Mehendi Artist in {locationDisplayName}
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
          <div className="rounded-2xl border border-hairline bg-surface p-8 sm:p-10 shadow-sm space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-2">Local Artistry</p>
              <h2 className="font-serif text-2xl text-brand sm:text-3xl">Mehendi Services in {location.name}</h2>
            </div>
            <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-muted">
              {location.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
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
