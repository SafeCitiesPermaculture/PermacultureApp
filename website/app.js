/* =============================================================================
   Safe Cities Permaculture — app.js
   -----------------------------------------------------------------------------
   Shared "app shell" for every logged-in page (Marketplace, Documents, Schedule,
   Assistant, Profile). It keeps those pages DRY and consistent by injecting the
   same header + footer, wiring the mobile menu, reflecting auth state, guarding
   pages that require a login, and providing a tiny toast helper.

   Usage in a page: set <body data-page="schedule" data-requires-auth>, then load
   api.js, then app.js, then an inline page script that uses the SC.* helpers.

   Depends on api.js (window.SC) being loaded first.
============================================================================= */
(function () {
  "use strict";

  // The navigation link set — identical to the app's tabs. `key` matches the
  // <body data-page="..."> value so the current item is highlighted.
  var NAV = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "marketplace", label: "Marketplace", href: "marketplace.html" },
    { key: "documents", label: "Documents", href: "documents.html" },
    { key: "schedule", label: "Schedule", href: "schedule.html" },
    { key: "assistant", label: "Assistant", href: "assistant.html" },
    { key: "profile", label: "Profile", href: "profile.html" },
  ];

  var active = document.body.getAttribute("data-page") || "";

  /* --------------------------------------------------------- 1. Auth guard */
  // Pages with `data-requires-auth` bounce to the login page when signed out,
  // remembering where to return via ?next=.
  if (document.body.hasAttribute("data-requires-auth") && !SC.isLoggedIn()) {
    var here = location.pathname.split("/").pop() || "index.html";
    location.replace("login.html?next=" + encodeURIComponent(here));
    return; // stop rendering; we're navigating away
  }

  /* ------------------------------------------------------- 2. Build header */
  function navLinks() {
    var items = NAV.map(function (item) {
      var cls = "primary-nav__link" + (item.key === active ? " is-current" : "");
      var current = item.key === active ? ' aria-current="page"' : "";
      return (
        '<li><a class="' + cls + '" href="' + item.href + '"' + current + ">" +
        SC.escapeHtml(item.label) +
        "</a></li>"
      );
    });
    // Signed out: a Log in button sits to the LEFT of Home, styled like the
    // Profile CTA pill. (Signed in, the account area on the right takes over.)
    if (!SC.isLoggedIn()) {
      items.unshift(
        '<li><a class="primary-nav__link primary-nav__link--cta" href="login.html">Log in</a></li>'
      );
    }
    return items.join("");
  }

  // The account area (right side): the username + Logout when signed in. When
  // signed out it's empty — the Log in button lives in the nav (left of Home).
  function accountArea() {
    var user = SC.getCachedUser();
    if (SC.isLoggedIn() && user) {
      return (
        '<div class="account">' +
        '<span class="account__name">Hi, ' + SC.escapeHtml(user.username) + "</span>" +
        '<button class="btn btn--sm btn--ghost" id="logoutBtn">Log out</button>' +
        "</div>"
      );
    }
    return "";
  }

  var header = document.createElement("header");
  header.className = "site-header";
  header.id = "top";
  header.innerHTML =
    '<div class="container site-header__inner">' +
    '<a class="brand" href="index.html" aria-label="Safe Cities Permaculture — home">' +
    '<img class="brand__logo" src="./assets/images/logo.png" alt="Safe Cities Permaculture logo" width="56" height="56" />' +
    '<span class="brand__text"><span class="brand__name">Safe Cities</span>' +
    '<span class="brand__tag">Igniting Community Transformation</span></span></a>' +
    '<button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="primaryNav" aria-label="Open menu">' +
    '<span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span></button>' +
    '<nav class="primary-nav" id="primaryNav" aria-label="Primary">' +
    '<ul class="primary-nav__list">' + navLinks() + "</ul>" +
    '<div class="primary-nav__account">' + accountArea() + "</div>" +
    "</nav></div>";

  document.body.insertBefore(header, document.body.firstChild);

  /* ------------------------------------------------------- 3. Build footer */
  var footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML =
    '<div class="container site-footer__bottom">' +
    "<p>&copy; " + new Date().getFullYear() +
    " Safe Cities Permaculture · Elsies River, Cape Town</p>" +
    '<a class="site-footer__totop" href="#top">Back to top ↑</a></div>';
  document.body.appendChild(footer);

  /* --------------------------------------------------- 4. Mobile nav toggle */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle && nav) {
    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.matchMedia("(min-width: 860px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ----------------------------------------------------------- 5. Log out */
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      logoutBtn.disabled = true;
      SC.logout().then(function () {
        location.href = "index.html";
      });
    });
  }

  /* --------------------------------------------------- 6. Toast notifications */
  // SC.toast("Saved", "success" | "error"). Auto-dismisses; announced politely.
  var toastHost = document.createElement("div");
  toastHost.className = "toast-host";
  toastHost.setAttribute("aria-live", "polite");
  toastHost.setAttribute("role", "status");
  document.body.appendChild(toastHost);

  SC.toast = function (message, kind) {
    var el = document.createElement("div");
    el.className = "toast toast--" + (kind || "info");
    el.textContent = message;
    toastHost.appendChild(el);
    // Allow the entrance transition to run, then schedule removal.
    requestAnimationFrame(function () { el.classList.add("is-shown"); });
    setTimeout(function () {
      el.classList.remove("is-shown");
      setTimeout(function () { el.remove(); }, 300);
    }, 3800);
  };

  /* ------------------------------- 7. Refresh cached user in the background */
  // Keeps the header name + role current without blocking the page.
  if (SC.isLoggedIn()) {
    SC.fetchUser()
      .then(function (user) {
        var nameEl = document.querySelector(".account__name");
        if (nameEl && user) nameEl.textContent = "Hi, " + user.username;
        document.dispatchEvent(new CustomEvent("sc:user", { detail: user }));
      })
      .catch(function () { /* stay with cached copy */ });
  }

  /* ---------------------------- 8. Instant navigation (prerender on hover) */
  // Make tab switches feel instant: supporting browsers (Chrome/Edge) prerender
  // the hovered nav page in the background — HTML, JS, AND its data fetches — so
  // clicking swaps in an already-populated page (Documents list, past AI
  // conversations, Marketplace listings all ready). Every nav page only does GET
  // reads on load, so speculating is side-effect-free. Unsupported browsers fall
  // back to a hover prefetch of the document, or just navigate normally.
  (function instantNav() {
    // Exclude the current page; the CTA/Profile link still matches .primary-nav__link.
    var NAV_SELECTOR = ".primary-nav__link:not(.is-current)";

    if (window.HTMLScriptElement &&
        HTMLScriptElement.supports &&
        HTMLScriptElement.supports("speculationrules")) {
      var rules = {
        prerender: [{ where: { selector_matches: NAV_SELECTOR }, eagerness: "moderate" }],
        prefetch: [{ where: { selector_matches: NAV_SELECTOR }, eagerness: "moderate" }],
      };
      var script = document.createElement("script");
      script.type = "speculationrules";
      script.textContent = JSON.stringify(rules);
      document.head.appendChild(script);
      return;
    }

    // Fallback: prefetch the document on first hover (Firefox; Safari best-effort).
    var seen = {};
    document.addEventListener("pointerover", function (e) {
      var a = e.target.closest && e.target.closest(NAV_SELECTOR);
      if (!a || !a.href || seen[a.href]) return;
      seen[a.href] = true;
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.href = a.href;
      document.head.appendChild(link);
    }, { passive: true });
  })();
})();
