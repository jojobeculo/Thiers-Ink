/**
 * Consentement aux cookies facultatifs et chargement conditionnel de GA4.
 * Rien n'est chargé ni déposé avant un accord explicite. Le refus est aussi
 * simple que l'acceptation. Le choix est conservé 6 mois, puis redemandé.
 */
import { PUBLIC_GA_MEASUREMENT_ID } from 'astro:env/client';

const STORAGE_KEY = 'thiersink:consent';
const VERSION = 1;
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;
// Durée de vie des cookies GA ramenée à 13 mois (recommandation CNIL).
const GA_COOKIE_SECONDS = 13 * 30 * 24 * 60 * 60;

interface Choice {
  v: number;
  analytics: boolean;
  ts: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const banner = document.querySelector<HTMLElement>('[data-consent]');
const gaId = PUBLIC_GA_MEASUREMENT_ID;

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const choice = JSON.parse(raw) as Choice;
    if (choice.v !== VERSION || Date.now() - choice.ts > MAX_AGE_MS) return null;
    return choice;
  } catch {
    return null;
  }
}

function storeChoice(analytics: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, analytics, ts: Date.now() }));
  } catch {
    /* stockage indisponible : le choix vaut pour cette visite */
  }
}

let gaLoaded = false;

function loadAnalytics() {
  if (!gaId || gaLoaded) return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag attend l'objet arguments tel quel
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    cookie_expires: GA_COOKIE_SECONDS,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.append(script);
}

function revokeAnalytics() {
  if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  // suppression des cookies _ga et _ga_<ID> sur le domaine courant et ses parents
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (name !== '_ga' && !name.startsWith('_ga_')) return;
    domains.forEach((domain) => {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    });
  });
}

function apply(analytics: boolean) {
  storeChoice(analytics);
  if (analytics) loadAnalytics();
  else revokeAnalytics();
  hide();
}

let opener: HTMLElement | null = null;

function show(customize = false, focus = false) {
  if (!banner) return;
  banner.hidden = false;
  const details = banner.querySelector<HTMLElement>('[data-consent-details]');
  const toggle = banner.querySelector<HTMLInputElement>('[data-consent-analytics]');
  const save = banner.querySelector<HTMLElement>('[data-consent-save]');
  const customizeBtn = banner.querySelector<HTMLElement>('[data-consent-customize]');
  if (toggle) toggle.checked = readChoice()?.analytics ?? false;
  if (details) details.hidden = !customize;
  if (save) save.hidden = !customize;
  customizeBtn?.setAttribute('aria-expanded', String(customize));
  if (focus) banner.querySelector<HTMLElement>('#consent-title')?.focus();
}

function hide() {
  if (!banner) return;
  banner.hidden = true;
  opener?.focus();
  opener = null;
}

if (banner) {
  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => apply(true));
  banner.querySelector('[data-consent-reject]')?.addEventListener('click', () => apply(false));
  banner.querySelector('[data-consent-customize]')?.addEventListener('click', () => show(true));
  banner.querySelector('[data-consent-save]')?.addEventListener('click', () => {
    apply(banner.querySelector<HTMLInputElement>('[data-consent-analytics]')?.checked ?? false);
  });
  banner.querySelector('[data-consent-close]')?.addEventListener('click', hide);
  banner.addEventListener('keydown', (e) => {
    // Échap ne vaut pas consentement : la bannière ne se ferme ainsi qu'une fois un choix enregistré
    if (e.key === 'Escape' && (!gaId || readChoice())) hide();
  });

  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((btn) =>
    btn.addEventListener('click', () => {
      opener = btn;
      show(Boolean(gaId), true);
    }),
  );

  if (gaId) {
    const choice = readChoice();
    if (!choice) show();
    else if (choice.analytics) loadAnalytics();
  }
}
