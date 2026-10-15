/* Clean Fast 37 — visite en vol pilotée par le scroll.
 *
 * Le rendu (canvas) est séparé du contenu (HTML sémantique) :
 *  - la scène épinglée dessine une séquence d'images choisie par la position de scroll ;
 *  - les chapitres de texte restent du HTML net, sélectionnable et accessible.
 *
 * Chronologie par morceaux : chaque beat de content/flight.json associe sa propre
 * distance de scroll (vh) à son propre intervalle du clip (from → to, en secondes).
 * Un beat avec from == to est un arrêt sur image.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var section = document.querySelector("[data-flight]");
  var dataEl = document.getElementById("flight-data");
  if (!section || !dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var manifest = data.manifest;
  var beats = data.beats;
  var sticky = section.querySelector(".flight__sticky");
  var stage = section.querySelector(".flight__stage");
  var canvas = section.querySelector(".flight__canvas");
  var progressBar = section.querySelector(".flight__progress");
  var chapterEls = Array.prototype.slice.call(section.querySelectorAll("[data-chapter]"));
  var chapterAlign = {};
  chapterEls.forEach(function (el) { chapterAlign[el.dataset.chapter] = el.dataset.align || "left"; });

  var PREF_KEY = "cf37-motion";
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function readPref() { try { return localStorage.getItem(PREF_KEY); } catch (e) { return null; } }
  function writePref(v) { try { localStorage.setItem(PREF_KEY, v); } catch (e) { /* stockage indisponible */ } }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smoothstep(a, b, x) {
    if (b <= a) return x >= b ? 1 : 0;
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /* ——— Contraintes de l'appareil ——— */
  var conn = navigator.connection || {};
  var memory = navigator.deviceMemory || 4;
  var smallScreen = Math.min(window.screen.width, window.screen.height) < 600;
  var lowEnd = memory <= 4 || smallScreen;

  /* ——— Chargement des images ——— */
  function FrameStore(opts) {
    this.count = opts.count;
    this.urlFor = opts.urlFor;
    this.useFetch = /^https?:$/.test(location.protocol) && "fetch" in window;
    this.encoded = new Map();      // index → Blob (ou HTMLImageElement en file://)
    this.encodedBytes = 0;
    this.maxEncodedBytes = opts.maxEncodedBytes;
    this.bitmaps = new Map();      // index → ImageBitmap décodé
    this.maxBitmaps = opts.maxBitmaps;
    this.inflight = new Map();     // index → AbortController
    this.decoding = new Set();
    this.attempts = new Map();
    this.queue = [];
    this.wanted = new Set();
    this.concurrency = opts.concurrency;
    this.current = 0;
    this.dir = 1;
    this.onReady = opts.onReady;
    this.destroyed = false;
    this.coarse = [];
    var stride = opts.coarseStride;
    for (var i = 0; i < this.count; i += stride) this.coarse.push(i);
    if (this.coarse[this.coarse.length - 1] !== this.count - 1) this.coarse.push(this.count - 1);
  }

  FrameStore.prototype.focus = function (index, dir) {
    if (this.destroyed) return;
    this.current = index;
    if (dir) this.dir = dir;
    var ahead = 28, behind = 8, list = [index], k, j;
    for (k = 1; k <= ahead; k++) {
      j = index + this.dir * k;
      if (j >= 0 && j < this.count) list.push(j);
      if (k <= behind) {
        j = index - this.dir * k;
        if (j >= 0 && j < this.count) list.push(j);
      }
    }
    var near = new Set(list);
    // Passe grossière : une image sur N sur toute la séquence, la plus proche d'abord,
    // pour qu'un saut rapide affiche immédiatement une image voisine.
    var self = this;
    var coarse = this.coarse.slice().sort(function (a, b) { return Math.abs(a - index) - Math.abs(b - index); });
    coarse.forEach(function (c) { if (!near.has(c)) list.push(c); });
    this.wanted = new Set(list);
    this.queue = list.filter(function (i) { return !self.encoded.has(i) && !self.inflight.has(i) && (self.attempts.get(i) || 0) < 3; });

    // Annule les requêtes devenues inutiles (hors fenêtre et hors passe grossière).
    this.inflight.forEach(function (ctrl, i) {
      if (!self.wanted.has(i)) { ctrl.abort(); self.inflight.delete(i); }
    });
    this.pump();

    // Décode l'image courante et ses voisines immédiates dans le sens du scroll.
    for (k = -2; k <= 4; k++) {
      j = index + this.dir * k;
      if (j >= 0 && j < this.count && this.encoded.has(j)) this.decode(j);
    }
  };

  FrameStore.prototype.pump = function () {
    while (!this.destroyed && this.inflight.size < this.concurrency && this.queue.length) {
      var i = this.queue.shift();
      if (this.encoded.has(i) || this.inflight.has(i)) continue;
      this.load(i);
    }
  };

  FrameStore.prototype.load = function (i) {
    var self = this;
    var ctrl = new AbortController();
    this.inflight.set(i, ctrl);
    var url = this.urlFor(i);
    var p;
    if (this.useFetch) {
      p = fetch(url, { signal: ctrl.signal, credentials: "same-origin" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      });
    } else {
      p = new Promise(function (resolve, reject) {
        var img = new Image();
        img.decoding = "async";
        ctrl.signal.addEventListener("abort", function () { img.src = ""; reject(new DOMException("Aborted", "AbortError")); });
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("image error")); };
        img.src = url;
      });
    }
    p.then(function (enc) {
      if (self.destroyed) return;
      self.storeEncoded(i, enc);
      if (Math.abs(i - self.current) <= 4) self.decode(i);
      else if (!self.bitmaps.size) self.decode(i);
    }).catch(function (err) {
      if (err && err.name === "AbortError") return;
      var n = (self.attempts.get(i) || 0) + 1;
      self.attempts.set(i, n);
      if (n < 3) {
        setTimeout(function () {
          if (!self.destroyed && self.wanted.has(i) && !self.encoded.has(i)) { self.queue.unshift(i); self.pump(); }
        }, 350 * Math.pow(2, n));
      }
    }).then(function () {
      if (self.inflight.get(i) === ctrl) self.inflight.delete(i);
      self.pump();
    });
  };

  FrameStore.prototype.storeEncoded = function (i, enc) {
    var size = enc.size || 60000;
    this.encoded.set(i, enc);
    this.encodedBytes += size;
    if (this.encodedBytes <= this.maxEncodedBytes) return;
    // Évince les images encodées les plus éloignées de la position courante.
    var self = this;
    var keys = Array.from(this.encoded.keys()).sort(function (a, b) { return Math.abs(b - self.current) - Math.abs(a - self.current); });
    for (var n = 0; n < keys.length && this.encodedBytes > this.maxEncodedBytes; n++) {
      var k = keys[n];
      if (Math.abs(k - this.current) < 12) break;
      var e = this.encoded.get(k);
      this.encodedBytes -= e.size || 60000;
      this.encoded.delete(k);
    }
  };

  FrameStore.prototype.decode = function (i) {
    if (this.bitmaps.has(i) || this.decoding.has(i)) return;
    var enc = this.encoded.get(i);
    if (!enc) return;
    var self = this;
    this.decoding.add(i);
    createImageBitmap(enc).then(function (bmp) {
      self.decoding.delete(i);
      if (self.destroyed) { bmp.close(); return; }
      self.bitmaps.set(i, bmp);
      self.evictBitmaps();
      self.onReady(i);
    }).catch(function () {
      self.decoding.delete(i);
      self.encoded.delete(i);
    });
  };

  FrameStore.prototype.evictBitmaps = function () {
    if (this.bitmaps.size <= this.maxBitmaps) return;
    var self = this;
    var keys = Array.from(this.bitmaps.keys()).sort(function (a, b) { return Math.abs(b - self.current) - Math.abs(a - self.current); });
    for (var n = 0; n < keys.length && this.bitmaps.size > this.maxBitmaps; n++) {
      var bmp = this.bitmaps.get(keys[n]);
      if (bmp && bmp.close) bmp.close();
      this.bitmaps.delete(keys[n]);
    }
  };

  // Renvoie l'image exacte si elle est prête, sinon la plus proche disponible.
  FrameStore.prototype.get = function (i) {
    var exact = this.bitmaps.get(i);
    if (exact) return { bitmap: exact, index: i, exact: true };
    if (this.encoded.has(i)) this.decode(i);
    var best = null, bestD = Infinity;
    this.bitmaps.forEach(function (bmp, k) {
      var d = Math.abs(k - i);
      if (d < bestD) { bestD = d; best = { bitmap: bmp, index: k, exact: false }; }
    });
    // Une image encodée plus proche que le meilleur bitmap ? On la décode.
    if (bestD > 1) {
      var self = this, nearestEnc = null, nd = bestD;
      this.encoded.forEach(function (_, k) { var d = Math.abs(k - i); if (d < nd) { nd = d; nearestEnc = k; } });
      if (nearestEnc !== null) self.decode(nearestEnc);
    }
    return best;
  };

  FrameStore.prototype.destroy = function () {
    this.destroyed = true;
    this.inflight.forEach(function (ctrl) { ctrl.abort(); });
    this.inflight.clear();
    this.bitmaps.forEach(function (bmp) { if (bmp.close) bmp.close(); });
    this.bitmaps.clear();
    this.encoded.clear();
    this.queue = [];
  };

  /* ——— Moteur de la visite ——— */
  var state = null;

  function frameUrl(i) {
    var n = String(i + (manifest.start || 0));
    while (n.length < (manifest.pad || 4)) n = "0" + n;
    return manifest.base + manifest.pattern.replace("{index}", n) + "?v=" + encodeURIComponent(manifest.version);
  }

  function chapterRanges() {
    var ranges = {};
    beats.forEach(function (b) {
      if (!b.chapter) return;
      var r = ranges[b.chapter] || (ranges[b.chapter] = { start: Infinity, end: -Infinity });
      r.start = Math.min(r.start, b._start);
      r.end = Math.max(r.end, b._end);
    });
    var ids = chapterEls.map(function (el) { return el.dataset.chapter; }).filter(function (id) { return ranges[id]; });
    ids.forEach(function (id, n) { ranges[id].first = n === 0; ranges[id].last = n === ids.length - 1; });
    return ranges;
  }

  function layout() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    // Unité vh stable : on ignore les petites variations dues aux barres du navigateur mobile.
    if (!state.vh || w !== state.width || Math.abs(h - state.vh) > 140) state.vh = h;
    state.width = w;
    var acc = 0;
    beats.forEach(function (b) {
      b._start = acc;
      acc += (b.vh * state.vh) / 100;
      b._end = acc;
    });
    state.travel = acc;
    state.stageH = sticky.offsetHeight || h;
    section.style.setProperty("--flight-height", Math.round(acc + state.stageH) + "px");
    state.ranges = chapterRanges();
    state.fade = (data.fadeVh || 25) * state.vh / 100;
    sizeCanvas();
    state.lastDrawKey = "";
  }

  function sizeCanvas() {
    var cssW = canvas.clientWidth || window.innerWidth;
    var cssH = canvas.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2, 2560 / Math.max(cssW, 1));
    var cw = Math.max(1, Math.round(cssW * dpr));
    var ch = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      state.ctx.imageSmoothingEnabled = true;
      state.ctx.imageSmoothingQuality = "high";
    }
  }

  function scrollProgress() {
    var top = section.getBoundingClientRect().top;
    return clamp(-top, 0, state.travel);
  }

  // Position de scroll (px dans la section) → temps du clip, cadrage, beat.
  function sample(p) {
    var b = beats[beats.length - 1], u = 1;
    for (var i = 0; i < beats.length; i++) {
      if (p < beats[i]._end || i === beats.length - 1) {
        b = beats[i];
        u = b._end > b._start ? clamp((p - b._start) / (b._end - b._start), 0, 1) : 1;
        break;
      }
    }
    var f = b.focus || [0.5, 0.5];
    return { time: b.from + (b.to - b.from) * u, focus: f[0] + (f[1] - f[0]) * u, beat: b };
  }

  function updateChapters(p) {
    var scrim = 0, scrimAlign = "left";
    chapterEls.forEach(function (el) {
      var id = el.dataset.chapter;
      var r = state.ranges[id];
      var o = 0, y = 0;
      if (r) {
        var fade = Math.min(state.fade, (r.end - r.start) * 0.3);
        var a = r.first ? 1 : smoothstep(r.start, r.start + fade, p);
        var b = r.last ? 1 : 1 - smoothstep(r.end - fade, r.end, p);
        if (!r.first && p < r.start) a = 0;
        if (!r.last && p > r.end) b = 0;
        o = a * b;
        y = (1 - a) * 28 - (1 - b) * 28;
      }
      var prev = el._o;
      if (prev === undefined || Math.abs(prev - o) > 0.001) {
        el.style.setProperty("--o", o.toFixed(3));
        el.style.setProperty("--y", y.toFixed(1) + "px");
        el._o = o;
      }
      var visible = o > 0.35;
      var hidden = o < 0.01;
      if (el._visible !== visible) { el.classList.toggle("is-visible", visible); el._visible = visible; }
      if (el._hidden !== hidden) {
        el.classList.toggle("is-hidden", hidden);
        el.inert = !visible;
        el._hidden = hidden;
      } else if (el.inert === visible) {
        el.inert = !visible;
      }
      if (o > scrim) { scrim = o; scrimAlign = chapterAlign[id]; }
    });
    stage.style.setProperty("--scrim", scrim.toFixed(3));
    stage.style.setProperty("--scrim-dir", scrimAlign === "right" ? "to left" : "to right");
    if (progressBar) progressBar.style.setProperty("--p", (state.travel ? p / state.travel : 0).toFixed(4));
  }

  function draw(index, focus) {
    var got = state.store.get(index);
    if (!got) {
      stage.classList.add("is-waiting");
      return false;
    }
    var key = got.index + "|" + focus.toFixed(3) + "|" + canvas.width + "x" + canvas.height;
    if (key !== state.lastDrawKey) {
      var bmp = got.bitmap;
      var cw = canvas.width, ch = canvas.height;
      var scale = Math.max(cw / bmp.width, ch / bmp.height);
      var dw = bmp.width * scale, dh = bmp.height * scale;
      var dx = (cw - dw) * focus;
      var dy = (ch - dh) / 2;
      state.ctx.drawImage(bmp, dx, dy, dw, dh);
      state.lastDrawKey = key;
      state.drawnIndex = got.index;
      if (!state.hasFrame) { state.hasFrame = true; stage.classList.add("has-frame"); }
    }
    if (got.exact) {
      state.waitingSince = 0;
      stage.classList.remove("is-waiting");
    } else {
      var now = performance.now();
      if (!state.waitingSince) state.waitingSince = now;
      stage.classList.toggle("is-waiting", now - state.waitingSince > 400);
    }
    return got.exact;
  }

  function tick(now) {
    state.raf = 0;
    if (!state.active) return;
    var dt = state.lastTick ? Math.min(now - state.lastTick, 100) : 16.7;
    state.lastTick = now;

    var p = scrollProgress();
    var s = sample(p);
    var target = s.time;
    var dir = p > state.lastP ? 1 : p < state.lastP ? -1 : state.dir;
    state.dir = dir;
    state.lastP = p;

    // Léger lissage de la tête de lecture ; saut direct pour les grands déplacements.
    var diff = target - state.shown;
    if (Math.abs(diff) > 2.5 || state.shown < 0) state.shown = target;
    else state.shown += diff * (1 - Math.pow(1 - 0.24, dt / 16.7));
    if (Math.abs(target - state.shown) < 0.25 / manifest.fps) state.shown = target;

    var index = clamp(Math.round(state.shown * manifest.fps), 0, manifest.count - 1);
    state.store.focus(index, dir);
    var exact = draw(index, s.focus);
    updateChapters(p);
    state.debug = { p: p, time: target, shown: state.shown, index: index, drawn: state.drawnIndex, beat: s.beat.id, exact: exact };
    section.dataset.frame = String(state.drawnIndex == null ? -1 : state.drawnIndex);
    section.dataset.beat = s.beat.id;

    if (state.shown !== target || !exact) schedule();
  }

  function schedule() {
    if (!state || !state.active || state.raf) return;
    state.raf = requestAnimationFrame(tick);
  }

  function onScroll() { schedule(); }
  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (state && state.active) { layout(); schedule(); } }, 120);
  }

  function start() {
    if (state && state.active) return;
    if (!canvas.getContext || !window.createImageBitmap) return false;
    root.classList.add("is-tour");
    state = {
      active: true,
      ctx: canvas.getContext("2d", { alpha: false }),
      vh: 0, width: 0, shown: -1, lastP: 0, dir: 1,
      raf: 0, lastTick: 0, hasFrame: false, lastDrawKey: "", drawnIndex: null
    };
    state.store = new FrameStore({
      count: manifest.count,
      urlFor: frameUrl,
      concurrency: lowEnd ? 4 : 6,
      maxBitmaps: lowEnd ? 10 : 20,
      maxEncodedBytes: (lowEnd ? 40 : 110) * 1024 * 1024,
      coarseStride: Math.max(4, Math.round(manifest.fps * 0.6)),
      onReady: function () { state.lastDrawKey = ""; schedule(); }
    });
    layout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    schedule();
    window.__flight = state;
    return true;
  }

  function stop() {
    if (!state) return;
    state.active = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.store.destroy();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    root.classList.remove("is-tour");
    section.style.removeProperty("--flight-height");
    stage.classList.remove("has-frame", "is-waiting");
    chapterEls.forEach(function (el) {
      el.inert = false;
      el.classList.remove("is-visible", "is-hidden");
      el.style.removeProperty("--o");
      el.style.removeProperty("--y");
      el._o = el._visible = el._hidden = undefined;
    });
    state = null;
    window.__flight = null;
  }

  function setMotion(on, remember) {
    if (remember) writePref(on ? "on" : "off");
    var anchor = section.getBoundingClientRect().top <= 0;
    if (on) start(); else stop();
    if (anchor) section.scrollIntoView({ block: "start", behavior: "auto" });
  }

  section.addEventListener("click", function (e) {
    var t = e.target.closest("[data-motion-toggle]");
    if (!t) return;
    setMotion(t.getAttribute("data-motion-toggle") === "on", true);
  });

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (e) {
      if (e.matches && readPref() !== "on") setMotion(false, false);
    });
  }

  if (root.classList.contains("is-tour")) {
    if (start() === false) root.classList.remove("is-tour");
  }
})();
