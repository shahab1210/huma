import { useApp } from '../context/AppContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { navigate } = useApp();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://humamehendi.in';

  const breadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/`,
      },
      ...items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 2,
        name: item.label,
        ...(item.path ? { item: `${baseUrl}/${item.path.replace(/^\//, '')}` } : {}),
      })),
    ],
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="px-4 py-3 text-xs text-muted sm:px-8 lg:px-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <button
            onClick={() => navigate('home')}
            className="hover:text-brand transition-colors"
          >
            Home
          </button>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <span className="text-gold" aria-hidden>›</span>
            {item.path ? (
              <button
                onClick={() => navigate(item.path!)}
                className="hover:text-brand transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-ink font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
