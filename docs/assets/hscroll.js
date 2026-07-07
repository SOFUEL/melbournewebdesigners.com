/* ==========================================================================
   MelbourneWebDesigners.com — how-it-works "focus reticle" scrub
   After the MIRA reference: the section pins and vertical scroll steps the
   cards through an acid corner-bracket frame. The active card sharpens and
   its chrome dissolves; upcoming cards wait blurred (depth of field); past
   cards fade out. Its description crossfades under the frame; numbered chips
   (clickable) and a hairline acid progress bar track the state.
   Desktop + motion-ok only — mobile, reduced-motion and no-JS keep the grid.
   ========================================================================== */
(function () {
  "use strict";

  var sec = document.querySelector(".hscroll");
  if (!sec) return;
  var pin = sec.querySelector(".hscroll-pin");
  var stage = sec.querySelector(".hs-stage");
  var track = sec.querySelector(".steps");
  var frame = sec.querySelector(".hs-frame");
  var desc = sec.querySelector(".hs-desc");
  var barI = sec.querySelector(".hscroll-bar i");
  var chips = [].slice.call(sec.querySelectorAll(".hs-pager button"));
  var cards = track ? [].slice.call(track.querySelectorAll(".step")) : [];
  if (!pin || !stage || !track || !cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PROBE = /[?&]hs=probe/.test(location.search); /* deterministic headless verification */
  var n = cards.length;

  function on() { return window.innerWidth > 760 && window.innerHeight >= 560 && !reduce; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var seg = -1, SEG = 0, cardW = 0, cardH = 0, gap = 0, slotX = 0, slotY = 0;
  var PAD = 26; /* bracket offset around the focused card */

  function reset() {
    sec.classList.remove("hscroll-on");
    sec.style.height = "";
    track.style.transform = "";
    if (barI) barI.style.transform = "";
    for (var i = 0; i < n; i++) cards[i].classList.remove("is-active", "is-past");
    seg = -1;
  }

  function txFor(i) { return Math.round(slotX - (cardW / 2 + i * (cardW + gap))); }

  function measure() {
    var sr = stage.getBoundingClientRect();
    cardW = Math.round(clamp(window.innerWidth * 0.26, 300, 430));
    cardH = Math.round(clamp(sr.height * 0.54, 240, 370));
    sec.style.setProperty("--hs-w", cardW + "px");
    sec.style.setProperty("--hs-h", cardH + "px");
    gap = parseFloat(getComputedStyle(track).gap) || 32;
    slotX = Math.round(Math.max(cardW / 2 + PAD + 10, sr.width * 0.38));
    slotY = Math.round(sr.height / 2);
    if (frame) {
      frame.style.left = (slotX - cardW / 2 - PAD) + "px";
      frame.style.top = (slotY - cardH / 2 - PAD) + "px";
      frame.style.width = (cardW + PAD * 2) + "px";
      frame.style.height = (cardH + PAD * 2) + "px";
    }
    if (desc) {
      desc.style.left = (slotX - cardW / 2) + "px";
      desc.style.top = (slotY + cardH / 2 + PAD + 16) + "px";
      desc.style.width = cardW + "px";
    }
  }

  var swT;
  function apply(i, instant) {
    i = clamp(i, 0, n - 1);
    if (i === seg) return;
    seg = i;
    track.style.transform = "translate3d(" + txFor(i) + "px,-50%,0)";
    for (var k = 0; k < n; k++) {
      cards[k].classList.toggle("is-active", k === i);
      cards[k].classList.toggle("is-past", k < i);
    }
    for (k = 0; k < chips.length; k++) chips[k].classList.toggle("on", k === i);
    if (desc) {
      var p = cards[i].querySelector(".step-p");
      var put = function () {
        while (desc.firstChild) desc.removeChild(desc.firstChild);
        if (p) desc.appendChild(p.cloneNode(true));
        desc.classList.remove("sw");
      };
      clearTimeout(swT);
      if (instant) { put(); }
      else { desc.classList.add("sw"); swT = setTimeout(put, 180); }
    }
  }

  function size() {
    if (!on()) { reset(); return; }
    sec.classList.add("hscroll-on");
    SEG = Math.max(420, Math.round(window.innerHeight * 0.55));
    sec.style.height = "calc(100svh + " + ((n - 1) * SEG) + "px)";
    measure();
    var hold = seg < 0 ? 0 : seg;
    seg = -1;
    apply(hold, true);
    fx();
  }

  function fx() {
    if (!on()) return;
    var r = sec.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    if (barI) barI.style.transform = "scaleX(" + p.toFixed(4) + ")";
    apply(Math.round(p * (n - 1)), false);
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

  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      if (!on()) return;
      var i = clamp(parseInt(b.getAttribute("data-i"), 10) || 0, 0, n - 1);
      var top = Math.round(sec.getBoundingClientRect().top + window.scrollY) + i * SEG + 2;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  /* re-measure once webfonts land — display sizes shift the geometry */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { size(); });
  }
  size();

  if (PROBE) {
    window.__hsq = function () {
      return {
        on: sec.classList.contains("hscroll-on"),
        seg: seg, segPx: SEG, cardW: cardW, slotX: slotX,
        tx: track.style.transform,
        chips: chips.map(function (c) { return c.classList.contains("on") ? 1 : 0; }).join(""),
        desc: desc ? (desc.textContent || "").slice(0, 34) : "",
        frameL: frame ? frame.style.left : "",
        bar: barI ? barI.style.transform : ""
      };
    };
    window.__hsgo = function (i) { apply(i, true); };
    window.__hsfx = fx;
  }
})();
