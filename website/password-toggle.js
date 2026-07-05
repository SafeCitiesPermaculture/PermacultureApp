/*
  password-toggle.js
  Adds a plain-text "Show / Hide" button to every password field on the page.
  No dependencies, no icon fonts - include it on any page that has a
  <input type="password"> and each one gets a visible toggle.
*/
(function () {
  "use strict";

  // Styles for the toggle. Injected after styles.css so equal-specificity
  // rules (e.g. input padding) take effect.
  var style = document.createElement("style");
  style.textContent =
    ".pw-wrap{position:relative;display:block}" +
    ".pw-wrap input{padding-right:4.25rem}" +
    ".pw-toggle{position:absolute;top:50%;right:.5rem;transform:translateY(-50%);" +
    "background:transparent;border:0;cursor:pointer;font:inherit;font-weight:700;" +
    "color:var(--ink,#2f3a2f);padding:.25rem .4rem;text-decoration:underline;line-height:1}" +
    ".pw-toggle:focus-visible{outline:2px solid var(--leaf-bright,#7fb069);border-radius:4px}";
  document.head.appendChild(style);

  function enhance(input) {
    if (input.dataset.pwEnhanced) return;
    input.dataset.pwEnhanced = "1";

    // Wrap the input so the button can sit on its right edge.
    var wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var btn = document.createElement("button");
    btn.type = "button"; // never submit the form
    btn.className = "pw-toggle";
    btn.textContent = "Show";
    btn.setAttribute("aria-label", "Show password");
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      var reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      btn.textContent = reveal ? "Hide" : "Show";
      btn.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
    });
  }

  function run() {
    var inputs = document.querySelectorAll('input[type="password"]');
    for (var i = 0; i < inputs.length; i++) enhance(inputs[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
