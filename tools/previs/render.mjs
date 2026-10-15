#!/usr/bin/env node
// Rend la prévisualisation 3D image par image (Chromium headless + WebGL logiciel).
//   node tools/previs/render.mjs                       → séquence complète + poster + manifeste
//   node tools/previs/render.mjs --test 0,10.5,19.5 --out /tmp/x   → quelques images de contrôle (PNG)
import http from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
  return acc;
}, []));
const W = +(args.w || 1280), H = +(args.h || 720);
const FPS = +(args.fps || 10);
const DURATION = +(args.duration || 42);
const OUT = path.resolve(ROOT, args.out || "media/flight/previs");
const QUALITY = +(args.quality || 0.8);

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css" };
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) throw new Error("hors racine");
    const body = await readFile(f);
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync"]
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[page]", m.text()); });
page.on("pageerror", (e) => console.log("[page error]", e.message));
await page.goto(`http://127.0.0.1:${port}/tools/previs/scene.html?w=${W}&h=${H}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });

async function grab(t, type, q) {
  return page.evaluate(([t, type, q]) => { window.renderAt(t); return window.snapshot(type, q); }, [t, type, q]);
}
const toBuf = (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");

if (args.test) {
  await mkdir(OUT, { recursive: true });
  for (const t of String(args.test).split(",").map(Number)) {
    const start = Date.now();
    const buf = toBuf(await grab(t, "image/png", 1));
    const f = path.join(OUT, `previs-t${t.toFixed(1).padStart(4, "0")}.png`);
    await writeFile(f, buf);
    console.log(`t=${t}s → ${f} (${Date.now() - start} ms)`);
  }
} else {
  const count = Math.round(DURATION * FPS) + 1;
  const framesDir = path.join(OUT, "frames");
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  let bytes = 0;
  const t0 = Date.now();
  for (let i = 0; i < count; i++) {
    const buf = toBuf(await grab(i / FPS, "image/webp", QUALITY));
    bytes += buf.length;
    await writeFile(path.join(framesDir, `frame-${String(i).padStart(4, "0")}.webp`), buf);
    if (i % 25 === 0) console.log(`${i}/${count} — ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/image`);
  }
  await writeFile(path.join(OUT, "poster.webp"), toBuf(await grab(0, "image/webp", 0.9)));
  const manifest = {
    kind: "previs",
    label: "Prévisualisation 3D du plan de vol",
    version: `previs-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`,
    fps: FPS,
    count,
    duration: DURATION,
    width: W,
    height: H,
    pattern: "frames/frame-{index}.webp",
    pad: 4,
    start: 0,
    poster: "poster.webp",
    source: "tools/previs (three.js, rendu logiciel) — remplacé par le master Higgsfield une fois généré"
  };
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ ${count} images, ${(bytes / 1048576).toFixed(1)} Mo → ${path.relative(ROOT, OUT)}`);
}

await browser.close();
server.close();
