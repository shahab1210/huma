import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = 'Huma Mehendi | Professional Mehendi Artist in Lucknow, Raebareli & UP',
  description = 'Professional mehendi artist offering bridal mehendi, Arabic henna, makeup & beauty services in Lucknow, Kanpur, Raebareli, Sandila, Fatehpur & UP.',
  keywords = 'mehendi artist, bridal mehendi, mehendi artist lucknow, mehendi artist raebareli, mehendi artist kanpur, henna artist',
  canonicalUrl = '',
  ogImage = 'https://images.unsplash.com/photo-1762162089047-97e09435984d?w=1200&h=630&fit=crop',
  ogType = 'website',
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProperty);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '');

    // Standard Meta Tags
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');

    // Open Graph Meta Tags
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    if (currentUrl) setMeta('og:url', currentUrl, true);
    if (ogImage) setMeta('og:image', ogImage, true);

    // Twitter Card Meta Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    // Canonical Link Tag
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (currentUrl) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = currentUrl;
    }

    // JSON-LD Structured Data
    let script = document.getElementById('structured-data') as HTMLScriptElement | null;
    if (structuredData) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    } else if (script) {
      script.remove();
    }

    // Cleanup on unmount
    return () => {
      document.title = 'Huma Mehendi | Professional Mehendi Artist';
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, structuredData]);

  return null;
}
