/* Aperçu exporté : simule l'Ajax Cart API dans le navigateur avec les rendus réels du thème.
   Aucun appel réseau, aucun paiement. Le contenu du panier est gardé le temps de l'onglet. */
(() => {
  const STATES = __STATES__;
  const MAX = 10;
  let qty = 0;
  try {
    qty = Math.min(MAX, Number(sessionStorage.getItem('apercu-panier')) || 0);
  } catch (e) {}
  const save = () => {
    try {
      sessionStorage.setItem('apercu-panier', String(qty));
    } catch (e) {}
  };

  const toast = document.querySelector('.apercu-toast');
  let toastTimer = 0;
  const say = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 3600);
  };

  if (window.theme) window.theme.routes.cart = 'panier.html';

  const json = (body) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    const u = String(url);
    if (u.endsWith('/cart/add.js')) {
      const n = opts.body && opts.body.get ? Number(opts.body.get('quantity')) || 1 : 1;
      const before = qty;
      qty = Math.min(MAX, qty + n);
      save();
      if (before + n > MAX) say(`Aperçu limité à ${MAX} articles.`);
      return json({ id: 4242, quantity: n, sections: STATES[qty] });
    }
    if (u.endsWith('/cart/change.js')) {
      const body = JSON.parse(opts.body || '{}');
      qty = Math.min(MAX, Math.max(0, Number(body.quantity) || 0));
      save();
      return json({ item_count: qty, sections: STATES[qty] });
    }
    return realFetch(url, opts);
  };

  // Applique l'état du panier conservé d'une page à l'autre.
  const inner = (html, selector) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const el = (selector && doc.querySelector(selector)) || doc.querySelector('.shopify-section') || doc.body;
    return el.innerHTML;
  };
  const s = STATES[qty];
  const drawer = document.getElementById('CartDrawer-Contents');
  if (drawer && s['cart-drawer']) drawer.innerHTML = inner(s['cart-drawer']);
  const bubble = document.getElementById('cart-icon-bubble');
  if (bubble && s['cart-icon-bubble']) bubble.innerHTML = inner(s['cart-icon-bubble']);
  document.querySelectorAll('[data-cart-root][data-section-id="template--preview__main"]').forEach((el) => {
    el.innerHTML = inner(s['template--preview__main'], '[data-cart-root]');
  });

  // Paiement, pages légales, contact : hors aperçu.
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const action = form.getAttribute('action') || '';
    if (action.includes('/cart/add')) return;
    e.preventDefault();
    if (action.includes('/cart')) say('Ici, le client passe sur le paiement sécurisé Shopify (non inclus dans l’aperçu).');
    else say('Formulaire désactivé dans l’aperçu.');
  }, true);
  document.addEventListener('click', (e) => {
    const off = e.target.closest('[data-preview-off]');
    if (off) {
      e.preventDefault();
      say('Cette page (politiques, contact…) se crée dans Shopify ; elle n’est pas incluse dans l’aperçu.');
    }
    const pay = e.target.closest('.shopify-payment-button__button');
    if (pay) say('Apple Pay, Google Pay ou Shop Pay s’afficheront ici selon les moyens activés dans Shopify.');
  }, true);
  document.querySelectorAll('.shopify-payment-button__button').forEach((b) => (b.disabled = false));
})();
