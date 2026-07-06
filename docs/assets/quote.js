/* ==========================================================================
   MelbourneWebDesigners.com — multi-step qualifying funnel
   Vanilla JS. One question per screen. Contact details last.
   URL-encoded POST (no CORS preflight) -> n8n. Graceful mailto fallback.
   ========================================================================== */
(function () {
  "use strict";

  var ENDPOINT = "https://socialfuel.app.n8n.cloud/webhook/mwd-lead";
  var FALLBACK_EMAIL = "hello@socialfuel.media";
  var MIN_SECONDS = 3; // anti-spam: min time on page before a submit counts

  var form = document.getElementById("quote-form");
  if (!form) return;

  var loadedAt = Date.now();
  var steps = Array.prototype.slice.call(form.querySelectorAll(".q-step"));
  var progressBar = document.getElementById("progress-bar");
  var stepCount = document.getElementById("step-count");
  var backBtn = document.getElementById("btn-back");
  var thankState = document.getElementById("state-thanks");
  var errState = document.getElementById("state-error");
  var summaryEl = document.getElementById("answer-summary");

  var current = 0;
  var answers = {}; // keyed by data-name

  // Human-readable labels for the choice steps (for the summary chips)
  var CHOICE_STEPS = ["project_type", "goal", "budget", "timeline"];

  function totalSteps() { return steps.length; }

  // error display: target the CURRENT step's own .funnel-err slot so the
  // message shows next to the step the user is on (context + contact each
  // have their own). Falls back to any .funnel-err in the form.
  function errSlot() {
    var step = steps[current];
    return (step && step.querySelector(".funnel-err")) || form.querySelector(".funnel-err");
  }
  function showErr(msg) { var el = errSlot(); if (el) el.textContent = msg; }
  function clearErr() {
    form.querySelectorAll(".funnel-err").forEach(function (el) { el.textContent = ""; });
  }

  function showStep(i) {
    steps.forEach(function (s, idx) { s.classList.toggle("active", idx === i); });
    current = i;
    var pct = Math.round(((i + 1) / totalSteps()) * 100);
    if (progressBar) progressBar.style.width = pct + "%";
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    if (stepCount) stepCount.textContent = pad(i + 1) + " / " + pad(totalSteps());
    // The global chrome "Back" serves the auto-advancing choice steps (1-4).
    // Context/contact steps carry their own inline Back button, so hide the
    // global one there to avoid a doubled control.
    var stepType = steps[i].getAttribute("data-step");
    var hasOwnNav = stepType === "context" || stepType === "contact";
    if (backBtn) {
      backBtn.disabled = i === 0;
      backBtn.parentElement.classList.toggle("hide", hasOwnNav);
    }
    clearErr();
    // focus first input on text steps
    var firstInput = steps[i].querySelector("input[type=text], input[type=email], input[type=tel], textarea");
    if (firstInput) { try { firstInput.focus(); } catch (e) {} }
    // build the summary on the final (contact) step
    if (summaryEl && steps[i].getAttribute("data-step") === "contact") buildSummary();
    // scroll the card into view on mobile
    if (window.scrollY > 120) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildSummary() {
    var bits = [];
    CHOICE_STEPS.forEach(function (k) { if (answers[k]) bits.push(answers[k]); });
    // rebuild via safe DOM nodes (no innerHTML)
    while (summaryEl.firstChild) summaryEl.removeChild(summaryEl.firstChild);
    if (!bits.length) { summaryEl.classList.add("hide"); return; }
    summaryEl.classList.remove("hide");
    bits.forEach(function (b) {
      var span = document.createElement("span");
      span.className = "chip";
      span.textContent = b;
      summaryEl.appendChild(span);
    });
  }

  // ---- choice steps: clickable option cards ----
  steps.forEach(function (step) {
    var name = step.getAttribute("data-name");
    var opts = step.querySelectorAll(".opt");
    opts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        opts.forEach(function (o) { o.classList.remove("selected"); o.setAttribute("aria-pressed", "false"); });
        opt.classList.add("selected");
        opt.setAttribute("aria-pressed", "true");
        if (name) answers[name] = opt.getAttribute("data-value");
        // auto-advance after a beat so the selection registers visually
        setTimeout(next, 220);
      });
    });
  });

  // ---- validation per step ----
  function validateStep(i) {
    var step = steps[i];
    var type = step.getAttribute("data-step");
    if (type === "choice") {
      var name = step.getAttribute("data-name");
      if (!answers[name]) return "Please pick an option to continue.";
      return null;
    }
    if (type === "context") {
      var biz = form.business_name.value.trim();
      if (!biz) return "A business or project name helps us match you.";
      answers.business_name = biz;
      answers.website_url = form.website_url.value.trim();
      var rel = step.querySelector(".opt.selected");
      answers.relationship = rel ? rel.getAttribute("data-value") : "";
      return null;
    }
    if (type === "contact") {
      var nm = form.name.value.trim();
      var em = form.email.value.trim();
      if (!nm) return "Please add your name.";
      if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Please add a valid email so we can reply.";
      answers.name = nm;
      answers.email = em;
      answers.phone = form.phone.value.trim();
      answers.message = form.message.value.trim();
      return null;
    }
    return null;
  }

  function next() {
    var err = validateStep(current);
    if (err) { showErr(err); return; }
    if (current < totalSteps() - 1) showStep(current + 1);
  }

  function prev() { if (current > 0) showStep(current - 1); }

  // Enter key advances on text steps
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (steps[current].getAttribute("data-step") === "contact") { submit(); }
      else { next(); }
    }
  });

  if (backBtn) backBtn.addEventListener("click", prev);
  // wire the in-step "Back" buttons (context + contact steps) too
  form.querySelectorAll("[data-back]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); prev(); });
  });

  // "Continue" buttons on non-choice steps
  form.querySelectorAll("[data-action=next]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); next(); });
  });
  form.querySelectorAll("[data-action=submit]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); submit(); });
  });

  // ---- submission ----
  var submitting = false;
  function submit() {
    if (submitting) return;
    var err = validateStep(current);
    if (err) { showErr(err); return; }

    // honeypot: if filled, silently "succeed" (bot) — never POST
    var hp = form.company_website ? form.company_website.value.trim() : "";
    if (hp) { showThanks(); return; }

    // min-time guard
    if ((Date.now() - loadedAt) / 1000 < MIN_SECONDS) {
      showErr("Just a moment…");
      var waitMs = MIN_SECONDS * 1000 - (Date.now() - loadedAt) + 150;
      setTimeout(function () { clearErr(); submit(); }, waitMs);
      return;
    }

    submitting = true;
    var submitBtn = form.querySelector("[data-action=submit]");
    var origLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

    var services = [answers.project_type, answers.goal].filter(Boolean).join(" · ");

    var payload = {
      name: answers.name || "",
      email: answers.email || "",
      phone: answers.phone || "",
      business_name: answers.business_name || "",
      website_url: answers.website_url || "",
      budget: answers.budget || "",
      timeline: answers.timeline || "",
      services: services,
      message: answers.message || "",
      project_type: answers.project_type || "",
      goal: answers.goal || "",
      relationship: answers.relationship || "",
      source: "melbournewebdesigners.com",
      page: location.pathname,
      company_website: hp
    };

    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", {
            budget: answers.budget || "(not set)",
            project_type: answers.project_type || "(not set)",
            timeline: answers.timeline || "(not set)"
          });
        }
        if (typeof window.fbq === "function") {
          window.fbq("track", "Lead", {
            content_name: "quote-funnel",
            content_category: answers.budget || "(not set)"
          });
        }
        showThanks();
      })
      .catch(function () {
        showError(payload);
      })
      .finally(function () {
        submitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origLabel; }
      });
  }

  function hideAllSteps() {
    steps.forEach(function (s) { s.classList.remove("active"); });
    var chrome = form.querySelector(".funnel-chrome");
    if (chrome) chrome.classList.add("hide");
  }

  function showThanks() {
    hideAllSteps();
    if (thankState) thankState.classList.add("active");
    if (progressBar) progressBar.style.width = "100%";
    if (stepCount) stepCount.textContent = "Done";
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  }

  function showError(payload) {
    hideAllSteps();
    if (errState) {
      // build a helpful mailto fallback so the lead is never lost
      var subject = "Web design quote — melbournewebdesigners.com";
      var lines = [
        "Hi SOCIALFUEL,",
        "",
        "I filled out the quote form but it didn't submit. Here are my details:",
        "",
        "Name: " + payload.name,
        "Email: " + payload.email,
        "Phone: " + (payload.phone || "—"),
        "Business: " + payload.business_name,
        "Website: " + (payload.website_url || "—"),
        "Project type: " + payload.project_type,
        "Goal: " + payload.goal,
        "Budget: " + payload.budget,
        "Timeline: " + payload.timeline,
        "Relationship: " + payload.relationship,
        "",
        "Message: " + (payload.message || "—")
      ];
      var href = "mailto:" + FALLBACK_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      var link = document.getElementById("fallback-mailto");
      if (link) link.setAttribute("href", href);
      errState.classList.add("active");
    }
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  }

  // ---- ?budget= deep-link preselect (from the cost page) ----
  function preselectBudget() {
    var params = new URLSearchParams(location.search);
    var b = params.get("budget");
    if (!b) return;
    // match against the budget step's option values (case/space tolerant)
    var step = steps.filter(function (s) { return s.getAttribute("data-name") === "budget"; })[0];
    if (!step) return;
    var want = b.trim().toLowerCase();
    var opts = step.querySelectorAll(".opt");
    for (var j = 0; j < opts.length; j++) {
      if (opts[j].getAttribute("data-value").toLowerCase() === want) {
        answers.budget = opts[j].getAttribute("data-value");
        opts[j].classList.add("selected");
        opts[j].setAttribute("aria-pressed", "true");
        break;
      }
    }
  }

  // init
  preselectBudget();
  showStep(0);
})();
