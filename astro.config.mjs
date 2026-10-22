// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { createHash } from 'node:crypto';
import { MOTION_TIER_SCRIPT } from './src/scripts/motion-tier.inline.mjs';

// Domaine définitif du site (ex. https://www.thiersink.fr), lu au moment du build.
// Tant qu'il n'est pas renseigné : pas d'URL canonique, pas d'URL absolue Open Graph
// et pas de sitemap. Voir docs/A-CONFIRMER.md.
const site = process.env.SITE_URL?.replace(/\/$/, '') || undefined;

/** @type {`sha256-${string}`} */
const motionTierHash = `sha256-${createHash('sha256').update(MOTION_TIER_SCRIPT).digest('base64')}`;

export default defineConfig({
  site,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: {
    format: 'file',
    // CSS intégrée aux pages : aucune feuille bloquante à télécharger avant le rendu.
    inlineStylesheets: 'always',
  },
  integrations: site
    ? [
        sitemap({
          filter: (page) => !page.includes('/demande'),
        }),
      ]
    : [],
  security: {
    checkOrigin: true,
    // Derrière un proxy HTTPS, Astro ne fait confiance aux en-têtes X-Forwarded-*
    // (hôte, protocole, IP du visiteur) que pour le domaine déclaré.
    allowedDomains: site ? [{ hostname: new URL(site).hostname, protocol: 'https' }] : [],
    // CSP émise en <meta> sur chaque page : empreintes des scripts et styles d'Astro.
    // frame-ancestors et HSTS, impossibles en <meta>, sont ajoutés par server.mjs.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
        "font-src 'self'",
        "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
        'frame-src https://www.openstreetmap.org',
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com'],
        hashes: [motionTierHash],
      },
      styleDirective: {
        // attributs style="--i: 1" (délais d'animation) : seuls les attributs sont autorisés
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
  prefetch: false,
  devToolbar: { enabled: false },
  fonts: [
    {
      // Substitut de Satoshi demandé par la référence : Satoshi lui-même (Fontshare,
      // ITF Free Font License). Les fichiers sont téléchargés au build puis servis
      // depuis le site : aucune requête vers un tiers côté visiteur.
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      weights: [500, 700],
      styles: ['normal'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      // Substitut de TT Ramillas Variable (licence commerciale non fournie) :
      // Cormorant Garamond (SIL OFL), fichiers du paquet @fontsource. Le sous-ensemble
      // latin couvre tout le français (accents, œ, guillemets, tirets).
      provider: fontProviders.local(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            weight: 300,
            style: 'normal',
            src: ['./node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff2'],
          },
          {
            weight: 300,
            style: 'italic',
            src: ['./node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff2'],
          },
        ],
      },
    },
  ],
  env: {
    schema: {
      PUBLIC_GA_MEASUREMENT_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        startsWith: 'G-',
      }),
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 465 }),
      SMTP_SECURE: envField.boolean({ context: 'server', access: 'secret', default: true }),
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      BOOKING_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      BOOKING_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
