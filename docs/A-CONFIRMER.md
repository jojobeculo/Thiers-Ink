# Registre des informations à confirmer avant publication

Ce registre liste tout ce qui doit être validé par le propriétaire (Anthony Degoul)
avant la mise en ligne. Dans les pages, les manques sont signalés par le marqueur
**[À CONFIRMER AVANT PUBLICATION]**. Pour les retrouver :

```sh
grep -rn "À CONFIRMER" src/
```

Recherche réalisée le 22 octobre 2026.

## 1. Identité et coordonnées

| Information | Valeur utilisée | Source | Statut |
|---|---|---|---|
| Nom commercial | THIERSINK (aussi « Thiers Ink ») | Annuaire de la ville de Thiers, Fresha, annuaire des entreprises | Concordant |
| Enseigne déclarée | THIERSINK BY @NTHOO22 | recherche-entreprises.api.gouv.fr | À confirmer |
| Exploitant | Anthony Degoul, entrepreneur individuel | recherche-entreprises.api.gouv.fr | À confirmer |
| SIREN / SIRET (établissement) | 953 459 062 / 953 459 062 00022 | recherche-entreprises.api.gouv.fr | À vérifier sur l'extrait d'immatriculation |
| Adresse du salon | 43 rue des Docteurs-Dumas, 63300 Thiers | Ville de Thiers, Fresha, registre, bio Instagram | Concordant |
| Coordonnées GPS | 45.859707, 3.546308 | Base Adresse Nationale | Concordant |
| Téléphone | 06 12 80 09 89 | Ville de Thiers, Fresha, grandbio.fr | Concordant |
| E-mail | anthoo_thiersink@icloud.com | Annuaire de la ville de Thiers | À confirmer |
| Facebook | facebook.com/profile.php?id=100089193006424 | Annuaire de la ville de Thiers | Concordant |
| Instagram | @anthoo22_thiersink | Résultats de recherche (bio reprenant l'adresse) | À confirmer : passer `site.social.instagram.confirmed` à `true` pour l'ajouter aux données structurées |

Le siège déclaré de l'entreprise individuelle est à une autre adresse que le salon.
Les mentions légales affichent l'adresse du salon : le propriétaire doit confirmer
que ce choix lui convient.

## 2. Mentions légales (`src/pages/mentions-legales.astro`)

- Forme juridique exacte et mention d'immatriculation (RNE).
- Numéro de TVA intracommunautaire, ou mention « TVA non applicable, art. 293 B du CGI ».
- Directeur de la publication.
- Hébergeur : raison sociale, adresse, téléphone.
- Prestataire de conception du site, le cas échéant.

## 3. Confidentialité (`src/pages/confidentialite.astro`)

- Prestataire d'envoi des e-mails (SMTP) et hébergeur, en tant que destinataires.
- Durée de conservation des demandes dans la messagerie du salon.
- Journaux techniques de l'hébergeur : nature et durée.
- Si GA4 est activé : vérifier la description avec la configuration réelle de la propriété.

## 4. Activité et contenus

| Point | État actuel | Action |
|---|---|---|
| Prestations | Tatouage, piercing (oreille, nez, corps) | Confirmer la liste (`src/data/services.ts`). |
| Détatouage | Listé seulement par Fresha, non affiché | Confirmer ou écarter. |
| Horaires | Affichés comme indicatifs : mardi–samedi 9 h–12 h et 14 h–18 h, fermé dimanche et lundi (fiche Fresha, seule source détaillée ; Bottin et grandbio n'en donnent pas) | Confirmer ou corriger `site.hours` et `site.openingHours` dans `src/config/site.ts` (aussi utilisés par les données structurées). |
| Zone desservie | Thiers, Courpière, Lezoux, Puy-Guillaume, Peschadoires, Vichy, Clermont-Ferrand | Valider `site.areaServed` (référencement local). |
| Pages de prestation | `/tatoueur-thiers`, `/piercing-thiers` : déroulé d'une demande et conseils génériques | Relire et valider le texte (`src/pages/*-thiers.astro`). |
| Accès PMR, stationnement | Mentionnés par la bio Instagram, non affichés | Confirmer avant d'ajouter. |
| Textes de présentation | Rédigés à partir des sources publiques | Valider : `Hero.astro`, `Atelier.astro`, `Highlights.astro` (points forts), `Artist.astro`, `Booking.astro`, `CtaBand.astro`, `services.ts`, réponses publiées de `faq.ts` (notamment « Où trouver un tatoueur à Thiers ? », « Où faire un piercing à Thiers ? », « Quels sont les horaires ? » et « le salon vous répond pour convenir d'un rendez-vous »). |
| Réponses de FAQ en brouillon | Acompte, tarifs, mineurs, soins, paiement | Rédiger les réponses dans `src/data/faq.ts` puis retirer `draft: true`. Les brouillons ne s'affichent qu'en développement. |
| Réservation Planity | Aucun profil trouvé | Si un profil officiel existe, renseigner `site.booking.planityUrl`. |

## 5. Visuels

Tous les visuels du site sont **provisoires** : ils ont été générés pour la maquette
(shaders et dessins vectoriels originaux) et sont étiquetés « Visuel provisoire ».
Aucune image d'un autre salon n'est utilisée.

- Remplacer les études du portfolio par des photographies de réalisations de
  l'atelier, avec l'accord écrit des clients photographiés
  (`src/data/portfolio.ts`, mettre `provisional: false`).
- Remplacer l'image de l'atelier (`src/components/Atelier.astro`).
- Ajouter un portrait de l'artiste si souhaité (`src/components/Artist.astro`).
- L'image Open Graph (`public/og-thiersink.jpg`) et le visuel du hero sont des
  créations graphiques : ils peuvent rester.

## 6. Carte

La carte des infos pratiques est générée à partir des données OpenStreetMap (extraction du
22/10/2026, licence ODbL) : l'attribution « © contributeurs OpenStreetMap » doit rester
visible.

## 7. Avis clients

Aucun avis n'est reproduit. La fiche Google du salon (« Thiersink - tatouage-piercing »,
43 Rue des Docteurs Dumas) affichait le 22/10/2026 une note de 5/5 pour 168 avis.

Afficher ces avis sur le site, dans une fenêtre défilante, demande un accès que seul le
salon peut ouvrir :

- **API Google Places** (clé d'API sur un compte Google Cloud du salon) : la note, le
  nombre d'avis et **5 avis au maximum**, choisis par Google. Les conditions de Google
  Maps Platform encadrent strictement la conservation de ces données : elles doivent
  être récupérées à nouveau régulièrement (serveur, ou reconstruction quotidienne).
- **API Google Business Profile** (connexion du propriétaire de la fiche, accès à
  demander à Google) : tous les avis.
- **Widget d'un prestataire** (Elfsight, Trustindex…) : tous les avis, mais un script
  tiers et des cookies à soumettre au consentement, à ajouter à la CSP et à la page
  Confidentialité.

Recopier les avis à la main ou les extraire automatiquement de Google Maps est exclu :
c'est contraire aux conditions de Google, et un avis supprimé ou modifié par son auteur
resterait affiché. Le Code de la consommation (art. L111-7-2) impose aussi d'indiquer
comment les avis affichés sont collectés et triés. Aucune note moyenne ne doit être
ajoutée aux données structurées (Google ignore les avis déclarés par l'établissement
lui-même).

## 8. Mise en ligne

- `SITE_URL` : domaine définitif (canonique, Open Graph, sitemap).
- Configuration SMTP : sans elle, le formulaire répond honnêtement que l'envoi est
  indisponible et invite à appeler le salon.
- `PUBLIC_GA_MEASUREMENT_ID` : seulement si la mesure d'audience est souhaitée.
- `PUBLIC_GOOGLE_SITE_VERIFICATION` : code de la balise meta Google Search Console, puis
  envoyer `sitemap-index.xml` dans Search Console.
- HTTPS : à activer chez l'hébergeur, puis `FORCE_HTTPS=true`.
- Faire relire les pages légales : leur présence ne garantit pas la conformité.
- Fiche Google Business Profile (« Thiersink - tatouage-piercing », déjà en ligne) :
  vérifier que nom, adresse, téléphone et horaires sont identiques au site, y ajouter
  l'adresse du site, des photos récentes et répondre aux avis. C'est le premier levier
  du référencement local.
