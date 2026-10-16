# Suivi publicitaire, consentement et TikTok

## Principe : une seule source par plateforme

Le thème **ne contient aucun pixel codé en dur**. Le suivi passe uniquement par les applications officielles, qui s'appuient sur les événements standard de Shopify (Web Pixels) et sur l'envoi côté serveur (API de conversions). C'est ce qui évite le double comptage.

| Plateforme | Application officielle (Shopify App Store) | À régler dans l'application |
|---|---|---|
| TikTok | **TikTok** | Pixel + partage de données « Maximum » (Events API) ; synchronisation du catalogue |
| Meta (Facebook, Instagram) | **Facebook & Instagram** | Pixel + API de conversions, niveau de partage « Maximum » |
| Google (Analytics 4, Ads) | **Google & YouTube** | Liaison GA4 et Google Ads ; conversions importées depuis Shopify |

À ne pas faire :
- coller un code de pixel dans `theme.liquid` ou dans un « pixel personnalisé » en plus de l'application : chaque événement serait compté deux fois ;
- installer à la fois Google Tag Manager et l'application Google & YouTube pour les mêmes conversions ;
- créer des conversions manuelles sur la page de remerciement.

## Correspondance des événements

Shopify publie automatiquement ces événements ; les applications les traduisent pour chaque plateforme, avec un identifiant d'événement commun au pixel et à l'envoi serveur (déduplication).

| Moment | Événement Shopify | TikTok | Meta | GA4 |
|---|---|---|---|---|
| Fiche produit vue | `product_viewed` | ViewContent | ViewContent | view_item |
| Ajout au panier (y compris en Ajax depuis l'accueil, la fiche, la page TikTok ou la barre fixe) | `product_added_to_cart` | AddToCart | AddToCart | add_to_cart |
| Paiement commencé | `checkout_started` | InitiateCheckout | InitiateCheckout | begin_checkout |
| Commande payée | `checkout_completed` | CompletePayment / Purchase | Purchase | purchase |

Vérification : extensions **TikTok Pixel Helper**, **Meta Pixel Helper** et **Google Tag Assistant**, plus le **Gestionnaire d'événements** de chaque plateforme (mode test). Faites une commande test : chaque événement doit apparaître **une seule fois**.

## Consentement (RGPD et recommandations de la CNIL)

1. Paramètres › **Confidentialité des clients** › activer la **bannière de cookies** pour la France et l'Union européenne.
2. Les applications officielles respectent automatiquement le choix du visiteur transmis par l'API Customer Privacy de Shopify : sans consentement, pas de cookies publicitaires.
3. Le thème affiche un bouton « Préférences de cookies » en pied de page dès que la bannière est active.
4. Décrivez les services utilisés dans la page Cookies et la politique de confidentialité (voir `docs/02-textes-legaux.md`).

## Paramètres UTM

Convention conseillée (minuscules, sans accents ni espaces) :

| Paramètre | Valeur |
|---|---|
| `utm_source` | `tiktok`, `meta`, `google` |
| `utm_medium` | `paid_social`, `cpc`, `organic_social`, `email` |
| `utm_campaign` | nom de la campagne |
| `utm_content` | nom de la publicité ou de la vidéo |

Macros dynamiques proposées par les régies (à vérifier dans leur interface au moment de la création) : TikTok `__CAMPAIGN_NAME__`, `__AID_NAME__`, `__CID_NAME__` ; Meta `{{campaign.name}}`, `{{adset.name}}`, `{{ad.name}}`.

## Page d'atterrissage TikTok

URL à utiliser dans les publicités :

```
https://[votre-domaine]/products/rouleau-anti-poils-ace2ace?view=tiktok&utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__
```

Ce modèle (`templates/product.tiktok.json`) affiche immédiatement le produit, le prix et le bouton d'achat, sans animation longue ni fil d'Ariane, avec la barre d'achat fixe sur téléphone, puis le fonctionnement et la FAQ. Son adresse canonique reste celle de la fiche produit : pas de contenu dupliqué pour les moteurs de recherche.

Pour l'utiliser avec Meta : même URL avec `utm_source=meta`.

## Préparer TikTok Shop

L'application TikTok de Shopify peut synchroniser le catalogue vers TikTok Shop dans les pays où ce service est ouvert. Points à préparer, **sans rien inventer** :
- **Autorisation de marque** : TikTok Shop peut exiger une preuve de droit à vendre une marque tierce (facture du fournisseur, autorisation du titulaire de la marque ACE2ACE). Rassemblez ces justificatifs avant la demande.
- Images : produit seul sur fond clair, format carré, haute définition, sans texte ni logo ajouté.
- Titre et description : ceux de la fiche Shopify (caractéristiques documentées uniquement).
- Poids et dimensions du colis : **mesurés**, nécessaires au calcul de la livraison.
- Stock : la quantité Shopify est synchronisée ; évitez les ventes en rupture.
- Politiques de livraison et de retour identiques à celles de la boutique.
- Code-barres (GTIN/EAN) s'il figure sur l'emballage.
