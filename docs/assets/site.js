/* ==========================================================================
   MelbourneWebDesigners.com — progressive-enhancement helpers
   Mobile nav · sticky-header state · list filter · scroll reveals ·
   row link propagation · cost estimator. The site is fully functional
   without JS; all of this is enhancement. Motion respects reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- sticky header: add .scrolled once the page moves ---- */
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- mobile nav (full-screen overlay) ---- */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("nav-menu");
  var closeBtn = document.getElementById("nav-close");
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () { setOpen(!menu.classList.contains("open")); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false);
    });
  }

  /* ---- THE LIST filter: platform tokens + an "ecom" pseudo-filter ---- */
  var filterBar = document.getElementById("dir-filters");
  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-platforms]"));
  if (filterBar && rows.length) {
    var btns = Array.prototype.slice.call(filterBar.querySelectorAll(".filter-btn"));
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      var want = btn.getAttribute("data-filter");
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      var shown = 0;
      rows.forEach(function (row) {
        var match;
        if (want === "all") match = true;
        else if (want === "ecom") match = row.getAttribute("data-ecom") === "1";
        else match = (row.getAttribute("data-platforms") || "").split("|").indexOf(want) !== -1;
        row.classList.toggle("hide", !match);
        if (match) shown++;
      });
      var empty = document.getElementById("dir-empty");
      if (empty) empty.classList.toggle("hide", shown > 0);
    });
  }

  /* ---- row external link: don't trigger the whole-row profile link ---- */
  document.querySelectorAll("[data-stop]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.stopPropagation(); });
  });

  /* ---- scroll reveals (IntersectionObserver), reduced-motion safe ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (revealEls.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
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

  /* ---- floating mobile CTA: fade in once the featured "Get a free quote"
     button scrolls out of view; hide near the footer CTA and when nav is open ---- */
  var mcta = document.getElementById("m-cta");
  var mctaTrigger = document.getElementById("sf-quote");
  if (mcta && mctaTrigger) {
    var footerEl = document.getElementById("site-footer");
    var mctaShown = false, mctaTick = false;
    var updateMcta = function () {
      mctaTick = false;
      var passed = mctaTrigger.getBoundingClientRect().bottom < 0;
      var footerRevealed = footerEl ? footerEl.getBoundingClientRect().top < window.innerHeight : false;
      var navOpen = menu && menu.classList.contains("open");
      var show = passed && !footerRevealed && !navOpen;
      if (show !== mctaShown) {
        mcta.classList.toggle("show", show);
        mcta.setAttribute("aria-hidden", show ? "false" : "true");
        mcta.setAttribute("tabindex", show ? "0" : "-1");
        mctaShown = show;
      }
    };
    var onMctaScroll = function () { if (!mctaTick) { mctaTick = true; requestAnimationFrame(updateMcta); } };
    window.addEventListener("scroll", onMctaScroll, { passive: true });
    window.addEventListener("resize", onMctaScroll, { passive: true });
    // reliable "footer revealed" trigger — fires the moment the footer crosses in/out
    if ("IntersectionObserver" in window && footerEl) {
      new IntersectionObserver(onMctaScroll, { threshold: 0 }).observe(footerEl);
    }
    updateMcta();
  }
})();
