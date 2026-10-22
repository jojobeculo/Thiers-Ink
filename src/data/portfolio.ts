import type { ImageMetadata } from 'astro';
import encre01 from '../assets/images/etudes/encre-01.jpg';
import encre02 from '../assets/images/etudes/encre-02.jpg';
import botanique from '../assets/images/etudes/botanique.jpg';
import dotwork from '../assets/images/etudes/dotwork.jpg';
import geometrie from '../assets/images/etudes/geometrie.jpg';
import blackwork from '../assets/images/etudes/blackwork.jpg';
import lunes from '../assets/images/etudes/lunes.jpg';

export interface Work {
  id: string;
  image: ImageMetadata;
  title: string;
  /** Style, zone tatouée, projet : à renseigner uniquement quand l'information est connue. */
  details: string[];
  alt: string;
  /**
   * `true` tant que l'image n'est pas une création authentique de l'atelier.
   * Une étiquette « Visuel provisoire » s'affiche alors sur le site.
   */
  provisional: boolean;
  /** Place dans la grille éditoriale (voir Portfolio.astro). */
  span: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
}

// Visuels générés pour la maquette (shaders et dessins vectoriels originaux).
// À remplacer par les photographies des réalisations de THIERSINK, avec l'accord
// des clients concernés. Voir docs/A-CONFIRMER.md.
export const works: Work[] = [
  {
    id: 'etude-01',
    image: encre01,
    title: 'Étude n° 01 — Encre',
    details: ['Texture'],
    alt: "Visuel provisoire : volutes d'encre claire sur fond noir.",
    provisional: true,
    span: 'a',
  },
  {
    id: 'etude-02',
    image: botanique,
    title: 'Étude n° 02 — Ligne botanique',
    details: ['Trait fin'],
    alt: 'Visuel provisoire : brin fleuri dessiné au trait noir sur papier beige.',
    provisional: true,
    span: 'b',
  },
  {
    id: 'etude-03',
    image: dotwork,
    title: 'Étude n° 03 — Mandala',
    details: ['Pointillé'],
    alt: 'Visuel provisoire : mandala en pointillé beige sur fond noir.',
    provisional: true,
    span: 'c',
  },
  {
    id: 'etude-04',
    image: lunes,
    title: 'Étude n° 04 — Phases',
    details: ['Pointillé'],
    alt: 'Visuel provisoire : sept phases de lune en pointillé, alignées sur fond noir étoilé.',
    provisional: true,
    span: 'd',
  },
  {
    id: 'etude-05',
    image: geometrie,
    title: 'Étude n° 05 — Géométrie',
    details: ['Trait fin'],
    alt: 'Visuel provisoire : fleur de vie et hexagramme tracés au trait fin sur fond charbon.',
    provisional: true,
    span: 'e',
  },
  {
    id: 'etude-06',
    image: blackwork,
    title: 'Étude n° 06 — Sphère',
    details: ['Lignes'],
    alt: 'Visuel provisoire : sphère suggérée par des lignes horizontales déformées, encre noire sur papier beige.',
    provisional: true,
    span: 'f',
  },
  {
    id: 'etude-07',
    image: encre02,
    title: 'Étude n° 07 — Encre',
    details: ['Texture'],
    alt: "Visuel provisoire : nappe d'encre horizontale aux reflets clairs sur fond noir.",
    provisional: true,
    span: 'g',
  },
];

export const hasProvisionalWorks = works.some((w) => w.provisional);
