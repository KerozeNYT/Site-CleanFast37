/* Clean Fast 37 — en-tête, menu mobile et formulaire de devis. */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var banner = document.querySelector(".demo-banner");
  var themed = Array.prototype.slice.call(document.querySelectorAll("[data-header]"));

  /* ——— En-tête : fond au scroll, thème clair/sombre selon la section dessous ——— */
  var bannerH = 0;
  function measureBanner() {
    bannerH = banner ? banner.offsetHeight : 0;
    root.style.setProperty("--banner-h", bannerH + "px");
  }

  var ticking = false;
  function updateHeader() {
    ticking = false;
    var y = window.scrollY;
    if (banner) root.style.setProperty("--banner-h", Math.max(0, bannerH - y) + "px");
    header.classList.toggle("is-scrolled", y > 8);
    var probe = header.getBoundingClientRect().bottom - 1;
    var theme = "dark";
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { theme = themed[i].dataset.header; break; }
    }
    if (header.dataset.on !== theme) header.dataset.on = theme;
  }
  function requestHeader() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateHeader); }
  }
  if (header) {
    measureBanner();
    updateHeader();
    window.addEventListener("scroll", requestHeader, { passive: true });
    window.addEventListener("resize", function () { measureBanner(); requestHeader(); });
  }

  /* ——— Menu mobile ——— */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    nav.classList.toggle("is-open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (e) { if (e.matches) setMenu(false); });
  }

  /* ——— Formulaire de devis ———
     Avec un endpoint : envoi réel (POST) et message de succès uniquement sur réponse 2xx.
     Sans endpoint : mode démonstration explicite, aucun message « envoyé ». */
  var form = document.querySelector("[data-quote-form]");
  if (form) {
    var status = form.querySelector(".form__status");
    var submit = form.querySelector("[type=submit]");
    var endpoint = form.getAttribute("data-endpoint");
    function setStatus(state, text) {
      status.dataset.state = state;
      status.textContent = text;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (!endpoint) {
        setStatus("demo", form.getAttribute("data-demo-result"));
        return;
      }
      submit.disabled = true;
      setStatus("pending", "Envoi en cours…");
      fetch(endpoint, {
        method: (form.getAttribute("method") || "POST").toUpperCase(),
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        setStatus("success", form.getAttribute("data-success"));
        form.reset();
      }).catch(function () {
        setStatus("error", form.getAttribute("data-error"));
      }).then(function () {
        submit.disabled = false;
      });
    });
  }
})();
