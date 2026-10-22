// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Domaine définitif du site (ex. https://www.thiersink.fr), lu au moment du build.
// Tant qu'il n'est pas renseigné : pas d'URL canonique, pas d'URL absolue Open Graph
// et pas de sitemap. Voir docs/A-CONFIRMER.md.
const site = process.env.SITE_URL?.replace(/\/$/, '') || undefined;

export default defineConfig({
  site,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
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
      // Cormorant Garamond (SIL OFL), servi depuis node_modules.
      provider: fontProviders.npm({ remote: false }),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      weights: [300],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'serif'],
      options: { package: '@fontsource/cormorant-garamond' },
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
