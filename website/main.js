/* =============================================================================
   Safe Cities Permaculture — main.js
   -----------------------------------------------------------------------------
   Plain, dependency-free JavaScript. Two small progressive enhancements:
     1. Accessible mobile navigation toggle (hamburger).
     2. Scroll-reveal animations for elements marked with .reveal.
     3. Auto-updating footer year.
   Everything degrades gracefully: with JS off, the nav links are still present
   in the markup and .reveal content is shown by the CSS fallback.
============================================================================= */

(function () {
  "use strict";

  /* ----------------------------------------------- 1. Mobile navigation menu */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");

  if (toggle && nav) {
    // Open / close the menu and keep aria-expanded in sync for screen readers.
    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    // Close the menu after following a link (mobile single-page feel).
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    // Close on Escape, then return focus to the toggle button.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    // If the viewport grows to desktop while the menu is open, reset state so
    // the inline desktop nav isn't stuck in the "open" class.
    var desktop = window.matchMedia("(min-width: 860px)");
    desktop.addEventListener("change", function (event) {
      if (event.matches) setMenu(false);
    });
  }

  /* --------------------------------------------------- 2. Scroll-reveal effect */
  var revealEls = document.querySelectorAll(".reveal");

  // Reveal the hero immediately on load (it's above the fold).
  document.querySelectorAll(".hero .reveal").forEach(function (el) {
    el.classList.add("is-visible");
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // reveal once, then stop watching
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      if (!el.classList.contains("is-visible")) observer.observe(el);
    });
  } else {
    // No IntersectionObserver support: just show everything.
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --------------------------------------------------- 3. Footer year stamp */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
