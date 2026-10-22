/**
 * Informations publiques de THIERSINK.
 *
 * Chaque donnée indique sa source. Les données marquées `confirmed: false`
 * proviennent de sources publiques concordantes mais doivent être validées par
 * le propriétaire avant publication (voir docs/A-CONFIRMER.md).
 */

export const site = {
  name: 'THIERSINK',
  /** Graphie alternative relevée dans l'annuaire de la ville de Thiers. */
  altName: 'Thiers Ink',
  activity: 'Tatouage & piercing',
  locale: 'fr_FR',
  description:
    'THIERSINK, atelier de tatouage et de piercing au 43 rue des Docteurs-Dumas à Thiers (Puy-de-Dôme). Demande de rendez-vous en ligne ou par téléphone.',

  /** Responsable : Anthony Degoul (registre national des entreprises, entreprise individuelle). */
  owner: {
    name: 'Anthony Degoul',
    role: 'Tatouage & piercing',
  },

  address: {
    street: '43 rue des Docteurs-Dumas',
    postalCode: '63300',
    city: 'Thiers',
    region: 'Puy-de-Dôme',
    country: 'FR',
    /** Base Adresse Nationale (data.geopf.fr), score 0,97. */
    geo: { lat: 45.859707, lng: 3.546308 },
  },

  /** Annuaire de la ville de Thiers, Fresha, grandbio.fr. */
  phone: { display: '06 12 80 09 89', href: 'tel:+33612800989' },
  /** Annuaire de la ville de Thiers. */
  email: 'anthoo_thiersink@icloud.com',

  social: {
    /** Lien indiqué comme « site internet » par l'annuaire de la ville de Thiers. */
    facebook: 'https://www.facebook.com/profile.php?id=100089193006424',
    /** Compte dont la bio reprend l'adresse du salon. À confirmer par le propriétaire. */
    instagram: {
      handle: '@anthoo22_thiersink',
      url: 'https://www.instagram.com/anthoo22_thiersink/',
      confirmed: false,
    },
  },

  /**
   * Réservation. Aucun profil Planity propre à THIERSINK n'a été trouvé
   * (recherche du 22/10/2026). Renseigner ici l'URL officielle exacte si elle
   * existe : tous les boutons « Prendre rendez-vous » y renverront.
   */
  booking: {
    planityUrl: null as string | null,
    formAnchor: '#rendez-vous',
  },

  /**
   * Horaires : non publiés tant qu'ils ne sont pas confirmés (Fresha et
   * grandbio.fr donnent des horaires différents). Format attendu :
   * [{ days: 'Mardi – samedi', hours: '9 h – 12 h · 14 h – 18 h' }]
   */
  hours: [] as { days: string; hours: string }[],
} as const;

/**
 * Préfixe un chemin interne du sous-chemin de déploiement (BASE_PATH), par exemple
 * /Thiers-Ink pour l'aperçu GitHub Pages. Sans sous-chemin, le chemin reste inchangé.
 */
export const withBase = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

export const bookingHref = site.booking.planityUrl ?? withBase(`/${site.booking.formAnchor}`);
export const isExternalBooking = site.booking.planityUrl !== null;

export const mapLinks = {
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `THIERSINK ${site.address.street} ${site.address.postalCode} ${site.address.city}`,
  )}`,
  osm: `https://www.openstreetmap.org/?mlat=${site.address.geo.lat}&mlon=${site.address.geo.lng}#map=18/${site.address.geo.lat}/${site.address.geo.lng}`,
  apple: `https://maps.apple.com/?address=${encodeURIComponent(
    `${site.address.street}, ${site.address.postalCode} ${site.address.city}, France`,
  )}&ll=${site.address.geo.lat},${site.address.geo.lng}`,
};

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
