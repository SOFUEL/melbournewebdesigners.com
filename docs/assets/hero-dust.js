/* ==========================================================================
   MelbourneWebDesigners.com — hero particles v4 (plexus)
   Vanilla port of particles.js (2.0) behaviour per supplied config:
   drifting nodes + proximity-linked lines, hover "grab" (lines to cursor),
   click "push" (+4 nodes), edge bounce, size/opacity animation — recoloured
   tonally (golds + rare acid) for the near-black hero. Zero dependencies.
   Pauses off-screen. Reduced-motion: static Flinders line-art.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("hero-dust");
  if (!hero || !canvas) return;

  /* geometric Flinders line-art — reduced-motion fallback */
  var FLINDERS =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 340" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M14 330H1186M30 322H1170M46 314H1154"/>' +
    '<path d="M52 270H196M52 282H196"/>' +
    '<path d="M66 314v-20a11 11 0 0 1 22 0v20M106 314v-20a11 11 0 0 1 22 0v20M146 314v-20a11 11 0 0 1 22 0v20"/>' +
    '<path d="M200 314V182M440 314V182M190 182H450M200 170H440"/>' +
    '<path d="M230 314v-64a90 66 0 0 1 180 0v64"/>' +
    '<path d="M248 314v-56a72 52 0 0 1 144 0v56"/>' +
    '<path d="M320 206v-44M282 216l-24-34M358 216l24-34"/>' +
    '<path d="M214 314V196M426 314V196"/>' +
    '<path d="M252 292v-72h14v72zM374 292v-72h14v72z"/>' +
    '<path d="M204 170 320 116l116 54"/>' +
    '<circle cx="320" cy="156" r="16"/><path d="M320 156v-11M320 156l8 5"/>' +
    '<path d="M206 182v-34M234 182v-34M202 148h36M208 148a14 12 0 0 1 28 0M220 136v-10"/>' +
    '<path d="M406 182v-34M434 182v-34M402 148h36M408 148a14 12 0 0 1 28 0M420 136v-10"/>' +
    '<path d="M276 116l10-20h68l10 20M292 96l8-16h40l8 16"/>' +
    '<path d="M303 96v-7a5 5 0 0 1 10 0v7M323 96v-7a5 5 0 0 1 10 0v7"/>' +
    '<path d="M286 80a54 48 0 0 1 108 0"/>' +
    '<path d="M340 32v48M312 40q11 18 11 40M368 40q-11 18-11 40"/>' +
    '<path d="M330 32h20M333 32V22h14v10M334 22a6 6 0 0 1 12 0M340 16V2"/>' +
    '<path d="M450 196H1084M450 208H1084M450 258H1084"/>' +
    '<path d="M478 250v-18a10 10 0 0 1 20 0v18M542 250v-18a10 10 0 0 1 20 0v18M606 250v-18a10 10 0 0 1 20 0v18M670 250v-18a10 10 0 0 1 20 0v18M734 250v-18a10 10 0 0 1 20 0v18M798 250v-18a10 10 0 0 1 20 0v18M862 250v-18a10 10 0 0 1 20 0v18M926 250v-18a10 10 0 0 1 20 0v18M990 250v-18a10 10 0 0 1 20 0v18"/>' +
    '<path d="M474 314v-32a13 13 0 0 1 26 0v32M538 314v-32a13 13 0 0 1 26 0v32M602 314v-32a13 13 0 0 1 26 0v32M666 314v-32a13 13 0 0 1 26 0v32M730 314v-32a13 13 0 0 1 26 0v32M794 314v-32a13 13 0 0 1 26 0v32M858 314v-32a13 13 0 0 1 26 0v32M922 314v-32a13 13 0 0 1 26 0v32M986 314v-32a13 13 0 0 1 26 0v32"/>' +
    '<path d="M1096 314V118M1152 314V118M1090 118h68M1096 202h56M1096 214h56"/>' +
    '<circle cx="1124" cy="156" r="14"/><path d="M1124 156v-10M1124 156l7 4"/>' +
    '<path d="M1100 118l7-16h34l7 16M1106 102a18 16 0 0 1 36 0"/>' +
    '<path d="M1124 86V68"/><circle cx="1124" cy="64" r="2.6"/>' +
    '<path d="M1158 270h28M1158 282h28"/>' +
    "</svg>";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var staticHost = document.querySelector(".hero-static");
  if (reduce) {
    if (staticHost) {
      staticHost.replaceChildren(
        new DOMParser().parseFromString(FLINDERS, "image/svg+xml").documentElement
      );
      staticHost.style.display = "block";
    }
    canvas.style.display = "none";
    return;
  }

  var ctx = canvas.getContext("2d", { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* tonal palette: golds + rare acid nodes; lines in warm gold */
  var NODE_COLORS = ["255,203,99", "236,166,66", "186,121,47"];
  var ACID = "217,255,63";
  var LINK_RGB = "236,176,86";

  /* config — mapped from the supplied particles.js setup */
  var LINK_DIST = 160;
  var LINK_WIDTH = 1.2;
  var LINK_ALPHA = 0.4;
  var GRAB_DIST = 220;
  var GRAB_ALPHA = 0.8;
  var PUSH_N = 4;
  var MAX_N = 240;

  var W = 0, H = 0;
  var parts = [];
  var running = false;
  var mouseX = -9999, mouseY = -9999;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(x, y) {
    var acid = Math.random() < 0.07;
    return {
      x: x != null ? x : rand(0, W),
      y: y != null ? y : rand(0, H),
      vx: rand(-1, 1) * rand(0.25, 0.85),
      vy: rand(-1, 1) * rand(0.25, 0.85),
      r: rand(1, 3),
      rPhase: rand(0, Math.PI * 2),
      o: rand(0.3, 0.7),
      oPhase: rand(0, Math.PI * 2),
      col: acid ? ACID : NODE_COLORS[(Math.random() * 3) | 0],
      acid: acid
    };
  }

  function targetCount() {
    /* ~140 per 1440×900, scaled by area, clamped */
    var n = Math.round((W * H) / 9200);
    return Math.max(40, Math.min(170, n));
  }

  function setup() {
    var r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    parts = [];
    var n = targetCount();
    for (var i = 0; i < n; i++) parts.push(makeParticle());
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);

    var t = now * 0.001;
    var i, j, p, q, dx, dy, d2, d, a;

    /* move + draw nodes */
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
      else if (p.x > W) { p.x = W; p.vx = -p.vx; }
      if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
      else if (p.y > H) { p.y = H; p.vy = -p.vy; }

      var rr = p.r + Math.sin(t * 2 + p.rPhase) * 0.6;
      if (rr < 0.6) rr = 0.6;
      var oo = p.o + Math.sin(t * 1.2 + p.oPhase) * 0.2;
      if (oo < 0.12) oo = 0.12;

      ctx.globalAlpha = p.acid ? Math.min(0.85, oo + 0.15) : oo;
      ctx.fillStyle = "rgb(" + p.col + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, 6.2832);
      ctx.fill();
    }

    /* proximity links */
    ctx.lineWidth = LINK_WIDTH;
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      for (j = i + 1; j < parts.length; j++) {
        q = parts[j];
        dx = p.x - q.x; dy = p.y - q.y;
        d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          d = Math.sqrt(d2);
          a = LINK_ALPHA * (1 - d / LINK_DIST);
          ctx.globalAlpha = a;
          ctx.strokeStyle = "rgb(" + LINK_RGB + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      /* hover grab: link node to cursor */
      if (mouseX > -999) {
        dx = p.x - mouseX; dy = p.y - mouseY;
        d2 = dx * dx + dy * dy;
        if (d2 < GRAB_DIST * GRAB_DIST) {
          d = Math.sqrt(d2);
          a = GRAB_ALPHA * (1 - d / GRAB_DIST);
          ctx.globalAlpha = a;
          ctx.strokeStyle = "rgb(" + (p.acid ? ACID : LINK_RGB) + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function stop() { running = false; }

  hero.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", function () { mouseX = -9999; mouseY = -9999; });
  hero.addEventListener("click", function (e) {
    if (parts.length >= MAX_N) return;
    var r = canvas.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
    for (var k = 0; k < PUSH_N; k++) parts.push(makeParticle(cx + rand(-8, 8), cy + rand(-8, 8)));
  });

  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { x.isIntersecting ? start() : stop(); });
  }, { threshold: 0.05 });
  io.observe(hero);

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });

  var rT;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(setup, 220);
  });

  setup();
  start();
})();
