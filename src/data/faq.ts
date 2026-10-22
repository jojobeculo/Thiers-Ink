import { site, withBase } from '../config/site';

export interface FaqEntry {
  id: string;
  question: string;
  /** HTML simple autorisé (liens internes). */
  answer: string;
  /**
   * `true` : la réponse dépend d'une politique du salon qui n'est pas confirmée.
   * L'entrée s'affiche uniquement en développement, avec une mention
   * [À CONFIRMER AVANT PUBLICATION], et jamais dans le build de production.
   */
  draft?: boolean;
}

export const faq: FaqEntry[] = [
  {
    id: 'tatoueur-thiers',
    question: 'Où trouver un tatoueur à Thiers ?',
    answer: `Le salon ${site.name} vous accueille au ${site.address.street}, à ${site.address.city} (Puy-de-Dôme), pour vos projets de tatouage. Prenez rendez-vous avec le <a href="${withBase('/#rendez-vous')}">formulaire en ligne</a> ou au <a href="${site.phone.href}">${site.phone.display}</a>. Tout savoir sur la page <a href="${withBase('/tatoueur-thiers')}">tatoueur à Thiers</a>.`,
  },
  {
    id: 'piercing-thiers',
    question: 'Où faire un piercing à Thiers ?',
    answer: `${site.name} réalise des piercings de l'oreille, du nez et des piercings corporels au ${site.address.street}, à ${site.address.city}. Détails sur la page <a href="${withBase('/piercing-thiers')}">piercing à Thiers</a>.`,
  },
  {
    id: 'horaires',
    question: 'Quels sont les horaires du salon ?',
    answer: `Horaires indicatifs : du mardi au samedi, de 9 h à 12 h et de 14 h à 18 h ; fermé le dimanche et le lundi. Un appel au <a href="${site.phone.href}">${site.phone.display}</a> permet de confirmer avant de venir.`,
  },
  {
    id: 'rendez-vous',
    question: 'Comment prendre rendez-vous ?',
    answer: `Envoyez une demande avec le <a href="${withBase('/#rendez-vous')}">formulaire de rendez-vous</a> ou appelez le salon au <a href="${site.phone.href}">${site.phone.display}</a>. Une demande envoyée depuis le site n'est pas une réservation ferme : le salon vous répond pour convenir d'un rendez-vous.`,
  },
  {
    id: 'preparer',
    question: 'Que préciser dans une demande de tatouage ?',
    answer: `Décrivez le motif, l'emplacement sur le corps, la taille approximative et le style recherché. Plus la description est précise, plus l'échange avec le salon est simple. Tous les conseils sont sur la page <a href="${withBase('/tatoueur-thiers')}">tatoueur à Thiers</a>.`,
  },
  {
    id: 'reference',
    question: 'Puis-je envoyer une image de référence ?',
    answer:
      'Oui. Le formulaire accepte une image facultative au format JPG, PNG, WebP ou HEIC, de 5 Mo au maximum.',
  },
  {
    id: 'adresse',
    question: 'Où se trouve le salon ?',
    answer: `Au ${site.address.street}, ${site.address.postalCode} ${site.address.city}. Les liens d'itinéraire se trouvent dans les <a href="${withBase('/#infos')}">informations pratiques</a>.`,
  },
  {
    id: 'realisations',
    question: "Où voir les réalisations de l'atelier ?",
    answer: `Les publications récentes de l'atelier sont visibles sur <a href="${site.social.instagram.url}" target="_blank" rel="noopener noreferrer">Instagram (${site.social.instagram.handle})</a>.`,
  },
  // Réponses à fournir par le salon ---------------------------------------
  {
    id: 'acompte',
    question: 'Faut-il verser un acompte ?',
    answer: '[À CONFIRMER AVANT PUBLICATION] Politique d’acompte du salon.',
    draft: true,
  },
  {
    id: 'tarifs',
    question: 'Combien coûte un tatouage ou un piercing ?',
    answer: '[À CONFIRMER AVANT PUBLICATION] Mode de calcul des tarifs, éventuel minimum.',
    draft: true,
  },
  {
    id: 'mineurs',
    question: 'Les mineurs peuvent-ils se faire tatouer ou percer ?',
    answer:
      '[À CONFIRMER AVANT PUBLICATION] Conditions appliquées par le salon (autorisation parentale, âge minimum, pièces à fournir).',
    draft: true,
  },
  {
    id: 'soins',
    question: 'Quels soins après un tatouage ou un piercing ?',
    answer: '[À CONFIRMER AVANT PUBLICATION] Consignes de soins remises par le salon.',
    draft: true,
  },
  {
    id: 'paiement',
    question: 'Quels moyens de paiement sont acceptés ?',
    answer: '[À CONFIRMER AVANT PUBLICATION] Moyens de paiement acceptés.',
    draft: true,
  },
];

export const publishedFaq = faq.filter((entry) => import.meta.env.DEV || !entry.draft);
