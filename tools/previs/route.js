// Trajet de la caméra (un seul plan continu, sans coupe).
// Chaque clé : t (s), position x/y/z (m), yaw (° ; 0 = nord, +90 = ouest, -90 = est, 180 = sud),
// pitch (° ; négatif = regarde vers le bas). Le roulis est calculé à partir de la vitesse de lacet
// (le pilote s'incline dans les virages), plus un éventuel ajout « roll ».
// Les temps correspondent au master vidéo prévu : clip A 0–14 s, clip B 14–28 s, clip C 28–42 s.
export const ROUTE = [
  // 01 — Arrivée : approche à hauteur d'œil, arc le long de la berline du parvis, alignement sur la porte
  { t: 0.0, x: 7.0, y: 1.9, z: 41.0, yaw: 31, pitch: -3 },
  { t: 1.6, x: 2.4, y: 1.6, z: 35.2, yaw: 44, pitch: -5 },
  { t: 3.0, x: -1.0, y: 1.35, z: 29.0, yaw: 72, pitch: -7 },
  { t: 4.3, x: -4.8, y: 1.45, z: 22.6, yaw: 46, pitch: -4 },
  { t: 5.5, x: -10.6, y: 1.6, z: 18.0, yaw: 14, pitch: -2 },
  // Porte sectionnelle : on glisse à l'intérieur
  { t: 7.0, x: -12.0, y: 1.65, z: 11.0, yaw: 2, pitch: -3 },
  // 02 — Atelier auto : ralentit, s'incline et regarde le flanc de la berline, S autour du SUV, plonge vers la portière
  { t: 8.5, x: -12.7, y: 1.35, z: 6.6, yaw: 38, pitch: -6 },
  { t: 10.0, x: -12.9, y: 1.1, z: 1.6, yaw: 58, pitch: -5 },
  { t: 11.2, x: -12.0, y: 1.3, z: -3.4, yaw: -8, pitch: -4 },
  { t: 12.4, x: -8.6, y: 0.95, z: -6.3, yaw: -22, pitch: -9 },
  { t: 13.2, x: -5.2, y: 1.3, z: -5.2, yaw: -62, pitch: -4 },
  { t: 14.0, x: -2.7, y: 1.5, z: -3.85, yaw: -88, pitch: -2 },
  // Transition : porte vitrée vers l'atelier textile
  { t: 15.0, x: 0.4, y: 1.55, z: -3.8, yaw: -92, pitch: -3 },
  { t: 16.5, x: 2.8, y: 1.6, z: -3.2, yaw: -104, pitch: -8 },
  // 03 — Atelier textile : longe le tapis en le regardant, plonge près des fibres, frôle la machine et le canapé
  { t: 17.8, x: 5.0, y: 1.55, z: -0.9, yaw: -148, pitch: -28 },
  { t: 19.2, x: 8.0, y: 0.75, z: 0.4, yaw: -168, pitch: -20 },
  { t: 20.6, x: 11.4, y: 1.2, z: 0.6, yaw: -128, pitch: -9 },
  { t: 22.0, x: 15.0, y: 1.45, z: -1.4, yaw: -62, pitch: -4 },
  { t: 23.0, x: 17.9, y: 1.5, z: -4.3, yaw: -8, pitch: -2 },
  // 04 — Séchage : passage, virage à gauche dans l'allée, slalom entre les séchoirs, virage à droite au bout
  { t: 24.0, x: 18.0, y: 1.55, z: -8.0, yaw: 14, pitch: -2 },
  { t: 25.0, x: 15.8, y: 1.6, z: -10.8, yaw: 74, pitch: -3 },
  { t: 26.0, x: 11.6, y: 1.55, z: -11.6, yaw: 96, pitch: -3 },
  { t: 27.0, x: 7.6, y: 1.5, z: -10.4, yaw: 82, pitch: -2 },
  { t: 28.0, x: 4.6, y: 1.5, z: -11.3, yaw: 52, pitch: -1 },
  // Sortie par la porte arrière vers la cour (on voit la cour, la clôture, les arbres, le ciel)
  { t: 29.0, x: 3.6, y: 1.6, z: -13.9, yaw: 10, pitch: 0 },
  { t: 30.0, x: 3.5, y: 1.85, z: -17.6, yaw: 0, pitch: 1 },
  { t: 30.5, x: 3.5, y: 2.05, z: -19.6, yaw: 0, pitch: 1 },
  // Lacet de 180° en continuant d'avancer
  { t: 31.5, x: 3.6, y: 2.7, z: -23.2, yaw: 50, pitch: 0 },
  { t: 32.5, x: 3.7, y: 3.5, z: -26.2, yaw: 128, pitch: -3 },
  { t: 33.5, x: 3.8, y: 4.6, z: -28.8, yaw: 180, pitch: -6 },
  // 05 — Révélation : recul et montée, l'atelier, sa cour, la zone d'activité, la route principale
  { t: 35.5, x: 3.8, y: 9.5, z: -36.0, yaw: 180, pitch: -12 },
  { t: 38.0, x: 3.5, y: 22.0, z: -52.0, yaw: 180, pitch: -21 },
  { t: 40.0, x: 3.0, y: 38.0, z: -70.0, yaw: 180, pitch: -26 },
  { t: 42.0, x: 2.5, y: 54.0, z: -88.0, yaw: 180, pitch: -28 }
];

const KEYS = ["x", "y", "z", "yaw", "pitch"];

function tangent(i, k) {
  const R = ROUTE;
  if (i === 0) return (R[1][k] - R[0][k]) / (R[1].t - R[0].t);
  if (i === R.length - 1) return 0.35 * (R[i][k] - R[i - 1][k]) / (R[i].t - R[i - 1].t);
  return (R[i + 1][k] - R[i - 1][k]) / (R[i + 1].t - R[i - 1].t);
}

// Hermite cubique paramétré en temps : vitesse continue d'une clé à l'autre.
function hermite(i, u, h, k) {
  const p0 = ROUTE[i][k], p1 = ROUTE[i + 1][k];
  const m0 = tangent(i, k) * h, m1 = tangent(i + 1, k) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
}

function raw(t) {
  const R = ROUTE;
  t = Math.max(R[0].t, Math.min(R[R.length - 1].t, t));
  let i = 0;
  while (i < R.length - 2 && t > R[i + 1].t) i++;
  const h = R[i + 1].t - R[i].t;
  const u = h > 0 ? (t - R[i].t) / h : 0;
  const out = {};
  for (const k of KEYS) out[k] = hermite(i, u, h, k);
  return out;
}

export function sampleRoute(t) {
  const s = raw(t);
  // Roulis : le pilote s'incline dans le sens du virage (proportionnel à la vitesse de lacet).
  const dt = 0.08;
  const yawRate = (raw(t + dt).yaw - raw(t - dt).yaw) / (2 * dt); // °/s
  const altitudeFade = Math.max(0, 1 - Math.max(0, s.y - 6) / 10);
  s.roll = Math.max(-11, Math.min(11, yawRate * 0.11)) * altitudeFade;
  return s;
}
