// Script en ligne exécuté avant le premier rendu (voir BaseLayout.astro).
// Il est aussi importé par astro.config.mjs pour calculer son empreinte CSP :
// toute modification est donc prise en compte automatiquement.
//
// Niveaux : full (ordinateur), lite (écran tactile, petit écran, appareil très
// modeste ou économie de données), reduced (réglage « réduire les animations » du
// système ou du visiteur : fondus simples, sans déplacement). Le visiteur peut
// réactiver les animations depuis le pied de page. Aucune donnée n'est collectée.
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
  if (mq('(pointer: coarse)') || mq('(max-width: 820px)') || c.saveData || (cores && cores <= 2) || (mem && mem <= 2)) tier = 'lite';
  window.__thiersinkAutoTier = tier;
  if (!('IntersectionObserver' in window) || pref === 'reduced' || (pref !== 'on' && mq('(prefers-reduced-motion: reduce)'))) tier = 'reduced';
  d.setAttribute('data-motion', tier);
  setTimeout(function () { if (!window.__thiersinkMotion) d.setAttribute('data-reveal-fallback', ''); }, 6000);
})();`;
