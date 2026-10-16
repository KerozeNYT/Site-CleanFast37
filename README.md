# Maison Nette — thème Shopify pour le rouleau anti-poils ACE2ACE

Thème Shopify Online Store 2.0 pour une boutique mono-produit : le rouleau anti-poils réutilisable ACE2ACE pour chiens et chats (modèle blanc), vendu 29,90 € TTC en France.

Esprit : la sobriété des grandes pages produit (beaucoup d'air, photographie au centre, typographie nette), une démonstration claire du geste, et une conversion rapide sur téléphone pour le trafic publicitaire.

> « Maison Nette » est un nom de travail provisoire, à vérifier (marque, domaine, réseaux) avant publication. La boutique n'est ni le site officiel ACE2ACE, ni un distributeur agréé du fabricant ; une mention l'indique en pied de page.

## Contenu

| Dossier | Rôle |
|---|---|
| `layout/` | Gabarit général (`theme.liquid`) et page mot de passe |
| `templates/` | Gabarits JSON : accueil, produit, **produit « tiktok »** (atterrissage publicitaire), panier, pages, contact, comptes clients… |
| `sections/` | Sections administrables (hero, problème, solution, avant/après, fonctionnement, gros plans, quotidien, offre, FAQ, dernier appel, fiche produit, panier…) |
| `snippets/` | Composants : galerie, formulaire d'achat, panier latéral, prix, images responsives… |
| `assets/` | CSS par section, `global.js` (léger, sans dépendance) |
| `config/` | Réglages du thème (couleurs, polices, panier, animations, réseaux) |
| `locales/` | Textes de l'interface en français |
| `docs/` | Guides : mise en ligne, textes légaux, suivi publicitaire et TikTok, référencement, vidéos |
| `dev/` | Outils de développement (non envoyés à Shopify) |

## Principes respectés

- **Vrai commerce Shopify** : formulaire produit natif, Ajax Cart API + Section Rendering API pour le panier latéral, paiement accéléré et checkout Shopify. Aucun faux panier, aucune simulation de paiement.
- **Aucune donnée inventée** : pas de prix barré, de compte à rebours, de faux stock, de faux avis ou de fausses commandes. Le stock affiché est celui de Shopify ; les frais et délais de livraison viennent de vos réglages.
- **Aucun visuel trompeur** : sans photo, un emplacement neutre s'affiche (et, dans l'éditeur seulement, la prise de vue attendue). Les comparaisons avant / après ne s'affichent qu'avec deux photos réelles marquées « vérifiées ». Les vidéos générées portent la mention « Illustration ».
- **Tout se règle dans l'administration** : textes, médias, ordre des sections, blocs, couleurs, polices, menus ; contenus produit via métachamps.
- **Performance et accessibilité** : téléphone d'abord, images responsives WebP/AVIF, chargement différé, vidéo lancée seulement si visible, respect de « moins d'animations » et de l'économie de données, navigation clavier, contrastes.
- **Suivi publicitaire** par les applications officielles TikTok, Meta et Google, avec consentement (bannière Shopify) et sans double comptage.

## Mise en ligne

Voir **[docs/01-mise-en-ligne.md](docs/01-mise-en-ligne.md)**. En bref :

```bash
npm install
npm run package          # crée dist/maison-nette-theme-0.1.0.zip
```

Puis Shopify › Boutique en ligne › Thèmes › Ajouter un thème › Importer un fichier zip.
Ou avec Shopify CLI : `shopify theme push --unpublished`.

## Outils de développement

```bash
npm run check            # Theme Check (règles officielles Shopify)
npm run preview          # aperçu local : http://localhost:4173 (données fictives, aucune photo)
npm run preview -- --design   # même aperçu avec les indications de l'éditeur de thème
npm run shots            # captures téléphone et ordinateur (aperçu lancé au préalable)
```

L'aperçu local rend les vrais fichiers Liquid avec liquidjs et simule le panier Ajax ; il sert à vérifier la mise en page. Seule une boutique Shopify fait foi (`shopify theme dev`).

## Guides

1. [Mise en ligne pas à pas](docs/01-mise-en-ligne.md)
2. [Textes légaux à compléter](docs/02-textes-legaux.md)
3. [Suivi publicitaire, consentement et TikTok](docs/03-suivi-publicitaire-et-tiktok.md)
4. [Référencement naturel](docs/04-referencement.md)
5. [Vidéos : hero, démonstration, publicité](docs/05-videos-higgsfield.md)
