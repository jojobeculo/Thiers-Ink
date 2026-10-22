// Script en ligne exécuté avant le premier rendu (voir BaseLayout.astro).
// Il est aussi importé par astro.config.mjs pour calculer son empreinte CSP :
// toute modification est donc prise en compte automatiquement.
//
// Niveaux : full (ordinateur performant), lite (tactile, petit écran, appareil
// moyen), reduced (préférence système ou du visiteur, appareil modeste, économie
// de données). Aucune donnée n'est collectée ni envoyée.
export const MOTION_TIER_SCRIPT = `(function () {
  var d = document.documentElement;
  d.classList.add('js');
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  var pref = null;
  try { pref = localStorage.getItem('thiersink:motion'); } catch (e) {}
  var n = navigator;
  var c = n.connection || {};
  var cores = n.hardwareConcurrency || 0;
  var mem = n.deviceMemory || 0;
  var tier = 'full';
  if (mq('(prefers-reduced-motion: reduce)') || !('IntersectionObserver' in window) || c.saveData || (cores && cores <= 2) || (mem && mem <= 2)) {
    tier = 'reduced';
  } else if (mq('(pointer: coarse)') || mq('(max-width: 820px)') || (cores && cores <= 4) || (mem && mem <= 4)) {
    tier = 'lite';
  }
  window.__thiersinkAutoTier = tier;
  if (pref === 'reduced') tier = 'reduced';
  d.setAttribute('data-motion', tier);
  setTimeout(function () { if (!window.__thiersinkMotion) d.removeAttribute('data-motion'); }, 4000);
})();`;
