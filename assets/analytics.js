/* Analytics bootstraps, externalised so the site can run a strict CSP with no
   inline executable scripts (no 'unsafe-inline', no fragile per-build hashes).
   GA4 gtag.js is loaded async in the head; this file defines the shim + config.
   Meta Pixel loads fbevents.js itself. Both fire on every page. */
(function () {
  "use strict";

  // Google Analytics 4
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag("js", new Date());
  gtag("config", "G-63LHZZEP85", { anonymize_ip: true });

  // Meta Pixel
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", "728805897182538");
  fbq("track", "PageView");
  if (location.pathname.indexOf("get-quote") !== -1) fbq("track", "ViewContent", { content_name: "quote-funnel" });
})();
