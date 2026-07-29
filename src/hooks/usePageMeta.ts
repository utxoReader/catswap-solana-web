import { useEffect } from 'react';
import { APP_ROUTES, AppPage, DEFAULT_OG_IMAGE, SITE_NAME, buildPageUrl, createJsonLd } from '../seo/routeMeta';

const ensureMeta = (selector: string, create: () => HTMLMetaElement) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = create();
    document.head.appendChild(element);
  }

  return element;
};

const ensureLink = (selector: string, create: () => HTMLLinkElement) => {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = create();
    document.head.appendChild(element);
  }

  return element;
};

export const usePageMeta = (page: AppPage) => {
  useEffect(() => {
    const meta = APP_ROUTES[page];
    const canonicalUrl = buildPageUrl(
      meta.path,
      typeof window !== 'undefined' ? window.location.origin : undefined
    );
    const ogImageUrl = buildPageUrl(
      DEFAULT_OG_IMAGE,
      typeof window !== 'undefined' ? window.location.origin : undefined
    );

    document.title = meta.title;

    ensureMeta('meta[name="description"]', () => {
      const element = document.createElement('meta');
      element.name = 'description';
      return element;
    }).content = meta.description;

    ensureMeta('meta[name="robots"]', () => {
      const element = document.createElement('meta');
      element.name = 'robots';
      return element;
    }).content = 'index,follow';

    ensureMeta('meta[property="og:type"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:type');
      return element;
    }).content = 'website';

    ensureMeta('meta[property="og:site_name"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:site_name');
      return element;
    }).content = SITE_NAME;

    ensureMeta('meta[property="og:title"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      return element;
    }).content = meta.title;

    ensureMeta('meta[property="og:description"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:description');
      return element;
    }).content = meta.description;

    ensureMeta('meta[property="og:url"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:url');
      return element;
    }).content = canonicalUrl;

    ensureMeta('meta[property="og:image"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:image');
      return element;
    }).content = ogImageUrl;

    ensureMeta('meta[name="twitter:card"]', () => {
      const element = document.createElement('meta');
      element.name = 'twitter:card';
      return element;
    }).content = 'summary_large_image';

    ensureMeta('meta[name="twitter:title"]', () => {
      const element = document.createElement('meta');
      element.name = 'twitter:title';
      return element;
    }).content = meta.title;

    ensureMeta('meta[name="twitter:description"]', () => {
      const element = document.createElement('meta');
      element.name = 'twitter:description';
      return element;
    }).content = meta.description;

    ensureMeta('meta[name="twitter:image"]', () => {
      const element = document.createElement('meta');
      element.name = 'twitter:image';
      return element;
    }).content = ogImageUrl;

    ensureLink('link[rel="canonical"]', () => {
      const element = document.createElement('link');
      element.rel = 'canonical';
      return element;
    }).href = canonicalUrl;

    let structuredData = document.getElementById('structured-data') as HTMLScriptElement | null;
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'structured-data';
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }

    structuredData.textContent = JSON.stringify(createJsonLd(meta));
  }, [page]);
};

export default usePageMeta;
