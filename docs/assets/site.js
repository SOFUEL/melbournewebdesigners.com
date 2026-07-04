/* ==========================================================================
   MelbourneWebDesigners.com — small progressive-enhancement helpers
   Mobile nav toggle · directory platform filter · cost estimator.
   All optional: the site is fully functional without JS.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- mobile nav ---- */
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---- directory platform filter ---- */
  var filterBar = document.getElementById("dir-filters");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-platforms]"));
  if (filterBar && cards.length) {
    var btns = Array.prototype.slice.call(filterBar.querySelectorAll(".filter-btn"));
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      var want = btn.getAttribute("data-filter");
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      var shown = 0;
      cards.forEach(function (card) {
        var plats = (card.getAttribute("data-platforms") || "").split("|");
        var match = want === "all" || plats.indexOf(want) !== -1;
        card.classList.toggle("hide", !match);
        if (match) shown++;
      });
      var empty = document.getElementById("dir-empty");
      if (empty) empty.classList.toggle("hide", shown > 0);
    });
  }

  /* ---- cost estimator ---- */
  var est = document.getElementById("estimator");
  if (est) {
    // base bands (A$) by project type: [low, high] for a ~5-page baseline
    var BASE = {
      "Business website": [3000, 10000],
      "E-commerce store": [6000, 30000],
      "Landing page":     [1200, 4000],
      "Web app / custom": [15000, 60000]
    };
    // maps the computed midpoint to a funnel budget band string
    function bandForMid(mid) {
      if (mid < 4000) return "Under $4k";
      if (mid < 8000) return "$4k – $8k";
      if (mid < 15000) return "$8k – $15k";
      return "$15k+";
    }
    var state = { type: "Business website", pages: 5, features: {} };

    var typePills = est.querySelectorAll("[data-est-type]");
    typePills.forEach(function (p) {
      p.addEventListener("click", function () {
        typePills.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        p.setAttribute("aria-pressed", "true");
        state.type = p.getAttribute("data-est-type");
        recompute();
      });
    });

    var pagesInput = document.getElementById("est-pages");
    var pagesOut = document.getElementById("est-pages-out");
    if (pagesInput) {
      pagesInput.addEventListener("input", function () {
        state.pages = parseInt(pagesInput.value, 10) || 1;
        if (pagesOut) pagesOut.textContent = state.pages >= 25 ? "25+" : String(state.pages);
        recompute();
      });
    }

    var featurePills = est.querySelectorAll("[data-est-feature]");
    featurePills.forEach(function (p) {
      p.addEventListener("click", function () {
        var f = p.getAttribute("data-est-feature");
        var on = p.getAttribute("aria-pressed") === "true";
        p.setAttribute("aria-pressed", on ? "false" : "true");
        state.features[f] = !on;
        recompute();
      });
    });

    var valEl = document.getElementById("est-val");
    var ctaEl = document.getElementById("est-cta");

    function recompute() {
      var base = BASE[state.type] || BASE["Business website"];
      var low = base[0], high = base[1];
      // pages beyond the 5-page baseline add cost
      var extraPages = Math.max(0, state.pages - 5);
      var perPageLow = state.type === "Landing page" ? 250 : 350;
      var perPageHigh = state.type === "Landing page" ? 600 : 900;
      low += extraPages * perPageLow;
      high += extraPages * perPageHigh;
      // feature add-ons (rough honest ranges)
      var FEAT = {
        cms:        [800, 3000],
        booking:    [1200, 5000],
        payments:   [1500, 6000],
        integrations:[1500, 8000],
        seo:        [1000, 4000],
        copy:       [800, 3500]
      };
      Object.keys(state.features).forEach(function (f) {
        if (state.features[f] && FEAT[f]) { low += FEAT[f][0]; high += FEAT[f][1]; }
      });
      var fmt = function (n) { return "A$" + Math.round(n / 100) * 100 >= 1000
        ? "A$" + (Math.round(n / 500) * 500).toLocaleString("en-AU")
        : "A$" + Math.round(n).toLocaleString("en-AU"); };
      if (valEl) {
        // clear + rebuild without innerHTML
        while (valEl.firstChild) valEl.removeChild(valEl.firstChild);
        var lowSpan = document.createElement("span");
        lowSpan.textContent = fmt(low);
        var dash = document.createTextNode(" – ");
        var highSpan = document.createElement("span");
        highSpan.textContent = fmt(high);
        valEl.appendChild(lowSpan);
        valEl.appendChild(dash);
        valEl.appendChild(highSpan);
      }
      var mid = (low + high) / 2;
      var band = bandForMid(mid);
      if (ctaEl) ctaEl.setAttribute("href", "../get-quote/?budget=" + encodeURIComponent(band));
    }

    recompute();
  }
})();
