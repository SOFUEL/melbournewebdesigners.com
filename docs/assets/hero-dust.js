/* ==========================================================================
   MelbourneWebDesigners.com — hero "magic dust" engine
   Ambient dust particles materialise into a geometric Flinders St Station.
   Vanilla, zero deps. Sampled from an inline SVG. Pauses off-screen.
   Reduced-motion: static ghosted SVG instead, no animation.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("hero-dust");
  if (!hero || !canvas) return;

  /* Geometric Flinders Street Station — dome, clock arch, turrets, colonnade.
     Static hand-authored constant (never user input). */
  var FLINDERS =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    /* steps */
    '<path d="M20 300H500M40 288H480M60 276H460"/>' +
    /* main pavilion walls + cornice */
    '<path d="M100 276V186M260 276V186M92 186H268M100 174H260"/>' +
    /* entry arches */
    '<path d="M116 276v-54a64 64 0 0 1 128 0v54"/>' +
    '<path d="M130 276v-50a50 50 0 0 1 100 0v50"/>' +
    '<path d="M108 276V202M252 276V202"/>' +
    /* clock */
    '<circle cx="180" cy="152" r="15"/><path d="M180 152V141M180 152l7 4"/>' +
    /* attic band */
    '<path d="M110 174V130H250v44M110 146H250"/>' +
    /* drum tiers */
    '<path d="M128 130l10-24h84l10 24M142 106l8-20h60l8 20"/>' +
    /* drum windows */
    '<path d="M163 106v-8a6 6 0 0 1 12 0v8M183 106v-8a6 6 0 0 1 12 0v8"/>' +
    /* dome + ribs */
    '<path d="M142 86a38 38 0 0 1 76 0"/>' +
    '<path d="M180 48v38M159 55q8 15 8 31M201 55q-8 15-8 31"/>' +
    /* lantern + finial */
    '<path d="M170 48h20M173 48V37h14v11M174 37a6 6 0 0 1 12 0M180 31v-8"/><circle cx="180" cy="21" r="2.4"/>' +
    /* flanking turrets */
    '<path d="M64 276v-80M92 276v-80M60 196h36M66 196a12 12 0 0 1 24 0M78 184v-11"/>' +
    '<path d="M268 276v-80M296 276v-80M264 196h36M270 196a12 12 0 0 1 24 0M282 184v-11"/>' +
    /* right wing colonnade */
    '<path d="M300 208H500M300 222H500"/>' +
    '<path d="M316 276v-30a14 14 0 0 1 28 0v30M352 276v-30a14 14 0 0 1 28 0v30M388 276v-30a14 14 0 0 1 28 0v30M424 276v-30a14 14 0 0 1 28 0v30M460 276v-30a14 14 0 0 1 28 0v30"/>' +
    '<path d="M322 232h16v10h-16zM358 232h16v10h-16zM394 232h16v10h-16zM430 232h16v10h-16zM466 232h16v10h-16z"/>' +
    /* left wing */
    '<path d="M20 214h80M20 226h80M34 276v-26a12 12 0 0 1 24 0v26M36 234h16v10h-16z"/>' +
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

  var ACID = "217,255,63";
  var PAPER = "244,242,236";

  /* particle stores */
  var N = 0;
  var px, py, hx, hy, dly, sz, ph, kind; /* kind: 0 paper, 1 acid, 2 loose */
  var LOOSE = 64;

  var W = 0, H = 0;
  var running = false, started = false, t0 = 0;
  var mouseX = -9999, mouseY = -9999, mInf = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function sample(cb) {
    var img = new Image();
    img.onload = function () {
      /* station footprint: right-of-centre, sized to hero */
      var tw = Math.max(300, Math.min(W * 0.5, 660));
      var th = tw * (320 / 520);
      var ox = Math.min(W * 0.62, W - tw * 0.92);
      var oy = H * 0.56 - th / 2;
      if (W < 720) { /* small screens: centre it under the copy */
        tw = Math.min(W * 0.92, 520); th = tw * (320 / 520);
        ox = (W - tw) / 2; oy = H * 0.66 - th / 2;
      }
      var off = document.createElement("canvas");
      off.width = Math.ceil(tw); off.height = Math.ceil(th);
      var octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0, tw, th);
      var data = octx.getImageData(0, 0, off.width, off.height).data;
      var step = W < 720 ? 4 : 3;
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

    /* small screens: ambient dust only — the station is a desktop moment
       (it would sit behind the stacked CTAs on mobile) */
    if (W < 720) { begin([]); } else { sample(begin); }

    function begin(homes) {
      var max = 2000;
      var count = Math.min(homes.length / 2, max) | 0;
      var loose = W < 720 ? 110 : LOOSE;
      var skip = count ? (homes.length / 2) / count : 1;
      N = count + loose;
      px = new Float32Array(N); py = new Float32Array(N);
      hx = new Float32Array(N); hy = new Float32Array(N);
      dly = new Float32Array(N); sz = new Float32Array(N);
      ph = new Float32Array(N); kind = new Uint8Array(N);

      for (var i = 0; i < count; i++) {
        var j = Math.floor(i * skip) * 2;
        hx[i] = homes[j] + rand(-0.6, 0.6);
        hy[i] = homes[j + 1] + rand(-0.6, 0.6);
        px[i] = rand(-40, W + 40);
        py[i] = rand(-30, H + 30);
        /* materialise in a left→right sweep across the station */
        dly[i] = ((hx[i] - W * 0.1) / W) * 950 + rand(0, 260);
        sz[i] = Math.random() < 0.22 ? 2 : 1.35;
        ph[i] = rand(0, Math.PI * 2);
        kind[i] = Math.random() < 0.1 ? 1 : 0;
      }
      for (var k = count; k < N; k++) { /* forever-loose ambient dust */
        px[k] = rand(0, W); py[k] = rand(0, H);
        hx[k] = rand(0, W); hy[k] = rand(0, H);
        dly[k] = 0; sz[k] = Math.random() < 0.3 ? 2 : 1.35;
        ph[k] = rand(0, Math.PI * 2); kind[k] = 2;
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
      var x, y, a;
      var tw = 0.62 + 0.38 * Math.sin(t * 0.0021 + ph[i] * 3.1);
      if (kind[i] === 2) {
        /* ambient drifters */
        x = px[i] + Math.sin(t * 0.00022 + ph[i]) * 30;
        y = py[i] - ((t * 0.008 + ph[i] * 60) % (H + 60)) + 30;
        if (y < -30) y += H + 60;
        a = 0.16 * tw;
      } else {
        var p = (t - dly[i]) / 1500;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        var e = easeOutCubic(p);
        x = px[i] + (hx[i] - px[i]) * e;
        y = py[i] + (hy[i] - py[i]) * e;
        /* settled breathing */
        x += Math.sin(t * 0.0011 + ph[i]) * 0.7 * e;
        y += Math.cos(t * 0.0009 + ph[i] * 1.7) * 0.7 * e;
        /* cursor repulsion */
        var dx = x - mouseX, dy = y - mouseY;
        var d2 = dx * dx + dy * dy;
        if (d2 < 8100) {
          var d = Math.sqrt(d2) || 1;
          var f = (1 - d / 90) * 16 * mInf * e;
          x += (dx / d) * f; y += (dy / d) * f;
        }
        a = (kind[i] === 1 ? 0.85 : 0.5) * (0.35 + 0.65 * e) * tw;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = kind[i] === 1 ? "rgb(" + ACID + ")" : "rgb(" + PAPER + ")";
      ctx.fillRect(x, y, sz[i], sz[i]);
    }
    ctx.globalAlpha = 1;
  }

  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function stop() { running = false; }

  /* interactivity + lifecycle */
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
