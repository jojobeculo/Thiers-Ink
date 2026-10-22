# THIERSINK — site web

Site de **THIERSINK**, atelier de tatouage et de piercing au 43 rue des Docteurs-Dumas,
63300 Thiers (Puy-de-Dôme). Direction artistique « Black Atelier », construite sur le
système éditorial Amrit Palace (tokens, typographie, géométrie) avec une couche de
mouvement expérimentale et une scène WebGL.

> Avant toute mise en ligne, traiter le registre [`docs/A-CONFIRMER.md`](docs/A-CONFIRMER.md) :
> informations légales, horaires, visuels provisoires, configuration SMTP.

## Stack

| Élément | Choix | Raison |
|---|---|---|
| Framework | [Astro 7](https://astro.build) | Pages statiques, zéro JavaScript par défaut, images optimisées au build. |
| Serveur | `@astrojs/node` (autonome) + `server.mjs` | Pages statiques + API du formulaire, en-têtes de sécurité, HTTPS. |
| Sitemap | `@astrojs/sitemap` | Activé quand `SITE_URL` est défini. |
| E-mail | `nodemailer` | Envoi SMTP des demandes, depuis le serveur uniquement. |
| Compression | `compression` | gzip / brotli des réponses textuelles dans `server.mjs`. |
| Polices | Satoshi (Fontshare, téléchargée au build) et Cormorant Garamond (`@fontsource`) | Servies depuis le site, sans requête tierce chez le visiteur. |

Aucune bibliothèque d'animation ni de 3D : le mouvement repose sur CSS,
IntersectionObserver et un shader WebGL écrit à la main (environ 3 Ko).

## Démarrage

Node.js **22.23.4 ou plus récent** (exigence d'Astro 7).

```sh
npm install
npm run dev       # développement : http://localhost:4321
npm run check     # vérification TypeScript / Astro
npm run build     # build de production dans dist/
npm start         # serveur de production (server.mjs)
```

Le build télécharge la police Satoshi depuis api.fontshare.com : l'environnement de
build doit avoir accès à Internet.

## Structure

```
astro.config.mjs        configuration : adaptateur, polices, variables, CSP
server.mjs              serveur de production : en-têtes, redirection HTTPS
src/config/site.ts      coordonnées vérifiées, réseaux, réservation, horaires
src/data/               portfolio, prestations, FAQ, avis
src/styles/tokens.css   tokens Amrit Palace + extension Black Atelier + couche sémantique
src/styles/global.css   base, typographie, boutons, liens, états de révélation
src/components/         sections de la page et composants partagés
src/scripts/            mouvement, navigation, curseur, portfolio, formulaire, consentement
src/scripts/hero/       shader de la goutte d'encre et moteur de rendu WebGL
src/lib/booking/        validation partagée, signature des images, limite de débit, SMTP
src/pages/              accueil, pages légales, 404, /demande, API, robots.txt
docs/A-CONFIRMER.md     registre des informations à valider
```

## Système de design

`src/styles/tokens.css` contient trois couches :

1. **Référence Amrit Palace**, reprise intégralement (couleurs, échelle typographique,
   espacements, rayons, surfaces).
2. **Extension Black Atelier** : noirs plus profonds (`--color-soot`, `--color-charcoal`)
   et variantes de contraste AA (`--color-espresso-aa`, `--color-rust`, `--color-ash`).
3. **Couche sémantique** par surface (`data-surface="dark" | "charcoal" | "light"`) :
   `--bg`, `--fg`, `--fg-muted`, `--rule`, `--accent`, `--control-border`.

Contrastes vérifiés : parchemin sur suie 12:1, walnut sur suie 5,9:1, onyx sur parchemin
8,8:1, espresso-aa sur parchemin 5,1:1, rust sur parchemin 5:1. Sur parchemin, l'accent
safran est remplacé par `--color-rust` (le safran n'y atteint que 1,6:1).

Typographie : TT Ramillas n'étant pas licenciée, les titres utilisent Cormorant Garamond
300 ; la sans-serif est Satoshi 500/700, comme dans la référence. Le mot-symbole est
calé sur la largeur de son conteneur (unités `cqi`).

## Mouvement

Un script en ligne (`src/scripts/motion-tier.inline.mjs`) choisit un niveau **avant le
premier rendu**, sans rien collecter :

| Niveau | Quand | Effets |
|---|---|---|
| `full` | Ordinateur, souris, plus de 4 cœurs ou 4 Go | WebGL, parallaxe, plans au défilement, inclinaison 3D, curseur, aperçu flottant des prestations. |
| `lite` | Tactile, écran ≤ 820 px, appareil moyen | Révélations et transitions CSS, bandeau animé, sans WebGL ni parallaxe. |
| `reduced` | `prefers-reduced-motion`, économie de données, ≤ 2 cœurs ou 2 Go, choix du visiteur | Aucune animation ; images fixes ; tout le contenu est visible. |

Après le chargement, une mesure d'une seconde (60 images, sans blocage) passe de `full`
à `lite` si l'affichage est saccadé. Le bouton « Réduire les animations » du pied de page
mémorise le choix du visiteur. Sans JavaScript, ou si le module ne démarre pas dans les
4 secondes, tout le contenu reste visible.

**Hero WebGL** : une goutte d'encre noire brillante en raymarching (`ink.frag`),
chargée après le premier rendu, au niveau `full` seulement. L'image fixe du hero est une
capture de la même scène : elle sert d'image LCP et de repli. La résolution et le nombre
de pas baissent si les images dépassent 22 ms ; au plancher, le rendu s'arrête. Aucune
image n'est calculée quand le hero est recouvert ou l'onglet inactif. Le contexte WebGL
est libéré à la destruction.

## Formulaire de rendez-vous

Le CTA unique « Prendre rendez-vous » mène au formulaire (`#rendez-vous`), ou à Planity si
`site.booking.planityUrl` est renseigné (aucun profil officiel trouvé à ce jour).

- Validation identique côté navigateur et serveur (`src/lib/booking/validate.ts`).
- Anti-spam : champ piège, délai minimal de remplissage, 5 envois par IP et par
  15 minutes (en mémoire), contrôle CSRF d'Astro (`Sec-Fetch-Site` / `Origin`).
- Image de référence facultative : 5 Mo, JPG/PNG/WebP/HEIC, vérifiée par sa signature
  binaire, jointe au courriel.
- Envoi SMTP réel ; « Répondre » écrit directement au demandeur. Rien n'est stocké.
- Sans configuration SMTP, l'API répond 503 et le site invite à appeler le salon :
  aucun faux message de succès.
- Sans JavaScript, le formulaire s'envoie normalement et `/demande` affiche l'issue.

## Consentement et GA4

GA4 n'est chargé qu'après acceptation explicite. « Tout refuser » et « Tout accepter »
ont le même poids ; « Personnaliser » détaille le choix. Le choix est gardé 6 mois, les
cookies GA expirent après 13 mois, les signaux Google et la publicité personnalisée sont
désactivés. Le refus après acceptation supprime les cookies `_ga`. Sans identifiant GA4,
aucun bandeau ne s'affiche et « Préférences cookies » l'indique. La carte OpenStreetMap
n'est chargée qu'au clic.

## SEO

Titre et description par page, `lang="fr"`, un seul `h1` par page, Open Graph et image de
partage, favicon, page 404, `robots.txt`, données structurées `TattooParlor` limitées aux
informations vérifiées (ni horaires ni note). L'URL canonique, les URL absolues
Open Graph et le sitemap n'existent qu'avec `SITE_URL` : aucun domaine n'est inventé.

## Sécurité

- CSP générée par Astro dans chaque page (empreintes des scripts et styles), plus
  `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` et COOP ajoutés par `server.mjs`.
- `FORCE_HTTPS=true` : redirection 301 vers HTTPS (d'après `X-Forwarded-Proto`) et HSTS.
  Le certificat TLS reste à configurer chez l'hébergeur ou sur le proxy.
- Aucun secret côté navigateur : les variables SMTP sont `access: 'secret'`.
- Ressources du build (`/_astro/`) servies avec un cache immuable d'un an.

## Variables d'environnement

Voir [`.env.example`](.env.example).

| Variable | Moment | Rôle |
|---|---|---|
| `SITE_URL` | build | Domaine définitif (canonique, Open Graph, sitemap) et domaine de confiance pour `X-Forwarded-*`. |
| `BASE_PATH` | build | Sous-chemin de déploiement (ex. `/Thiers-Ink` sur GitHub Pages). Vide à la racine. |
| `PUBLIC_STATIC_PREVIEW` | build | `true` sur un hébergement sans serveur : avis sur le formulaire. |
| `PUBLIC_GA_MEASUREMENT_ID` | build | Identifiant GA4 (`G-…`). Facultatif. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | exécution | Serveur d'envoi des demandes. |
| `BOOKING_TO`, `BOOKING_FROM` | exécution | Destinataire (défaut : e-mail du salon) et expéditeur. |
| `PORT`, `HOST`, `FORCE_HTTPS` | exécution | Serveur Node. |

## Déploiement

Hébergement Node.js (VPS, Render, Railway, Fly.io, Clever Cloud, conteneur…) derrière
un proxy HTTPS :

```sh
SITE_URL=https://www.exemple.fr npm run build
FORCE_HTTPS=true SMTP_HOST=… SMTP_USER=… SMTP_PASS=… npm start
```

Derrière un proxy, `SITE_URL` est indispensable : Astro ne fait confiance aux en-têtes
`X-Forwarded-*` que pour ce domaine. Sans lui, l'IP vue par le serveur est celle du proxy
et la limite de 5 demandes par 15 minutes s'appliquerait à tous les visiteurs à la fois.

### Aperçu GitHub Pages

Le workflow `.github/workflows/astro.yml` publie un aperçu statique sur
https://jojobeculo.github.io/Thiers-Ink/ à chaque push sur la branche. Il construit le
site avec `SITE_URL`, `BASE_PATH=/Thiers-Ink` et `PUBLIC_STATIC_PREVIEW=true`, puis
publie `dist/client/`. GitHub Pages n'exécute pas de serveur : le formulaire y affiche
que l'envoi en ligne n'est pas actif et renvoie vers le téléphone. Tous les liens
internes passent par `withBase()` (`src/config/site.ts`) pour suivre le sous-chemin.

Un hébergement purement statique peut servir `dist/client/`, mais le formulaire et la
page `/demande` ont besoin du serveur. Pour Netlify ou Vercel, remplacer l'adaptateur
`@astrojs/node` par l'adaptateur correspondant et reporter les en-têtes de `server.mjs`
dans leur configuration.

## Remplacer les contenus provisoires

- Visuels du portfolio : `src/data/portfolio.ts` (mettre `provisional: false`).
- Avis : `src/data/reviews.ts` (texte intégral, avec accord de l'auteur).
- Horaires et Planity : `src/config/site.ts`.
- Réponses de FAQ : `src/data/faq.ts` (retirer `draft: true`).

## Tests réalisés

Sur le build de production, avec Chromium (Playwright) :

- toutes les routes (accueil, pages légales, 404 avec statut 404, `/demande`) :
  aucune erreur de console, aucune violation CSP ;
- ordinateur 1440 px et iPhone 13 : parcours complet, aucun défilement horizontal ;
- WebGL actif au niveau `full`, image fixe aux niveaux `lite` et `reduced` ;
- `prefers-reduced-motion` et JavaScript désactivé : tout le contenu visible ;
- clavier : lien d'évitement, menu mobile modal (Échap, retour du focus), vue détaillée
  du portfolio (flèches, Échap, retour du focus), FAQ ;
- formulaire : erreurs accessibles et focus, champs conditionnels, envoi réel vers un
  serveur SMTP de test avec pièce jointe, faux JPEG refusé, fichier trop lourd refusé,
  champ piège, envoi trop rapide, limite de débit (429), CSRF (403), absence de SMTP (503),
  envoi sans JavaScript (303) ;
- consentement : aucune requête Google avant le choix, refus mémorisé, chargement de
  GA4 après acceptation, réouverture des préférences ;
- en-têtes de sécurité, compression brotli, redirection HTTPS et HSTS avec `FORCE_HTTPS=true` ;
- Lighthouse 12 sur le serveur local (débit simulé) : mobile 99 / 100 / 100 / 100 et
  ordinateur 100 / 100 / 100 / 100 (performance, accessibilité, bonnes pratiques, SEO),
  CLS 0. À mesurer de nouveau sur l'hébergement réel.

## Licences des polices

- Satoshi — Indian Type Foundry, ITF Free Font License (Fontshare).
- Cormorant Garamond — Christian Thalmann, SIL Open Font License 1.1.
