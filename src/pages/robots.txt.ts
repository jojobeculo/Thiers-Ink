import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /demande', ''];
  // Le sitemap n'est généré que lorsque le domaine définitif (SITE_URL) est connu.
  if (site) lines.push(`Sitemap: ${new URL('sitemap-index.xml', site).href}`, '');
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
