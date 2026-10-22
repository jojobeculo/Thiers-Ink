import type { APIRoute } from 'astro';
import { withBase } from '../config/site';

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', `Disallow: ${withBase('/api/')}`, `Disallow: ${withBase('/demande')}`, ''];
  // Le sitemap n'est généré que lorsque le domaine définitif (SITE_URL) est connu.
  if (site) lines.push(`Sitemap: ${new URL(withBase('/sitemap-index.xml'), site).href}`, '');
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
