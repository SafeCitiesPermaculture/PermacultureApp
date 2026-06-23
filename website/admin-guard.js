/* =============================================================================
   Safe Cities Permaculture — admin-guard.js
   -----------------------------------------------------------------------------
   Shared by the admin pages. Hides the page content and shows a notice if the
   signed-in user is not an administrator. The backend independently enforces
   the admin role on every /admin, /reports and /farms-write endpoint, so this
   is purely a UX guard — never a security boundary.

   Loaded AFTER api.js + app.js. app.js has already redirected anonymous users
   to the login page, so here we only need to check the role.
============================================================================= */
(function () {
  "use strict";

  function denyIfNotAdmin(user) {
    if (!user || user.userRole === "admin") return;
    var main = document.getElementById("main");
    if (!main) return;
    main.innerHTML =
      '<div class="container"><div class="panel" style="margin-top:3rem;text-align:center">' +
      '<h1 class="page-title">Admins only</h1>' +
      '<p class="state">This area is restricted to administrators.</p>' +
      '<a class="btn btn--leaf" href="profile.html">Back to profile</a>' +
      "</div></div>";
  }

  // Check the cached user immediately, then again when the fresh copy arrives.
  denyIfNotAdmin(SC.getCachedUser());
  document.addEventListener("sc:user", function (e) { denyIfNotAdmin(e.detail); });
})();
