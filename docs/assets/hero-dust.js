/* ==========================================================================
   MelbourneWebDesigners.com — hero "magic dust" engine v3
   Port of 21st.dev @uithefactory/magic-dust-shader (R3F/THREE) to
   zero-dependency 2D canvas: dust constructs → holds → deconstructs →
   cycles through full-width text targets (MELBOURNE ↔ WEB UX/UI).
   Additive-blended gold sprites, per-particle x-sweep delays, cubic ease,
   mouse repulsion. Pauses off-screen. Reduced-motion: static line-art.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("hero-dust");
  if (!hero || !canvas) return;

  /* ------------------------------------------------------------ sequence */
  var SEQUENCE = ["MELBOURNE", "WEB UX/UI"]; /* cycles: M → scatter → W → scatter → M … */
  var FONT_FAMILY = '"Bricolage Grotesque", "Inter", sans-serif';

  /* phase machine constants — ported from the component */
  var CONSTRUCT_RATE = 0.4;   /* progress/sec */
  var DECONSTRUCT_RATE = 0.6;
  var HOLD_DURATION = 3.0;    /* seconds */
  var SPEED = 1.15;
  var PROGRESS_MAX = 1.5;     /* overshoot so max-delay particles finish */

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

  /* tonal golds + rare acid sparks in the ambient layer */
  var GOLDS = ["255,203,99", "236,166,66", "186,121,47"];
  var PAPER = "244,242,236";
  var ACID = "217,255,63";

  /* pre-rendered additive glow sprites (one per gold tone) */
  function makeSprite(rgb) {
    var s = document.createElement("canvas");
    s.width = 16; s.height = 16;
    var g = s.getContext("2d");
    var grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(" + rgb + ",1)");
    grad.addColorStop(0.45, "rgba(" + rgb + ",.55)");
    grad.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 16);
    return s;
  }
  var SPRITES = [makeSprite(GOLDS[0]), makeSprite(GOLDS[1]), makeSprite(GOLDS[2])];
  var SPRITE_PAPER = makeSprite(PAPER);
  var SPRITE_ACID = makeSprite(ACID);

  var W = 0, H = 0;
  var N = 0;                       /* morphing particles */
  var ox_, oy_;                    /* fixed scatter origin */
  var t1x, t1y, d1;                /* current target + delays */
  var sz, tone, ph;                /* per-particle size/tone/phase */
  var targets = [];                /* [{x:Float32Array,y:Float32Array,d:Float32Array}] */
  var targetIndex = 0;

  var LOOSE = 130;                 /* ambient drifters (indices N..N+LOOSE-1) */
  var lx, ly, lph, lsz, lacid;

  var running = false, started = false, frozen = false;
  var phase = "CONSTRUCTING";
  var progress = 0, targetProgress = 0;
  var phaseStart = 0, pausedAt = 0;
  var lastNow = 0;
  var mouseX = -9999, mouseY = -9999, mInf = 0;

  /* perf auto-degrade */
  var ftAcc = 0, ftCount = 0, degraded = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- text sampling: ported from the component (canvas raster → points) */
  function sampleText(text, count) {
    var zone = { x: W * 0.015, y: H * 0.44, w: W * 0.97, h: H * 0.52 };
    var off = document.createElement("canvas");
    off.width = Math.ceil(zone.w); off.height = Math.ceil(zone.h);
    var octx = off.getContext("2d", { willReadFrequently: true });
    octx.fillStyle = "#000";
    octx.fillRect(0, 0, off.width, off.height);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    var fontSize = Math.floor(off.height * 0.9);
    octx.font = "800 " + fontSize + "px " + FONT_FAMILY;
    var tw = octx.measureText(text).width;
    var maxW = off.width * 0.985;
    if (tw > maxW) {
      fontSize = Math.floor(fontSize * (maxW / tw));
      octx.font = "800 " + fontSize + "px " + FONT_FAMILY;
    }
    octx.fillText(text, off.width / 2, off.height * 0.54);

    var data = octx.getImageData(0, 0, off.width, off.height).data;
    var step = 2;
    var pts = [];
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4] > 128) pts.push(x, y);
      }
    }
    var tx = new Float32Array(count), ty = new Float32Array(count);
    var n = pts.length / 2;
    if (!n) return { x: tx, y: ty, d: new Float32Array(count) };
    for (var i = 0; i < count; i++) {
      var j = (Math.random() * n) | 0;
      tx[i] = zone.x + pts[j * 2] + rand(-1.2, 1.2);
      ty[i] = zone.y + pts[j * 2 + 1] + rand(-1.2, 1.2);
    }
    /* ordered delays: normalised-x sweep * 0.7 + random * 0.3 (component) */
    var minX = Infinity, maxX = -Infinity, k;
    for (k = 0; k < count; k++) { if (tx[k] < minX) minX = tx[k]; if (tx[k] > maxX) maxX = tx[k]; }
    var range = (maxX - minX) || 1;
    var d = new Float32Array(count);
    for (k = 0; k < count; k++) d[k] = ((tx[k] - minX) / range) * 0.7 + Math.random() * 0.3;
    return { x: tx, y: ty, d: d };
  }

  function setup() {
    var r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var isSmall = W < 720;
    N = degraded ? 3200 : (isSmall ? 2600 : 6500);

    /* build after the display font is ready so glyphs sample correctly —
       but never block the show: 400ms cap, fallback font samples fine */
    var fontLoad = document.fonts && document.fonts.load
      ? document.fonts.load('800 200px "Bricolage Grotesque"').catch(function () {})
      : Promise.resolve();
    var ready = Promise.race([
      fontLoad,
      new Promise(function (res) { setTimeout(res, 400); })
    ]);

    ready.then(function () {
      targets = [];
      for (var s = 0; s < SEQUENCE.length; s++) targets.push(sampleText(SEQUENCE[s], N));

      ox_ = new Float32Array(N); oy_ = new Float32Array(N);
      sz = new Float32Array(N); tone = new Uint8Array(N); ph = new Float32Array(N);
      for (var i = 0; i < N; i++) {
        ox_[i] = rand(-60, W + 60);
        oy_[i] = rand(-40, H + 40);
        sz[i] = rand(0.4, 1.2);
        var tr = Math.random();
        tone[i] = tr < 0.5 ? 0 : tr < 0.85 ? 1 : 2;
        ph[i] = rand(0, Math.PI * 2);
      }
      t1x = targets[0].x; t1y = targets[0].y; d1 = targets[0].d;
      targetIndex = 0;

      lx = new Float32Array(LOOSE); ly = new Float32Array(LOOSE);
      lph = new Float32Array(LOOSE); lsz = new Float32Array(LOOSE);
      lacid = new Uint8Array(LOOSE);
      for (var k = 0; k < LOOSE; k++) {
        lx[k] = rand(0, W); ly[k] = rand(0, H);
        lph[k] = rand(0, Math.PI * 2); lsz[k] = rand(0.5, 1.3);
        lacid[k] = Math.random() < 0.08 ? 1 : 0;
      }

      phase = "CONSTRUCTING"; progress = 0; targetProgress = 0;
      phaseStart = performance.now();
      /* deterministic verification hook: ?dust=hold | hold2 jumps to a held word */
      var dbg = new URLSearchParams(location.search).get("dust");
      if (dbg === "hold" || dbg === "hold2") {
        if (dbg === "hold2") {
          targetIndex = 1 % targets.length;
          t1x = targets[targetIndex].x; t1y = targets[targetIndex].y; d1 = targets[targetIndex].d;
        }
        phase = "HOLDING"; progress = PROGRESS_MAX; targetProgress = PROGRESS_MAX;
        phaseStart = performance.now() - 1;
        frozen = true; /* stay held for verification renders */
      }
      lastNow = performance.now();
      started = true;
    });
  }

  function easeInOutCubic(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }
  function smooth02(p) { /* smoothstep(0, .2, p) */
    var t = p / 0.2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!started) return;

    var delta = Math.min((now - lastNow) / 1000, 0.05);
    lastNow = now;

    /* perf auto-degrade: if the first ~90 frames run slow, rebuild lighter */
    if (!degraded && ftCount < 90) {
      ftAcc += delta; ftCount++;
      if (ftCount === 90 && ftAcc / 90 > 0.022) {
        degraded = true; started = false; setup(); return;
      }
    }

    /* ---- phase machine (ported; wall-clock for determinism) ---- */
    var el = (now - phaseStart) / 1000;
    if (frozen) { /* verification hook: hold indefinitely */ }
    else if (phase === "CONSTRUCTING") {
      targetProgress = Math.min(PROGRESS_MAX, el * CONSTRUCT_RATE * SPEED);
      if (targetProgress === PROGRESS_MAX) { phase = "HOLDING"; phaseStart = now; }
    } else if (phase === "HOLDING") {
      targetProgress = PROGRESS_MAX;
      if (el > HOLD_DURATION) { phase = "DECONSTRUCTING"; phaseStart = now; }
    } else {
      targetProgress = Math.max(0, PROGRESS_MAX - el * DECONSTRUCT_RATE * SPEED);
      if (targetProgress === 0) {
        targetIndex = (targetIndex + 1) % targets.length;
        t1x = targets[targetIndex].x; t1y = targets[targetIndex].y; d1 = targets[targetIndex].d;
        phase = "CONSTRUCTING"; phaseStart = now;
      }
    }
    /* time-based smoothing (frame-rate independent) */
    progress += (targetProgress - progress) * Math.min(1, delta * 7);

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    mInf += ((mouseX > -999 ? 1 : 0) - mInf) * 0.08;

    var t = now;
    var i, p, e, x, y, a, spr, size;

    for (i = 0; i < N; i++) {
      p = (progress - d1[i]) * 3;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      e = easeInOutCubic(p);
      x = ox_[i] + (t1x[i] - ox_[i]) * e;
      y = oy_[i] + (t1y[i] - oy_[i]) * e;
      /* settled shimmer */
      x += Math.sin(t * 0.0011 + ph[i]) * 0.7 * e;
      y += Math.cos(t * 0.0009 + ph[i] * 1.7) * 0.7 * e;
      /* cursor repulsion */
      var dx = x - mouseX, dy = y - mouseY;
      var d2 = dx * dx + dy * dy;
      if (d2 < 10000) {
        var d = Math.sqrt(d2) || 1;
        var f = (1 - d / 100) * 20 * mInf;
        x += (dx / d) * f; y += (dy / d) * f;
      }
      a = smooth02(p) * (0.5 + 0.28 * Math.sin(t * 0.002 + ph[i] * 3.1));
      if (a <= 0.01) continue;
      spr = SPRITES[tone[i]];
      size = 5 + sz[i] * 5;
      ctx.globalAlpha = a * 0.58;
      ctx.drawImage(spr, x - size / 2, y - size / 2, size, size);
    }

    /* ambient loose dust (always alive, additive) */
    for (i = 0; i < LOOSE; i++) {
      x = lx[i] + Math.sin(t * 0.00022 + lph[i]) * 34;
      y = ly[i] - ((t * 0.008 + lph[i] * 60) % (H + 60)) + 30;
      if (y < -30) y += H + 60;
      a = (lacid[i] ? 0.4 : 0.16) * (0.6 + 0.4 * Math.sin(t * 0.0021 + lph[i] * 3.1));
      spr = lacid[i] ? SPRITE_ACID : SPRITE_PAPER;
      size = 4 + lsz[i] * 4;
      ctx.globalAlpha = a;
      ctx.drawImage(spr, x - size / 2, y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function start() {
    if (!running) {
      running = true;
      var now = performance.now();
      if (pausedAt) { phaseStart += now - pausedAt; pausedAt = 0; } /* don't skip phases while hidden */
      lastNow = now;
      requestAnimationFrame(frame);
    }
  }
  function stop() { if (running) { running = false; pausedAt = performance.now(); } }

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
