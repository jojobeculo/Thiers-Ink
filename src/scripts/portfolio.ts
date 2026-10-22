/**
 * Portfolio : vue détaillée (dialog modal natif) et inclinaison 3D au pointeur.
 */
import { getTier } from './motion';
import { notifyModal } from './nav';

interface WorkView {
  avif: string;
  webp: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  details: string;
  provisional: boolean;
}

const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
const dataEl = document.getElementById('works-data');
const triggers = [...document.querySelectorAll<HTMLButtonElement>('[data-work-index]')];

if (dialog && dataEl && triggers.length) {
  const works = JSON.parse(dataEl.textContent || '[]') as WorkView[];
  const stage = dialog.querySelector<HTMLElement>('[data-lb-stage]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const avif = dialog.querySelector<HTMLSourceElement>('[data-lb-avif]')!;
  const webp = dialog.querySelector<HTMLSourceElement>('[data-lb-webp]')!;
  const title = dialog.querySelector<HTMLElement>('[data-lb-title]')!;
  const details = dialog.querySelector<HTMLElement>('[data-lb-details]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-lb-counter]')!;
  const provisional = dialog.querySelector<HTMLElement>('[data-lb-provisional]')!;
  const error = dialog.querySelector<HTMLElement>('[data-lb-error]')!;
  let index = 0;
  let opener: HTMLElement | null = null;

  const pad = (n: number) => String(n).padStart(2, '0');

  function fill(i: number) {
    const work = works[i];
    error.hidden = true;
    avif.srcset = work.avif;
    webp.srcset = work.webp;
    img.src = work.src;
    img.width = work.width;
    img.height = work.height;
    img.alt = work.alt;
    title.textContent = work.title;
    details.textContent = work.details;
    provisional.hidden = !work.provisional;
    counter.textContent = `${pad(i + 1)} / ${pad(works.length)}`;
  }

  function show(next: number, dir = 1) {
    index = (next + works.length) % works.length;
    if (getTier() === 'reduced' || !dialog!.open) {
      fill(index);
      return;
    }
    stage.style.setProperty('--dir', String(dir));
    stage.dataset.state = 'out';
    window.setTimeout(() => {
      fill(index);
      stage.dataset.state = 'in';
      requestAnimationFrame(() => requestAnimationFrame(() => delete stage.dataset.state));
    }, 260);
  }

  img.addEventListener('error', () => {
    error.hidden = false;
  });

  triggers.forEach((btn) =>
    btn.addEventListener('click', () => {
      opener = btn;
      show(Number(btn.dataset.workIndex));
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      notifyModal(true);
    }),
  );

  dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(index - 1, -1));
  dialog.querySelector('[data-lb-next]')?.addEventListener('click', () => show(index + 1, 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1, 1);
    if (e.key === 'ArrowLeft') show(index - 1, -1);
  });
  // un clic hors de l'image et des contrôles ferme la vue
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    notifyModal(false);
    opener?.focus();
  });

  // balayage tactile
  let startX = 0;
  let startY = 0;
  stage.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    },
    { passive: true },
  );
}

/* Inclinaison 3D au survol (niveau full, souris uniquement) ---------------- */
triggers.forEach((btn) => {
  const frame = btn.querySelector<HTMLElement>('.work__frame');
  if (!frame) return;
  btn.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || getTier() !== 'full') return;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    frame.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
    frame.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
  });
  btn.addEventListener('pointerleave', () => {
    frame.style.removeProperty('--rx');
    frame.style.removeProperty('--ry');
  });
});
