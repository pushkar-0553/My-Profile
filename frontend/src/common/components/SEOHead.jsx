import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIG } from '../config/seo.config.js';
import { getCanonicalUrl, safeJsonLdString } from '../utils/seoHelper.js';

/**
 * Reusable SEOHead component.
 * Manages document title, canonical link, meta tags (description, robots, OpenGraph, Twitter),
 * and JSON-LD structured data in document.head.
 */
export function SEOHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  twitterCard = 'summary_large_image',
  noindex = false,
  structuredData
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const finalTitle = title
      ? (title.includes(SEO_CONFIG.shortName) || title.includes('Kagitha') ? title : `${title} | ${SEO_CONFIG.personName}`)
      : `${SEO_CONFIG.personName} — ${SEO_CONFIG.jobTitle}`;
    document.title = finalTitle;

    // 2. Canonical URL
    const canonicalHref = canonical || getCanonicalUrl(location.pathname);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalHref);

    // 3. Helper to create or update meta tags
    const updateMetaTag = (attributeName, attributeValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attributeName, attributeValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Description
    const metaDesc = description || SEO_CONFIG.description;
    updateMetaTag('name', 'description', metaDesc);

    // Author
    updateMetaTag('name', 'author', SEO_CONFIG.personName);

    // Robots
    const robotsContent = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    updateMetaTag('name', 'robots', robotsContent);

    // OpenGraph
    const finalOgImage = ogImage || SEO_CONFIG.defaultOgImage;
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', metaDesc);
    updateMetaTag('property', 'og:url', canonicalHref);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:site_name', SEO_CONFIG.siteName);
    updateMetaTag('property', 'og:image', finalOgImage);
    updateMetaTag('property', 'og:locale', 'en_US');

    // Twitter / X
    updateMetaTag('name', 'twitter:card', twitterCard);
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', metaDesc);
    updateMetaTag('name', 'twitter:image', finalOgImage);

    // 4. Structured Data (JSON-LD)
    const jsonLdId = 'seo-dynamic-jsonld';
    let scriptTag = document.getElementById(jsonLdId);

    if (structuredData) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = jsonLdId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = safeJsonLdString(structuredData);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup when component unmounts (remove dynamic JSON-LD if needed)
    return () => {
      const existingScript = document.getElementById(jsonLdId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [
    title,
    description,
    canonical,
    ogType,
    ogImage,
    twitterCard,
    noindex,
    structuredData,
    location.pathname
  ]);

  return null;
}
