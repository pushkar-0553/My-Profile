// SEO Helper Utilities: Canonical URL calculation, Schema.org generators, and safe JSON-LD serialization
import { SEO_CONFIG } from '../config/seo.config.js';

/**
 * Returns a normalized, absolute canonical URL for a given path.
 * Strips query parameters, hashes, and trailing slashes (except root).
 */
export function getCanonicalUrl(pathname = '/') {
  const cleanPath = (pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .trim();

  const normalized = cleanPath === '' || cleanPath === '/'
    ? '/'
    : `/${cleanPath.replace(/^\/+|\/+$/g, '')}`;

  return normalized === '/' ? SEO_CONFIG.siteUrl : `${SEO_CONFIG.siteUrl}${normalized}`;
}

/**
 * Safely stringifies JSON for embedding in <script type="application/ld+json">.
 * Escapes closing script tags and HTML entities to completely prevent XSS.
 */
export function safeJsonLdString(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Generates the authoritative Person schema representing the owner.
 */
export function buildPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SEO_CONFIG.siteUrl}/#person`,
    name: SEO_CONFIG.personName,
    alternateName: [SEO_CONFIG.shortName, 'Pushkara Sai Vardhan Kagitha', 'Pushkara Vardhan'],
    givenName: SEO_CONFIG.givenName,
    familyName: SEO_CONFIG.familyName,
    jobTitle: SEO_CONFIG.jobTitle,
    description: SEO_CONFIG.description,
    url: SEO_CONFIG.siteUrl,
    image: SEO_CONFIG.profileImage,
    sameAs: [
      SEO_CONFIG.linkedinUrl,
      SEO_CONFIG.githubUrl
    ],
    worksFor: {
      '@type': 'Organization',
      name: SEO_CONFIG.currentEmployer.name
    },
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: SEO_CONFIG.alumniOf.name
    },
    knowsAbout: SEO_CONFIG.skills
  };
}

/**
 * Generates the ProfilePage schema for Homepage and About page.
 */
export function buildProfilePageSchema(pageUrl, description) {
  const canonical = pageUrl || SEO_CONFIG.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: `${SEO_CONFIG.personName} — Official Portfolio`,
    description: description || SEO_CONFIG.description,
    inLanguage: 'en-US',
    mainEntity: buildPersonSchema()
  };
}

/**
 * Generates CreativeWork / SoftwareApplication schema for a public project case study.
 */
export function buildProjectSchema(project, canonicalUrl) {
  if (!project) return null;

  const url = canonicalUrl || `${SEO_CONFIG.siteUrl}/projects/${project.slug || project.id}`;
  const imageUrl = project.preview_url || project.featured_image_url || SEO_CONFIG.defaultOgImage;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#project`,
    name: project.title,
    headline: project.title,
    description: project.short_summary || project.problem || SEO_CONFIG.description,
    url: url,
    image: imageUrl,
    author: {
      '@type': 'Person',
      '@id': `${SEO_CONFIG.siteUrl}/#person`,
      name: SEO_CONFIG.personName,
      url: SEO_CONFIG.siteUrl
    },
    creator: {
      '@type': 'Person',
      name: SEO_CONFIG.personName
    },
    inLanguage: 'en-US'
  };

  if (project.category) {
    schema.genre = project.category;
  }

  if (project.created_at) {
    schema.dateCreated = project.created_at;
  }
  if (project.updated_at) {
    schema.dateModified = project.updated_at;
  }

  if (project.github_repo_url || project.github_url) {
    schema.codeRepository = project.github_repo_url || project.github_url;
  }

  if (project.live_demo_url) {
    schema.sameAs = project.live_demo_url;
  }

  return schema;
}

/**
 * Generates BreadcrumbList schema.
 */
export function buildBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generates CollectionPage schema for the Projects archive.
 */
export function buildCollectionPageSchema(projects = []) {
  const url = `${SEO_CONFIG.siteUrl}/projects`;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url: url,
    name: `Projects Archive — ${SEO_CONFIG.personName}`,
    description: `Curated engineering case studies, systems architecture, and applications built by ${SEO_CONFIG.personName}.`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: projects.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SEO_CONFIG.siteUrl}/projects/${p.slug || p.id}`,
        name: p.title
      }))
    }
  };
}
