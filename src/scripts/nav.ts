/**
 * En-tête : état au défilement, tonalité selon la surface, section active,
 * menu mobile (dialog modal) et bouton de réservation flottant sur mobile.
 */

const header = document.querySelector<HTMLElement>('[data-site-header]');
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const dock = document.querySelector<HTMLElement>('[data-booking-dock]');

export function notifyModal(open: boolean) {
  window.dispatchEvent(new CustomEvent('thiersink:modal', { detail: { open } }));
}

/* Défilement : fond, masquage vers le bas, réapparition vers le haut ------- */
if (header) {
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.toggleAttribute('data-scrolled', y > 24);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    const focusInside = header.contains(document.activeElement);
    if (goingDown && y > window.innerHeight * 0.9 && !focusInside) header.setAttribute('data-hidden', '');
    else if (goingUp || y < window.innerHeight * 0.5) header.removeAttribute('data-hidden');
    if (goingDown || goingUp) lastY = y;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  header.addEventListener('focusin', () => header.removeAttribute('data-hidden'));
  update();

  /* Tonalité : clair au-dessus des surfaces parchemin. */
  const surfaces = document.querySelectorAll<HTMLElement>('main [data-surface]');
  const bandHeight = () => header.offsetHeight / 2;
  let toneObserver: IntersectionObserver | null = null;
  const observeTone = () => {
    toneObserver?.disconnect();
    const bottom = window.innerHeight - bandHeight();
    toneObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const tone = (entry.target as HTMLElement).dataset.surface === 'light' ? 'light' : 'dark';
          header.dataset.tone = tone;
        }
      },
      { rootMargin: `-${bandHeight()}px 0px -${bottom}px 0px` },
    );
    surfaces.forEach((s) => toneObserver?.observe(s));
  };
  observeTone();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(observeTone, 200);
  });
}

/* Section active ----------------------------------------------------------- */
const spyLinks = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('[data-spy]').forEach((a) => spyLinks.set(a.dataset.spy!, a));
if (spyLinks.size) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        spyLinks.forEach((link, key) => {
          if (key === id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main section[id]').forEach((s) => spyObserver.observe(s));
}

/* Menu mobile ------------------------------------------------------------- */
if (menu && toggle) {
  const open = () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    notifyModal(true);
  };
  const finishClose = () => {
    menu.removeAttribute('data-closing');
    menu.close();
  };
  const close = () => {
    if (!menu.open || menu.hasAttribute('data-closing')) return;
    const reduced = document.documentElement.dataset.motion !== 'full' && document.documentElement.dataset.motion !== 'lite';
    if (reduced) {
      finishClose();
      return;
    }
    menu.setAttribute('data-closing', '');
    menu.addEventListener('animationend', finishClose, { once: true });
    // si l'animation n'a pas lieu (onglet en arrière-plan), on ferme quand même
    window.setTimeout(() => menu.open && finishClose(), 500);
  };

  toggle.addEventListener('click', open);
  menu.querySelector('[data-menu-close]')?.addEventListener('click', close);
  menu.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  let viaLink = false;
  menu.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    notifyModal(false);
    // après un lien, le navigateur place le point de départ du focus sur la cible
    if (!viaLink) toggle.focus();
    viaLink = false;
  });
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link], .btn').forEach((link) =>
    link.addEventListener('click', () => {
      // la navigation vers l'ancre se fait après la fermeture (défilement débloqué)
      viaLink = true;
      finishClose();
    }),
  );
}

/* Bouton de réservation flottant (mobile) ---------------------------------- */
if (dock) {
  const booking = document.querySelector('#rendez-vous');
  const footer = document.querySelector('footer');
  const state = { pastHero: false, nearBooking: false, nearFooter: false };
  const render = () => dock.toggleAttribute('data-visible', state.pastHero && !state.nearBooking && !state.nearFooter);
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === booking) state.nearBooking = entry.isIntersecting;
      if (entry.target === footer) state.nearFooter = entry.isIntersecting;
    }
    render();
  });
  [booking, footer].forEach((el) => el && io.observe(el));
  // le hero reste collé sous la section suivante : on se fie à la position de défilement
  let pending = false;
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const past = window.scrollY > window.innerHeight * 0.85;
      if (past !== state.pastHero) {
        state.pastHero = past;
        render();
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
