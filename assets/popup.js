/* ==========================================================================
   MelbourneWebDesigners.com — shortlist BRIDGE popup
   One question ("what are you building?") that hands off into the existing
   /get-quote/ funnel, resuming at the NEXT question. Deliberately not a second
   email capture: MWD had two capture endpoints with two different fulfilment
   promises, competing for the same visitor.
   Triggers: 45% scroll or 28s dwell (both platforms) + desktop exit-intent
   (armed after 8s). Suppressed 7 days after dismiss, forever after handoff.
   Suppressed entirely on the funnel, the cost estimator, and agency profiles.
   Accessible: focus-trapped dialog, ESC closes, focus restored.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("mwd-pop");
  if (!root) return;

  var KEY = "mwd_pop";

  /* Never interrupt:
     - /get-quote/  : the primary conversion itself
     - the cost page: the estimator IS the offer there, and the popup used to
                      fire at ~45% scroll — right between configuring a project
                      and seeing the price
     - /agencies/   : these pages are read by the agency owners we email asking
                      for a listing link. Do not pitch at them on their own page. */
  var path = location.pathname;
  if (/get-quote|web-design-cost-melbourne|\/agencies\//.test(path)) return;

  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  if (state.done) return;
  if (state.dismissedAt && (Date.now() - state.dismissedAt) < 7 * 864e5) return;

  var shown = false, lastFocus = null, armed = false;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var card = root.querySelector(".pop-card");
  var closeBtn = root.querySelector(".pop-close");
  var quoteUrl = root.getAttribute("data-quote") || "/get-quote/";

  function show() {
    if (shown) return;
    shown = true;
    lastFocus = document.activeElement;
    root.classList.add("on");
    document.documentElement.classList.add("pop-lock");
    if (window.__lenis) window.__lenis.stop();
    var first = root.querySelector(".pop-pill");
    if (first) setTimeout(function () { first.focus(); }, 60);
    if (typeof window.gtag === "function") window.gtag("event", "bridge_popup_view");
  }

  function hide(dismissed) {
    root.classList.remove("on");
    document.documentElement.classList.remove("pop-lock");
    if (window.__lenis) window.__lenis.start();
    if (dismissed) {
      state.dismissedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- triggers ---------- */
  if (fine) {
    setTimeout(function () { armed = true; }, 8000);
    document.addEventListener("mouseout", function (e) {
      if (!armed || shown) return;
      if (!e.relatedTarget && e.clientY <= 0) show();
    });
  }
  setTimeout(function () { if (!shown) show(); }, 28000);

  var scrollNeed = 0.45;
  window.addEventListener("scroll", function () {
    if (shown) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0 && (window.scrollY / max) >= scrollNeed) show();
  }, { passive: true });

  /* ---------- dismissal + focus trap ---------- */
  closeBtn.addEventListener("click", function () { hide(true); });
  root.addEventListener("click", function (e) { if (e.target === root) hide(true); });
  document.addEventListener("keydown", function (e) {
    if (!shown || !root.classList.contains("on")) return;
    if (e.key === "Escape") { hide(true); return; }
    if (e.key !== "Tab") return;
    var els = card.querySelectorAll("a[href], button, input, [tabindex]:not([tabindex='-1'])");
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- handoff: pill -> funnel, resuming at the next question ---------- */
  root.querySelectorAll(".pop-pill").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var project = btn.getAttribute("data-project") || "";
      state.done = true; /* answered — don't interrupt again */
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      if (typeof window.gtag === "function") {
        window.gtag("event", "bridge_popup_answer", { project_type: project });
      }
      location.href = quoteUrl + "?project_type=" + encodeURIComponent(project);
    });
  });
})();
