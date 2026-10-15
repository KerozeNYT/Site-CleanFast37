#!/usr/bin/env node
// Construit le site statique dans dist/ à partir de content/*.json et src/.
// Aucune dépendance : `node tools/build.mjs`.
import { readFile, writeFile, mkdir, cp, rm, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const r = (...p) => path.join(ROOT, ...p);

const site = JSON.parse(await readFile(r("content/site.json"), "utf8"));
const flight = JSON.parse(await readFile(r("content/flight.json"), "utf8"));

const mediaKey = process.env.FLIGHT_MEDIA || flight.media.active;
const manifestPath = flight.media.sources[mediaKey];
if (!manifestPath || !existsSync(r(manifestPath))) {
  console.error(`✗ Manifeste introuvable pour la source « ${mediaKey} » : ${manifestPath}`);
  process.exit(1);
}
const manifest = JSON.parse(await readFile(r(manifestPath), "utf8"));
const mediaDir = path.posix.dirname(manifestPath) + "/";

/* ——— Vérifications ——— */
const problems = [];
const lastTime = (manifest.count - 1) / manifest.fps;
flight.beats.forEach((b) => {
  if (!(b.vh > 0)) problems.push(`beat ${b.id} : vh doit être > 0`);
  if (b.from < 0 || b.to < 0 || b.from > lastTime + 1e-6 || b.to > lastTime + 1e-6)
    problems.push(`beat ${b.id} : intervalle ${b.from}→${b.to}s hors du clip (0→${lastTime.toFixed(2)}s)`);
  if (b.chapter && !flight.chapters.some((c) => c.id === b.chapter)) problems.push(`beat ${b.id} : chapitre inconnu « ${b.chapter} »`);
});
const pad = (n, w = manifest.pad || 4) => String(n).padStart(w, "0");
const frameRel = (i) => manifest.pattern.replace("{index}", pad(i + (manifest.start || 0)));
let frameBytes = 0;
for (let i = 0; i < manifest.count; i++) {
  const f = r(mediaDir, frameRel(i));
  if (!existsSync(f)) { problems.push(`image manquante : ${mediaDir}${frameRel(i)}`); if (problems.length > 20) break; continue; }
  frameBytes += (await stat(f)).size;
}
if (!existsSync(r(mediaDir, manifest.poster))) problems.push(`poster manquant : ${mediaDir}${manifest.poster}`);
if (problems.length) {
  console.error("✗ Problèmes de contenu :\n  " + problems.join("\n  "));
  process.exit(1);
}

/* ——— Utilitaires de rendu ——— */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>");
const plain = (s) => String(s).replace(/\*(.+?)\*/g, "$1");
const demo = !!(site.demo && site.demo.enabled);
const todo = (label) => `<span class="placeholder">[À compléter : ${esc(label)}]</span>`;
const val = (v, label) => (v == null || v === "" ? (demo ? todo(label) : "") : esc(v));
const arrow = `<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8h11M9 4l4 4-4 4"/></svg>`;
const arrowDown = `<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2v11M4 9l4 4 4-4"/></svg>`;

const hashes = {};
async function fingerprint(rel) {
  const buf = await readFile(r(rel));
  hashes[rel] = createHash("sha1").update(buf).digest("hex").slice(0, 10);
  return hashes[rel];
}
const cssTokensV = await fingerprint("src/styles/tokens.css");
const cssSiteV = await fingerprint("src/styles/site.css");
const jsSiteV = await fingerprint("src/scripts/site.js");
const jsFlightV = await fingerprint("src/scripts/flight.js");

const frameIndexAt = (t) => Math.max(0, Math.min(manifest.count - 1, Math.round(t * manifest.fps)));
const frameUrl = (i) => `${mediaDir}${frameRel(i)}?v=${encodeURIComponent(manifest.version)}`;
const posterUrl = `${mediaDir}${manifest.poster}?v=${encodeURIComponent(manifest.version)}`;
const isPrevis = manifest.kind === "previs";
const badge = isPrevis ? (manifest.label || "Prévisualisation 3D") : null;

function btn(cta, extra = "") {
  const cls = cta.style === "link" ? "link" : `btn btn--${cta.style || "ghost"}`;
  const icon = cta.style === "primary" || cta.style === "link" ? arrow : "";
  return `<a class="${cls}" href="${esc(cta.href)}"${extra}>${esc(cta.label)}${icon}</a>`;
}

function wordmark(cls = "") {
  const b = site.brand;
  if (b.logo) return `<a class="wordmark ${cls}" href="#visite"><img src="${esc(b.logo)}" alt="${esc(b.logoAlt || b.name)}"></a>`;
  return `<a class="wordmark ${cls}" href="#visite" aria-label="${esc(b.name)} — accueil"><span class="wordmark__primary">${esc(b.wordmark.primary)}</span><span class="wordmark__secondary">${esc(b.wordmark.secondary)}</span></a>`;
}

/* ——— Sections ——— */
function renderChapter(c, n) {
  const H = n === 0 ? "h1" : "h2";
  const still = frameUrl(frameIndexAt(c.still.time));
  const points = c.points ? `<ul class="chapter__points">${c.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : "";
  const ctas = c.ctas && c.ctas.length ? `<div class="chapter__ctas">${c.ctas.map((x) => btn(x)).join("")}</div>` : "";
  return `
      <article class="chapter chapter--${esc(c.kind)} chapter--${esc(c.align || "left")}" id="chapitre-${esc(c.id)}" data-chapter="${esc(c.id)}" data-align="${esc(c.align || "left")}" aria-labelledby="titre-${esc(c.id)}">
        <figure class="chapter__still"><img src="${still}" alt="${esc(c.still.alt)}" width="${manifest.width}" height="${manifest.height}" ${n === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>
        ${badge && n === 0 ? `<span class="flight__badge">${esc(badge)}</span>` : ""}
        <div class="chapter__copy"><div class="chapter__inner">
          <p class="eyebrow">${esc(c.eyebrow)}</p>
          <${H} class="chapter__title display" id="titre-${esc(c.id)}">${rich(c.title)}</${H}>
          <p class="chapter__lead lead">${esc(c.lead)}</p>
          ${points}
          ${ctas}
        </div></div>
      </article>`;
}

function renderFlight() {
  return `
  <section class="flight on-dark" id="visite" data-flight data-header="dark" aria-label="Visite de l'atelier ${esc(site.brand.name)}">
    <div class="flight__sticky">
      <div class="flight__stage" aria-hidden="true">
        <img class="flight__poster" src="${posterUrl}" alt="" width="${manifest.width}" height="${manifest.height}" decoding="async">
        <canvas class="flight__canvas"></canvas>
        <div class="flight__shade"></div>
        <div class="flight__scrim"></div>
        <div class="flight__loading">Chargement des images…</div>
      </div>
      <div class="flight__hud">
        <a class="flight__skip" href="${esc(flight.skip.href)}">${esc(flight.skip.label)}</a>
        <div class="flight__progress" aria-hidden="true"><span></span></div>
        <div class="flight__right">
          ${badge ? `<span class="flight__badge">${esc(badge)}</span>` : ""}
          <button type="button" class="flight__motion-off" data-motion-toggle="off">Images fixes</button>
        </div>
      </div>
      <div class="flight__chapters">${flight.chapters.map(renderChapter).join("")}
      </div>
    </div>
    <div class="flight__tools">
      <span>${badge ? esc(badge) : "Visite de l'atelier"}</span>
      <button type="button" data-motion-toggle="on">Activer la visite animée</button>
    </div>
  </section>`;
}

function renderServices() {
  const s = site.services;
  let n = 0;
  const groups = s.groups.map((g) => `
      <div class="service-group" id="${esc(g.id)}">
        <div class="service-group__head">
          <h3 class="service-group__label">${esc(g.label)}</h3>
          <p class="service-group__title">${esc(g.title)}</p>
        </div>
        <div class="service-cards">${g.items.map((it) => {
          n++;
          return `
          <article class="service-card">
            <span class="service-card__index" aria-hidden="true">${String(n).padStart(2, "0")}</span>
            <h4 class="service-card__name">${esc(it.name)}</h4>
            <p class="service-card__summary">${esc(it.summary)}</p>
            <ul class="service-card__details">${it.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
            <p class="service-card__price"><span>${esc(s.priceLabel)}</span><span>${it.price ? esc(it.price) : esc(s.priceFallback)}</span></p>
          </article>`;
        }).join("")}
        </div>
      </div>`).join("");
  return `
  <section class="section services on-light" id="${esc(s.id)}" data-header="light" aria-labelledby="titre-prestations">
    <div class="section__inner">
      <div class="section__head">
        <p class="eyebrow">${esc(s.eyebrow)}</p>
        <h2 class="section__title display" id="titre-prestations">${rich(s.title)}</h2>
        <p class="section__intro lead">${esc(s.intro)}</p>
      </div>${groups}
    </div>
  </section>`;
}

function renderMethod() {
  const m = site.method;
  return `
  <section class="section method on-light" id="${esc(m.id)}" data-header="light" aria-labelledby="titre-methode">
    <div class="section__inner">
      <div class="section__head">
        <p class="eyebrow">${esc(m.eyebrow)}</p>
        <h2 class="section__title display" id="titre-methode">${rich(m.title)}</h2>
      </div>
      <ol class="steps">${m.steps.map((st) => `
        <li class="step"><h3 class="step__name">${esc(st.name)}</h3><p class="step__text">${esc(st.text)}</p></li>`).join("")}
      </ol>
    </div>
  </section>`;
}

function renderQuote() {
  const q = site.quote, f = q.form;
  const live = !!f.endpoint;
  return `
  <section class="section quote on-light" id="${esc(q.id)}" data-header="light" aria-labelledby="titre-devis">
    <div class="section__inner quote__grid">
      <div class="quote__aside">
        <p class="eyebrow">${esc(q.eyebrow)}</p>
        <h2 class="section__title display" id="titre-devis">${rich(q.title)}</h2>
        <p>${esc(q.intro)}</p>
        ${live ? "" : `<p class="form-notice" role="note">${esc(f.demoNotice)}</p>`}
      </div>
      <form class="form" data-quote-form ${live ? `action="${esc(f.endpoint)}" data-endpoint="${esc(f.endpoint)}"` : ""} method="${esc(f.method || "POST")}" enctype="multipart/form-data"
        data-success="${esc(f.successMessage)}" data-error="${esc(f.errorMessage)}" data-demo-result="${esc(f.demoResult)}" novalidate>
        <div class="field"><label for="f-nom">Nom</label><input id="f-nom" name="nom" autocomplete="name" required></div>
        <div class="field"><label for="f-tel">Téléphone</label><input id="f-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel"></div>
        <div class="field"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="f-commune">Commune</label><input id="f-commune" name="commune" autocomplete="address-level2"></div>
        <div class="field field--full"><label for="f-service">Prestation</label>
          <select id="f-service" name="prestation" required>
            <option value="">Choisir…</option>
            ${f.services.map((s) => `<option>${esc(s)}</option>`).join("")}
          </select></div>
        <div class="field field--full"><label for="f-message">Votre besoin</label><textarea id="f-message" name="message" rows="4" placeholder="Modèle du véhicule, type de textile, dimensions, taches particulières…" required></textarea></div>
        <div class="field field--full"><label for="f-photo">Photo (facultatif)</label><input id="f-photo" name="photo" type="file" accept="image/*"></div>
        <label class="check"><input type="checkbox" name="consentement" required><span>${esc(f.consent)}</span></label>
        <div class="form__actions">
          <button class="btn btn--primary" type="submit">${live ? "Envoyer la demande" : "Envoyer (démonstration)"}${arrow}</button>
          <p class="form__status" role="status" aria-live="polite"></p>
        </div>
      </form>
    </div>
  </section>`;
}

function renderContact() {
  const c = site.contact;
  const phone = c.phone ? `<a href="tel:${esc(c.phone.replace(/[^+\d]/g, ""))}">${esc(c.phone)}</a>` : val(null, "téléphone");
  const email = c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : val(null, "e-mail");
  const socials = c.socials && c.socials.length
    ? c.socials.map((s) => `<a href="${esc(s.href)}" rel="noopener">${esc(s.label)}</a>`).join(" · ")
    : val(null, "réseaux sociaux");
  return `
  <section class="section contact on-dark" id="${esc(c.id)}" data-header="dark" aria-labelledby="titre-contact">
    <div class="section__inner contact__grid">
      <div>
        <p class="eyebrow" style="color:var(--glacier)">${esc(c.eyebrow)}</p>
        <h2 class="contact__title display" id="titre-contact">${rich(c.title)}</h2>
        <div class="chapter__ctas">${btn({ label: "Demander un devis", href: "#devis", style: "primary" })}</div>
      </div>
      <dl class="contact__list">
        <div class="contact__item"><dt>Téléphone</dt><dd>${phone}</dd></div>
        <div class="contact__item"><dt>E-mail</dt><dd>${email}</dd></div>
        <div class="contact__item"><dt>Adresse</dt><dd>${val(c.address, "adresse de l'atelier")}</dd></div>
        <div class="contact__item"><dt>Horaires</dt><dd>${val(c.hours, "horaires")}</dd></div>
        <div class="contact__item"><dt>Zone</dt><dd>${esc(c.area)}</dd></div>
        <div class="contact__item"><dt>Réseaux</dt><dd>${socials}</dd></div>
      </dl>
    </div>
  </section>`;
}

function renderFooter() {
  const f = site.footer;
  const legal = f.legal.map((l) => `<li>${l.href ? `<a href="${esc(l.href)}">${esc(l.label)}</a>` : `${esc(l.label)} ${demo ? todo("page") : ""}`}</li>`).join("");
  return `
  <footer class="site-footer" data-header="dark">
    <div class="site-footer__inner">
      ${wordmark()}
      <ul>${legal}</ul>
      <p>${isPrevis ? esc(f.credit) : `© ${new Date().getFullYear()} ${esc(site.brand.name)}`}</p>
    </div>
  </footer>`;
}

const flightData = {
  fadeVh: flight.fadeVh,
  beats: flight.beats.map(({ id, vh, from, to, chapter, focus }) => ({ id, vh, from, to, chapter, focus })),
  manifest: {
    kind: manifest.kind, version: manifest.version, fps: manifest.fps, count: manifest.count,
    width: manifest.width, height: manifest.height, pattern: manifest.pattern, pad: manifest.pad || 4,
    start: manifest.start || 0, base: mediaDir
  }
};

const m = site.meta;
const html = `<!doctype html>
<html lang="${esc(m.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(m.title)}</title>
  <meta name="description" content="${esc(m.description)}">
  <link rel="canonical" href="${esc(m.url)}">
  <meta name="theme-color" content="${esc(m.themeColor)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(m.title)}">
  <meta property="og:description" content="${esc(m.description)}">
  <meta property="og:url" content="${esc(m.url)}">
  <meta property="og:image" content="${esc(m.url)}${posterUrl.split("?")[0]}">
  <meta property="og:locale" content="fr_FR">
  ${demo ? '<meta name="robots" content="noindex">' : ""}
  <link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/tokens.css?v=${cssTokensV}">
  <link rel="stylesheet" href="assets/css/site.css?v=${cssSiteV}">
  <link rel="preload" href="${posterUrl}" as="image">
  <script>
    /* Choix du mode avant le premier rendu : visite animée ou images fixes. */
    (function () {
      var d = document.documentElement, q = null, pref = null;
      try { q = new URLSearchParams(location.search).get("tour"); pref = localStorage.getItem("cf37-motion"); } catch (e) {}
      var c = navigator.connection || {};
      var constrained = !!c.saveData || /(^|-)2g$/.test(c.effectiveType || "") || (navigator.deviceMemory && navigator.deviceMemory < 2);
      var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      var canvasOk = !!window.createImageBitmap;
      if (!constrained && canvasOk) d.classList.add("motion-allowed");
      var on = q === "on" || (q !== "off" && !constrained && canvasOk && (pref === "on" || (!reduce && pref !== "off")));
      if (on) d.classList.add("is-tour");
    })();
  </script>
</head>
<body class="${demo ? "has-demo-banner" : ""}">
  <a class="skip-link" href="#${esc(site.services.id)}">Aller aux prestations</a>
  ${demo ? `<div class="demo-banner" role="note">${esc(site.demo.banner)}</div>` : ""}
  <header class="site-header" data-on="dark">
    <div class="site-header__inner">
      ${wordmark()}
      <nav class="site-nav" id="site-nav" aria-label="Navigation principale">
        <ul>
          ${site.nav.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join("\n          ")}
          <li class="site-nav__cta"><a class="btn" href="${esc(site.navCta.href)}">${esc(site.navCta.label)}</a></li>
        </ul>
      </nav>
      <a class="btn site-header__cta" href="${esc(site.navCta.href)}">${esc(site.navCta.label)}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Ouvrir le menu"><span></span><span></span></button>
    </div>
  </header>
  <main id="contenu">${renderFlight()}${renderServices()}${renderMethod()}${renderQuote()}${renderContact()}
  </main>${renderFooter()}
  <script type="application/json" id="flight-data">${JSON.stringify(flightData).replace(/</g, "\\u003c")}</script>
  <script src="assets/js/site.js?v=${jsSiteV}" defer></script>
  <script src="assets/js/flight.js?v=${jsFlightV}" defer></script>
</body>
</html>
`;

/* ——— Écriture ——— */
await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, "assets"), { recursive: true });
await writeFile(path.join(DIST, "index.html"), html);
await cp(r("src/styles"), path.join(DIST, "assets/css"), { recursive: true });
await cp(r("src/scripts"), path.join(DIST, "assets/js"), { recursive: true });
await cp(r("src/fonts"), path.join(DIST, "assets/fonts"), { recursive: true });
await cp(r("src/brand"), path.join(DIST, "assets/brand"), { recursive: true });
await cp(r(mediaDir), path.join(DIST, mediaDir), { recursive: true });
if (existsSync(r("src/styletile.html"))) {
  const tile = (await readFile(r("src/styletile.html"), "utf8")).replaceAll("../src/styles/", "assets/css/").replaceAll("../src/brand/", "assets/brand/");
  await writeFile(path.join(DIST, "styletile.html"), tile);
}

const travel = flight.beats.reduce((a, b) => a + b.vh, 0);
console.log(`✓ dist/ construit — source « ${mediaKey} » (${manifest.kind}), ${manifest.count} images @ ${manifest.fps} i/s, ${(frameBytes / 1048576).toFixed(1)} Mo`);
console.log(`  ${flight.beats.length} beats, ${travel} vh de défilement épinglé, ${flight.chapters.length} chapitres${demo ? ", mode démo" : ""}`);
