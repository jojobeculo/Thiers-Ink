/**
 * Données structurées Schema.org (JSON-LD) du site.
 * Uniquement des informations publiques relevées sur des sources vérifiables
 * (voir src/config/site.ts) : aucune note ni aucun avis n'est déclaré.
 */
import { site, withBase, mapLinks } from '../config/site';

type Json = Record<string, unknown>;

/** URL absolue quand le domaine est connu, sinon chemin relatif. */
export function absolute(path: string, siteUrl?: URL): string {
  const local = withBase(path);
  return siteUrl ? new URL(local, siteUrl).href : local;
}

export function businessId(siteUrl?: URL): string {
  return `${absolute('/', siteUrl)}#salon`;
}

export function businessJsonLd(siteUrl?: URL): Json {
  return {
    '@type': 'TattooParlor',
    '@id': businessId(siteUrl),
    name: site.name,
    alternateName: site.altName,
    description: site.description,
    url: absolute('/', siteUrl),
    image: absolute('/og-thiersink.jpg', siteUrl),
    logo: absolute('/apple-touch-icon.png', siteUrl),
    telephone: '+33612800989',
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.address.geo.lat, longitude: site.address.geo.lng },
    hasMap: mapLinks.google,
    openingHoursSpecification: site.openingHours.map((slot) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: slot.days.map((d) => `https://schema.org/${d}`),
      opens: slot.opens,
      closes: slot.closes,
    })),
    areaServed: site.areaServed.map((name) => ({ '@type': 'Place', name })),
    founder: { '@type': 'Person', name: site.owner.name },
    knowsAbout: ['Tatouage', 'Piercing', "Piercing d'oreille", 'Piercing du nez', 'Piercing corporel'],
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tatouage', url: absolute('/tatouage-thiers', siteUrl) } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Piercing', url: absolute('/piercing-thiers', siteUrl) } },
    ],
    // Instagram n'est déclaré qu'une fois confirmé par le propriétaire.
    sameAs: [site.social.facebook, ...(site.social.instagram.confirmed ? [site.social.instagram.url] : [])],
  };
}

export function websiteJsonLd(siteUrl?: URL): Json {
  return {
    '@type': 'WebSite',
    '@id': `${absolute('/', siteUrl)}#site`,
    url: absolute('/', siteUrl),
    name: site.name,
    inLanguage: 'fr-FR',
    publisher: { '@id': businessId(siteUrl) },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], siteUrl?: URL): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path, siteUrl),
    })),
  };
}

export function faqJsonLd(entries: { question: string; answer: string }[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer.replace(/<[^>]+>/g, '') },
    })),
  };
}

export function serviceJsonLd(name: string, description: string, path: string, siteUrl?: URL): Json {
  return {
    '@type': 'Service',
    '@id': `${absolute(path, siteUrl)}#service`,
    name,
    serviceType: name,
    description,
    url: absolute(path, siteUrl),
    provider: { '@id': businessId(siteUrl) },
    areaServed: site.areaServed.map((place) => ({ '@type': 'Place', name: place })),
  };
}
