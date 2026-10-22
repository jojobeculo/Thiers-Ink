/**
 * Serveur de production de THIERSINK.
 *
 * Enveloppe le serveur autonome d'Astro (dist/server/entry.mjs) pour ajouter :
 * - les en-têtes de sécurité HTTP, y compris sur les pages statiques ;
 * - la redirection HTTP → HTTPS derrière un proxy (FORCE_HTTPS=true) ;
 * - la compression des réponses textuelles.
 *
 * Variables : PORT (4321), HOST (0.0.0.0), FORCE_HTTPS, SITE_URL.
 */
import http from 'node:http';
import compression from 'compression';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

const port = Number(process.env.PORT ?? 4321);
const host = process.env.HOST ?? '0.0.0.0';
const forceHttps = process.env.FORCE_HTTPS === 'true';
const canonicalOrigin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : null;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()',
  'X-Frame-Options': 'DENY',
  // complète la CSP <meta> d'Astro : frame-ancestors n'est valable qu'en en-tête
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// gzip / brotli des réponses textuelles (HTML, CSS, JS, JSON, SVG)
const compress = compression();

const server = http.createServer((req, res) => {
  // Derrière le proxy TLS de l'hébergeur, le protocole d'origine est dans X-Forwarded-Proto.
  const proto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim();
  if (forceHttps && proto === 'http') {
    const origin = canonicalOrigin ?? `https://${req.headers.host}`;
    res.writeHead(301, { Location: `${origin}${req.url ?? '/'}` });
    res.end();
    return;
  }
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
  if (forceHttps) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  compress(req, res, () => handler(req, res));
});

server.listen(port, host, () => {
  console.log(`THIERSINK : serveur prêt sur http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
