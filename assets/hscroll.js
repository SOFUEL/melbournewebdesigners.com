/* ==========================================================================
   MelbourneWebDesigners.com — how-it-works pinned horizontal scrub
   The section pins for one viewport while vertical scroll drives the steps
   strip horizontally (1:1 px mapping). Centre-most card gets .is-active
   (its ghost number fills acid); cards ride a subtle y/scale wave; a thin
   acid progress bar tracks the scrub. Desktop + fine layouts only — mobile,
   reduced-motion and no-JS all keep the stacked grid.
   ========================================================================== */
(function () {
  "use strict";

  var sec = document.querySelector(".hscroll");
  if (!sec) return;
  var pin = sec.querySelector(".hscroll-pin");
  var track = sec.querySelector(".steps");
  var barI = sec.querySelector(".hscroll-bar i");
  var cards = [].slice.call(sec.querySelectorAll(".step"));
  if (!pin || !track || !cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PROBE = /[?&]hs=probe/.test(location.search); /* deterministic headless verification */

  function on() { return window.innerWidth > 760 && window.innerHeight >= 560 && !reduce; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var travel = 0, active = -1;

  function reset() {
    sec.classList.remove("hscroll-on");
    sec.style.height = "";
    track.style.transform = "";
    if (barI) barI.style.transform = "";
    for (var i = 0; i < cards.length; i++) { cards[i].style.transform = ""; cards[i].classList.remove("is-active"); }
    active = -1;
  }

  function size() {
    if (!on()) { reset(); return; }
    sec.classList.add("hscroll-on");
    sec.style.height = "auto"; /* measure the natural track at current width */
    travel = Math.max(0, track.scrollWidth - pin.clientWidth);
    sec.style.height = "calc(100svh + " + Math.round(travel) + "px)";
    fx();
  }

  function fx() {
    if (!on()) return;
    var r = sec.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    track.style.transform = "translate3d(" + (-p * travel).toFixed(1) + "px,0,0)";
    if (barI) barI.style.transform = "scaleX(" + p.toFixed(4) + ")";

    var vwC = window.innerWidth / 2, best = -1, bestD = 1e9;
    for (var i = 0; i < cards.length; i++) {
      var cr = cards[i].getBoundingClientRect();
      var d = cr.left + cr.width / 2 - vwC;
      var ad = Math.abs(d);
      if (ad < bestD) { bestD = ad; best = i; }
      cards[i].style.transform =
        "translate3d(0," + (d * 0.035).toFixed(1) + "px,0) scale(" +
        (1 - Math.min(ad / window.innerWidth, 1) * 0.05).toFixed(3) + ")";
    }
    if (best !== active) {
      if (active > -1) cards[active].classList.remove("is-active");
      if (best > -1) cards[best].classList.add("is-active");
      active = best;
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { fx(); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var rT;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(size, 180); });

  /* re-measure once webfonts land — ghost numerals change the track width */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { size(); });
  }
  size();

  if (PROBE) {
    window.__hsq = function () {
      return {
        on: sec.classList.contains("hscroll-on"),
        travel: Math.round(travel),
        h: sec.style.height,
        tx: track.style.transform,
        bar: barI ? barI.style.transform : "",
        active: active
      };
    };
    window.__hsfx = fx;
  }
})();
