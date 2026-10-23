// Static & Build-Time Sitemap Generator for Vercel & Production Deployments
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = (process.env.VITE_SITE_URL || 'https://my-profile-seven-murex.vercel.app/').replace(/\/+$/, '');

// Static public pages
const staticPages = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: '/projects', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/experience', priority: '0.8', changefreq: 'monthly' },
  { path: '/skills', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' }
];

async function getPublishedProjectSlugs() {
  const slugs = new Set([
    'distributed-ecommerce-platform',
    'rpa-invoice-automation-pipeline',
    'modular-component-design-system'
  ]);

  // Attempt to fetch live published projects from backend API if available
  const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${apiUrl}/public/projects`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const projects = await res.json();
      if (Array.isArray(projects)) {
        projects.forEach(p => {
          if (p.slug) slugs.add(p.slug);
        });
      }
    }
  } catch {
    // Backend may not be running during isolated frontend CI build; fallback to seed projects
  }

  return Array.from(slugs);
}

async function generateSitemap() {
  const projectSlugs = await getPublishedProjectSlugs();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    ...staticPages.map(page => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority
    })),
    ...projectSlugs.map(slug => ({
      loc: `${SITE_URL}/projects/${slug}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.85'
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml.trim() + '\n', 'utf8');
  console.log(`[Sitemap] Generated valid XML sitemap with ${urls.length} canonical URLs at: ${sitemapPath}`);
}

generateSitemap().catch(err => {
  console.error('[Sitemap] Failed to generate sitemap:', err);
});
