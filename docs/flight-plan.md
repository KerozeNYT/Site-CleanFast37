# Plan de vol — Clean Fast 37

Un seul plan continu, sans coupe ni téléportation : la caméra arrive sur le parvis, entre par la grande porte de l'atelier automobile, traverse l'atelier textile et la salle de séchage, sort par la porte arrière, fait demi-tour et révèle tout le site depuis le ciel.

Chronologie du master prévu : **clip A 0–14 s · clip B 14–28 s · clip C 28–42 s** (42 s au total).

## Visual Story

| Scene | Visual story | Website copy |
|---|---|---|
| 01 — Arrivée (0–5,5 s) | À hauteur d'œil sur le parvis mouillé à l'heure bleue. La caméra s'incline à gauche et longe en arc l'avant de la berline noire du parvis (on voit tout son profil), se recale à droite et s'aligne sur la grande porte sectionnelle ouverte. | **Clean Fast 37 · Nettoyage haut de gamme · Indre-et-Loire** — « Le soin du *détail*, de la carrosserie au canapé. » Nettoyage automobile intérieur et extérieur, entretien des tapis, canapés et matelas. → *Demander un devis* · *Nos prestations* |
| Transition — Porte d'entrée (5,5–7 s) | Glisse droit à travers la porte ouverte, de la lumière froide du soir à la lumière LED de l'atelier. | Pas de texte : le mouvement parle. |
| 02 — Atelier automobile (7–14 s) | Ralentit, dérive à droite et tourne la tête vers la gauche pour suivre tout le flanc de la berline noire sous la rampe LED hexagonale. Fait un S autour d'un SUV gris, plonge vers sa portière ouverte (sellerie cuir), remonte et vire à droite vers une porte vitrée ouverte. | **01 — Automobile** — « Extérieur comme intérieur, *sans compromis*. » Lavage à la main, décontamination, jantes et vitres ; aspiration, shampoing, cuirs, vapeur. → *Prestations automobile* |
| Transition — Porte vitrée (14–16,5 s) | Traverse la porte vitrée : la lumière passe du blanc froid au chaud de l'atelier textile. | Pas de texte. |
| 03 — Atelier textile (16,5–23 s) | S'incline à droite et regarde vers le bas un grand tapis en laine posé à plat, suceur posé dessus ; descend raser les fibres, remonte, frôle la machine d'injection-extraction et le canapé en lin sans ses coussins, puis vire à gauche. | **02 — Textile de la maison** — « Tapis et canapés retrouvent leur *éclat*. » Injection-extraction, vapeur et détachage selon la fibre. → *Prestations textile* |
| 04 — Séchage (23–28 s) | Passe une large ouverture, tourne à gauche dans l'allée entre deux rangées de tapis suspendus, slalome autour de deux séchoirs en A, et tourne à droite au bout. | **03 — Finition** — « Séchage maîtrisé, *contrôle* à la lumière. » → *Notre méthode* |
| Transition — Sortie et demi-tour (28–33,5 s) | Contourne l'angle, sort tout droit par la porte arrière ouverte dans la cour clôturée (utilitaire blanc, palettes, clôture, arbres, ciel). Continue d'avancer en faisant un lacet de 180° vers la gauche jusqu'à faire face à la porte qu'elle vient de franchir. | Pas de texte. |
| 05 — Révélation (33,5–42 s) | Recule et monte en s'inclinant vers le bas : toit et équipements, cour arrière, parvis avant, voie d'accès, route principale avec voitures arrêtées et réverbères, entrepôts voisins, arbres, lumières de la ville. Se stabilise en vue aérienne haute. | **Clean Fast 37** — « Votre atelier de nettoyage en *Indre-et-Loire*. » Coordonnées, zone d'intervention. → *Demander un devis* · *Coordonnées* |

### Le trajet

L'atelier est un bâtiment d'activité à toit plat (≈ 44 × 32 m) dans une zone d'activité, façade sud sur la route principale. À gauche de la façade, la grande porte sectionnelle de l'atelier automobile ; à droite, la vitrine de l'atelier textile. On entre côté automobile, on traverse vers l'atelier textile par une porte vitrée dans la cloison, on passe au nord dans la salle de séchage, et on sort par la porte arrière dans la cour de service. Chaque changement de pièce se fait en franchissant physiquement une ouverture.

Le scroll introduit chaque chapitre en fondu dès que la caméra entre dans la pièce correspondante, le maintient pendant la manœuvre, puis le retire avant la transition suivante. Les transitions (portes, sortie, demi-tour) restent sans texte pour laisser parler le mouvement. Le premier chapitre est lisible au repos ; le dernier reste affiché sur la vue aérienne finale.

## Scroll pacing

Distances en hauteurs d'écran (vh), indépendantes de la durée des clips. Chaque beat associe son propre intervalle de scroll à son propre intervalle du clip (`content/flight.json`).

| Beat | Scroll | Clip | Mouvement | Texte |
|---|---|---|---|---|
| Arrêt d'ouverture | 70 vh | 0 s | Arrêt sur image | Chapitre « Arrivée » lisible au repos |
| Approche | 150 vh | 0 → 5,5 s | Continu | « Arrivée » maintenu puis retiré sur les 26 derniers vh |
| Porte d'entrée | 60 vh | 5,5 → 7 s | Continu | Aucun |
| Atelier automobile | 210 vh | 7 → 14 s | Continu, dense : le plus de distance | « Automobile » entre, se maintient, sort |
| Porte vitrée | 60 vh | 14 → 16,5 s | Continu | Aucun |
| Atelier textile | 190 vh | 16,5 → 23 s | Continu, dense | « Textile » |
| Allée de séchage | 150 vh | 23 → 28 s | Continu | « Finition » |
| Sortie arrière | 70 vh | 28 → 30,5 s | Continu | Aucun |
| Lacet 180° | 80 vh | 30,5 → 33,5 s | Beat court dédié, pour que le demi-tour ne fasse pas l'effet d'un saut | Aucun |
| Recul et montée | 170 vh | 33,5 → 42 s | Continu | « Révélation » entre |
| Arrêt final | 90 vh | 42 s | Arrêt sur image | « Révélation » et ses boutons maintenus |

Total : **1 300 vh de défilement épinglé**, plus la hauteur de la scène (100 vh). Une fois le vrai master reçu, ces valeurs seront ajustées après un test de défilement réel (desktop et mobile).

### Composition responsive

- Desktop : texte dans le tiers gauche (le chapitre Textile à droite), action au centre ou à droite du cadre. Les prompts demandent de garder le tiers gauche calme sur l'image de départ.
- Mobile : le recadrage portrait suit un point focal par beat (`focus` dans `content/flight.json`) ; texte en bas avec un dégradé.
- Aucune action importante sur les bords extrêmes du cadre.
