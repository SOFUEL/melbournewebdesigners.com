/* ==========================================================================
   MelbourneWebDesigners.com — footer fx
   Mira-style finale, ported from the NantStudios build:
   1) curtain reveal — the page lifts away over the fixed full-height footer
      (positioning is pure CSS; this file fades/rises the inner content with
      scroll progress), and
   2) cursor-draw — gold ink that trails the pointer across the footer, then
      fades. Desktop fine-pointer only; reduced-motion gets the static footer.
   ========================================================================== */
(function () {
  "use strict";

  var footer = document.getElementById("site-footer");
  var inner = footer ? footer.querySelector(".footer-inner") : null;
  var page = document.querySelector(".page-main");
  var canvas = document.getElementById("footer-draw");
  if (!footer || !inner || !page) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;

  function curtain() { return window.innerWidth > 760 && window.innerHeight >= 640; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* the trail loop hooks this to run only while the footer is exposed
     (IO can't gate a fixed element — it always "intersects" the viewport) */
  var onProgress = function () {};

  /* ---------- reveal: fade + rise the footer content as the page lifts ---------- */
  function reveal() {
    if (!curtain()) { inner.style.opacity = ""; inner.style.transform = ""; onProgress(0); return; }
    var p = clamp((window.scrollY + window.innerHeight - page.offsetHeight) / (window.innerHeight * 0.85), 0, 1);
    onProgress(p);
    if (reduce) { inner.style.opacity = ""; inner.style.transform = ""; return; }
    inner.style.opacity = p.toFixed(3);
    inner.style.transform = "translateY(" + ((1 - p) * 48).toFixed(1) + "px)";
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { reveal(); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  reveal();

  /* ---------- cursor-draw: tonal ink that trails the pointer, then fades ---------- */
  if (!canvas || reduce || !fine) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, strokes = [], live = null, running = false;
  var PROBE = /[?&]fx=probe/.test(location.search); /* deterministic headless verification: freeze fade */
  var FADE = PROBE ? 1e9 : 2600; /* ms a stroke lingers after the last move, then gone */
  var GAP = 130;     /* ms pause that starts a fresh stroke */
  var MAXPTS = 1600; /* safety cap on retained points */
  var INK = "236,176,86";          /* warm gold on the near-black footer */
  var GLOW = "rgba(217,255,63,.3)"; /* faint acid halo */

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function size() {
    var r = footer.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  size();
  window.addEventListener("resize", size);

  footer.addEventListener("pointermove", function (e) {
    if (!curtain()) return;
    var r = footer.getBoundingClientRect();
    var p = { x: e.clientX - r.left, y: e.clientY - r.top };
    var t = now();
    if (!live || (t - live.last) > GAP) { live = { pts: [p], last: t }; strokes.push(live); }
    else { live.pts.push(p); live.last = t; }
    var total = 0, i;
    for (i = 0; i < strokes.length; i++) total += strokes[i].pts.length;
    while (total > MAXPTS && strokes.length > 1) { total -= strokes[0].pts.length; strokes.shift(); }
  });

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.shadowColor = GLOW;
    ctx.shadowBlur = 7;
    for (var i = strokes.length - 1; i >= 0; i--) {
      var s = strokes[i], age = t - s.last;
      if (age > FADE) { strokes.splice(i, 1); continue; }
      if (s.pts.length < 2) continue;
      var a = 1 - age / FADE;
      ctx.strokeStyle = "rgba(" + INK + "," + (a * 0.8).toFixed(3) + ")";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (var j = 1; j < s.pts.length - 1; j++) {
        ctx.quadraticCurveTo(s.pts[j].x, s.pts[j].y, (s.pts[j].x + s.pts[j + 1].x) / 2, (s.pts[j].y + s.pts[j + 1].y) / 2);
      }
      ctx.lineTo(s.pts[s.pts.length - 1].x, s.pts[s.pts.length - 1].y);
      ctx.stroke();
    }
  }
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    draw(now());
  }
  if (PROBE) {
    window.__fxdraw = function () { draw(now()); };
    window.__fxq = function () {
      var pts = 0;
      for (var i = 0; i < strokes.length; i++) pts += strokes[i].pts.length;
      return { strokes: strokes.length, pts: pts, running: running, W: W, H: H };
    };
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function stop() { if (running) { running = false; ctx.clearRect(0, 0, W, H); } }

  var exposed = false;
  onProgress = function (p) {
    exposed = PROBE || p > 0.02;
    exposed && !document.hidden ? start() : stop();
  };

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : (exposed && start());
  });
  reveal();
})();
