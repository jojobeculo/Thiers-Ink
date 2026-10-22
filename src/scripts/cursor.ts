/**
 * Curseur personnalisé (ordinateur, souris). Le curseur natif n'est masqué
 * qu'une fois le curseur personnalisé actif ; il revient sur les champs de
 * formulaire, dans les fenêtres modales, en mode réduit et en cas d'erreur.
 */
import { getTier } from './motion';

const root = document.querySelector<HTMLElement>('[data-cursor-root]');
const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
const label = document.querySelector<HTMLElement>('[data-cursor-label]');
const html = document.documentElement;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

if (root && ring && dot && label) {
  const pos = { x: -100, y: -100, rx: -100, ry: -100 };
  let raf = 0;
  let enabled = false;
  let modalOpen = false;

  const loop = () => {
    pos.rx += (pos.x - pos.rx) * 0.2;
    pos.ry += (pos.y - pos.ry) * 0.2;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
    raf = Math.abs(pos.x - pos.rx) + Math.abs(pos.y - pos.ry) > 0.1 ? requestAnimationFrame(loop) : 0;
  };

  const stateFor = (target: Element | null): string => {
    if (!target) return '';
    const explicit = target.closest<HTMLElement>('[data-cursor]');
    if (explicit) return explicit.dataset.cursor ?? 'link';
    if (target.closest('input, textarea, select, iframe, [contenteditable]')) return 'native';
    if (target.closest('a, button, summary, label, [role="button"]')) return 'link';
    return '';
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    if (!html.classList.contains('has-cursor') && !modalOpen) {
      // premier mouvement : on place le cercle sans traînée puis on masque le curseur natif
      pos.rx = pos.x;
      pos.ry = pos.y;
      html.classList.add('has-cursor');
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const onOver = (e: PointerEvent) => {
    const state = stateFor(e.target as Element);
    root.dataset.state = state;
    root.toggleAttribute('data-hidden', state === 'native');
    if (state === 'view') label.textContent = 'Voir';
  };

  const onLeave = (e: MouseEvent) => {
    if (!e.relatedTarget) root.setAttribute('data-hidden', '');
  };
  const onEnter = () => root.removeAttribute('data-hidden');
  const onDown = () => root.setAttribute('data-pressed', '');
  const onUp = () => root.removeAttribute('data-pressed');

  const enable = () => {
    if (enabled) return;
    enabled = true;
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('mouseout', onLeave);
    document.addEventListener('mouseover', onEnter);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
  };

  const disable = () => {
    enabled = false;
    html.classList.remove('has-cursor');
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('mouseout', onLeave);
    document.removeEventListener('mouseover', onEnter);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const sync = () => (finePointer.matches && getTier() !== 'reduced' && !modalOpen ? enable() : disable());

  window.addEventListener('thiersink:motion', sync);
  finePointer.addEventListener('change', sync);
  window.addEventListener('thiersink:modal', ((e: CustomEvent<{ open: boolean }>) => {
    // les fenêtres modales passent au-dessus de tout : curseur natif pendant leur ouverture
    modalOpen = e.detail.open;
    sync();
  }) as EventListener);
  window.addEventListener('error', disable);
  sync();
}
