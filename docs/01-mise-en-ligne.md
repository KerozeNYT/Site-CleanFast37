# Mise en ligne : pas à pas

Ce guide part d'une boutique Shopify vide. Ce qui est entre crochets **[À COMPLÉTER]** dépend de vous : aucune de ces informations n'a été inventée dans le thème.

## 1. Installer le thème

**Option A : fichier .zip (le plus simple)**
1. Sur votre ordinateur, dans ce dépôt : `npm install` puis `npm run package`. Le fichier `dist/maison-nette-theme-0.1.0.zip` est créé.
2. Shopify › **Boutique en ligne › Thèmes › Ajouter un thème › Importer un fichier zip**.
3. Le thème arrive **non publié** : personnalisez-le et vérifiez-le avant de cliquer sur **Publier**.

**Option B : Shopify CLI**
```bash
shopify theme push --store votre-boutique.myshopify.com --unpublished
shopify theme dev --store votre-boutique.myshopify.com   # aperçu local branché sur la vraie boutique
```

## 2. Réglages de la boutique (Paramètres)

| Réglage | Où | Valeur |
|---|---|---|
| Devise | Paramètres › Marchés / Paiements | EUR |
| Langue | Paramètres › Langues | Français (par défaut) |
| Marché | Paramètres › Marchés | France [À COMPLÉTER : autres pays éventuels] |
| Taxes | Paramètres › Taxes et droits | « Tous les prix incluent les taxes » **coché** (prix affichés TTC) |
| Moyens de paiement | Paramètres › Paiements | [À COMPLÉTER] Le thème n'affiche que ceux réellement activés |
| Expédition | Paramètres › Expédition et livraison | [À COMPLÉTER : transporteurs, zones, tarifs, délais] |
| Coordonnées | Paramètres › Coordonnées de la boutique | [À COMPLÉTER : raison sociale, adresse, e-mail, téléphone] |
| Politiques | Paramètres › Politiques | Voir `docs/02-textes-legaux.md` |
| Bannière cookies | Paramètres › Confidentialité des clients | Activer la bannière pour la France / l'UE (voir `docs/03-suivi-publicitaire-et-tiktok.md`) |

Format monétaire conseillé (Paramètres › Général › Devise de la boutique › Modifier le formatage) :
`{{amount_with_comma_separator}} €` → affiche « 29,90 € ».

## 3. Créer le produit

Produits › Ajouter un produit :

| Champ | Valeur |
|---|---|
| Titre | Rouleau anti-poils réutilisable ACE2ACE pour chiens et chats — blanc |
| Prix | 29,90 € |
| Prix barré (« Prix avant réduction ») | **Laisser vide** (aucune réduction n'existe) |
| Fournisseur (vendor) | ACE2ACE |
| Type de produit | Accessoire d'entretien pour animaux |
| Suivi des stocks | Activé, avec la **quantité réelle** reçue [À COMPLÉTER] |
| Continuer à vendre en rupture | Désactivé |
| Poids | [À COMPLÉTER : poids réel mesuré, utile au calcul de livraison] |
| SKU / code-barres | [À COMPLÉTER si disponibles sur l'emballage] |
| Identifiant de l'URL (handle) | `rouleau-anti-poils-ace2ace` |
| Canaux de vente | Boutique en ligne (+ TikTok, Facebook & Instagram, Google une fois les applications installées) |

### Description (proposition, uniquement des caractéristiques autorisées)

> Le rouleau anti-poils ACE2ACE, une brosse anti-poils réutilisable pour chien et chat, collecte les poils de vos compagnons sur les textiles du quotidien : canapé en tissu, coussins, panier, sièges de voiture, dans la limite des textiles compatibles indiqués par le fabricant.
>
> **Comment ça marche ?** Passez le rouleau en va-et-vient sur le textile. Les poils sont collectés dans son compartiment. Ouvrez ensuite le compartiment pour le vider.
>
> **Manuel et réutilisable.** Il fonctionne sans pile, sans batterie et sans branchement électrique.
>
> Modèle : blanc.

Aucune dimension, matière, garantie commerciale ou performance chiffrée n'est indiquée : ajoutez-les seulement si elles figurent sur l'emballage ou la notice du fabricant.

### Métachamps (Paramètres › Données personnalisées › Produits › Ajouter une définition)

| Nom | Espace de noms et clé | Type | Utilisé par |
|---|---|---|---|
| Description courte | `custom.short_description` | Texte enrichi | Offre (accueil), fiche produit |
| Utilisation | `custom.usage` | Texte enrichi | Accordéon « Utilisation » |
| Entretien | `custom.care` | Texte enrichi | Accordéon « Entretien » |
| Livraison | `custom.delivery` | Texte enrichi | Accordéon « Livraison » |
| Retours | `custom.returns` | Texte enrichi | Accordéon « Retours » |

Si un métachamp est vide, le thème affiche le texte de secours défini dans l'éditeur (factuel et prudent), ou masque l'accordéon.

### Photos à fournir (liste de prises de vue)

Fond clair et lumière douce pour les vues produit ; intérieurs réels et lumineux pour les mises en situation. Format carré 2048 × 2048 px minimum pour la fiche produit.

| # | Prise de vue | Texte alternatif proposé |
|---|---|---|
| 1 | Rouleau fermé, vue 3/4, fond clair | Rouleau anti-poils ACE2ACE blanc, fermé, vue de trois quarts |
| 2 | Rouleau ouvert | Rouleau anti-poils ACE2ACE ouvert, compartiment de collecte visible |
| 3 | Gros plan du compartiment | Compartiment de collecte du rouleau ACE2ACE contenant des poils |
| 4 | Gros plan de la poignée | Poignée du rouleau anti-poils ACE2ACE |
| 5 | En situation sur un canapé en tissu | Rouleau ACE2ACE passé sur un canapé en tissu |
| 6 | En situation dans une voiture | Rouleau ACE2ACE sur une banquette de voiture en tissu |
| 7 | Avec l'animal à proximité | Chien allongé à côté du rouleau ACE2ACE sur un canapé |
| 8–15 | **Avant / après réels**, même cadrage, même lumière, sans retouche : canapé, voiture, tapis compatible, panier | Canapé en tissu avant / après passage du rouleau ACE2ACE |

Les comparaisons avant / après ne s'affichent sur la boutique qu'une fois les deux photos ajoutées **et** la case « Photos réelles vérifiées » cochée dans la section.

## 4. Menus (Boutique en ligne › Menus)

| Menu (identifiant) | Liens proposés |
|---|---|
| Menu principal (`main-menu`) | Le rouleau → produit · Démonstration → `/#demonstration` · Questions → `/#faq` · Contact → page Contact |
| Aide (`footer`) | Livraison → politique d'expédition · Retours et rétractation → politique de remboursement · Contact · Questions fréquentes → `/#faq` |
| Informations légales (`legal`) | Mentions légales · Conditions générales de vente · Confidentialité · Cookies · Garanties légales |

## 5. Pages (Boutique en ligne › Pages)

| Page | Modèle de thème | Contenu |
|---|---|---|
| Contact | `page.contact` | Coordonnées réelles [À COMPLÉTER] ; le formulaire envoie les messages à l'e-mail de la boutique |
| Cookies | `page` | Texte de `docs/02-textes-legaux.md` |
| Garanties légales | `page` | Texte de `docs/02-textes-legaux.md` |

## 6. Personnaliser dans l'éditeur de thème

Boutique en ligne › Thèmes › Personnaliser :
- **Paramètres du thème** : logo, couleurs, polices, panier latéral ou page panier, réseaux sociaux, image de partage.
- **Accueil** : chaque section a ses médias (photo, vidéo ordinateur, vidéo verticale téléphone), ses textes et ses blocs. Sans média, un emplacement neutre s'affiche ; dans l'éditeur, il indique la prise de vue attendue.
- **Produit** : blocs déplaçables (titre, prix, stock, boutons d'achat, réassurance, accordéons) et blocs d'applications.
- **Produit › modèle « tiktok »** : page d'atterrissage publicitaire (voir `docs/03`).

## 7. Vérifications avant publication

- [ ] Prix 29,90 € TTC, aucun prix barré.
- [ ] Stock réel renseigné ; le bouton passe à « Épuisé » à 0.
- [ ] Commande test de bout en bout (Paramètres › Paiements › mode test ou Bogus Gateway).
- [ ] Frais et délais de livraison réels, identiques dans la politique d'expédition.
- [ ] Politiques complètes, mentions légales et médiateur renseignés.
- [ ] Bannière cookies active ; les pixels ne se déclenchent qu'après consentement.
- [ ] Photos et vidéos réelles ; mention « Illustration » cochée pour tout média généré.
- [ ] Nom de marque « Maison Nette » vérifié (INPI, domaine, réseaux) ou remplacé.
- [ ] Mention sur la marque ACE2ACE visible en pied de page.
