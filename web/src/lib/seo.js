import { useEffect } from 'react';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-page SEO: title, description, canonical, social tags and optional JSON-LD.
 * JSON-LD only ever describes data that really exists (a price is emitted only when set).
 */
export function useSeo({ title, description, path, image, keywords, jsonLd, siteUrl, siteName } = {}) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
      upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    }
    if (title) {
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
      upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    }
    if (keywords) upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
      upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    }
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    if (siteName) upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });

    const base = (siteUrl || window.location.origin).replace(/\/$/, '');
    const canonical = `${base}${path ?? window.location.pathname}`;
    upsertLink('canonical', canonical);
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
  }, [title, description, path, image, keywords, siteUrl, siteName]);

  useEffect(() => {
    const id = 'page-jsonld';
    document.getElementById(id)?.remove();
    if (!jsonLd) return undefined;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => script.remove();
  }, [jsonLd]);
}

export function breadcrumbJsonLd(base, items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
