/* ==========================================================================
   MelbourneWebDesigners.com — AI Search Audit lead magnet popup
   Free "AI Search Visibility Audit" (valued at $497) in exchange for
   email + website. Triggers: desktop exit-intent (armed after 8s), 45%
   scroll, or 28s dwell — whichever first. Mobile: 60% scroll only.
   Suppressed 7 days after dismiss, forever after submit (localStorage).
   Accessible: focus-trapped dialog, ESC closes, focus restored.
   Anti-bot mirrors the funnel: honeypot + minimum-seconds-open.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("mwd-pop");
  if (!root) return;

  var KEY = "mwd_pop";
  var ENDPOINT = "https://socialfuel.app.n8n.cloud/webhook/mwd-audit";
  var MIN_SECONDS = 3;

  /* never on the funnel page — don't compete with the primary conversion */
  if (/get-quote/.test(location.pathname)) return;

  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  if (state.done) return;
  if (state.dismissedAt && (Date.now() - state.dismissedAt) < 7 * 864e5) return;

  var shown = false, openedAt = 0, lastFocus = null, armed = false;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var card = root.querySelector(".pop-card");
  var form = root.querySelector("form");
  var closeBtn = root.querySelector(".pop-close");

  function show() {
    if (shown) return;
    shown = true;
    openedAt = Date.now();
    lastFocus = document.activeElement;
    root.classList.add("on");
    document.documentElement.classList.add("pop-lock");
    var first = root.querySelector("input[name=email]");
    if (first) setTimeout(function () { first.focus(); }, 60);
    if (typeof window.gtag === "function") window.gtag("event", "audit_popup_view");
  }

  function hide(dismissed) {
    root.classList.remove("on");
    document.documentElement.classList.remove("pop-lock");
    if (dismissed) {
      state.dismissedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- triggers ---------- */
  setTimeout(function () { armed = true; }, 8000);

  if (fine) {
    document.addEventListener("mouseout", function (e) {
      if (!armed || shown) return;
      if (!e.relatedTarget && e.clientY <= 0) show();
    });
    setTimeout(function () { if (!shown) show(); }, 28000);
  }

  var scrollNeed = fine ? 0.45 : 0.6;
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

  /* ---------- submit ---------- */
  var submitting = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitting) return;

    var email = (form.email.value || "").trim();
    var website = (form.website.value || "").trim();
    var errEl = root.querySelector(".pop-err");
    errEl.textContent = "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "Please enter a valid email."; return; }
    if (!website) { errEl.textContent = "Please add your website so we can audit it."; return; }
    if (!/^https?:\/\//i.test(website)) website = "https://" + website;

    /* anti-bot: honeypot filled or submitted too fast -> fake success */
    var tooFast = (Date.now() - openedAt) / 1000 < MIN_SECONDS;
    if (form.company_website.value || tooFast) { success(); return; }

    submitting = true;
    var btn = form.querySelector("button[type=submit]");
    var orig = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";

    var body = new URLSearchParams();
    body.append("email", email);
    body.append("website", website);
    body.append("source", "popup");
    body.append("page", location.pathname);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (typeof window.gtag === "function") window.gtag("event", "audit_optin", { source: "popup" });
        if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "ai-audit" });
        success();
      })
      .catch(function () {
        errEl.textContent = "Something hiccuped — please try again, or email us and mention the free audit.";
      })
      .finally(function () {
        submitting = false;
        btn.disabled = false; btn.textContent = orig;
      });
  });

  function success() {
    root.querySelector(".pop-body").classList.add("hide");
    root.querySelector(".pop-done").classList.remove("hide");
    state.done = true;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
})();
