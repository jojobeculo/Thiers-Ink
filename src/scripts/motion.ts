/**
 * Système de mouvement de THIERSINK.
 *
 * Le niveau (full, lite, reduced) est décidé par le script en ligne de
 * BaseLayout avant le premier rendu. Ce module :
 * - révèle les éléments [data-reveal] une seule fois à leur entrée à l'écran ;
 * - anime les effets liés au défilement (niveau full uniquement) ;
 * - mesure brièvement la fluidité après le chargement et passe en lite si besoin ;
 * - gère les boutons [data-motion-toggle] (préférence du visiteur, stockée localement) ;
 * - anime les boutons [data-magnetic] et la barre de progression de lecture.
 */

export type MotionTier = 'full' | 'lite' | 'reduced';

declare global {
  interface Window {
    __thiersinkMotion?: boolean;
    __thiersinkAutoTier?: MotionTier;
  }
  interface WindowEventMap {
    'thiersink:motion': CustomEvent<{ tier: MotionTier }>;
  }
}

const root = document.documentElement;
const STORAGE_KEY = 'thiersink:motion';

export function getTier(): MotionTier {
  const tier = root.dataset.motion;
  return tier === 'full' || tier === 'lite' ? tier : 'reduced';
}

function setTier(tier: MotionTier) {
  if (root.dataset.motion === tier) return;
  root.dataset.motion = tier;
  window.dispatchEvent(new CustomEvent('thiersink:motion', { detail: { tier } }));
}

/* Révélations ------------------------------------------------------------ */
function initReveals() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length) return;
  if (!root.hasAttribute('data-motion')) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

/* Effets liés au défilement (full) --------------------------------------- */
function initScrollEffects() {
  const parallax = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  const planes = [...document.querySelectorAll<HTMLElement>('[data-plane]')];
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const visible = new Set<HTMLElement>();
  let frame = 0;
  let active = false;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
      schedule();
    },
    { rootMargin: '15% 0px 15% 0px' },
  );
  [...parallax, ...planes].forEach((el) => io.observe(el));

  function update() {
    frame = 0;
    const vh = window.innerHeight;
    if (hero) {
      const cover = Math.min(Math.max(window.scrollY / vh, 0), 1);
      hero.style.setProperty('--cover', cover.toFixed(4));
    }
    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      if (el.hasAttribute('data-plane')) {
        // 0 quand le haut de la section entre par le bas, 1 au tiers supérieur
        const p = Math.min(Math.max((vh - rect.top) / (vh * 0.7), 0), 1);
        el.style.setProperty('--plane', p.toFixed(4));
        continue;
      }
      const speed = Number(el.dataset.parallax) || 0.1;
      const center = rect.top + rect.height / 2 - vh / 2;
      el.style.setProperty('--py', `${(-center * speed).toFixed(1)}px`);
    }
  }

  function schedule() {
    if (!active || frame) return;
    frame = requestAnimationFrame(update);
  }

  function start() {
    if (active) return;
    active = true;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  }

  function stop() {
    active = false;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const el of [...parallax, ...planes]) {
      el.style.removeProperty('--py');
      el.style.removeProperty('--plane');
    }
    hero?.style.removeProperty('--cover');
  }

  if (getTier() === 'full') start();
  window.addEventListener('thiersink:motion', (e) => (e.detail.tier === 'full' ? start() : stop()));
}

/* Sonde de fluidité ------------------------------------------------------
   Une seconde de mesure juste après le chargement, AVANT le démarrage de la
   scène WebGL (qui attend `probeDone`) : sans blocage ni collecte. */
let resolveProbe: () => void = () => {};
export const probeDone = new Promise<void>((resolve) => (resolveProbe = resolve));

function probeSmoothness() {
  if (getTier() !== 'full') {
    resolveProbe();
    return;
  }
  const run = () => {
    const samples: number[] = [];
    let last = 0;
    let warmup = 8;
    const tick = (now: number) => {
      if (warmup-- > 0) {
        last = now;
        requestAnimationFrame(tick);
        return;
      }
      samples.push(now - last);
      last = now;
      if (samples.length < 45) {
        requestAnimationFrame(tick);
        return;
      }
      samples.sort((a, b) => a - b);
      const median = samples[Math.floor(samples.length / 2)];
      // > 28 ms par image (< 36 i/s) avant même la 3D : on allège les effets.
      if (median > 28 && getTier() === 'full') setTier('lite');
      resolveProbe();
    };
    requestAnimationFrame(tick);
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/* Préférence du visiteur --------------------------------------------------- */
function initToggles() {
  const toggles = document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]');
  const sync = () => {
    const reduced = getTier() === 'reduced';
    toggles.forEach((btn) => {
      const label = btn.querySelector('[data-motion-label]');
      if (label) label.textContent = reduced ? 'Activer les animations' : 'Réduire les animations';
    });
  };
  toggles.forEach((btn) =>
    btn.addEventListener('click', () => {
      const reduce = getTier() !== 'reduced';
      try {
        // « on » réactive les animations même si le système demande de les réduire
        localStorage.setItem(STORAGE_KEY, reduce ? 'reduced' : 'on');
      } catch {
        /* stockage indisponible : la préférence vaut pour cette page */
      }
      setTier(reduce ? 'reduced' : (window.__thiersinkAutoTier ?? 'lite'));
    }),
  );
  window.addEventListener('thiersink:motion', sync);
  sync();
}

/* Boutons magnétiques (full, souris) ---------------------------------------- */
function initMagnetic() {
  const items = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  items.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || getTier() !== 'full') return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty('--mx', `${(x * 14).toFixed(1)}px`);
      el.style.setProperty('--my', `${(y * 10).toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  });
}

/* Barre de progression de lecture ----------------------------------------- */
function initProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  if (!bar) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}

window.__thiersinkMotion = true;
root.removeAttribute('data-reveal-fallback');
// Sans attribut (JavaScript sans le script d'en-tête) : contenu affiché tel quel.
initReveals();
initToggles();
initProgress();
if (root.hasAttribute('data-motion')) {
  initScrollEffects();
  initMagnetic();
  probeSmoothness();
} else {
  resolveProbe();
}
