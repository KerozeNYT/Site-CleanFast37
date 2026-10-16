// Aperçu local du thème, sans boutique Shopify.
// Rend les gabarits JSON, les groupes de sections et les sections avec liquidjs et des données
// fictives (un produit ACE2ACE à 29,90 €, aucune photo : emplacements neutres), et simule
// l'Ajax Cart API + la Section Rendering API pour tester le panier latéral.
// Ce n'est PAS Shopify : seul l'envoi du thème sur une boutique fait foi.
//
//   node dev/preview.mjs [--port 4173] [--design]   (--design : libellés de l'éditeur de thème)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid, Value } from 'liquidjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 4173;
const designMode = args.includes('--design');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p).replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));

/* ---------- Données fictives ---------- */
const locale = readJSON('locales/fr.default.json');
const settingsData = readJSON('config/settings_data.json');
const themeSettings = { ...settingsData.presets[settingsData.current] };

class Color extends String {
  constructor(hex) {
    super(hex);
    const n = parseInt(hex.replace('#', ''), 16);
    Object.assign(this, { red: (n >> 16) & 255, green: (n >> 8) & 255, blue: n & 255 });
  }
}
const font = (weight) => ({ family: 'Inter', fallback_families: 'system-ui, -apple-system, "Segoe UI", sans-serif', weight, 'system?': false, style: 'normal' });

for (const [k, v] of Object.entries(themeSettings)) {
  if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) themeSettings[k] = new Color(v);
}
themeSettings.type_body_font = font(400);
themeSettings.type_heading_font = font(600);

const productUrl = '/products/rouleau-anti-poils-ace2ace';
const variant = { id: 4242, title: 'Default Title', price: 2990, available: true, inventory_quantity: 1 };
const product = {
  id: 42,
  handle: 'rouleau-anti-poils-ace2ace',
  title: 'Rouleau anti-poils réutilisable ACE2ACE pour chiens et chats — blanc',
  vendor: 'ACE2ACE',
  url: productUrl,
  price: 2990,
  available: true,
  has_only_default_variant: true,
  options: ['Title'],
  variants: [variant],
  selected_or_first_available_variant: variant,
  media: [],
  images: [],
  featured_media: null,
  featured_image: null,
  description: '<p>Rouleau manuel et réutilisable pour retirer les poils de chien et de chat des textiles compatibles.</p>',
  metafields: { custom: {} },
  type: 'Accessoire pour animaux',
  tags: []
};

const link = (title, url) => ({ title, url, current: false, links: [] });
const linklists = {
  'main-menu': { title: 'Menu principal', links: [link('Le rouleau', productUrl), link('Démonstration', '/#demonstration'), link('Questions', '/#faq'), link('Contact', '/pages/contact')] },
  footer: { title: 'Aide', links: [link('Livraison', '/policies/shipping-policy'), link('Retours et rétractation', '/policies/refund-policy'), link('Contact', '/pages/contact'), link('Questions fréquentes', '/#faq')] },
  legal: { title: 'Informations légales', links: [link('Mentions légales', '/policies/legal-notice'), link('Conditions générales de vente', '/policies/terms-of-service'), link('Confidentialité', '/policies/privacy-policy'), link('Cookies', '/pages/cookies')] }
};

const cart = { items: [], note: '' };
function cartDrop() {
  const items = cart.items.map((it, i) => ({
    ...it,
    key: `${variant.id}:${i}`,
    url: productUrl,
    image: null,
    product: { title: 'ACE2ACE — Rouleau anti-poils réutilisable', has_only_default_variant: true },
    variant: { title: 'Default Title' },
    vendor: 'ACE2ACE',
    final_price: variant.price,
    final_line_price: variant.price * it.quantity
  }));
  const count = items.reduce((n, it) => n + it.quantity, 0);
  return { items, item_count: count, total_price: items.reduce((n, it) => n + it.final_line_price, 0), currency: { iso_code: 'EUR' }, note: cart.note };
}

function globals(page = 'index', suffix = null) {
  return {
    settings: themeSettings,
    shop: { name: 'Maison Nette', url: `http://localhost:${port}`, description: '', money_format: '{{amount_with_comma_separator}} €', enabled_payment_types: [], shipping_policy: null, refund_policy: null, terms_of_service: null, privacy_policy: null },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', all_products_collection_url: '/collections/all', search_url: '/search', account_url: '/account' },
    request: { design_mode: designMode, locale: { iso_code: 'fr' }, page_type: page, origin: `http://localhost:${port}`, path: '/' },
    collections: { all: { products: [product], title: 'Tous les produits', url: '/collections/all' } },
    linklists,
    cart: cartDrop(),
    product: page === 'product' ? product : null,
    template: { name: page, suffix },
    canonical_url: `http://localhost:${port}/`,
    page_title: page === 'product' ? product.title : 'Rouleau anti-poils pour chiens et chats ACE2ACE',
    page_description: 'Rouleau réutilisable anti-poils ACE2ACE pour chiens et chats : manuel, sans pile, avec compartiment de collecte.',
    content_for_header: '',
    additional_checkout_buttons: false,
    content_for_additional_checkout_buttons: ''
  };
}

/* ---------- Moteur Liquid ---------- */
const liquid = new Liquid({ root: [path.join(root, 'snippets')], extname: '.liquid', strictFilters: true, dynamicPartials: true });
const missing = new Set();
const kv = (argsList) => Object.fromEntries(argsList.filter(Array.isArray));

function translate(key, params = {}) {
  let value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), locale);
  if (value && typeof value === 'object' && 'count' in params) value = Number(params.count) <= 1 ? value.one : value.other;
  if (typeof value !== 'string') {
    missing.add(key);
    return `translation missing: fr.${key}`;
  }
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (k in params ? params[k] : ''));
}

const money = (cents) => (Number(cents) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!,))/g, ' ');
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '').map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)).join('');

liquid.registerFilter('t', (key, ...a) => translate(key, kv(a)));
liquid.registerFilter('money', (c) => `${money(c)} €`);
liquid.registerFilter('money_without_currency', (c) => money(c));
liquid.registerFilter('asset_url', (f) => `/assets/${f}`);
liquid.registerFilter('stylesheet_tag', (u) => `<link href="${u}" rel="stylesheet" type="text/css" media="all">`);
liquid.registerFilter('font_face', (f) => `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:normal;font-display:swap;src:url("/fonts/inter-latin-wght-normal.woff2") format("woff2");}`);
liquid.registerFilter('font_url', () => '/fonts/inter-latin-wght-normal.woff2');
liquid.registerFilter('preload_tag', (u, ...a) => `<link rel="preload" href="${u}"${attrs(kv(a))}>`);
liquid.registerFilter('font_modify', (f, prop, value) => ({ ...f, [prop]: Number(value) || value }));
liquid.registerFilter('placeholder_svg_tag', () => '<svg class="placeholder-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#ECEAE6"/><g fill="none" stroke="#D3D0CA" stroke-width="2"><rect x="168" y="124" width="64" height="48" rx="8"/><circle cx="200" cy="148" r="13"/></g></svg>');
liquid.registerFilter('image_url', (img) => img?.src || '');
liquid.registerFilter('image_tag', (src, ...a) => `<img src="${src}"${attrs({ alt: '', ...kv(a) })}>`);
liquid.registerFilter('video_tag', () => '<video controls muted playsinline></video>');
liquid.registerFilter('external_video_tag', () => '');
liquid.registerFilter('media_tag', () => '');
liquid.registerFilter('payment_type_svg_tag', () => '');
liquid.registerFilter('metafield_tag', (mf) => String(mf ?? ''));
liquid.registerFilter('structured_data', (p) => JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.title, brand: { '@type': 'Brand', name: p.vendor }, offers: { '@type': 'Offer', price: (p.price / 100).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock' } }));
liquid.registerFilter('payment_button', () => '<div class="shopify-payment-button"><button type="button" class="shopify-payment-button__button" style="width:100%;background:#000;color:#fff;border:0;font-weight:600" disabled>Paiement accéléré (selon les moyens activés)</button></div>');

liquid.registerTag('schema', {
  parse(_, remain) {
    let t;
    while ((t = remain.shift())) if (t.name === 'endschema') return;
    throw new Error('schema non fermé');
  },
  render() {}
});

/** Découpe « 'product', product, id: x, data-a: '' » au premier niveau. */
function splitArgs(str) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of str) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

liquid.registerTag('form', {
  parse(token, remain) {
    this.args = splitArgs(token.args);
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain);
    stream.on('tag:endform', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('form non fermé'); });
    stream.start();
  },
  *render(ctx, emitter) {
    const type = yield new Value(this.args[0], this.liquid).value(ctx);
    const html = {};
    for (const a of this.args.slice(2)) {
      const m = a.match(/^([\w-]+)\s*:\s*(.+)$/);
      if (m) html[m[1]] = yield new Value(m[2], this.liquid).value(ctx);
    }
    const action = type === 'product' ? '/cart/add' : type === 'contact' ? '/contact' : '/';
    ctx.push({ form: { posted_successfully: false, errors: null } });
    const inner = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
    ctx.pop();
    const dataAttrs = Object.fromEntries(Object.entries(html).map(([k, v]) => [k, k.startsWith('data-') && v === '' ? true : v]));
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8"${attrs(dataAttrs)}><input type="hidden" name="form_type" value="${type}"><input type="hidden" name="utf8" value="✓">${inner}</form>`);
  }
});

/* ---------- Sections ---------- */
const schemaCache = new Map();
function sectionFile(type) {
  if (!schemaCache.has(type)) {
    const src = read(`sections/${type}.liquid`);
    const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
    schemaCache.set(type, { src, schema: m ? JSON.parse(m[1]) : {} });
  }
  return schemaCache.get(type);
}

function resolveSettings(defs = [], values = {}) {
  const out = {};
  for (const d of defs) {
    if (!d.id) continue;
    let v = d.id in values ? values[d.id] : d.default;
    if (d.type === 'link_list') v = v ? linklists[v] || null : null;
    else if (d.type === 'product') v = v ? product : null;
    else if (['image_picker', 'video', 'collection', 'page', 'blog', 'article'].includes(d.type)) v = null;
    else if (d.type === 'color' && v) v = new Color(v);
    out[d.id] = v ?? null;
  }
  return out;
}

async function renderSection(id, data, page, suffix = null) {
  const { src, schema } = sectionFile(data.type);
  const order = data.block_order || Object.keys(data.blocks || {});
  const blocks = order.map((key) => {
    const b = data.blocks[key];
    const def = (schema.blocks || []).find((x) => x.type === b.type) || {};
    return { id: key, type: b.type, settings: resolveSettings(def.settings, b.settings), shopify_attributes: '' };
  });
  const section = { id, settings: resolveSettings(schema.settings, data.settings), blocks };
  const html = await liquid.parseAndRender(src, { section }, { globals: globals(page, suffix) });
  const tag = schema.tag || 'div';
  return `<${tag} id="shopify-section-${id}" class="shopify-section${schema.class ? ' ' + schema.class : ''}">${html}</${tag}>`;
}

async function renderGroup(name, page) {
  const group = readJSON(`sections/${name}.json`);
  const parts = [];
  for (const key of group.order) parts.push(await renderSection(`sections--preview__${key}`, group.sections[key], page));
  return parts.join('\n');
}

liquid.registerTag('sections', {
  parse(token) {
    this.name = token.args.trim().replace(/^['"]|['"]$/g, '');
  },
  *render(ctx, emitter) {
    emitter.write(yield renderGroup(this.name, ctx.getSync(['template', 'name'])));
  }
});

async function renderPage(page, suffix = null) {
  const file = suffix && fs.existsSync(path.join(root, `templates/${page}.${suffix}.json`)) ? `${page}.${suffix}` : page;
  const tpl = readJSON(`templates/${file}.json`);
  const parts = [];
  for (const key of tpl.order) {
    if (tpl.sections[key].disabled) continue;
    parts.push(await renderSection(`template--preview__${key}`, tpl.sections[key], page, suffix));
  }
  const layout = read('layout/theme.liquid');
  return liquid.parseAndRender(layout, { content_for_layout: parts.join('\n') }, { globals: globals(page, file === page ? null : suffix) });
}

const renderSections = async (ids, page) => {
  const out = {};
  for (const id of ids) {
    const m = id.match(/^template--preview__(.+)$/);
    if (m) {
      const tpl = readJSON('templates/cart.json');
      out[id] = tpl.sections[m[1]] ? await renderSection(id, tpl.sections[m[1]], 'cart') : null;
    } else {
      out[id] = fs.existsSync(path.join(root, `sections/${id}.liquid`)) ? await renderSection(id, { type: id, settings: {} }, page) : null;
    }
  }
  return out;
};

/* ---------- Serveur ---------- */
const types = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
const readBody = (req) => new Promise((resolve) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => resolve(b));
});
function parseForm(body, contentType = '') {
  if (contentType.includes('application/json')) return JSON.parse(body || '{}');
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1];
    const out = {};
    for (const part of body.split(`--${boundary}`)) {
      const m = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }
  return Object.fromEntries(new URLSearchParams(body));
}
const send = (res, status, body, type = 'text/html; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  try {
    if (url.pathname.startsWith('/assets/')) {
      const file = path.join(root, 'assets', path.basename(url.pathname));
      return fs.existsSync(file) ? send(res, 200, fs.readFileSync(file), types[path.extname(file)] || 'application/octet-stream') : send(res, 404, '');
    }
    if (url.pathname.startsWith('/fonts/')) {
      const file = path.join(root, 'node_modules/@fontsource-variable/inter/files', path.basename(url.pathname));
      return fs.existsSync(file) ? send(res, 200, fs.readFileSync(file), 'font/woff2') : send(res, 404, '');
    }
    if (url.pathname === '/cart/add.js' && req.method === 'POST') {
      const data = parseForm(await readBody(req), req.headers['content-type']);
      const qty = Math.max(1, Number(data.quantity) || 1);
      if (cart.items[0]) cart.items[0].quantity += qty;
      else cart.items.push({ quantity: qty });
      const sections = await renderSections(String(data.sections || '').split(',').filter(Boolean), 'index');
      return send(res, 200, JSON.stringify({ id: variant.id, quantity: qty, price: variant.price, sections }), 'application/json');
    }
    if (url.pathname === '/cart/change.js' && req.method === 'POST') {
      const data = parseForm(await readBody(req), req.headers['content-type']);
      const i = Number(data.line) - 1;
      if (cart.items[i]) {
        if (Number(data.quantity) <= 0) cart.items.splice(i, 1);
        else cart.items[i].quantity = Number(data.quantity);
      }
      const sections = await renderSections(data.sections || [], 'index');
      return send(res, 200, JSON.stringify({ ...cartDrop(), sections }), 'application/json');
    }
    if (url.pathname === '/__reset') {
      cart.items = [];
      return send(res, 200, 'ok', 'text/plain');
    }
    const page = url.pathname.startsWith('/products/') ? 'product' : url.pathname === '/' ? 'index' : url.pathname === '/cart' ? 'cart' : null;
    if (page && fs.existsSync(path.join(root, `templates/${page}.json`))) return send(res, 200, await renderPage(page, url.searchParams.get('view')));
    return send(res, 404, '<h1>404 (aperçu local)</h1>');
  } catch (err) {
    console.error(err);
    return send(res, 500, `<pre>${String(err.stack || err).replace(/</g, '&lt;')}</pre>`);
  } finally {
    if (missing.size) {
      console.warn('Traductions manquantes :', [...missing].join(', '));
      missing.clear();
    }
  }
});

server.listen(port, () => console.log(`Aperçu local : http://localhost:${port}/${designMode ? ' (mode éditeur)' : ''}`));
