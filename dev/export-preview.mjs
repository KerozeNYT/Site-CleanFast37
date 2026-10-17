// Exporte l'aperçu local en pages HTML autonomes (CSS et JS intégrés), consultables sans serveur :
// accueil, fiche produit, page TikTok, panier. Le panier est simulé dans le navigateur à partir
// des vrais rendus Liquid du thème (états de 0 à 10 articles). Aucune donnée réelle, aucun paiement.
//   node dev/export-preview.mjs [dossier de sortie]
// L'accueil (index.html) est écrit sans <html>/<head>/<body> : il est destiné à une page Artifact,
// qui ajoute ce squelette elle-même. Les autres pages sont des documents complets.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || path.join(root, '.cache/apercu'));
const port = 4176;
const base = `http://localhost:${port}`;
const MAX = 10;
fs.mkdirSync(out, { recursive: true });

const server = spawn(process.execPath, [path.join(root, 'dev/preview.mjs'), '--port', String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.once('data', resolve));

const post = async (url, body, json = true) => {
  const res = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded' },
    body: json ? JSON.stringify(body) : new URLSearchParams(body)
  });
  return res.json();
};

try {
  // États du panier : sections rendues par le thème pour 0 à MAX articles.
  const states = {};
  for (let q = 0; q <= MAX; q++) {
    await fetch(`${base}/__reset`);
    if (q > 0) await post('/cart/add.js', { id: '4242', quantity: String(q) }, false);
    const data = await post('/cart/change.js', { line: 1, quantity: q, sections: ['cart-drawer', 'cart-icon-bubble', 'template--preview__main'] });
    states[q] = data.sections;
  }
  await fetch(`${base}/__reset`);

  const css = (file) => fs.readFileSync(path.join(root, 'assets', file), 'utf8');
  const js = fs.readFileSync(path.join(root, 'assets/global.js'), 'utf8');
  const stub = fs.readFileSync(path.join(root, 'dev/export-preview-stub.js'), 'utf8').replace('__STATES__', JSON.stringify(states).replace(/<\//g, '<\\/'));

  const pages = [
    { file: 'index.html', route: '/', label: 'Accueil', fragment: true },
    { file: 'produit.html', route: '/products/rouleau-anti-poils-ace2ace', label: 'Fiche produit' },
    { file: 'tiktok.html', route: '/products/rouleau-anti-poils-ace2ace?view=tiktok', label: 'Page TikTok' },
    { file: 'panier.html', route: '/cart', label: 'Panier' }
  ];

  const rewriteLinks = (html) =>
    html.replace(/href="([^"]*)"/g, (m, href) => {
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('data:')) return m;
      if (href === '/') return 'href="index.html"';
      if (href.startsWith('/#')) return `href="index.html${href.slice(1)}"`;
      if (href.startsWith('/products/') && href.includes('view=tiktok')) return 'href="tiktok.html"';
      if (href.startsWith('/products/') || href === '/collections/all') return 'href="produit.html"';
      if (href === '/cart') return 'href="panier.html"';
      return 'href="#" data-preview-off';
    });

  for (const p of pages) {
    let html = await (await fetch(base + p.route)).text();
    html = html
      .replace(/http:\/\/localhost:\d+/g, '')
      .replace(/<link rel="canonical"[^>]*>/, '')
      .replace(/<link rel="preconnect"[^>]*>/g, '')
      .replace(/<link rel="preload"[^>]*>/g, '')
      .replace(/@font-face\{[^}]*\}/g, '')
      .replace(/<link href="\/assets\/([^"]+\.css)" rel="stylesheet"[^>]*>/g, (_, f) => `<style>${css(f)}</style>`)
      .replace(/<script src="\/assets\/global\.js"[^>]*><\/script>/, '');
    html = rewriteLinks(html);

    const nav = pages
      .map((q) => `<a href="${q.file}"${q.file === p.file ? ' aria-current="page"' : ''}>${q.label}</a>`)
      .join('');
    const banner = `<div class="apercu-bar" role="note"><p><strong>Aperçu du thème</strong> · données de démonstration ; les zones beiges recevront vos photos et vidéos ; le paiement réel se fera sur Shopify.</p><nav aria-label="Pages de l’aperçu">${nav}</nav></div><div class="apercu-toast" role="status" aria-live="polite" hidden></div>`;
    const extraHead = `<script>document.documentElement.classList.add('js');</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"><style>${fs.readFileSync(path.join(root, 'dev/export-preview.css'), 'utf8')}</style>`;
    const scripts = `<script>${stub}</script><script>${js}</script>`;

    const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
    const title = `<title>${p.fragment ? 'Boutique Maison Nette' : `${p.label} — Maison Nette`}</title>`;
    const headClean = head.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta charset="utf-8">/, '').replace(/<meta name="viewport"[^>]*>/, '');

    const doc = p.fragment
      ? `${title}\n${extraHead}\n${headClean}\n${banner}\n${body}\n${scripts}\n`
      : `<!doctype html>\n<html lang="fr" class="no-js">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${title}\n${extraHead}\n${headClean}\n</head>\n<body>\n${banner}\n${body}\n${scripts}\n</body>\n</html>\n`;
    fs.writeFileSync(path.join(out, p.file), doc);
    console.log(`${p.file} : ${(doc.length / 1024).toFixed(0)} Ko`);
  }
} finally {
  server.kill();
}
