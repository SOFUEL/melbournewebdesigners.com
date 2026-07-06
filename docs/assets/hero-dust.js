/* ==========================================================================
   MelbourneWebDesigners.com — hero "magic dust" engine v2 (full-width)
   Tonal gold dust materialises into a full-width geometric Flinders St
   Station skyline (dome pavilion left-of-centre, long arcaded wing,
   Elizabeth St clock tower far right — drawn from the night-photo ref).
   Vanilla, zero deps. Pauses off-screen. Reduced-motion: static line-art.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("hero-dust");
  if (!hero || !canvas) return;

  /* Full-width geometric Flinders Street Station (static hand-authored). */
  var FLINDERS =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 340" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    /* ground + steps, full width */
    '<path d="M14 330H1186M30 322H1170M46 314H1154"/>' +
    /* ------ left low wing ------ */
    '<path d="M52 270H196M52 282H196"/>' +
    '<path d="M66 314v-20a11 11 0 0 1 22 0v20M106 314v-20a11 11 0 0 1 22 0v20M146 314v-20a11 11 0 0 1 22 0v20"/>' +
    /* ------ main dome pavilion ------ */
    '<path d="M200 314V182M440 314V182M190 182H450M200 170H440"/>' +
    /* grand entry arch + inner + fan */
    '<path d="M230 314v-64a90 66 0 0 1 180 0v64"/>' +
    '<path d="M248 314v-56a72 52 0 0 1 144 0v56"/>' +
    '<path d="M320 206v-44M282 216l-24-34M358 216l24-34"/>' +
    /* pilasters + banners (photo echo) */
    '<path d="M214 314V196M426 314V196"/>' +
    '<path d="M252 292v-72h14v72zM374 292v-72h14v72z"/>' +
    /* gable pediment + clock */
    '<path d="M204 170 320 116l116 54"/>' +
    '<circle cx="320" cy="156" r="16"/><path d="M320 156v-11M320 156l8 5"/>' +
    /* corner turrets */
    '<path d="M206 182v-34M234 182v-34M202 148h36M208 148a14 12 0 0 1 28 0M220 136v-10"/>' +
    '<path d="M406 182v-34M434 182v-34M402 148h36M408 148a14 12 0 0 1 28 0M420 136v-10"/>' +
    /* drum tiers above gable */
    '<path d="M276 116l10-20h68l10 20M292 96l8-16h40l8 16"/>' +
    '<path d="M303 96v-7a5 5 0 0 1 10 0v7M323 96v-7a5 5 0 0 1 10 0v7"/>' +
    /* dome + ribs + lantern + spire */
    '<path d="M286 80a54 48 0 0 1 108 0"/>' +
    '<path d="M340 32v48M312 40q11 18 11 40M368 40q-11 18-11 40"/>' +
    '<path d="M330 32h20M333 32V22h14v10M334 22a6 6 0 0 1 12 0M340 16V2"/>' +
    /* ------ long arcaded wing ------ */
    '<path d="M450 196H1084M450 208H1084M450 258H1084"/>' +
    '<path d="M478 250v-18a10 10 0 0 1 20 0v18M542 250v-18a10 10 0 0 1 20 0v18M606 250v-18a10 10 0 0 1 20 0v18M670 250v-18a10 10 0 0 1 20 0v18M734 250v-18a10 10 0 0 1 20 0v18M798 250v-18a10 10 0 0 1 20 0v18M862 250v-18a10 10 0 0 1 20 0v18M926 250v-18a10 10 0 0 1 20 0v18M990 250v-18a10 10 0 0 1 20 0v18"/>' +
    '<path d="M474 314v-32a13 13 0 0 1 26 0v32M538 314v-32a13 13 0 0 1 26 0v32M602 314v-32a13 13 0 0 1 26 0v32M666 314v-32a13 13 0 0 1 26 0v32M730 314v-32a13 13 0 0 1 26 0v32M794 314v-32a13 13 0 0 1 26 0v32M858 314v-32a13 13 0 0 1 26 0v32M922 314v-32a13 13 0 0 1 26 0v32M986 314v-32a13 13 0 0 1 26 0v32"/>' +
    /* ------ right clock tower (Elizabeth St corner) ------ */
    '<path d="M1096 314V118M1152 314V118M1090 118h68M1096 202h56M1096 214h56"/>' +
    '<circle cx="1124" cy="156" r="14"/><path d="M1124 156v-10M1124 156l7 4"/>' +
    '<path d="M1100 118l7-16h34l7 16M1106 102a18 16 0 0 1 36 0"/>' +
    '<path d="M1124 86V68"/><circle cx="1124" cy="64" r="2.6"/>' +
    /* right stub */
    '<path d="M1158 270h28M1158 282h28"/>' +
    "</svg>";

  function svgNode() {
    return new DOMParser().parseFromString(FLINDERS, "image/svg+xml").documentElement;
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var staticHost = document.querySelector(".hero-static");
  if (reduce) {
    if (staticHost) {
      staticHost.replaceChildren(svgNode());
      staticHost.style.display = "block";
    }
    canvas.style.display = "none";
    return;
  }

  var ctx = canvas.getContext("2d", { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* tonal golds sampled from the night-photo facade, plus rare acid sparks */
  var GOLDS = ["255,203,99", "236,166,66", "186,121,47"];
  var GOLD_W = [0.5, 0.85, 1];       /* cumulative weights */
  var PAPER = "244,242,236";
  var ACID = "217,255,63";

  var N = 0;
  var px, py, hx, hy, dly, sz, ph, kind; /* 0/1/2 gold tones, 3 loose, 4 acid spark */

  var W = 0, H = 0;
  var running = false, started = false, t0 = 0;
  var mouseX = -9999, mouseY = -9999, mInf = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function goldKind() {
    var r = Math.random();
    for (var g = 0; g < 3; g++) if (r < GOLD_W[g]) return g;
    return 2;
  }

  function sample(cb) {
    var img = new Image();
    img.onload = function () {
      /* full-width skyline: bottom-anchored across the hero */
      var tw = Math.min(W * 0.97, 1680);
      var th = tw * (340 / 1200);
      var ox = (W - tw) / 2;
      var oy = H * 0.94 - th;
      var off = document.createElement("canvas");
      off.width = Math.ceil(tw); off.height = Math.ceil(th);
      var octx = off.getContext("2d", { willReadFrequently: true });
      /* mirror the skyline: dome pavilion lands in the open right half,
         the long arcade runs tonally behind the headline */
      octx.translate(off.width, 0);
      octx.scale(-1, 1);
      octx.drawImage(img, 0, 0, tw, th);
      octx.setTransform(1, 0, 0, 1, 0, 0);
      var data = octx.getImageData(0, 0, off.width, off.height).data;
      var step = W >= 1200 ? 2 : 3;
      var homes = [];
      for (var y = 0; y < off.height; y += step) {
        for (var x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 70) homes.push(ox + x, oy + y);
        }
      }
      cb(homes);
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FLINDERS);
  }

  function setup() {
    var r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* small screens: ambient dust only — the skyline needs width to read */
    if (W < 720) { begin([]); } else { sample(begin); }

    function begin(homes) {
      var max = 3400;
      var count = Math.min(homes.length / 2, max) | 0;
      var loose = W < 720 ? 130 : 150;
      var skip = count ? (homes.length / 2) / count : 1;
      N = count + loose;
      px = new Float32Array(N); py = new Float32Array(N);
      hx = new Float32Array(N); hy = new Float32Array(N);
      dly = new Float32Array(N); sz = new Float32Array(N);
      ph = new Float32Array(N); kind = new Uint8Array(N);

      for (var i = 0; i < count; i++) {
        var j = Math.floor(i * skip) * 2;
        hx[i] = homes[j] + rand(-0.7, 0.7);
        hy[i] = homes[j + 1] + rand(-0.7, 0.7);
        px[i] = rand(-50, W + 50);
        py[i] = rand(-40, H + 40);
        /* materialise in a left→right sweep across the skyline */
        dly[i] = (hx[i] / W) * 1100 + rand(0, 300);
        sz[i] = Math.random() < 0.24 ? 2 : 1.4;
        ph[i] = rand(0, Math.PI * 2);
        kind[i] = goldKind();
      }
      for (var k = count; k < N; k++) { /* forever-loose ambient dust */
        px[k] = rand(0, W); py[k] = rand(0, H);
        hx[k] = rand(0, W); hy[k] = rand(0, H);
        dly[k] = 0; sz[k] = Math.random() < 0.3 ? 2 : 1.4;
        ph[k] = rand(0, Math.PI * 2);
        kind[k] = Math.random() < 0.08 ? 4 : 3;
      }
      started = true;
      t0 = performance.now();
    }
  }

  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!started) return;
    var t = now - t0;
    ctx.clearRect(0, 0, W, H);
    mInf += ((mouseX > -999 ? 1 : 0) - mInf) * 0.08;

    for (var i = 0; i < N; i++) {
      var x, y, a, col;
      var tw = 0.6 + 0.4 * Math.sin(t * 0.0021 + ph[i] * 3.1);
      if (kind[i] >= 3) {
        /* ambient drifters (paper + rare acid sparks) */
        x = px[i] + Math.sin(t * 0.00022 + ph[i]) * 34;
        y = py[i] - ((t * 0.008 + ph[i] * 60) % (H + 60)) + 30;
        if (y < -30) y += H + 60;
        a = (kind[i] === 4 ? 0.4 : 0.15) * tw;
        col = kind[i] === 4 ? ACID : PAPER;
      } else {
        var p = (t - dly[i]) / 1500;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        var e = easeOutCubic(p);
        x = px[i] + (hx[i] - px[i]) * e;
        y = py[i] + (hy[i] - py[i]) * e;
        x += Math.sin(t * 0.0011 + ph[i]) * 0.7 * e;
        y += Math.cos(t * 0.0009 + ph[i] * 1.7) * 0.7 * e;
        var dx = x - mouseX, dy = y - mouseY;
        var d2 = dx * dx + dy * dy;
        if (d2 < 10000) {
          var d = Math.sqrt(d2) || 1;
          var f = (1 - d / 100) * 18 * mInf * e;
          x += (dx / d) * f; y += (dy / d) * f;
        }
        /* tonal: brightest gold slightly stronger, deep amber recessive */
        a = (kind[i] === 0 ? 0.5 : kind[i] === 1 ? 0.42 : 0.34) * (0.3 + 0.7 * e) * tw;
        col = GOLDS[kind[i]];
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgb(" + col + ")";
      ctx.fillRect(x, y, sz[i], sz[i]);
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
    rT = setTimeout(function () { started = false; setup(); }, 220);
  });

  setup();
  start();
})();
