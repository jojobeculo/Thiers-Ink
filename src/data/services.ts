import type { ImageMetadata } from 'astro';
import encre01 from '../assets/images/etudes/encre-01.jpg';
import dotwork from '../assets/images/etudes/dotwork.jpg';

export interface Service {
  id: string;
  name: string;
  /** Texte de présentation : à valider par le salon (docs/A-CONFIRMER.md). */
  summary: string;
  items: string[];
  preview: ImageMetadata;
  previewAlt: string;
  /** Page dédiée (référencement local). */
  path: string;
}

// Prestations relevées sur les sources publiques : tatouage et piercing
// (annuaire de la ville de Thiers, Fresha, Facebook). Le détatouage, mentionné
// seulement par Fresha, n'est pas affiché tant qu'il n'est pas confirmé.
export const services: Service[] = [
  {
    id: 'tatouage',
    name: 'Tatouage',
    summary:
      'Un projet de tatouage se prépare à partir de votre demande : le motif, son emplacement, la taille envisagée et le style recherché.',
    items: ['Motif', 'Emplacement', 'Taille', 'Style'],
    preview: encre01,
    previewAlt: '',
    path: '/tatouage-thiers',
  },
  {
    id: 'piercing',
    name: 'Piercing',
    summary: "Piercing de l'oreille, du nez et piercing corporel.",
    items: ['Oreille', 'Nez', 'Corps'],
    preview: dotwork,
    previewAlt: '',
    path: '/piercing-thiers',
  },
];
