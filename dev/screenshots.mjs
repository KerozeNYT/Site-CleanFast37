// Captures de l'aperçu local (téléphone et ordinateur) + panier latéral après un vrai clic
// sur « Ajouter au panier ». Nécessite `node dev/preview.mjs` lancé.
//   node dev/screenshots.mjs [dossier de sortie] [url]

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const out = path.resolve(process.argv[2] || '.cache/shots');
const base = process.argv[3] || 'http://localhost:4173';
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(out, { recursive: true });

const viewports = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 }
];

const browser = await chromium.launch({ executablePath });
const errors = [];

for (const vp of viewports) {
  const { name, ...options } = vp;
  const context = await browser.newContext({ viewport: { width: options.width, height: options.height }, ...options, locale: 'fr-FR' });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] console: ${m.text()}`));
  await fetch(`${base}/__reset`);

  for (const [slug, route] of [['accueil', '/'], ['produit', '/products/rouleau-anti-poils-ace2ace']]) {
    const res = await page.goto(base + route, { waitUntil: 'networkidle' });
    if (!res || res.status() !== 200) continue;
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `${slug}-${name}-haut.png`) });
    await page.screenshot({ path: path.join(out, `${slug}-${name}-complet.png`), fullPage: true });
  }

  // Panier latéral : clic réel sur le bouton de l'offre (Ajax Cart API simulée par l'aperçu).
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const button = page.locator('#OfferForm [data-add-button]');
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.waitForSelector('.cart-drawer.is-open', { timeout: 5000 }).catch(() => errors.push(`[${name}] le panier ne s’est pas ouvert`));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, `panier-${name}.png`) });
  await context.close();
}

await browser.close();
console.log(`Captures dans ${out}`);
if (errors.length) {
  console.log('Erreurs :\n' + errors.join('\n'));
  process.exitCode = 1;
}
