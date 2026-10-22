export interface Review {
  author: string;
  /** Texte intégral, reproduit à l'identique avec l'accord de son auteur. */
  text: string;
  /** Note sur 5, telle que publiée sur la source. */
  rating: 1 | 2 | 3 | 4 | 5;
  source: 'Google' | 'Facebook';
  /** Lien public vers l'avis ou la page qui le publie. */
  url: string;
  date: string;
}

// Aucun avis n'est reproduit tant qu'il n'a pas été copié depuis sa source
// publique avec l'accord de son auteur. La section affiche alors des liens vers
// les pages publiques. Voir docs/A-CONFIRMER.md.
export const reviews: Review[] = [];
