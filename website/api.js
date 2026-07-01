/* =============================================================================
   Safe Cities Permaculture — api.js
   -----------------------------------------------------------------------------
   Plain-JS data layer for the static frontend. It talks to the SAME backend the
   mobile app uses (Express REST API + the FastAPI AI service) and reuses the
   exact same JWT auth scheme and token storage, so nothing on the backend has to
   change.

   Loaded as a classic script (no ES modules) so it works when served from any
   static host. Everything is hung off a single global namespace: `window.SC`.

   Token model (identical to the Expo app):
     localStorage["tokens"] = JSON.stringify({ accessToken, refreshToken })
     - accessToken  sent as `Authorization: Bearer <token>` on every request
     - on a 401 we call POST /auth/refresh once, then retry the original request
============================================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------- Configuration */
  // Resolve the Express API base. When the site is served BY the backend (same
  // origin) we use a relative "/api" path, which sidesteps CORS entirely.
  // Otherwise we point at localhost (dev) or the Render deployment (prod).
  function computeBackend() {
    var h = location.hostname;
    var isLocal = h === "localhost" || h === "127.0.0.1";
    if (isLocal) {
      // Served by the Express server itself? -> same-origin relative path.
      return location.port === "3000" ? "/api" : "http://localhost:3000/api";
    }
    if (location.protocol === "file:") return "http://localhost:3000/api";
    // Served from the backend's own domain -> relative; else absolute.
    if (h === "permacultureapp.onrender.com") return "/api";
    return "https://permacultureapp.onrender.com/api";
  }
  // The AI service is always a separate origin (its own host/port).
  function computeAi() {
    var h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || location.protocol === "file:") {
      return "http://localhost:8000";
    }
    return "https://afc-estate-ai.onrender.com";
  }
  var BACKEND_URL = computeBackend();
  var AI_BASE_URL = computeAi();

  var STORAGE_KEY = "tokens"; // same key the mobile app uses

  /* --------------------------------------------------------- Token storage */
  function getTokens() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function storeTokens(accessToken, refreshToken) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: accessToken, refreshToken: refreshToken })
    );
  }
  function clearTokens() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem("sessionExpiry");
  }
  function isLoggedIn() {
    var t = getTokens();
    return !!(t && t.accessToken);
  }

  // How long a login stays valid on a device before re-login is required.
  var SESSION_MAX_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

  /* -------------------------------------------------- Session expiry (2 weeks)
     The login is kept on this device (localStorage) so users stay logged in
     across visits. At login we record when the session should expire; if the
     saved session is past that point, we clear it so the user logs in again.
     Runs immediately, before any page auth check, since this script loads first. */
  (function enforceSessionExpiry() {
    try {
      var expiry = Number(localStorage.getItem("sessionExpiry"));
      if (expiry && Date.now() > expiry) {
        clearTokens();
      }
    } catch (e) {
      /* localStorage unavailable — leave the session as-is */
    }
  })();

  // Cache the logged-in user so pages don't re-fetch it constantly.
  function getCachedUser() {
    try {
      var raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function setCachedUser(user) {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }

  /* ----------------------------------------------------- Token refresh flow */
  function tryRefresh() {
    var tokens = getTokens();
    if (!tokens || !tokens.refreshToken) return Promise.resolve(false);
    return fetch(BACKEND_URL + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })
      .then(function (res) {
        if (!res.ok) return false;
        return res.json().then(function (data) {
          storeTokens(data.accessToken, tokens.refreshToken);
          return true;
        });
      })
      .catch(function () {
        return false;
      });
  }

  /* ------------------------------------------------------- Core request fn */
  // base   : which service ("api" = Express, "ai" = FastAPI)
  // path   : e.g. "/tasks/" — appended to the chosen base URL
  // opts   : { method, body, form, retry }
  //   - body  : plain object -> sent as JSON
  //   - form  : a FormData instance -> sent as multipart (for file uploads)
  function request(base, path, opts) {
    opts = opts || {};
    var root = base === "ai" ? AI_BASE_URL : BACKEND_URL;
    var tokens = getTokens();
    var headers = {};
    if (tokens && tokens.accessToken) {
      headers.Authorization = "Bearer " + tokens.accessToken;
    }

    var fetchOpts = { method: opts.method || "GET", headers: headers };
    if (opts.form) {
      fetchOpts.body = opts.form; // browser sets the multipart boundary
    } else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      fetchOpts.body = JSON.stringify(opts.body);
    }

    return fetch(root + path, fetchOpts).then(function (res) {
      // Transparently refresh once on an expired access token, then retry.
      var isAuthCall = path.indexOf("/login") !== -1 || path.indexOf("/refresh") !== -1;
      if (res.status === 401 && !opts.retry && !isAuthCall) {
        return tryRefresh().then(function (ok) {
          if (ok) {
            var retryOpts = Object.assign({}, opts, { retry: true });
            return request(base, path, retryOpts);
          }
          clearTokens();
          return Promise.reject(new ApiError("Session expired. Please log in again.", 401));
        });
      }
      return parse(res);
    });
  }

  // Turn a fetch Response into data, or a rejected ApiError carrying the
  // backend's message + status code.
  function parse(res) {
    var ct = res.headers.get("content-type") || "";
    if (res.status === 204) return null;
    if (ct.indexOf("application/json") !== -1) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new ApiError(
            (data && (data.message || data.error || data.detail)) || "Request failed",
            res.status
          );
        }
        return data;
      });
    }
    // Non-JSON (e.g. file downloads) — hand back the raw response.
    if (!res.ok) throw new ApiError("Request failed", res.status);
    return res;
  }

  function ApiError(message, status) {
    this.message = message;
    this.status = status;
    this.name = "ApiError";
  }
  ApiError.prototype = Object.create(Error.prototype);

  /* ----------------------------------------------------------- Auth methods */
  function login(username, password) {
    return request("api", "/auth/login", {
      method: "POST",
      body: { username: username, password: password },
    }).then(function (data) {
      storeTokens(data.accessToken, data.refreshToken);
      setCachedUser(data.user);
      // Keep this login valid on this device for two weeks.
      localStorage.setItem("sessionExpiry", String(Date.now() + SESSION_MAX_MS));
      return data.user;
    });
  }
  function signup(username, email, password) {
    return request("api", "/auth/signup", {
      method: "POST",
      body: { username: username, email: email, password: password },
    });
  }
  function logout() {
    var tokens = getTokens();
    var done = tokens && tokens.refreshToken
      ? request("api", "/auth/logout", {
          method: "POST",
          body: { refreshToken: tokens.refreshToken },
        }).catch(function () {})
      : Promise.resolve();
    return done.then(clearTokens);
  }
  // Public password-reset flow (no auth). Step 1 emails a link to the user.
  function requestPasswordReset(username, email) {
    return request("api", "/auth/reset-password", {
      method: "PUT",
      body: { username: username, email: email },
    });
  }
  // Step 2: redeem the token from the emailed link with a new password.
  function resetPasswordWithToken(token, newPassword) {
    return request("api", "/auth/reset-password/" + encodeURIComponent(token), {
      method: "PUT",
      body: { newPassword: newPassword },
    });
  }

  // Pull fresh user data (also refreshes the cached copy).
  function fetchUser() {
    return request("api", "/auth/userdata", {}).then(function (data) {
      var user = data.user || data;
      setCachedUser(user);
      return user;
    });
  }

  /* --------------------------------------------- Feature endpoint wrappers */
  var Listings = {
    all: function () { return request("api", "/listings/get", {}); },
    mine: function () { return request("api", "/listings/get-my-listings", {}); },
    one: function (id) { return request("api", "/listings/get/" + id, {}); },
    create: function (form) { return request("api", "/listings/post", { method: "POST", form: form }); },
    update: function (id, form) { return request("api", "/listings/update/" + id, { method: "PUT", form: form }); },
    remove: function (id) { return request("api", "/listings/remove/" + id, { method: "DELETE" }); },
  };

  var Tasks = {
    open: function () { return request("api", "/tasks/", {}); },
    completed: function () { return request("api", "/tasks/completed", {}); },
    create: function (body) { return request("api", "/tasks/", { method: "POST", body: body }); },
    update: function (id, body) { return request("api", "/tasks/" + id, { method: "PUT", body: body }); },
    complete: function (id, form) { return request("api", "/tasks/complete/" + id, { method: "PUT", form: form }); },
    reopen: function (id) { return request("api", "/tasks/incomplete/" + id, { method: "PUT" }); },
    remove: function (id) { return request("api", "/tasks/" + id, { method: "DELETE" }); },
  };

  var Files = {
    list: function (parent) {
      return request("api", "/files/list" + (parent ? "?parent=" + parent : ""), {});
    },
    // Download returns the raw Response so callers can read a Blob.
    download: function (id) { return request("api", "/files/" + id, { method: "POST" }); },
    storage: function () { return request("api", "/files/storage", {}); },
    // Admin-only writes to Drive (backend enforces the admin role; 403 if not).
    upload: function (parent, file) {
      var form = new FormData();
      form.append("file", file);
      form.append("parent", parent || "null");
      return request("api", "/files/upload", { method: "POST", form: form });
    },
    createFolder: function (name, parent) {
      return request("api", "/files/folder/create", {
        method: "POST",
        body: { name: name, parent: parent || "null" },
      });
    },
    // flags: { showInDocs?: bool, inCorpus?: bool }
    setFlags: function (id, flags) {
      return request("api", "/files/" + id + "/flags", { method: "PATCH", body: flags });
    },
    remove: function (id) { return request("api", "/files/delete/" + id, { method: "DELETE" }); },
  };

  var Users = {
    me: function () { return request("api", "/user/me", {}); },
    updateProfile: function (body) { return request("api", "/user/update-profile", { method: "PUT", body: body }); },
    changePassword: function (oldPassword, newPassword) {
      return request("api", "/user/change-password", {
        method: "PUT",
        body: { oldPassword: oldPassword, newPassword: newPassword },
      });
    },
    image: function (id, form) { return request("api", "/user/image/" + id, { method: "PUT", form: form }); },
  };

  // Conversations live under /api (mounted without a sub-prefix on the router).
  var Messages = {
    conversations: function () { return request("api", "/conversations", {}); },
    // usernames: array of the OTHER participants' usernames.
    start: function (usernames) {
      return request("api", "/conversations", { method: "POST", body: { usernames: usernames } });
    },
    conversation: function (id) { return request("api", "/conversations/" + id, {}); },
    list: function (id) { return request("api", "/conversations/" + id + "/messages", {}); },
    send: function (id, text) {
      return request("api", "/conversations/" + id + "/messages", { method: "POST", body: { text: text } });
    },
    rename: function (id, name) {
      return request("api", "/conversations/" + id + "/rename", { method: "PUT", body: { name: name } });
    },
  };

  // Admin-only endpoints (backend enforces the admin role; 403 if not).
  var Admin = {
    unverified: function () { return request("api", "/admin/unverified", {}); },
    verified: function () { return request("api", "/admin/verified", {}); },
    user: function (id) { return request("api", "/admin/user/" + id, {}); },
    verify: function (id) { return request("api", "/admin/verify/" + id, { method: "PUT" }); },
    deny: function (id) { return request("api", "/admin/denyverify/" + id, { method: "DELETE" }); },
    remove: function (id) { return request("api", "/admin/remove/" + id, { method: "PUT" }); },
    update: function (id, updatedUserData) {
      return request("api", "/admin/user/update/" + id, { method: "PUT", body: { updatedUserData: updatedUserData } });
    },
    resetPassword: function (id, newPassword) {
      return request("api", "/admin/user/reset-password/" + id, { method: "PUT", body: { newPassword: newPassword } });
    },
    safecities: function () { return request("api", "/admin/safecities", {}); },
    tasks: function (query) {
      var qs = "";
      if (query) {
        var parts = [];
        if (query.assignedTo) parts.push("assignedTo=" + encodeURIComponent(query.assignedTo));
        if (query.isCompleted != null) parts.push("isCompleted=" + query.isCompleted);
        if (parts.length) qs = "?" + parts.join("&");
      }
      return request("api", "/admin/tasks" + qs, {});
    },
  };

  var Reports = {
    all: function () { return request("api", "/reports/", {}); },
    one: function (id) { return request("api", "/reports/" + id, {}); },
    remove: function (id) { return request("api", "/reports/" + id, { method: "DELETE" }); },
    dismiss: function (id) { return request("api", "/reports/dismiss/" + id, { method: "PUT" }); },
    create: function (body) { return request("api", "/reports/", { method: "POST", body: body }); },
  };

  var Farms = {
    all: function (includeInactive) {
      return request("api", "/farms/" + (includeInactive ? "?all=true" : ""), {});
    },
    create: function (name) { return request("api", "/farms/", { method: "POST", body: { name: name } }); },
    update: function (id, body) { return request("api", "/farms/" + id, { method: "PUT", body: body }); },
    remove: function (id) { return request("api", "/farms/" + id, { method: "DELETE" }); },
  };

  var Assistant = {
    // history: [{role:"user"|"assistant", content:""}]; includeTasks folds the
    // user's open tasks into the model context.
    chat: function (message, history, includeTasks) {
      return request("ai", "/chat", {
        method: "POST",
        body: { message: message, history: history || [], include_tasks: !!includeTasks },
      });
    },
    // Streaming variant of chat(): the reply arrives token-by-token over
    // Server-Sent Events. `handlers` may provide onSources(arr), onDelta(text),
    // onError(msg), onDone(). Returns a Promise that resolves once the stream
    // ends; the Promise rejects only if the connection can't be established
    // (e.g. auth/network) — mid-stream issues come through onError.
    chatStream: function (message, history, includeTasks, handlers) {
      handlers = handlers || {};
      var payload = JSON.stringify({
        message: message,
        history: history || [],
        include_tasks: !!includeTasks,
      });

      function open(isRetry) {
        var tokens = getTokens();
        var headers = { "Content-Type": "application/json" };
        if (tokens && tokens.accessToken) {
          headers.Authorization = "Bearer " + tokens.accessToken;
        }
        return fetch(AI_BASE_URL + "/chat/stream", {
          method: "POST",
          headers: headers,
          body: payload,
        }).then(function (res) {
          // Refresh once on an expired access token, then retry the stream.
          if (res.status === 401 && !isRetry) {
            return tryRefresh().then(function (ok) {
              if (ok) return open(true);
              clearTokens();
              throw new ApiError("Session expired. Please log in again.", 401);
            });
          }
          if (!res.ok || !res.body) {
            throw new ApiError(
              "The assistant is unavailable. Please try again.",
              res.status
            );
          }
          return pump(res.body.getReader());
        });
      }

      function pump(reader) {
        var decoder = new TextDecoder();
        var buffer = "";
        var finished = false;
        function finish() {
          if (!finished) { finished = true; if (handlers.onDone) handlers.onDone(); }
        }
        function read() {
          return reader.read().then(function (result) {
            if (result.done) { finish(); return; }
            buffer += decoder.decode(result.value, { stream: true });
            var frames = buffer.split("\n\n");
            buffer = frames.pop(); // keep the trailing partial frame
            for (var i = 0; i < frames.length; i++) {
              var line = frames[i].trim();
              if (line.indexOf("data:") !== 0) continue;
              var evt;
              try { evt = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
              if (evt.type === "sources") {
                if (handlers.onSources) handlers.onSources(evt.sources || []);
              } else if (evt.type === "delta") {
                if (handlers.onDelta) handlers.onDelta(evt.text || "");
              } else if (evt.type === "error") {
                if (handlers.onError) handlers.onError(evt.message || "Something went wrong.");
              } else if (evt.type === "done") {
                finish();
              }
            }
            if (finished) return;
            return read();
          });
        }
        return read();
      }

      return open(false);
    },
    // --- Persisted chat history (Express backend, separate from the AI call) ---
    // Sidebar list: saved chats first, then the 10 most recent.
    history: function () { return request("api", "/chat", {}); },
    // Full chat (with messages) by id.
    get: function (id) { return request("api", "/chat/" + id, {}); },
    // Create or update a chat. body: { chatId?, messages, title? } -> { chat }.
    save: function (body) { return request("api", "/chat/save", { method: "POST", body: body }); },
    // Save/unsave (pin) a chat so it sticks to the top and is never auto-deleted.
    pin: function (id, isPinned) {
      return request("api", "/chat/" + id + "/pin", { method: "PUT", body: { isPinned: isPinned } });
    },
    remove: function (id) { return request("api", "/chat/" + id, { method: "DELETE" }); },
  };

  /* ------------------------------------------------------------- Utilities */
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function formatDate(value) {
    if (!value) return "";
    var d = new Date(value);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }
  function currency(n) {
    var num = Number(n) || 0;
    return "R" + num.toLocaleString("en-ZA");
  }

  // Build a circular avatar <img>. Falls back to the logo if no picture is set
  // or the URL fails to load (e.g. legacy Google-Drive links that don't render).
  function avatarEl(url, size, alt) {
    var img = document.createElement("img");
    img.className = "avatar-img";
    img.width = size || 32;
    img.height = size || 32;
    img.alt = alt || "";
    img.loading = "lazy";
    img.src = url || "./assets/images/logo.png";
    img.addEventListener("error", function () {
      if (img.src.indexOf("logo.png") === -1) img.src = "./assets/images/logo.png";
    });
    return img;
  }

  /* ------------------------------------------------------------- Export API */
  window.SC = {
    BACKEND_URL: BACKEND_URL,
    AI_BASE_URL: AI_BASE_URL,
    // auth + tokens
    getTokens: getTokens,
    clearTokens: clearTokens,
    isLoggedIn: isLoggedIn,
    getCachedUser: getCachedUser,
    login: login,
    signup: signup,
    logout: logout,
    fetchUser: fetchUser,
    requestPasswordReset: requestPasswordReset,
    resetPasswordWithToken: resetPasswordWithToken,
    // resources
    Listings: Listings,
    Tasks: Tasks,
    Files: Files,
    Users: Users,
    Messages: Messages,
    Admin: Admin,
    Reports: Reports,
    Farms: Farms,
    Assistant: Assistant,
    // utils
    request: request,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    currency: currency,
    avatarEl: avatarEl,
    ApiError: ApiError,
  };
})();
