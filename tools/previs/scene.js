// Prévisualisation 3D (maquette « grey-box ») du vol continu Clean Fast 37.
// Même implantation et même trajet que les prompts Higgsfield (docs/higgsfield-prompts.md).
// Repère : x = est, y = haut, z = sud (vers la route principale). Unités : mètres.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ROUTE, sampleRoute } from "./route.js";

const params = new URLSearchParams(location.search);
const W = +params.get("w") || 1280;
const H = +params.get("h") || 720;

RectAreaLightUniformsLib.init();
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.32;
scene.fog = new THREE.FogExp2(new THREE.Color("#55617a"), 0.0042);

const camera = new THREE.PerspectiveCamera(56, W / H, 0.05, 4000);
camera.rotation.order = "YXZ";

/* ——— Ciel de crépuscule ——— */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(2500, 48, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color("#0f1c31") },
      mid: { value: new THREE.Color("#33496b") },
      horizon: { value: new THREE.Color("#c98d68") },
      sunDir: { value: new THREE.Vector3(-0.85, 0.04, 0.35).normalize() }
    },
    vertexShader: `varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.2, h));
        c = mix(c, top, smoothstep(0.2, 0.8, h));
        float s = max(dot(d, sunDir), 0.0);
        c += vec3(1.0, 0.55, 0.3) * pow(s, 14.0) * 0.45 * (1.0 - smoothstep(0.0, 0.35, h));
        if (h < 0.0) c = mix(horizon * 0.55, vec3(0.06, 0.07, 0.08), smoothstep(0.0, 0.15, -h));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  })
);
sky.renderOrder = -1;
scene.add(sky);

/* ——— Matériaux ——— */
function stripeTexture(base, line, n = 32, w = 256) {
  const c = document.createElement("canvas");
  c.width = w; c.height = 8;
  const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, w, 8);
  g.fillStyle = line;
  for (let i = 0; i < n; i++) g.fillRect((i * w) / n, 0, Math.max(1, w / n / 6), 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const cladTex = stripeTexture("#2c3236", "#1d2124", 24);
cladTex.repeat.set(6, 1);
const M = {
  clad: new THREE.MeshStandardMaterial({ color: "#ffffff", map: cladTex, roughness: 0.62, metalness: 0.35 }),
  fascia: new THREE.MeshStandardMaterial({ color: "#d8d2c6", roughness: 0.55 }),
  panel: new THREE.MeshStandardMaterial({ color: "#e4e2dc", roughness: 0.8 }),
  panelWarm: new THREE.MeshStandardMaterial({ color: "#e9e3d8", roughness: 0.85 }),
  roof: new THREE.MeshStandardMaterial({ color: "#3b4044", roughness: 0.9 }),
  ceiling: new THREE.MeshStandardMaterial({ color: "#26292c", roughness: 0.95 }),
  epoxy: new THREE.MeshStandardMaterial({ color: "#9aa0a4", roughness: 0.2, metalness: 0.05 }),
  concrete: new THREE.MeshStandardMaterial({ color: "#7b7e80", roughness: 0.85 }),
  asphalt: new THREE.MeshStandardMaterial({ color: "#2b2e31", roughness: 0.92 }),
  asphaltWet: new THREE.MeshStandardMaterial({ color: "#2a2d30", roughness: 0.55 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: "#6e7173", roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: "#2f3a31", roughness: 1 }),
  line: new THREE.MeshStandardMaterial({ color: "#d9d8d2", roughness: 0.7 }),
  frame: new THREE.MeshStandardMaterial({ color: "#16191b", roughness: 0.4, metalness: 0.6 }),
  steel: new THREE.MeshStandardMaterial({ color: "#8d949a", roughness: 0.35, metalness: 0.8 }),
  dark: new THREE.MeshStandardMaterial({ color: "#1b1f22", roughness: 0.6, metalness: 0.2 }),
  glass: new THREE.MeshStandardMaterial({ color: "#a9c2cf", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false }),
  glassDark: new THREE.MeshStandardMaterial({ color: "#0c1216", roughness: 0.04, metalness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: "#121314", roughness: 0.85 }),
  linen: new THREE.MeshStandardMaterial({ color: "#cfc5b2", roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: "#a07c55", roughness: 0.8 }),
  ledCool: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#eef5ff", emissiveIntensity: 7 }),
  ledWarm: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffd9a6", emissiveIntensity: 5 }),
  lamp: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffc98a", emissiveIntensity: 6 }),
  winGlow: new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#f3dcb8", emissiveIntensity: 0.9 }),
  winDim: new THREE.MeshStandardMaterial({ color: "#3d4954", roughness: 0.2, metalness: 0.5 }),
  tail: new THREE.MeshStandardMaterial({ color: "#2a0606", emissive: "#5a0b0b", emissiveIntensity: 0.6 }),
  head: new THREE.MeshStandardMaterial({ color: "#dfe6ea", emissive: "#cfd9e0", emissiveIntensity: 0.25, roughness: 0.1 }),
  headOn: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#fff3dc", emissiveIntensity: 4 }),
  tailOn: new THREE.MeshStandardMaterial({ color: "#300", emissive: "#ff2a1a", emissiveIntensity: 3 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#2b3a2b", roughness: 1 }),
  bark: new THREE.MeshStandardMaterial({ color: "#3a2f27", roughness: 1 })
};

function add(mesh, { cast = true, receive = true } = {}, parent = scene) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}
// Boîte posée au sol : (x, z) = centre, y = base.
function box(w, h, d, mat, x, y, z, opts, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  return add(m, opts, parent);
}
function plane(w, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return add(m, { cast: false, receive: true }, parent);
}

/* Mur le long de l'axe X (à z fixe) avec ouvertures [{a, b, top}] (a, b en x). */
function wallX(z, x0, x1, h, t, mat, openings = []) {
  let cur = x0;
  const ops = openings.slice().sort((p, q) => p.a - q.a);
  for (const o of ops) {
    if (o.a > cur) box(o.a - cur, h, t, mat, (cur + o.a) / 2, 0, z);
    if (o.top < h) box(o.b - o.a, h - o.top, t, mat, (o.a + o.b) / 2, o.top, z);
    if (o.sill) box(o.b - o.a, o.sill, t, mat, (o.a + o.b) / 2, 0, z);
    cur = o.b;
  }
  if (x1 > cur) box(x1 - cur, h, t, mat, (cur + x1) / 2, 0, z);
}
/* Mur le long de l'axe Z (à x fixe) avec ouvertures [{a, b, top}] (a, b en z). */
function wallZ(x, z0, z1, h, t, mat, openings = []) {
  let cur = z0;
  const ops = openings.slice().sort((p, q) => p.a - q.a);
  for (const o of ops) {
    if (o.a > cur) box(t, h, o.a - cur, mat, x, 0, (cur + o.a) / 2);
    if (o.top < h) box(t, h - o.top, o.b - o.a, mat, x, o.top, (o.a + o.b) / 2);
    if (o.sill) box(t, o.sill, o.b - o.a, mat, x, 0, (o.a + o.b) / 2);
    cur = o.b;
  }
  if (z1 > cur) box(t, h, z1 - cur, mat, x, 0, (cur + z1) / 2);
}

/* ——— Textures de tapis ——— */
function rugTexture(pal, seed = 1) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 352;
  const g = c.getContext("2d");
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = pal[0]; g.fillRect(0, 0, 512, 352);
  g.strokeStyle = pal[1]; g.lineWidth = 18; g.strokeRect(20, 20, 472, 312);
  g.strokeStyle = pal[2]; g.lineWidth = 6; g.strokeRect(40, 40, 432, 272);
  g.fillStyle = pal[2];
  for (let i = 0; i < 60; i++) { g.globalAlpha = 0.25; g.fillRect(50 + rnd() * 400, 50 + rnd() * 250, 6, 6); }
  g.globalAlpha = 1;
  g.save(); g.translate(256, 176); g.rotate(Math.PI / 4);
  g.fillStyle = pal[1]; g.fillRect(-70, -70, 140, 140);
  g.fillStyle = pal[3] || pal[0]; g.fillRect(-42, -42, 84, 84);
  g.fillStyle = pal[2]; g.fillRect(-16, -16, 32, 32);
  g.restore();
  for (let i = 0; i < 2500; i++) {
    g.globalAlpha = 0.05; g.fillStyle = rnd() > 0.5 ? "#000" : "#fff";
    g.fillRect(rnd() * 512, rnd() * 352, 2, 2);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const RUG_PALETTES = [
  ["#7d3b2c", "#d9c7a5", "#1f2b44", "#a8573e"],
  ["#2c3d55", "#c9b893", "#8a2f2a", "#41577a"],
  ["#c8b89a", "#6b4a35", "#2f3b3a", "#e2d6bd"],
  ["#5b6b4f", "#d7c9a8", "#3a2a22", "#7b8a68"],
  ["#8d6a4a", "#2a2d3d", "#d8c7a0", "#a88160"],
  ["#3d2f3a", "#c4ab86", "#7a8b8f", "#5a4352"]
];
const rugMats = RUG_PALETTES.map((p, i) => new THREE.MeshStandardMaterial({ map: rugTexture(p, 7 + i * 13), roughness: 1, side: THREE.DoubleSide }));

/* ——— Véhicules (sans logo ni marquage) ———
   Profil latéral extrudé sur la largeur : caisse peinte + vitrage. Longueur sur x, largeur sur z. */
const PROFILES = {
  sedan: {
    L: 4.85, wheel: 0.34, wx: 1.48,
    body: [["m", -2.4, 0.3], ["l", 2.36, 0.3], ["q", 2.48, 0.32, 2.47, 0.55], ["q", 2.45, 0.8, 2.12, 0.85], ["l", 0.95, 0.99], ["l", -1.78, 1.02], ["q", -2.38, 1.0, -2.46, 0.82], ["l", -2.48, 0.6], ["q", -2.47, 0.32, -2.4, 0.3]],
    glass: [["m", 0.95, 0.99], ["q", 0.45, 1.33, 0.05, 1.4], ["l", -0.98, 1.42], ["q", -1.52, 1.34, -1.78, 1.02], ["l", 0.95, 0.99]],
    roof: [["m", 0.2, 1.37], ["l", -1.1, 1.39], ["l", -1.1, 1.445], ["l", 0.2, 1.425], ["l", 0.2, 1.37]]
  },
  suv: {
    L: 4.7, wheel: 0.38, wx: 1.45,
    body: [["m", -2.3, 0.38], ["l", 2.26, 0.38], ["q", 2.38, 0.4, 2.37, 0.64], ["q", 2.35, 0.97, 2.05, 1.02], ["l", 1.15, 1.1], ["l", -2.18, 1.12], ["q", -2.36, 1.1, -2.36, 0.82], ["l", -2.3, 0.38]],
    glass: [["m", 1.15, 1.1], ["q", 0.62, 1.6, 0.25, 1.69], ["l", -1.95, 1.71], ["q", -2.22, 1.66, -2.18, 1.12], ["l", 1.15, 1.1]],
    roof: [["m", 0.35, 1.66], ["l", -2.0, 1.68], ["l", -2.0, 1.74], ["l", 0.35, 1.72], ["l", 0.35, 1.66]]
  },
  van: {
    L: 5.3, wheel: 0.36, wx: 1.7,
    body: [["m", -2.62, 0.36], ["l", 2.52, 0.36], ["q", 2.68, 0.4, 2.66, 0.82], ["l", 2.42, 1.28], ["l", 1.62, 1.3], ["l", 1.58, 2.3], ["l", -2.6, 2.36], ["l", -2.62, 0.36]],
    glass: [["m", 2.42, 1.28], ["q", 2.05, 2.1, 1.62, 2.28], ["l", 1.62, 1.3], ["l", 2.42, 1.28]],
    roof: null
  }
};
function shapeFrom(cmds) {
  const s = new THREE.Shape();
  for (const c of cmds) {
    if (c[0] === "m") s.moveTo(c[1], c[2]);
    else if (c[0] === "l") s.lineTo(c[1], c[2]);
    else s.quadraticCurveTo(c[1], c[2], c[3], c[4]);
  }
  return s;
}
function extrude(cmds, width, bevel, mat, parent) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(cmds), { depth: width - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 14 });
  geo.translate(0, 0, -(width - 2 * bevel) / 2);
  return add(new THREE.Mesh(geo, mat), {}, parent);
}
function makeCar({ color = "#0c0e10", Wd = 1.9, kind = "sedan", door = 0, cabinGlass = false, lightsOn = false }) {
  const P = PROFILES[kind];
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.14, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 });
  extrude(P.body, Wd, 0.09, paint, g);
  const glassMat = cabinGlass
    ? new THREE.MeshStandardMaterial({ color: "#1c252b", roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.32, depthWrite: false })
    : M.glassDark;
  extrude(P.glass, Wd * 0.86, 0.05, glassMat, g);
  if (P.roof) extrude(P.roof, Wd * 0.84, 0.03, paint, g);
  if (cabinGlass) {
    const leather = new THREE.MeshStandardMaterial({ color: "#a77a52", roughness: 0.55 });
    for (const sx of [0.1, -1.0]) for (const sz of [-0.42, 0.42]) {
      box(0.55, 0.2, 0.55, leather, sx, 0.62, sz, {}, g);
      const back = box(0.14, 0.72, 0.5, leather, sx - 0.3, 0.62, sz, {}, g);
      back.rotation.z = 0.14;
    }
    box(0.35, 0.3, 1.5, M.dark, 0.95, 0.8, 0, {}, g);
  }
  const wheelGeo = new THREE.CylinderGeometry(P.wheel, P.wheel, 0.26, 28);
  const rimGeo = new THREE.CylinderGeometry(P.wheel * 0.66, P.wheel * 0.66, 0.27, 20);
  for (const wx of [P.wx, -P.wx]) for (const wz of [Wd / 2 - 0.13, -Wd / 2 + 0.13]) {
    const w = new THREE.Mesh(wheelGeo, M.rubber); w.rotation.x = Math.PI / 2; w.position.set(wx, P.wheel, wz); add(w, {}, g);
    const r = new THREE.Mesh(rimGeo, M.steel); r.rotation.x = Math.PI / 2; r.position.set(wx, P.wheel, wz); add(r, { cast: false }, g);
  }
  const hy = kind === "van" ? 0.95 : kind === "suv" ? 0.86 : 0.68;
  for (const s of [-1, 1]) {
    box(0.05, 0.08, 0.4, lightsOn ? M.headOn : M.head, P.L / 2 - 0.02, hy, s * (Wd / 2 - 0.32), { cast: false }, g);
    box(0.05, 0.07, 0.42, lightsOn ? M.tailOn : M.tail, -P.L / 2 + 0.01, hy + 0.12, s * (Wd / 2 - 0.3), { cast: false }, g);
  }
  if (door) {
    // Portière avant côté +z ouverte (charnière à l'avant de la portière).
    const pivot = new THREE.Group();
    pivot.position.set(0.85, 0, Wd / 2 - 0.02);
    pivot.rotation.y = door;
    const d = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.78, 0.07, 3, 0.03), paint);
    d.position.set(-0.58, 0.42 + 0.39, 0.035);
    add(d, {}, pivot);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.03), glassMat);
    win.position.set(-0.6, 1.45, 0.035);
    add(win, { cast: false }, pivot);
    g.add(pivot);
  }
  scene.add(g);
  return g;
}

/* ——— Bâtiment Clean Fast 37 ——— */
const BH = 8;          // hauteur
const T = 0.3;         // épaisseur des murs extérieurs
// Sol intérieur
plane(21.4, 32, M.epoxy, -11.5, 0.02, 0);                // atelier auto
plane(23, 22, M.concrete, 10.5, 0.02, 5);                // atelier textile
plane(23, 10, M.concrete, 10.5, 0.02, -11);              // séchage
// Façade sud (avant) : grande porte sectionnelle ouverte + vitrage atelier textile
wallX(16, -22, 22, BH, T, M.clad, [
  { a: -15, b: -9, top: 5 },
  { a: -6.5, b: -2.5, top: 3.6, sill: 0.4 },
  { a: 0.5, b: 20.5, top: 3.8, sill: 0.35 }
]);
// Vitrages
box(4, 3.2, 0.06, M.glass, -4.5, 0.4, 16, { cast: false, receive: false });
box(20, 3.45, 0.06, M.glass, 10.5, 0.35, 16, { cast: false, receive: false });
for (let x = 0.5; x <= 20.5; x += 2.5) box(0.08, 3.45, 0.14, M.frame, x, 0.35, 16.02);
box(20.2, 0.1, 0.16, M.frame, 10.5, 3.75, 16.02);
// Bandeau de façade (sans lettrage) et auvent
box(44.4, 1.1, 0.4, M.fascia, 0, BH - 1.3, 16.25, { cast: true });
box(9, 0.18, 2.2, M.frame, -12, 5.3, 17.1);
for (const x of [-15.6, -8.4]) box(0.12, 0.9, 0.12, M.frame, x, 5.48, 18.05);
// Porte sectionnelle relevée (tambour sous plafond)
box(6.4, 0.5, 0.6, M.dark, -12, 5.0, 15.6);
// Murs latéraux et arrière
wallZ(-22, -16, 16, BH, T, M.clad);
wallZ(22, -16, 16, BH, T, M.clad);
wallX(-16, -22, 22, BH, T, M.clad, [{ a: 1, b: 6, top: 4.6 }]);
box(5.6, 0.55, 0.65, M.dark, 3.5, 4.6, -15.6);
// Doublage intérieur clair
wallZ(-21.7, -15.8, 15.8, BH - 0.4, 0.1, M.panel);
wallX(-15.75, -21.7, -1.2, BH - 0.4, 0.1, M.panel);
wallX(15.75, -21.7, -1.2, BH - 0.4, 0.1, M.panel, [{ a: -15, b: -9, top: 5 }, { a: -6.5, b: -2.5, top: 3.6, sill: 0.4 }]);
wallZ(21.7, -15.8, 15.8, BH - 0.4, 0.1, M.panelWarm);
wallX(-15.75, -0.8, 21.7, BH - 0.4, 0.1, M.panelWarm, [{ a: 1, b: 6, top: 4.6 }]);
// Toiture, acrotère, équipements
box(44.6, 0.45, 32.6, M.roof, 0, BH, 0);
box(44, 0.04, 32, M.ceiling, 0, BH - 0.06, 0, { cast: false });
box(44.6, 0.7, 0.3, M.clad, 0, BH + 0.45, 16.15);
box(44.6, 0.7, 0.3, M.clad, 0, BH + 0.45, -16.15);
box(0.3, 0.7, 32.6, M.clad, 22.15, BH + 0.45, 0);
box(0.3, 0.7, 32.6, M.clad, -22.15, BH + 0.45, 0);
for (const [x, z] of [[-14, -8], [-9, -8], [10, -9], [14, 8]]) box(2.4, 1.3, 1.8, M.steel, x, BH + 0.45, z);
for (let i = 0; i < 4; i++) box(1.6, 0.3, 11, new THREE.MeshStandardMaterial({ color: "#5b6c7a", roughness: 0.2, metalness: 0.3 }), -18 + i * 5.5, BH + 0.45, 2);

// Cloison atelier auto | atelier textile (x = -1) avec porte vitrée ouverte
wallZ(-1, -16, 16, BH - 0.4, 0.2, M.panel, [{ a: -5, b: -2.6, top: 3 }]);
box(0.08, 3, 0.12, M.frame, -1, 0, -5); box(0.08, 3, 0.12, M.frame, -1, 0, -2.6); box(0.14, 0.12, 2.5, M.frame, -1, 2.95, -3.8);
{
  const leaf = new THREE.Group(); leaf.position.set(-1, 0, -5); leaf.rotation.y = -Math.PI / 2 + 0.15;
  box(2.3, 2.9, 0.05, M.glass, 1.15, 0.05, 0, { cast: false, receive: false }, leaf);
  box(2.3, 0.08, 0.07, M.frame, 1.15, 0.05, 0, {}, leaf); box(2.3, 0.08, 0.07, M.frame, 1.15, 2.87, 0, {}, leaf);
  box(0.06, 2.9, 0.07, M.frame, 2.27, 0.05, 0, {}, leaf);
  scene.add(leaf);
}
// Cloison atelier textile | séchage (z = -6) avec passage ouvert
wallX(-6, -1, 21.7, BH - 0.4, 0.2, M.panelWarm, [{ a: 16.5, b: 19.5, top: 3.2 }]);

/* Atelier automobile */
// Rampe lumineuse au-dessus de la voiture principale
const gridY = 5.6;
for (let i = 0; i < 5; i++) box(0.09, 0.05, 9.5, M.ledCool, -18.4 + i * 1.2, gridY, 3, { cast: false, receive: false });
for (let j = 0; j < 4; j++) box(5.0, 0.05, 0.09, M.ledCool, -16, gridY, -1.6 + j * 3.07, { cast: false, receive: false });
box(5.4, 0.04, 9.9, M.frame, -16, gridY + 0.07, 3, { cast: false });
for (const [x, z] of [[-6.5, 6], [-6.5, -2], [-12, -12], [-6, -12]]) for (let k = 0; k < 2; k++) box(0.09, 0.05, 3.2, M.ledCool, x + k * 0.9, 6.4, z, { cast: false, receive: false });
function rect(color, intensity, w, h, x, y, z, target) {
  const l = new THREE.RectAreaLight(color, intensity, w, h);
  l.position.set(x, y, z); l.lookAt(...target); scene.add(l); return l;
}
rect("#eef5ff", 9, 4.8, 9.2, -16, gridY - 0.05, 3, [-16, 0, 3]);
rect("#eef5ff", 5, 2.2, 10, -6.4, 6.3, 2, [-6.4, 0, 2]);
rect("#eef5ff", 5, 3.6, 3.4, -9, 6.3, -12, [-9, 0, -12]);
const carA = makeCar({ color: "#0b0d0f", L: 4.85, Wd: 1.92, kind: "sedan" });
carA.position.set(-16, 0, 3); carA.rotation.y = -Math.PI / 2; // nez vers le sud
const carB = makeCar({ color: "#6f777d", L: 4.7, Wd: 1.95, kind: "suv", door: 1.05, cabinGlass: true });
carB.position.set(-8, 0, -9); // nez vers l'est, portière côté sud ouverte
// Équipements
box(0.9, 0.95, 0.6, M.dark, -12.6, 0, -12.8); box(0.5, 0.55, 0.45, new THREE.MeshStandardMaterial({ color: "#2f5d63", roughness: 0.5 }), -11.6, 0, -12.8);
{
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 24), M.steel);
  reel.rotation.z = Math.PI / 2; reel.position.set(-21.45, 1.6, -4); add(reel);
}
for (let s = 0; s < 3; s++) {
  box(0.45, 0.04, 4.2, M.steel, -21.4, 0.6 + s * 0.6, 9.5);
  for (let b = 0; b < 12; b++) {
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 10), new THREE.MeshStandardMaterial({ color: ["#e6e2da", "#25292c", "#2f5d63", "#b9b2a5"][b % 4], roughness: 0.4 }));
    bt.position.set(-21.4, 0.62 + s * 0.6 + 0.14, 7.6 + b * 0.32); add(bt, { cast: false });
  }
}
box(0.8, 0.9, 1.6, M.dark, -20.9, 0, 12.5);
plane(0.25, 22, M.dark, -11.5, 0.025, -1); // caniveau

/* Atelier textile */
const rugMain = plane(4.2, 3.0, rugMats[0], 6, 0.06, 2.5);
box(5.4, 0.04, 4.2, new THREE.MeshStandardMaterial({ color: "#5d6366", roughness: 0.5 }), 6, 0.02, 2.5, { cast: false });
// Machine d'injection-extraction + flexible + suceur posé sur le tapis
box(0.55, 0.85, 0.75, new THREE.MeshStandardMaterial({ color: "#3b4247", roughness: 0.45, metalness: 0.3 }), 10.2, 0, 3.4);
{
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20), M.steel); tank.position.set(10.2, 1.1, 3.4); add(tank);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(10.0, 0.7, 3.1), new THREE.Vector3(9.4, 0.08, 2.6), new THREE.Vector3(8.6, 0.1, 2.2), new THREE.Vector3(7.8, 0.12, 2.0)]);
  add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.035, 8), M.dark), { cast: true });
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 10), M.steel);
  wand.rotation.z = Math.PI / 2; wand.rotation.y = 0.3; wand.position.set(7.2, 0.1, 1.85); add(wand);
  box(0.35, 0.06, 0.12, M.dark, 6.6, 0.07, 1.65);
}
// Canapé en lin, coussins retirés posés sur la table
{
  const sofa = new THREE.Group();
  box(2.6, 0.42, 0.95, M.linen, 0, 0.1, 0, {}, sofa);
  box(2.6, 0.75, 0.25, M.linen, 0, 0.35, -0.38, {}, sofa);
  box(0.22, 0.62, 0.95, M.linen, -1.3, 0.1, 0, {}, sofa); box(0.22, 0.62, 0.95, M.linen, 1.3, 0.1, 0, {}, sofa);
  box(2.2, 0.12, 0.7, M.linen, 0, 0.52, 0.06, {}, sofa);
  for (const x of [-1.15, 1.15]) for (const z of [-0.38, 0.38]) box(0.06, 0.1, 0.06, M.wood, x, 0, z, {}, sofa);
  sofa.position.set(15.2, 0, 6.2); sofa.rotation.y = -Math.PI / 2 + 0.35; scene.add(sofa);
}
box(2.4, 0.06, 1.0, M.wood, 13.2, 0.85, 10.5); for (const [x, z] of [[12.1, 10.1], [14.3, 10.1], [12.1, 10.9], [14.3, 10.9]]) box(0.05, 0.85, 0.05, M.frame, x, 0, z);
for (let i = 0; i < 3; i++) box(0.7, 0.18, 0.6, M.linen, 12.6 + i * 0.6, 0.91 + (i % 2) * 0.18, 10.5);
// Table de pliage, étagères, suspensions chaudes
box(3.2, 0.06, 1.2, M.wood, 3.5, 0.9, 12); for (const [x, z] of [[2.0, 11.5], [5.0, 11.5], [2.0, 12.5], [5.0, 12.5]]) box(0.05, 0.9, 0.05, M.frame, x, 0, z);
for (let i = 0; i < 4; i++) box(0.9, 0.2, 0.7, rugMats[(i + 2) % 6], 2.6 + i * 0.6, 0.96 + (i % 2) * 0.2, 12);
for (let s = 0; s < 4; s++) box(5, 0.04, 0.5, M.wood, 9.5, 0.5 + s * 0.65, 15.35);
for (const [x, z] of [[4, 0], [8, 3], [12, 6], [6, 10], [16, 2]]) {
  box(0.04, 2.2, 0.04, M.frame, x, 3.6, z, { cast: false });
  box(0.55, 0.22, 0.55, M.ledWarm, x, 3.4, z, { cast: false });
}
const warm = (x, z, i = 26) => { const p = new THREE.PointLight("#ffd3a0", i, 11, 2); p.position.set(x, 3.2, z); scene.add(p); };
warm(5, 1.5, 34); warm(11.5, 5, 26); warm(6, 10, 18);
rect("#fff1df", 3.5, 6, 3, 8, 7.4, 3, [8, 0, 3]);

/* Salle de séchage : rails, tapis suspendus, allée */
const railY = 3.4;
function railRow(z, x0, x1) {
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, x1 - x0, 10), M.steel);
  rail.rotation.z = Math.PI / 2; rail.position.set((x0 + x1) / 2, railY, z); add(rail);
  for (const x of [x0, x1]) box(0.08, railY, 0.08, M.steel, x, 0, z);
  let k = 0;
  for (let x = x0 + 1.0; x <= x1 - 0.9; x += 2.05) {
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 2.7), rugMats[(k + Math.round(z)) % 6]);
    rug.position.set(x, railY - 1.38, z + (k % 2 ? 0.04 : -0.04));
    rug.rotation.y = (k % 3 - 1) * 0.06;
    add(rug); k++;
  }
}
railRow(-8.6, -0.5, 15);
railRow(-13.4, 7.2, 21.4);
// Séchoirs mobiles en A dans l'allée (pour le slalom)
function aRack(x, z) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.55, 0.04), M.steel);
    leg.position.set(-0.75, 0.72, s * 0.28); leg.rotation.x = s * 0.2; add(leg, {}, g);
    const leg2 = leg.clone(); leg2.position.x = 0.75; add(leg2, {}, g);
  }
  const r = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), rugMats[(Math.abs(Math.round(x)) + 3) % 6]);
  r.rotation.y = Math.PI / 2; r.rotation.order = "YXZ";
  const a = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.78), r.material); a.position.set(0, 1.1, 0.16); a.rotation.x = -0.35; add(a, {}, g);
  const b = a.clone(); b.position.z = -0.16; b.rotation.x = 0.35; add(b, {}, g);
  g.position.set(x, 0, z); scene.add(g);
}
aRack(13, -10.0);
aRack(8.5, -12.2);
box(0.7, 1.1, 0.5, new THREE.MeshStandardMaterial({ color: "#d7d9d6", roughness: 0.6 }), 20.6, 0, -9.0);
box(0.7, 1.1, 0.5, new THREE.MeshStandardMaterial({ color: "#d7d9d6", roughness: 0.6 }), 0.3, 0, -13.8);
for (let x = 1; x < 21; x += 4) {
  box(0.1, 0.05, 2.6, M.ledCool, x, 7.3, -11, { cast: false, receive: false });
}
rect("#f4f6f2", 4, 20, 2.2, 10.5, 7.2, -11, [10.5, 0, -11]);
{ const p = new THREE.PointLight("#f2f2ea", 14, 9, 2); p.position.set(4, 3.0, -11.5); scene.add(p); }

/* Abords : parvis, voie d'accès, cour arrière, clôture */
plane(64, 28, M.asphaltWet, 0, 0.01, 30);              // parvis avant
plane(16, 8, M.asphalt, 0, 0.012, 46);                  // accès route
plane(52, 28, M.asphalt, 0, 0.01, -30);                 // cour arrière
plane(6, 12, M.asphalt, 26, 0.012, -38);                // sortie cour
for (let x = -26; x <= 26; x += 3.2) if (x < -16 || x > -8) plane(0.1, 5, M.line, x, 0.02, 37.5);
plane(52.2, 0.1, M.line, 0, 0.02, 40);
box(64, 0.15, 0.3, M.sidewalk, 0, 0, 43.9, { cast: false });
// Totem d'entrée sans lettrage
box(0.6, 3.2, 1.6, M.dark, 9, 0, 41.5); box(0.62, 2.2, 1.2, M.fascia, 9, 0.6, 41.5, { cast: false });
// Voiture « héros » sur le parvis
const carF = makeCar({ color: "#101315", L: 4.8, Wd: 1.9, kind: "sedan" });
carF.position.set(-4, 0, 28); carF.rotation.y = -Math.PI / 2;
// Appliques extérieures
for (const x of [-16.2, -7.8, 22.5]) box(0.25, 0.25, 0.25, M.lamp, x, 3.6, 16.3, { cast: false });
{ const p = new THREE.PointLight("#ffc98a", 40, 16, 2); p.position.set(-12, 4.8, 18.3); scene.add(p); }
{ const p = new THREE.PointLight("#ffc98a", 22, 14, 2); p.position.set(3.5, 4.4, -16.6); scene.add(p); }
// Cour arrière : utilitaire, palettes, bennes, clôture, arbres
const van = makeCar({ color: "#d9dad6", L: 5.3, Wd: 2.05, kind: "van" });
van.position.set(12, 0, -26);
for (let i = 0; i < 3; i++) box(1.2, 0.15, 1.0, M.wood, -8 + (i % 2) * 0.1, i * 0.16, -24);
box(2.0, 1.3, 1.4, new THREE.MeshStandardMaterial({ color: "#2f3d36", roughness: 0.8 }), -14, 0, -36);
box(2.0, 1.3, 1.4, new THREE.MeshStandardMaterial({ color: "#3b3f42", roughness: 0.8 }), -11, 0, -36);
{
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 2.2, 0.04), M.frame, 1400);
  const m4 = new THREE.Matrix4(); let n = 0;
  const putBar = (x, z) => { m4.makeTranslation(x, 1.1, z); bars.setMatrixAt(n++, m4); };
  for (let x = -30; x <= 22; x += 0.14) putBar(x, -42);
  for (let z = -42; z <= -16.5; z += 0.14) { putBar(-30, z); putBar(30, z); }
  bars.count = n; add(bars, { cast: true, receive: false });
  box(52, 0.06, 0.06, M.frame, -4, 2.15, -42, { cast: false }); box(52, 0.06, 0.06, M.frame, -4, 0.15, -42, { cast: false });
}

/* Voirie : route principale, trottoirs, marquage, réverbères, voie de desserte */
plane(1400, 14, M.asphalt, 0, 0.008, 55);
plane(1400, 3, M.sidewalk, 0, 0.012, 46.5);
plane(1400, 3, M.sidewalk, 0, 0.012, 63.5);
{
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.15), M.line, 800);
  const m4 = new THREE.Matrix4(), rx = new THREE.Matrix4().makeRotationX(-Math.PI / 2); let n = 0;
  for (let x = -690; x < 690; x += 9) { m4.makeTranslation(x, 0.02, 55).multiply(rx); dash.setMatrixAt(n++, m4); }
  dash.count = n; add(dash, { cast: false });
  const edge = (z) => plane(1400, 0.15, M.line, 0, 0.02, z); edge(48.4); edge(61.6);
}
plane(1400, 7, M.asphalt, 0, 0.008, -50);
{
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 8, 8), M.frame, 200);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.12, 0.35), M.lamp, 200);
  const m4 = new THREE.Matrix4(); let n = 0;
  for (let x = -300; x <= 300; x += 30) for (const z of [45.6, 64.4]) {
    m4.makeTranslation(x, 4, z); poles.setMatrixAt(n, m4);
    m4.makeTranslation(x, 8, z + (z < 55 ? 0.5 : -0.5)); heads.setMatrixAt(n, m4); n++;
  }
  poles.count = heads.count = n; add(poles); add(heads, { cast: false });
  for (const x of [-30, 0, 30]) { const p = new THREE.PointLight("#ffc68a", 120, 30, 2); p.position.set(x, 7.6, 46.2); scene.add(p); }
}
// Véhicules immobiles sur la route et sur les parkings voisins
for (const [x, z, rot, c, on] of [[-38, 52, 0, "#2d3237", true], [-46, 52, 0, "#8a8f93", true], [27, 58, Math.PI, "#1e2a35", true], [64, 58, Math.PI, "#b5b7b4", true]]) {
  const v = makeCar({ color: c, kind: "sedan", lightsOn: on }); v.position.set(x, 0, z); v.rotation.y = rot;
}

/* Voisinage : bâtiments d'activité, parkings, arbres, horizon */
function unit(x, z, w, d, h, color, glow = 0.35) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.2 });
  box(w, h, d, mat, x, 0, z);
  box(w + 0.3, 0.5, d + 0.3, M.roof, x, h, z);
  const win = glow > 0 ? M.winGlow : M.winDim;
  box(w * 0.7, 1.2, 0.05, win, x, h * 0.45, z + d / 2 + 0.03, { cast: false });
}
unit(58, 0, 34, 34, 9, "#8d9396");
unit(-60, -4, 30, 36, 7, "#6f767a");
unit(-6, 92, 64, 36, 11, "#9a9d9b");
unit(78, 96, 40, 30, 8, "#7a8084");
unit(-92, 92, 44, 30, 9, "#858a8c");
unit(120, -6, 40, 40, 10, "#757b80");
unit(-118, -8, 36, 40, 8, "#8c9194");
unit(10, -92, 58, 30, 9, "#7f8487");
plane(30, 20, M.asphalt, 58, 0.01, 30); plane(26, 18, M.asphalt, -60, 0.01, 27);
for (const [x, z, c] of [[52, 27, "#38404a"], [56, 27, "#c6c8c5"], [64, 27, "#5a2b2b"], [-64, 26, "#2c3036"], [-56, 26, "#9aa0a3"]]) {
  const v = makeCar({ color: c, kind: "sedan" }); v.position.set(x, 0, z); v.rotation.y = Math.PI / 2;
}
{
  const N = 420;
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), M.leaf, N);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 6), M.bark, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let n = 0, seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tree = (x, z, hgt) => {
    const r = hgt * 0.32;
    p.set(x, hgt - r * 0.8, z); s.set(r, r * 1.15, r); m4.compose(p, q, s); crowns.setMatrixAt(n, m4);
    p.set(x, (hgt - r) / 2, z); s.set(1, hgt - r, 1); m4.compose(p, q, s); trunks.setMatrixAt(n, m4); n++;
  };
  for (let x = -200; x <= 200; x += 12) { if (Math.abs(x) > 9) tree(x + rnd() * 2, 67.5, 7 + rnd() * 3); }
  for (let x = -34; x <= 34; x += 5) tree(x + rnd(), -45 - rnd() * 2, 7 + rnd() * 3);
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, d = 160 + rnd() * 380;
    tree(Math.cos(a) * d, Math.sin(a) * d - 40, 9 + rnd() * 9);
  }
  crowns.count = trunks.count = n; add(crowns); add(trunks);
}
plane(3000, 3000, M.grass, 0, 0, 0);
{
  const far = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "#5c636b", roughness: 0.9 }), 160);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let n = 0;
  for (let i = 0; i < 160; i++) {
    const a = rnd() * Math.PI * 2, d = 260 + rnd() * 600;
    const h = 6 + rnd() * 18;
    p.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); s.set(20 + rnd() * 40, h, 16 + rnd() * 30); m4.compose(p, q, s); far.setMatrixAt(n++, m4);
  }
  far.count = n; add(far, { cast: false });
}

/* ——— Lumières générales ——— */
scene.add(new THREE.HemisphereLight("#9fb5d6", "#3a342d", 0.75));
const sun = new THREE.DirectionalLight("#ffb889", 1.7);
sun.position.set(-160, 55, 75);
sun.target.position.set(0, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 420 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
// Lumière froide d'appoint dans l'atelier auto (fuit par la porte ouverte)
{ const p = new THREE.PointLight("#e9f1ff", 30, 14, 2); p.position.set(-11, 4.5, 12); scene.add(p); }
{ const p = new THREE.PointLight("#e9f1ff", 22, 12, 2); p.position.set(-8, 4.5, -7); scene.add(p); }

/* ——— Caméra ——— */
function setCamera(t) {
  const s = sampleRoute(t);
  camera.position.set(s.x, s.y, s.z);
  camera.rotation.set(THREE.MathUtils.degToRad(s.pitch), THREE.MathUtils.degToRad(s.yaw), THREE.MathUtils.degToRad(s.roll));
  sky.position.copy(camera.position);
  return s;
}

window.renderAt = (t) => {
  const s = setCamera(t);
  renderer.render(scene, camera);
  return s;
};
window.ROUTE = ROUTE;
window.snapshot = (type = "image/webp", q = 0.82) => renderer.domElement.toDataURL(type, q);

const t0 = parseFloat(params.get("t") || "0");
window.renderAt(t0);
window.READY = true;
