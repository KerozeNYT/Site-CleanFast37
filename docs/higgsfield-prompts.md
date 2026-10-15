# Pack de prompts Higgsfield — vol continu Clean Fast 37

Objectif : un rendu **photoréaliste**, en **un seul plan continu**. Les prompts sont en anglais, car les modèles les suivent mieux. Copie chaque bloc tel quel.

## Ordre de production

| Étape | Quoi | Modèle conseillé | Réglages |
|---|---|---|---|
| 1 | 3 images de départ (choisir 1) | **Nano Banana Pro** (sinon Seedream 4.5) | 16:9, 2K ou 4K |
| 2 | Image de référence aérienne | Nano Banana Pro, **avec l'image de départ choisie en référence** | 16:9, 2K |
| 3 | Clip A (0–14 s) | **Seedance 2.5**, mode *Omni reference* | Image de départ = start image · 14 s · 1080p · 16:9 · audio **off** |
| 4 | Clip B (14–28 s) | Seedance 2.5, mode *Video extension*, **forward** | Vidéo de référence = clip A · 14 s · 1080p · audio off |
| 5 | Clip C (28–42 s) | Seedance 2.5, *Video extension*, **forward** | Vidéo de référence = clip B **+ image aérienne de l'étape 2** en référence · 14 s · 1080p · audio off |

Conseils :
- **Regarde chaque clip avant de lancer le suivant.** S'il y a un défaut (objet volant, voiture qui apparaît, logo, saut), envoie-le-moi avant d'étendre : souvent, couper la fin abîmée et étendre depuis la partie propre coûte moins cher que tout refaire.
- Si Higgsfield propose un **brouillon 480p** (*draft*) pour Seedance 2.5, utilise-le pour valider le mouvement, puis finalise en 1080p.
- Si l'interface propose un *preset* ou une « amélioration du prompt » qui ne correspond pas, **refuse-la** et garde le texte tel quel.
- Ne mets jamais le mot « drone » dans un prompt vidéo : le modèle dessinerait un drone dans l'image.
- Note les crédits consommés après chaque génération : les extensions coûtent souvent plus que prévu, car elles traitent aussi la vidéo d'entrée.

Quand c'est prêt, dis-le-moi : je récupère les fichiers dans ton historique Higgsfield, je contrôle chaque clip (planche contact, détection de coupes, raccords), puis j'assemble le master et les images du site.

---

## Description commune du lieu (pour info, déjà incluse dans les prompts)

Bâtiment d'activité moderne à toit plat dans une zone d'activité près de Tours. Bardage métallique anthracite à joints debout verticaux, bandeau haut blanc cassé **sans lettrage**. À gauche, grande porte sectionnelle ouverte sur l'atelier automobile (lumière LED froide) ; à droite, vitrine à fins cadres noirs sur l'atelier textile (lumière chaude). Parvis en asphalte mouillé, berline noire sans logo. Heure bleue.

---

## Étape 1 — Images de départ (générer les 3, en choisir 1)

### Direction A — Heure bleue, sol mouillé (premium, nocturne doux)

```
Photorealistic architectural photograph at blue hour, eye-level, camera 1.7 m above the ground, standing on a wet dark asphalt forecourt about 25 m in front of a modern single-storey industrial workshop in a small business park in the Loire Valley, France. Flat-roof building about 44 m wide and 8 m tall, facade of dark anthracite vertical standing-seam metal cladding, a continuous plain warm off-white fascia band along the top edge with no lettering. On the left part of the facade a 6 m wide sectional garage door is fully open, the interior glowing with cool white light: a hexagonal LED light grid on a dark ceiling, a polished light grey epoxy floor and the glossy rear of a black car inside. To the right, a long floor-to-ceiling glazed shopfront with slim black aluminium frames shows a warm-lit textile workshop with pendant lights, shelves of folded fabrics and a linen sofa. A freshly detailed glossy black unbadged sedan is parked on the forecourt slightly left of the open door, water beads on its paint, reflections of the warm and cool light. White parking lines on the asphalt, puddle reflections. The open garage door sits just right of the image centre; the left third of the frame stays calm: empty parking bays, a neighbouring grey warehouse, deep blue sky fading to warm amber at the horizon. Shot on a full-frame camera, 24 mm lens, f/5.6, natural perspective, realistic exposure, crisp detail, subtle film grain. No people. No text, no logos, no brand badges, no signage lettering, blank number plates.
```

### Direction B — Fin d'après-midi dorée (chaleureux, accueillant)

```
Photorealistic architectural photograph in late golden-hour sunlight, eye-level, camera 1.7 m above the ground on a clean dry dark asphalt forecourt about 25 m in front of a modern single-storey industrial workshop in a small business park in the Loire Valley, France. Flat-roof building about 44 m wide and 8 m tall, facade of dark anthracite vertical standing-seam metal cladding with low warm sunlight raking across the ribs, a continuous plain warm off-white fascia band along the top edge with no lettering. On the left part of the facade a 6 m wide sectional garage door is fully open onto a bright detailing bay with a hexagonal LED light grid, polished light grey epoxy floor and the glossy rear of a black car. To the right, a long glazed shopfront with slim black frames reveals a warm textile workshop with a linen sofa and shelves of folded fabrics. A glossy black unbadged sedan is parked on the forecourt slightly left of the open door, sunlight sliding along its flank. The open door sits just right of the image centre; the left third of the frame stays calm: empty parking bays, a neighbouring warehouse, trees and a soft clear sky. Full-frame camera, 24 mm lens, f/5.6, natural perspective, realistic exposure, crisp detail. No people. No text, no logos, no brand badges, no signage lettering, blank number plates.
```

### Direction C — Nuit, fine pluie (dramatique)

```
Photorealistic architectural photograph at night after light rain, eye-level, camera 1.7 m above the ground on a glossy wet asphalt forecourt about 25 m in front of a modern single-storey industrial workshop in a small business park in the Loire Valley, France. Flat-roof building about 44 m wide and 8 m tall, dark anthracite vertical standing-seam metal cladding, a plain warm off-white fascia band along the top edge with no lettering, softly lit by small wall lights. On the left part of the facade a 6 m wide sectional garage door is fully open, the interior blazing with cool white light from a hexagonal LED grid over a polished epoxy floor, the glossy rear of a black car inside; the light spills across the wet forecourt. To the right a long glazed shopfront with slim black frames glows warm, showing a textile workshop with a linen sofa and folded fabrics. A glossy black unbadged sedan stands on the forecourt slightly left of the open door, mirror-like reflections in the puddles. The open door sits just right of the image centre; the left third of the frame stays dark and calm: empty parking bays, a neighbouring warehouse, a deep navy sky with low clouds lit by distant town light. Full-frame camera, 24 mm lens, f/4, realistic night exposure, no blown highlights, fine grain. No people. No text, no logos, no brand badges, no signage lettering, blank number plates.
```

---

## Étape 2 — Image de référence aérienne (avec l'image choisie en référence)

À générer **en mettant l'image de départ choisie en référence**, pour garder la même architecture. Adapte la lumière (blue hour / golden hour / night) à la direction choisie.

```
Using the reference image of this exact building (same dark anthracite vertical standing-seam cladding, same plain off-white fascia band without lettering, same flat roof, same proportions and glazing), a photorealistic high aerial photograph taken from about 55 m altitude BEHIND the building, looking forward over its rear toward the main road in front, tilted about 30 degrees down. In the foreground: the fenced rear service yard on dark asphalt with a white unbadged panel van, stacked pallets, two dark waste containers, a black steel bar fence with a row of trees and a narrow service road behind it. The rear wall has an open roller door near its middle, interior light spilling out. The flat roof shows rooftop HVAC units and rows of solar panels. Beyond the building: the front forecourt with white parking lines and the black sedan, an access road joining a four-lane main road with a few stationary cars with headlights on, glowing street lamps, neighbouring business-park warehouses with their own car parks, trees, and the lights of the town in the distance. Same time of day and lighting as the reference image. Realistic scale and geography, everything connected by roads, nothing floating. Shot on a full-frame camera, 24 mm lens. No people. No text, no logos, no signage lettering.
```

---

## Étape 3 — Clip A (0–14 s) · Seedance 2.5 · Omni reference · image de départ = start image

```
One single continuous first-person camera move, no cuts, 14 seconds, starting exactly from the reference image. The camera itself is flying smoothly and precisely like an expert pilot's first-person camera; nothing flying or hovering is ever visible in frame. Every vehicle, person and object is stationary unless described; nothing appears, disappears or changes.
0-3s: the camera glides forward at eye height across the wet forecourt, banking gently to the left and arcing past the front quarter of the parked black sedan so that its full side profile and reflections slide past on the left.
3-5.5s: it curves back to the right, lines up with the wide open sectional garage door and gathers a little speed.
5.5-7s: it glides straight through the open door into the detailing bay; the exposure adapts from the evening exterior to the cool white LED interior.
7-10s: it slows down, drifts to the right and yaws left to look along the full length of a glossy black unbadged sedan parked under a large hexagonal LED light grid, the grid reflected across its paint and on the polished light grey epoxy floor; dark graphite walls, black ceiling, plain unlabeled bottles on wall shelves.
10-12.5s: it S-curves around a grey unbadged SUV parked further back, dipping low to look through its open front door at clean tan leather seats.
12.5-14s: it rises slightly and turns right toward an open frameless glass door in a white partition at the back right of the bay; through the doorway a warm-lit textile workshop is visible.
Photorealistic, natural motion blur, 24 mm lens look, stable horizon with slight banking in the turns, realistic reflections. No people. No text, no logos, no brand badges, no signage lettering, blank number plates.
```

---

## Étape 4 — Clip B (14–28 s) · Seedance 2.5 · Video extension · forward · vidéo de référence = clip A

```
Continue the exact same single continuous first-person camera move from the last frame of the reference video, same speed, lens, exposure and lighting, no cuts. The camera itself is flying; nothing flying or hovering is ever visible in frame. Every object is stationary unless described; nothing appears, disappears or changes.
0-2.5s: the camera flies straight through the open glass door into a warm, softer textile workshop: pale off-white walls, light oak work tables, warm pendant lights.
2.5-5s: it banks right and yaws right to look down at a large hand-knotted wool rug in terracotta, indigo and cream lying flat on a grey wash floor, a stainless steel extraction wand resting on it beside a compact carpet-extraction machine.
5-7.5s: it dips low and skims just above the edge of the rug so that the wool fibres and pattern fill the frame, then rises again.
7.5-9s: it curves past the extraction machine and a natural linen sofa with its seat cushions removed and stacked on a work table, then banks left.
9-10.5s: it passes through a wide opening in the back wall into a long drying room.
10.5-12.5s: it turns left into an aisle between two rows of cleaned rugs hanging from stainless steel rails, weaving left then right around two freestanding A-frame drying racks with draped rugs; dehumidifiers stand on the floor.
12.5-14s: it reaches the end of the aisle and turns right toward the rear wall; ahead, an open roller door shows the outside: a fenced rear yard, a white unbadged van and the evening sky.
Photorealistic, natural motion blur, 24 mm lens look. No people. No text, no logos, no labels, no signage lettering.
```

---

## Étape 5 — Clip C (28–42 s) · Seedance 2.5 · Video extension · forward · vidéo = clip B + image aérienne (étape 2) en référence

```
Continue the exact same single continuous first-person camera move from the last frame of the reference video, same speed, lens and lighting, no cuts. The camera itself is flying; nothing flying or hovering is ever visible in frame. Every vehicle and object is stationary; nothing appears, disappears or changes. The final aerial view must match the reference image.
0-2.5s: the camera rounds the corner and flies straight out through the open rear roller door into the fenced service yard: dark asphalt, a white unbadged panel van, stacked pallets, waste containers, a black steel bar fence with trees behind it and the evening sky. The view ahead shows only the yard, the fence and the trees, never the front of the building.
2.5-5.5s: still moving forward across the yard and rising slightly, the camera yaws 180 degrees to the left in one smooth turn until it faces back at the rear wall of the building and the open roller door it has just come out of.
5.5-14s: it flies backwards and climbs steadily while tilting down, revealing the whole building: the flat roof with rooftop units and solar panels, the rear yard, then beyond it the front forecourt with the black sedan, the access road joining the main road with stationary cars with headlights on and glowing street lamps, neighbouring business-park warehouses, trees and the town lights in the distance. It ends on a stable high aerial view matching the reference image.
Photorealistic, consistent architecture: same dark anthracite cladding, same off-white fascia band, same flat roof. Natural motion blur, 24 mm lens look. No people. No text, no logos, no signage lettering.
```

---

## Ce que je vérifierai sur chaque clip

- Aucune coupe cachée (détection de changement de plan), aucun saut de position, d'échelle ou de lumière.
- Pas de drone ni d'objet volant, pas de voiture ou de personne qui apparaît, pas de logo ni de lettrage.
- Les raccords : dernière image du clip A = première du clip B, et ainsi de suite.
- La sortie arrière montre bien la cour (pas la façade avant), le lacet de 180° est continu, la vue finale est géographiquement crédible.

Réparations possibles plutôt que régénération : couper un passage abîmé et étendre depuis une partie propre, ou retoucher un petit défaut par édition vidéo (par ex. FLUX 3 Video Edit : « remove the small flying object from every frame; keep everything else identical »).
