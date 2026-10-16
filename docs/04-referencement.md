# Référencement naturel (SEO)

## Ce que le thème fait déjà

- Balise `canonical` sur chaque page (le modèle TikTok `?view=tiktok` pointe vers la fiche produit).
- Titres et descriptions issus des champs SEO de Shopify ; balises Open Graph et Twitter pour le partage.
- Un seul `h1` par page, sections en `h2`, éléments en `h3`.
- Données structurées : **Product / Offer** générées par Shopify à partir des vraies données (prix, devise, disponibilité, images), **BreadcrumbList** sur la fiche produit, **Organization / WebSite** sur l'accueil. Aucune note, aucun avis, aucune statistique.
- Images responsives avec texte alternatif, chargement différé hors du premier écran, format WebP/AVIF servi automatiquement par le CDN Shopify.
- Plan du site `/sitemap.xml` et `robots.txt` générés par Shopify.

## Titres et descriptions à saisir

| Page | Où | Titre (≈ 60 caractères max.) | Méta-description (≈ 155 caractères max.) |
|---|---|---|---|
| Accueil | Boutique en ligne › Préférences | Rouleau anti-poils chien et chat ACE2ACE \| Maison Nette | Retirez les poils de chien et de chat de votre canapé ou de la voiture avec le rouleau réutilisable ACE2ACE. Manuel, sans pile. 29,90 € TTC. |
| Produit | Fiche produit › Référencement | Rouleau réutilisable anti-poils ACE2ACE – chien et chat | Rouleau anti-poils ACE2ACE : collectez les poils de chien et de chat sur vos textiles compatibles, puis videz le compartiment. Sans pile ni branchement. |
| FAQ / pages | Chaque page › Référencement | Titre explicite de la page | Résumé factuel de la page |

Remplacez « Maison Nette » par le nom définitif de la boutique.

## Mots-clés et emplacement naturel

| Mot-clé | Où il apparaît naturellement |
|---|---|
| Rouleau anti-poils animaux | Titre produit, accroche de l'accueil, description |
| Brosse anti-poils chien et chat | Description produit (« brosse » utilisé une fois, sans bourrage) |
| Enlever poils de chien canapé / Enlever poils de chat canapé | Section « Le problème », FAQ « Sur quels textiles… », texte alternatif des photos canapé |
| Rouleau réutilisable anti-poils | Titre produit, section « La solution » |
| Enlever poils de chien voiture | FAQ « sièges automobiles », section « Au quotidien », photo voiture |
| Brosse ACE2ACE | Marque (fournisseur), titre produit |

Règle : écrire pour le lecteur ; un mot-clé par paragraphe au plus, jamais de liste de mots-clés cachée.

## Textes alternatifs

Voir le tableau de prises de vue dans `docs/01-mise-en-ligne.md`. Un texte alternatif décrit l'image (« Rouleau ACE2ACE passé sur un canapé en tissu »), il ne répète pas des mots-clés.

## Après la mise en ligne

1. Google Search Console : ajouter le domaine, soumettre `https://[domaine]/sitemap.xml`.
2. Vérifier les résultats enrichis de la fiche produit avec l'outil « Test des résultats enrichis » de Google.
3. Contenus utiles possibles dans le blog (sans promesse chiffrée) : « Comment entretenir un canapé en tissu avec un chien », « Préparer la voiture avant un trajet avec son animal ».
