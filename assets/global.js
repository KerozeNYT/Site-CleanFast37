/* Maison Nette — scripts du thème.
   Léger et modulaire : chaque comportement ne s'active que si son élément est présent.
   Panier : Ajax Cart API + Section Rendering API (aucun faux panier, paiement sur le checkout Shopify). */
(() => {
  'use strict';

  const theme = window.theme || {};
  const strings = theme.strings || {};
  const routes = theme.routes || {};
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (theme.motion === false) root.classList.add('motion-off');
  const motionAllowed = () => theme.motion !== false && !reducedMotion.matches;

  /* ---------- Utilitaires ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function formatMoney(cents, format = theme.moneyFormat || '{{amount_with_comma_separator}} €') {
    const value = Number(cents) / 100;
    const group = (num, decimals, thousands, decimal) => {
      const [int, frac] = num.toFixed(decimals).split('.');
      const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return frac ? withSep + decimal + frac : withSep;
    };
    return format.replace(/ /g, '\u00a0').replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount': return group(value, 2, ',', '.');
        case 'amount_no_decimals': return group(value, 0, ',', '.');
        case 'amount_with_comma_separator': return group(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return group(value, 0, '.', ',');
        case 'amount_with_space_separator': return group(value, 2, ' ', ',');
        case 'amount_no_decimals_with_space_separator': return group(value, 0, ' ', ',');
        case 'amount_with_apostrophe_separator': return group(value, 2, "'", '.');
        default: return group(value, 2, '.', ',');
      }
    });
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || data.status) throw data;
    return data;
  }

  /** Remplace le contenu de cible par celui de la section rendue (Section Rendering API). */
  function sectionInner(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rootEl = doc.querySelector('[data-cart-root]') || doc.querySelector('.shopify-section') || doc.body;
    return rootEl.innerHTML;
  }

  /* ---------- Apparition au défilement ---------- */
  function initReveal() {
    const items = $$('.reveal:not(.is-visible)');
    if (!items.length) return;
    if (!motionAllowed() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    const toggle = $('[data-menu-toggle]');
    const nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!nav) return;
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.hidden = !open;
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !nav.hidden) {
        set(false);
        toggle.focus();
      }
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) set(false);
    });
  }

  /* ---------- Barre produit : masque les ancres sans cible (ex. avant/après non publié) ---------- */
  function initSubnav() {
    $$('[data-subnav] a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      if (id && !document.getElementById(id)) a.hidden = true;
    });
  }

  /* ---------- Quantités ---------- */
  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-quantity-step]');
    if (!step) return;
    const input = $('input', step.closest('[data-quantity]'));
    const min = input.min === '' ? 0 : Number(input.min);
    const max = input.max === '' ? Infinity : Number(input.max);
    const next = Math.min(max, Math.max(min, (Number(input.value) || 0) + Number(step.dataset.quantityStep)));
    if (next === Number(input.value)) return;
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Formulaires produit ---------- */
  function updateAddLabel(form) {
    const button = $('[data-add-button]', form);
    if (!button) return;
    const label = $('[data-add-label]', button);
    const variantInput = $('[data-variant-input]', form);
    let price = Number(button.dataset.price);
    let available = !button.disabled;
    if (variantInput && variantInput.tagName === 'SELECT') {
      const option = variantInput.selectedOptions[0];
      price = Number(option.dataset.price);
      available = option.dataset.available === 'true';
      button.dataset.price = price;
    }
    const qtyInput = $('input[name="quantity"]', form);
    const qty = Math.max(1, Number(qtyInput && qtyInput.value) || 1);
    button.disabled = !available;
    const template = button.dataset.labelTemplate || strings.addToCartPrice || '';
    label.textContent = available ? template.replace('[price]', formatMoney(price * qty)) : strings.soldOut;
  }

  function initProductForms() {
    $$('form[data-product-form]').forEach((form) => {
      if (form.dataset.bound) return;
      form.dataset.bound = 'true';
      form.addEventListener('change', (e) => {
        if (e.target.matches('[data-variant-input]') && form.closest('[data-main-product]')) {
          const url = new URL(window.location.href);
          url.searchParams.set('variant', e.target.value);
          window.history.replaceState({}, '', url);
        }
        updateAddLabel(form);
      });
      form.addEventListener('input', (e) => {
        if (e.target.name === 'quantity') updateAddLabel(form);
      });
      form.addEventListener('submit', (e) => onAddToCart(e, form));
    });
  }

  async function onAddToCart(e, form) {
    if (theme.cartType === 'page' && form.dataset.afterAdd !== 'checkout') return; // envoi classique vers /cart
    e.preventDefault();
    const button = $('[data-add-button]', form);
    const label = button && $('[data-add-label]', button);
    const status = $('[data-form-status]', form);
    if (!button || button.disabled) return;

    const original = label.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = strings.adding;
    if (status) status.textContent = '';

    const body = new FormData(form);
    body.append('sections', 'cart-drawer,cart-icon-bubble');
    body.append('sections_url', window.location.pathname);

    try {
      const res = await fetch(routes.cartAdd + '.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body
      });
      const data = await res.json();
      if (!res.ok || data.status) throw data;

      document.dispatchEvent(new CustomEvent('cart:added', { detail: { item: data } }));
      if (form.dataset.afterAdd === 'checkout') {
        window.location.href = (routes.root || '/').replace(/\/?$/, '/') + 'checkout';
        return;
      }
      if (data.sections) Cart.render(data.sections);
      Cart.open(button);
    } catch (err) {
      const message = (err && (err.description || err.message)) || strings.cartError;
      if (status) status.textContent = message;
      else Cart.open(button, message);
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = false;
      label.textContent = original;
      updateAddLabel(form);
    }
  }

  /* ---------- Panier (latéral et page) ---------- */
  const Cart = {
    drawer: null,
    lastFocus: null,
    timers: new WeakMap(),

    init() {
      this.drawer = $('[data-cart-drawer]');
      document.addEventListener('click', (e) => {
        const opener = e.target.closest('[data-cart-open]');
        if (opener && this.drawer) {
          e.preventDefault();
          this.open(opener);
          return;
        }
        if (e.target.closest('[data-cart-close]') && this.drawer && this.drawer.classList.contains('is-open')) {
          const link = e.target.closest('a[href]');
          if (!link || link.getAttribute('href') === '#' || link.pathname === window.location.pathname) e.preventDefault();
          this.close();
          return;
        }
        const remove = e.target.closest('[data-remove-line]');
        if (remove) {
          e.preventDefault();
          this.change(remove.closest('[data-cart-root]'), Number(remove.dataset.removeLine), 0);
        }
      });

      document.addEventListener('change', (e) => {
        const input = e.target.closest('[data-cart-root] input[name="updates[]"]');
        if (!input) return;
        const item = input.closest('[data-line]');
        const rootEl = input.closest('[data-cart-root]');
        clearTimeout(this.timers.get(item));
        this.timers.set(item, setTimeout(() => this.change(rootEl, Number(item.dataset.line), Math.max(0, Number(input.value) || 0), input.id), 350));
      });

      document.addEventListener('keydown', (e) => {
        if (!this.drawer || !this.drawer.classList.contains('is-open')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'Tab') this.trapFocus(e);
      });
    },

    panel() {
      return this.drawer && $('.cart-drawer__panel', this.drawer);
    },

    open(trigger, message) {
      if (!this.drawer) {
        window.location.href = routes.cart;
        return;
      }
      this.lastFocus = trigger || document.activeElement;
      this.drawer.classList.add('is-open');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drawer-open');
      const status = $('[data-cart-status]', this.drawer);
      if (status && message) status.textContent = message;
      requestAnimationFrame(() => this.panel().focus());
    },

    close() {
      if (!this.drawer) return;
      this.drawer.classList.remove('is-open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drawer-open');
      if (this.lastFocus && document.contains(this.lastFocus)) this.lastFocus.focus();
    },

    trapFocus(e) {
      const focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', this.panel())
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === this.panel())) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },

    /** Met à jour le panier latéral, la page panier et la pastille à partir des sections rendues. */
    render(sections, focusId) {
      Object.entries(sections).forEach(([id, html]) => {
        if (!html) return;
        if (id === 'cart-icon-bubble') {
          const bubble = document.getElementById('cart-icon-bubble');
          if (bubble) bubble.innerHTML = sectionInner(html);
          const count = bubble ? bubble.textContent.trim() || '0' : '0';
          $$('[data-cart-open]').forEach((a) => {
            if (strings.cartOpen) a.setAttribute('aria-label', strings.cartOpen.replace('[count]', count));
          });
          return;
        }
        $$(`[data-cart-root][data-section-id="${id}"]`).forEach((el) => {
          el.innerHTML = sectionInner(html);
        });
      });
      if (focusId) {
        const el = document.getElementById(focusId);
        if (el) el.focus();
      }
    },

    async change(rootEl, line, quantity, focusId) {
      if (!rootEl || !line) return;
      const ids = new Set(['cart-icon-bubble']);
      $$('[data-cart-root][data-section-id]').forEach((el) => ids.add(el.dataset.sectionId));
      rootEl.classList.add('is-loading');
      const status = $('[data-cart-status]', rootEl);
      if (status) status.textContent = strings.cartUpdating || '';
      try {
        const data = await postJSON(routes.cartChange + '.js', {
          line,
          quantity,
          sections: Array.from(ids),
          sections_url: window.location.pathname
        });
        this.render(data.sections, focusId);
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: data } }));
      } catch (err) {
        const s = $('[data-cart-status]', rootEl);
        if (s) s.textContent = (err && err.description) || strings.cartError;
      } finally {
        rootEl.classList.remove('is-loading');
      }
    }
  };

  /* ---------- Barre d'achat fixe (téléphone) ---------- */
  function initStickyBuy() {
    const bar = $('[data-sticky-buy]');
    const target = bar && document.getElementById(bar.dataset.stickyBuy);
    if (!bar || !target || bar.dataset.bound) return;
    bar.dataset.bound = 'true';
    const footer = $('.site-footer');
    let shown = null;
    let ticking = false;
    // Position calculée au défilement : un saut d'ancre ne déclenche aucun IntersectionObserver.
    const update = () => {
      ticking = false;
      const pastForm = target.getBoundingClientRect().bottom < 0;
      const footerVisible = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      const show = pastForm && !footerVisible;
      if (show === shown) return;
      shown = show;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      $$('a, button', bar).forEach((el) => (show ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1')));
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* ---------- Galerie produit ---------- */
  function initGalleries() {
    $$('[data-gallery]').forEach((gallery) => {
      const track = $('[data-gallery-track]', gallery);
      if (!track) return;
      const slides = $$(':scope > li', track);
      const counter = $('[data-gallery-counter]', gallery);
      const thumbs = $$('[data-gallery-thumb]', gallery);
      const dialog = $('[data-zoom-dialog]', gallery);
      let index = 0;

      const goTo = (i, smooth = true) => {
        index = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft, behavior: smooth && motionAllowed() ? 'smooth' : 'auto' });
      };
      const setActive = (i) => {
        index = i;
        thumbs.forEach((t, n) => t.setAttribute('aria-current', String(n === i)));
        if (counter && strings.mediaCounter) {
          counter.textContent = strings.mediaCounter.replace('[index]', i + 1).replace('[total]', slides.length);
        }
        slides.forEach((s, n) => {
          if (n !== i) $$('video', s).forEach((v) => v.pause());
        });
      };

      let ticking = false;
      track.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
          if (i !== index) setActive(i);
        });
      }, { passive: true });

      thumbs.forEach((t) => t.addEventListener('click', () => {
        const i = Number(t.dataset.galleryThumb);
        goTo(i);
        setActive(i);
      }));
      const prev = $('[data-gallery-prev]', gallery);
      const next = $('[data-gallery-next]', gallery);
      if (prev) prev.addEventListener('click', () => goTo(index - 1));
      if (next) next.addEventListener('click', () => goTo(index + 1));

      if (dialog && typeof dialog.showModal === 'function') {
        let lastZoom = null;
        gallery.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-zoom]');
          if (btn) {
            dialog.showModal();
            const fig = $(`[data-zoom-index="${btn.dataset.zoom}"]`, dialog);
            if (fig) fig.scrollIntoView({ block: 'nearest', inline: 'start' });
            const img = fig && $('img', fig);
            if (img && fig.scrollWidth > fig.clientWidth) fig.scrollLeft = (fig.scrollWidth - fig.clientWidth) / 2;
            lastZoom = btn;
          }
          if (e.target.closest('[data-zoom-close]')) dialog.close();
        });
        dialog.addEventListener('close', () => {
          if (lastZoom) lastZoom.focus();
        });
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) dialog.close();
        });
      }
    });
  }

  /* ---------- Avant / après ---------- */
  function initCompare() {
    $$('[data-compare]').forEach((frame) => {
      const range = $('input[type="range"]', frame);
      const set = (value) => {
        const v = Math.round(Math.max(0, Math.min(100, value)));
        frame.style.setProperty('--pos', v + '%');
        if (range) {
          range.value = v;
          if (strings.compareValue) range.setAttribute('aria-valuetext', strings.compareValue.replace('[value]', v));
        }
      };
      const fromPointer = (e) => {
        const rect = frame.getBoundingClientRect();
        set(((e.clientX - rect.left) / rect.width) * 100);
      };
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let decided = false;
      frame.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        dragging = true;
        decided = e.pointerType === 'mouse';
        startX = e.clientX;
        startY = e.clientY;
        if (decided) {
          frame.setPointerCapture(e.pointerId);
          fromPointer(e);
        }
      });
      frame.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        if (!decided) {
          const dx = Math.abs(e.clientX - startX);
          const dy = Math.abs(e.clientY - startY);
          if (dx < 6 && dy < 6) return;
          decided = true;
          if (dy > dx) {
            dragging = false; // geste vertical : on laisse défiler la page
            return;
          }
          frame.setPointerCapture(e.pointerId);
        }
        fromPointer(e);
      });
      const stop = (e) => {
        if (dragging && !decided && e.type === 'pointerup') fromPointer(e); // simple toucher
        dragging = false;
      };
      frame.addEventListener('pointerup', stop);
      frame.addEventListener('pointercancel', stop);
      if (range) range.addEventListener('input', () => set(Number(range.value)));
    });

    $$('[data-compare-tabs]').forEach((wrap) => {
      const tabs = $$('[role="tab"]', wrap);
      const select = (tab, focus) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
          const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
          if (!(e.key in map)) return;
          e.preventDefault();
          select(tabs[(map[e.key] + tabs.length) % tabs.length], true);
        });
      });
    });
  }

  /* ---------- Vidéo du hero ---------- */
  function initHeroVideo() {
    const video = $('[data-hero-video]');
    if (!video) return;
    const conn = navigator.connection || {};
    const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
    if (!motionAllowed() || slow) return; // l'image fixe reste affichée
    const mobile = window.matchMedia('(max-width: 749px)').matches;
    const src = (mobile && video.dataset.srcMobile) || video.dataset.src;
    if (!src) return;

    const toggle = $('[data-hero-toggle]');
    let userPaused = false;
    let visible = false;
    const setToggle = (playing) => {
      if (!toggle) return;
      toggle.hidden = false;
      toggle.setAttribute('aria-label', playing ? strings.pauseVideo : strings.playVideo);
      $('[data-icon-pause]', toggle).hidden = !playing;
      $('[data-icon-play]', toggle).hidden = playing;
    };
    const play = () => {
      if (userPaused || !visible || document.hidden) return;
      if (!video.src) video.src = src;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    video.addEventListener('playing', () => {
      video.classList.add('is-playing');
      setToggle(true);
    });
    video.addEventListener('pause', () => setToggle(false));
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (video.paused) {
          userPaused = false;
          play();
        } else {
          userPaused = true;
          video.pause();
        }
      });
    }
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else video.pause();
    }, { threshold: 0.25 }).observe(video);
    document.addEventListener('visibilitychange', () => (document.hidden ? video.pause() : play()));
  }

  /* ---------- Perspective au curseur (ordinateur) ---------- */
  function initTilt() {
    if (!finePointer.matches || !motionAllowed()) return;
    $$('[data-tilt]').forEach((stage) => {
      const target = $('[data-tilt-target]', stage);
      if (!target) return;
      let frame = 0;
      stage.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = stage.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          target.style.setProperty('--tilt-y', (x * 10).toFixed(2) + 'deg');
          target.style.setProperty('--tilt-x', (-y * 8).toFixed(2) + 'deg');
          target.style.setProperty('--lift', '-6px');
        });
      });
      stage.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        target.style.removeProperty('--tilt-x');
        target.style.removeProperty('--tilt-y');
        target.style.removeProperty('--lift');
      });
    });
  }

  /* ---------- Démarrage (et rechargement des sections dans l'éditeur de thème) ---------- */
  function init() {
    initReveal();
    initSubnav();
    initProductForms();
    initGalleries();
    initCompare();
    initStickyBuy();
    initHeroVideo();
    initTilt();
  }

  initMenu();
  Cart.init();
  init();
  document.addEventListener('shopify:section:load', init);
  document.addEventListener('shopify:section:select', (e) => {
    $$('.reveal', e.target).forEach((el) => el.classList.add('is-visible'));
  });
})();
