/* ==========================================================================
   MelbourneWebDesigners.com — how-it-works "focus reticle" scrub (MIRA-style)
   The section pins a full 100vh; vertical scroll steps the cards through a
   dead-centre 5:3 acid bracket frame. The active card sharpens and its chrome
   dissolves; upcoming cards wait blurred (depth of field); past cards fade
   out. Its description crossfades below the frame. A MIRA split counter tracks
   state — done+active numbers cluster left, upcoming stay right, an acid line
   grows between them. Each slide (incl. the CTA) holds for a full scroll
   segment before the pin releases. Desktop + motion-ok only.
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
  var countL = sec.querySelector(".hs-count-left");
  var countR = sec.querySelector(".hs-count-right");
  var fill = sec.querySelector(".hs-count-mid i");
  var chips = [].slice.call(sec.querySelectorAll(".hs-count button"));
  var cards = track ? [].slice.call(track.querySelectorAll(".step")) : [];
  if (!pin || !stage || !track || !cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PROBE = /[?&]hs=probe/.test(location.search); /* deterministic headless verification */
  var n = cards.length;
  var PAD = 30; /* bracket offset around the focused card */

  function on() { return window.innerWidth > 760 && window.innerHeight >= 600 && !reduce; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var seg = -1, SEG = 0, cardW = 0, cardH = 0, gap = 0, slotX = 0, slotY = 0;
  /* buttery track: fx() feeds a continuous fractional target; a lerp follower
     writes the transform every frame (the old per-index CSS tween stepped) */
  var curTx = null, targetTx = null, rafOn = false;

  function reset() {
    sec.classList.remove("hscroll-on");
    sec.style.height = "";
    track.style.transform = "";
    track.style.top = "";
    curTx = targetTx = null;
    if (fill) fill.style.transform = "";
    for (var i = 0; i < n; i++) cards[i].classList.remove("is-active", "is-past");
    for (i = 0; i < chips.length; i++) { chips[i].classList.remove("on"); countR.appendChild(chips[i]); }
    seg = -1;
  }

  function txForF(f) { return slotX - (f * (cardW + gap) + cardW / 2); }
  function txFor(i) { return Math.round(txForF(i)); }

  function writeTx() { track.style.transform = "translate3d(" + curTx.toFixed(2) + "px,-50%,0)"; }
  function followTx() {
    if (!on() || targetTx === null || curTx === null) { rafOn = false; return; }
    var d = targetTx - curTx;
    if (Math.abs(d) < 0.08) { curTx = targetTx; writeTx(); rafOn = false; return; }
    curTx += d * 0.14;
    writeTx();
    requestAnimationFrame(followTx);
  }
  function nudgeTx() {
    if (curTx === null && targetTx !== null) { curTx = targetTx; writeTx(); return; }
    if (!rafOn) { rafOn = true; requestAnimationFrame(followTx); }
  }
  function snapTx(tx) { targetTx = tx; curTx = tx; writeTx(); }

  function measure() {
    var sr = stage.getBoundingClientRect();
    var pr = pin.getBoundingClientRect();
    var stageOffset = sr.top - pr.top; /* layout-constant: header clearance + head height */

    /* 5:3 focus card, sized to the viewport, capped so it never crowds width */
    cardH = Math.round(clamp(window.innerHeight * 0.42, 220, 360));
    cardW = Math.round(cardH * 5 / 3);
    if (cardW > window.innerWidth * 0.62) { cardW = Math.round(window.innerWidth * 0.62); cardH = Math.round(cardW * 3 / 5); }
    sec.style.setProperty("--hs-w", cardW + "px");
    sec.style.setProperty("--hs-h", cardH + "px");
    gap = parseFloat(getComputedStyle(track).gap) || 40;

    /* dead centre of the viewport, then nudged in if it would touch head/counter */
    slotX = Math.round(window.innerWidth / 2);
    slotY = Math.round(window.innerHeight / 2 - stageOffset);
    var minY = Math.round(cardH / 2 + PAD + 8);
    var maxY = Math.round(sr.height - cardH / 2 - PAD - 92);
    if (slotY < minY) slotY = minY;
    if (maxY > minY && slotY > maxY) slotY = maxY;

    track.style.top = slotY + "px";
    if (frame) {
      frame.style.left = (slotX - cardW / 2 - PAD) + "px";
      frame.style.top = (slotY - cardH / 2 - PAD) + "px";
      frame.style.width = (cardW + PAD * 2) + "px";
      frame.style.height = (cardH + PAD * 2) + "px";
    }
    if (desc) {
      desc.style.left = (slotX - cardW / 2) + "px";
      desc.style.top = (slotY + cardH / 2 + PAD + 18) + "px";
      desc.style.width = cardW + "px";
    }
  }

  var swT;
  function apply(i, instant) {
    i = clamp(i, 0, n - 1);
    if (instant) snapTx(txFor(i));
    if (i === seg) return;
    seg = i;
    for (var k = 0; k < n; k++) {
      cards[k].classList.toggle("is-active", k === i);
      cards[k].classList.toggle("is-past", k < i);
    }
    /* MIRA counter: chips 0..i cluster left (i = active), i+1..n-1 stay right */
    for (k = 0; k < chips.length; k++) {
      var idx = parseInt(chips[k].getAttribute("data-i"), 10);
      (idx <= i ? countL : countR).appendChild(chips[k]);
      chips[k].classList.toggle("on", idx === i);
    }
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
    /* one full segment per slide (incl. the CTA) so each is clearly held */
    SEG = Math.max(380, Math.round(window.innerHeight * 0.52));
    sec.style.height = "calc(100svh + " + (n * SEG) + "px)";
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
    if (fill) fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
    /* continuous track position (each slide holds at its segment centre),
       discrete index still drives card states / counter / description */
    targetTx = txForF(clamp(p * n - 0.5, 0, n - 1));
    nudgeTx();
    apply(clamp(Math.floor(p * n), 0, n - 1), false);
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

  /* chip → scroll to that slide's segment centre */
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      if (!on()) return;
      var i = clamp(parseInt(b.getAttribute("data-i"), 10) || 0, 0, n - 1);
      var top = Math.round(sec.getBoundingClientRect().top + window.scrollY + (i + 0.5) * SEG);
      if (window.__lenis) window.__lenis.scrollTo(top);
      else window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  /* re-measure once webfonts land — display metrics shift the geometry */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { size(); });
  }
  size();

  if (PROBE) {
    window.__hsq = function () {
      return {
        on: sec.classList.contains("hscroll-on"),
        seg: seg, segPx: SEG, cardW: cardW, cardH: cardH,
        ratio: +(cardW / cardH).toFixed(3),
        slotX: slotX, slotY: slotY,
        tx: track.style.transform,
        left: countL.textContent, right: countR.textContent,
        onChip: chips.map(function (c) { return c.classList.contains("on") ? 1 : 0; }).join(""),
        desc: desc ? (desc.textContent || "").slice(0, 30) : "",
        fill: fill ? fill.style.transform : ""
      };
    };
    window.__hsgo = function (i) { apply(i, true); };
    window.__hsfx = fx;
  }
})();
