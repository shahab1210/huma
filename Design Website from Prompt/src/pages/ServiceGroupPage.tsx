import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BASE_URL, type ServiceGroupData } from '../services/api';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import ServiceCard from '../components/ServiceCard';

interface ServiceGroupPageProps {
  slug: string;
}

interface GroupProduct {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  discountType?: string;
  discountValue?: number;
  description: string;
  duration: string;
  images: { url: string; publicId?: string }[];
  category?: { name: string };
  isAvailable: boolean;
  isFeatured: boolean;
  startingPrice?: number;
  coverage?: string;
}

export default function ServiceGroupPage({ slug }: ServiceGroupPageProps) {
  const { navigate, addToCart } = useApp();
  const [group, setGroup] = useState<ServiceGroupData | null>(null);
  const [designs, setDesigns] = useState<GroupProduct[]>([]);
  const [services, setServices] = useState<GroupProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/service-groups/${slug}`);
        const data = await res.json();
        if (data.success) {
          setGroup(data.data.serviceGroup);
          setDesigns(data.data.designs || []);
          setServices(data.data.services || []);
        } else {
          setError('Service group not found');
        }
      } catch {
        setError('Failed to load service group');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <section className="px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-ink">Not Found</h1>
        <p className="mt-3 text-muted">The service group you're looking for doesn't exist.</p>
        <button onClick={() => navigate('home')} className="mt-6 rounded-full bg-brand px-6 py-2 text-sm text-white hover:bg-brand/90 transition">
          Back to Home
        </button>
      </section>
    );
  }

  const allProducts = [...designs, ...services];
  const parentLabel = group.parentType === 'MEHENDI' ? 'Mehendi' : group.parentType === 'MAKEUP' ? 'Makeup' : 'Parlour';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: group.name,
    description: group.seoDescription || group.shortDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Huma Mehendi & Beauty Artist',
    },
    areaServed: [
      { '@type': 'City', name: 'Lucknow' },
      { '@type': 'City', name: 'Kanpur' },
      { '@type': 'City', name: 'Raebareli' },
    ],
  };

  const renderProductCard = (product: GroupProduct) => {
    const hasDiscount = product.mrp && product.mrp > 0 && product.mrp > product.price;
    const discountPercent = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
    const imgUrl = product.images?.[0]?.url || '';

    return (
      <div key={product._id} className="group rounded-xl border border-gold/20 bg-white shadow-sm transition hover:shadow-md overflow-hidden">
        {imgUrl && (
          <div className="relative">
            <img src={imgUrl} alt={product.name} className="h-48 w-full object-cover" />
            {hasDiscount && (
              <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        )}
        <div className="p-4">
          {product.category?.name && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-gold">{product.category.name}</p>
          )}
          <h3 className="mt-1 font-serif text-base text-ink">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-xs text-muted line-clamp-2">{product.description}</p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand">₹{product.price.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className="text-xs text-muted line-through">₹{product.mrp!.toLocaleString('en-IN')}</span>
            )}
          </div>
          {product.duration && (
            <p className="mt-1 text-[10px] text-muted">{product.duration}</p>
          )}
          <button
            onClick={() => {
              // Create a Service-compatible object for the cart
              const cartItem = {
                id: product._id,
                type: group.parentType,
                name: product.name,
                category: product.category?.name || '',
                description: product.description,
                duration: product.duration,
                startingPrice: product.price,
                image: imgUrl,
                featured: product.isFeatured,
                availability: product.isAvailable ? 'AVAILABLE' as const : 'BLOCKED' as const,
              };
              addToCart(cartItem);
            }}
            disabled={!product.isAvailable}
            className="mt-3 w-full rounded-full bg-brand py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title={group.seoTitle || `${group.name} | Huma Mehendi & Beauty Artist`}
        description={group.seoDescription || group.shortDescription}
        structuredData={structuredData}
      />
      <Breadcrumbs items={[
        { label: parentLabel, path: group.parentType.toLowerCase() },
        { label: group.name },
      ]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand/5 px-6 py-16 text-center sm:px-12 lg:px-24">
        {group.heroImage && (
          <img src={group.heroImage} alt={group.name} className="absolute inset-0 w-full h-full object-cover opacity-15" />
        )}
        <div className="relative">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-6 bg-gold" aria-hidden />
            {parentLabel}
            <span className="h-px w-6 bg-gold" aria-hidden />
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            {group.name}
          </h1>
          {group.shortDescription && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {group.shortDescription}
            </p>
          )}
        </div>
      </section>

      {/* Description */}
      {group.description && (
        <section className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
          <p className="text-sm leading-relaxed text-muted">{group.description}</p>
        </section>
      )}

      {/* Products Grid */}
      <section className="px-6 py-8 sm:px-12 lg:px-24">
        <h2 className="text-center font-serif text-2xl text-ink">
          {group.parentType === 'MEHENDI' ? 'Designs' : 'Services'} ({allProducts.length})
        </h2>
        {allProducts.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allProducts.map(renderProductCard)}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">No products available in this group yet.</p>
        )}
      </section>

      {/* CTA */}
      <section className="bg-brand/5 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-ink">Interested in {group.name}?</h2>
        <p className="mt-3 text-sm text-muted">Book your appointment or contact us on WhatsApp for more details.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('booking')}
            className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand/90 transition"
          >
            Book Now
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
