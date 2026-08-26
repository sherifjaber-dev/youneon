(function youneonPiBoot() {
  function errMsg(e) {
    if (!e) return "unknown";
    if (typeof e === "string") return e;
    if (e.message) return e.message;
    try { return JSON.stringify(e); } catch (x) { return String(e); }
  }

  function findPi() {
    var found = null;
    try { if (window.Pi) found = window.Pi; } catch (w) {}
    if (!found) {
      try { if (window.parent && window.parent.Pi) found = window.parent.Pi; } catch (p) {}
    }
    if (!found) {
      try { if (window.top && window.top.Pi) found = window.top.Pi; } catch (t) {}
    }
    if (found && !window.Pi) {
      try { window.Pi = found; } catch (cp) { console.log("[Pi] error: " + errMsg(cp)); }
    }
    try { return window.Pi || found; } catch (r) { return found; }
  }

  function renderStatus() {
    var nodes = document.querySelectorAll("[data-youneon-pi-status], #youneon-pi-status");
    if (!nodes.length) return;
    var P = findPi();
    var last = window.__YOUNEON_PI_LAST__ || "";
    var text = "Pi SDK: " + (P ? "yes" : "no") + (last ? "  ·  " + last : "");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function setLast(text) {
    window.__YOUNEON_PI_LAST__ = text;
    renderStatus();
  }

  function logSdkLoaded() {
    if (window.__YOUNEON_PI_SDK_LOGGED__ || !findPi()) return;
    window.__YOUNEON_PI_SDK_LOGGED__ = true;
    console.log("[Pi] SDK loaded");
    renderStatus();
  }

  function isPublicLegalPath() {
    try {
      var p = String((location && location.pathname) || "");
      return p === "/privacy" || p === "/terms" || p.indexOf("/privacy/") === 0 || p.indexOf("/terms/") === 0;
    } catch (e) {
      return false;
    }
  }

  function hideOverlays() {
    try {
      if (document.documentElement.classList) document.documentElement.classList.add("youneon-signed-in");
      else document.documentElement.className += " youneon-signed-in";
    } catch (c) {}
    var nodes = document.querySelectorAll(".youneon-static-login, #youneon-static-login, [data-youneon-login-host]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.display = "none";
      nodes[i].style.visibility = "hidden";
      nodes[i].style.pointerEvents = "none";
      try { nodes[i].setAttribute("data-youneon-login-hidden", "1"); } catch (a) {}
    }
    var tree = document.getElementById("youneon-app-tree");
    if (tree) tree.style.pointerEvents = "auto";
  }

  function showOverlays() {
    if (window.__YOUNEON_PUBLIC_PAGE__ || isPublicLegalPath()) {
      hideOverlays();
      return;
    }
    try {
      if (document.documentElement.classList) document.documentElement.classList.remove("youneon-signed-in");
      else document.documentElement.className = String(document.documentElement.className || "").replace(/youneon-signed-in/g, "");
    } catch (c) {}
    var nodes = document.querySelectorAll(".youneon-static-login, #youneon-static-login, [data-youneon-login-host]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.display = "flex";
      nodes[i].style.visibility = "visible";
      nodes[i].style.pointerEvents = "auto";
      try { nodes[i].removeAttribute("data-youneon-login-hidden"); } catch (a) {}
    }
    var tree = document.getElementById("youneon-app-tree");
    if (tree) tree.style.pointerEvents = "none";
  }

  function persistLite(uid, username) {
    try {
      localStorage.setItem("youneon_pi_session_lite", JSON.stringify({ uid: uid || "", username: username || "" }));
      localStorage.setItem("youneon_authenticated", "1");
      localStorage.setItem("youneon_pi_current_user", JSON.stringify({ uid: uid || "", username: username || "" }));
    } catch (ls) {}
  }

  function pickUser(result) {
    var rec = result || {};
    var nested = rec.user && typeof rec.user === "object" ? rec.user : null;
    var source = nested || rec;
    var uid = source && source.uid ? String(source.uid) : "";
    var username = source && source.username ? String(source.username) : "";
    var token = rec.accessToken ? String(rec.accessToken) : "";
    if (!(uid || username)) return null;
    return { uid: uid || username, username: username || uid, accessToken: token };
  }

  function dispatchOk(uid, username) {
    try {
      window.dispatchEvent(new CustomEvent("youneon:pi-auth-ok", { detail: { uid: uid, username: username } }));
    } catch (ev) {
      try { window.dispatchEvent(new Event("youneon:pi-auth-ok")); } catch (ev2) {}
    }
  }

  function postToken(token) {
    if (!token || token === "restored") return;
    try {
      var x = new XMLHttpRequest();
      x.open("POST", "/api/pi/auth", true);
      x.setRequestHeader("Content-Type", "application/json");
      x.withCredentials = true;
      x.send(JSON.stringify({ accessToken: token }));
    } catch (pe) {
      console.log("[Pi] error: " + errMsg(pe));
    }
  }

  function markOk(result) {
    var picked = pickUser(result);
    if (!picked) return;
    if (window.__PI_AUTH_OK) {
      hideOverlays();
      return;
    }
    window.__PI_AUTH_OK = true;
    persistLite(picked.uid, picked.username);
    hideOverlays();
    setLast("Last: signed in" + (picked.username ? " as " + picked.username : ""));
    console.log("[Pi] authenticate success");
    dispatchOk(picked.uid, picked.username);
    postToken(picked.accessToken);
  }

  function clearAuth() {
    window.__PI_AUTH_OK = false;
    try {
      localStorage.removeItem("youneon_pi_session_lite");
      localStorage.removeItem("youneon_authenticated");
      localStorage.removeItem("youneon_pi_current_user");
    } catch (c) {}
    showOverlays();
    try {
      window.dispatchEvent(new CustomEvent("youneon:pi-auth-logout"));
    } catch (ev) {
      try { window.dispatchEvent(new Event("youneon:pi-auth-logout")); } catch (ev2) {}
    }
  }

  function wireAuth(p) {
    try {
      if (p && typeof p.then === "function") {
        p.then(function (r) { markOk(r); }, function (e) {
          console.log("[Pi] error: " + errMsg(e));
          setLast("Last: " + errMsg(e));
        });
      }
    } catch (w) {
      console.log("[Pi] error: " + errMsg(w));
    }
  }

  function onIncompletePaymentFound(payment) {
    try {
      var x = new XMLHttpRequest();
      x.open("POST", "/api/pi/payment/incomplete", true);
      x.setRequestHeader("Content-Type", "application/json");
      x.withCredentials = true;
      x.send(JSON.stringify({
        paymentId: payment && payment.identifier ? payment.identifier : null,
        payment: payment
      }));
    } catch (ie) {
      console.log("[Pi] error: " + errMsg(ie));
    }
  }

  function callAuthenticate() {
    var P = findPi();
    if (!P || typeof P.authenticate !== "function") {
      setLast("Last: window.Pi missing");
      console.log("[Pi] error: no window.Pi");
      return;
    }
    console.log("[Pi] authenticate start");
    setLast("Last: authenticate called");
    var promise = null;
    try {
      promise = P.authenticate(["username", "payments"], onIncompletePaymentFound);
      wireAuth(promise);
    } catch (classicErr) {
      console.log("[Pi] error: " + errMsg(classicErr));
      setLast("Last: " + errMsg(classicErr));
    }
    try {
      var objectResult = P.authenticate({ scopes: ["username", "payments"] });
      wireAuth(objectResult);
      if (!promise) promise = objectResult;
    } catch (objectErr) {
      console.log("[Pi] error: " + errMsg(objectErr));
    }
    return promise;
  }

  window.__youneonFindPi = findPi;
  window.__youneonCallPiAuthenticate = callAuthenticate;
  window.__youneonMarkPiAuthOk = markOk;
  window.__youneonClearPiAuth = clearAuth;
  window.__youneonPiAuth = function () {
    var P = findPi();
    if (!P) {
      setLast("Last: window.Pi missing");
      console.log("[Pi] error: no window.Pi");
      return;
    }
    try {
      if (P.init) P.init({ version: "2.0", sandbox: true });
    } catch (ie) {
      console.log("[Pi] error: " + errMsg(ie));
    }
    return callAuthenticate();
  };

  var AUTH_JS =
    "try{var P=null;try{P=window.Pi;}catch(w){}if(!P){try{P=window.parent.Pi;}catch(p){}}if(!P){try{P=window.top.Pi;}catch(t){}}if(P&&!window.Pi){try{window.Pi=P;}catch(cp){}}function wireAuth(p){try{if(p&&typeof p.then==='function')p.then(function(r){try{if(typeof window.__youneonMarkPiAuthOk==='function')window.__youneonMarkPiAuthOk(r);}catch(m){}},function(e){console.log('[Pi] error: '+e);});}catch(w2){}}var last='';if(!P||typeof P.authenticate!=='function'){last='Last: window.Pi missing';console.log('[Pi] error: no window.Pi');}else{console.log('[Pi] authenticate start');last='Last: authenticate called';try{wireAuth(P.authenticate(['username','payments'],function(payment){try{var x=new XMLHttpRequest();x.open('POST','/api/pi/payment/incomplete',true);x.setRequestHeader('Content-Type','application/json');x.withCredentials=true;x.send(JSON.stringify({paymentId:payment&&payment.identifier,payment:payment}));}catch(ie){console.log('[Pi] error: '+ie);}}));}catch(c){console.log('[Pi] error: '+c);last='Last: '+c;}try{wireAuth(P.authenticate({scopes:['username','payments']}));}catch(o){console.log('[Pi] error: '+o);}}try{window.__YOUNEON_PI_LAST__=last;var sts=document.querySelectorAll('[data-youneon-pi-status],#youneon-pi-status');for(var si=0;si<sts.length;si++){sts[si].textContent='Pi SDK: '+(P?'yes':'no')+'  ·  '+last;}}catch(su){console.log('[Pi] error: '+su);}if(typeof window.__youneonPiAuth==='function'){try{window.__youneonPiAuth();}catch(au){console.log('[Pi] error: '+au);}}}catch(e){console.log('[Pi] error: '+e)}";
  var LOGIN_V = "neon-faces-2";
  var NONE =
    "pointer-events:none;user-select:none;-webkit-user-select:none;cursor:pointer";
  var OVERLAY_CHROME =
    "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#070010;color:#ffffff;padding:48px 16px 72px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:rgba(194,24,117,0.35);caret-color:transparent";
  var CTRL_STYLE =
    "height:37px;min-height:37px;padding:0 16px;font-size:14px;font-weight:600;line-height:1;border:0;border-radius:12px;color:#FFFFFF;background-color:#C21875;background-image:none;cursor:pointer;width:100%;max-width:100%;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto;position:relative;z-index:2147483647;touch-action:manipulation;-webkit-tap-highlight-color:rgba(194,24,117,0.35);user-select:none;-webkit-user-select:none;caret-color:transparent;box-shadow:none";
  var STATUS_STYLE =
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif";
  var NATIVE_ATTRS =
    'onclick="' + AUTH_JS + '" onpointerdown="' + AUTH_JS + '" onmousedown="' + AUTH_JS + '" ontouchstart="' + AUTH_JS + '" onselectstart="return false" unselectable="on"';
  var CONTROLS_HTML =
    '<button type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' + CTRL_STYLE + '" ' + NATIVE_ATTRS + '><span aria-hidden="true" style="font-size:16px;line-height:1;font-weight:600;pointer-events:none">&#960;</span>Sign in with Pi</button>';
  var STATUS_HTML =
    '<p id="youneon-pi-status" data-youneon-pi-status="1" style="' + STATUS_STYLE + '">Pi SDK: …</p>';
  var LEGAL_STOP =
    'onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
  function overlayInnerHtml() {
    return (
      '<div class="youneon-welcome-card" style="position:relative;z-index:2;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;' + NONE + '">' +
      '<h1 style="font-size:2.05rem;font-weight:800;letter-spacing:-0.03em;line-height:1.05;margin:0 0 8px;color:#ffffff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;' + NONE + '"><span style="color:#ffffff;font-weight:800;font-family:system-ui,-apple-system,Segoe UI,sans-serif;' + NONE + '">You</span><span style="color:#E03596;font-family:Pacifico,\'Segoe Script\',\'Snell Roundhand\',cursive;font-weight:400;font-size:1.15em;letter-spacing:0.01em;text-shadow:0 0 8px rgba(224,53,150,0.72),0 0 18px rgba(194,24,117,0.4);' + NONE + '">Neon</span></h1>' +
      '<img class="youneon-welcome-hero" src="/default-avatar.png" alt="" width="512" height="512" decoding="async" style="display:block;width:min(72vw,268px);height:auto;margin:10px 0 18px;object-fit:contain;' + NONE + '" />' +
      '<p style="font-size:15px;line-height:1.4;font-weight:500;color:#8b8494;margin:0 0 22px;' + NONE + '">Meet in the glow.</p>' +
      '<div style="pointer-events:auto;user-select:none;-webkit-user-select:none;width:100%;display:flex;justify-content:center">' +
      CONTROLS_HTML +
      "</div>" +
      '<p style="font-size:12px;line-height:1.45;font-weight:500;color:#5c5666;margin:12px 0 0;' + NONE + '">You need a Pi account to enter.</p>' +
      STATUS_HTML +
      "</div>" +
      '<div class="youneon-welcome-legal" data-youneon-legal="1" style="position:absolute;left:0;right:0;bottom:max(22px,env(safe-area-inset-bottom));z-index:3;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:auto;user-select:none;-webkit-user-select:none">' +
      '<a href="/terms" ' + LEGAL_STOP + ' style="color:#E03596;font-size:14px;font-weight:600;text-decoration:none;pointer-events:auto;cursor:pointer;font-family:system-ui,-apple-system,Segoe UI,sans-serif">Terms</a>' +
      '<span style="color:#E03596;font-size:14px;font-weight:600;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif">&amp;</span>' +
      '<a href="/privacy" ' + LEGAL_STOP + ' style="color:#E03596;font-size:14px;font-weight:600;text-decoration:none;pointer-events:auto;cursor:pointer;font-family:system-ui,-apple-system,Segoe UI,sans-serif">Privacy</a>' +
      "</div>"
    );
  }

  function isLoginTarget(t) {
    if (!t) return false;
    if (t.nodeType === 3) t = t.parentNode;
    if (!t || !t.closest) return false;
    if (t.closest("[data-youneon-legal], .youneon-welcome-legal")) return false;
    return !!(
      t.closest(".youneon-static-login") ||
      t.closest("#youneon-static-login") ||
      t.closest("[data-youneon-login-host]") ||
      t.closest("[data-youneon-signin]") ||
      t.closest(".youneon-signin-btn")
    );
  }
  function onLoginHit(ev) {
    if (window.__PI_AUTH_OK) return;
    if (!isLoginTarget(ev && ev.target)) return;
    if (typeof window.__youneonPiAuth === "function") window.__youneonPiAuth();
    else callAuthenticate();
  }
  function bindLoginHits() {
    if (window.__YOUNEON_LOGIN_HIT_BOUND__) return;
    window.__YOUNEON_LOGIN_HIT_BOUND__ = true;
    var types = ["pointerdown", "mousedown", "touchstart", "click"];
    for (var i = 0; i < types.length; i++) {
      try { document.addEventListener(types[i], onLoginHit, true); } catch (he) { console.log("[Pi] error: " + errMsg(he)); }
    }
  }
  function styleOverlay(el) {
    if (!el || !el.style) return;
    el.style.zIndex = "2147483647";
    el.style.pointerEvents = "auto";
    el.style.cursor = "pointer";
    el.style.touchAction = "manipulation";
    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";
    el.style.webkitTapHighlightColor = "rgba(194,24,117,0.35)";
    el.style.caretColor = "transparent";
    el.style.backgroundColor = "#070010";
    el.style.background = "#070010";
    try { el.setAttribute("unselectable", "on"); } catch (u) { console.log("[Pi] error: " + errMsg(u)); }
  }
  function applyNativeAttrs(el) {
    if (!el) return;
    try {
      el.setAttribute("onclick", AUTH_JS);
      el.setAttribute("onpointerdown", AUTH_JS);
      el.setAttribute("onmousedown", AUTH_JS);
      el.setAttribute("ontouchstart", AUTH_JS);
      el.setAttribute("onselectstart", "return false");
      el.setAttribute("unselectable", "on");
    } catch (n) { console.log("[Pi] error: " + errMsg(n)); }
  }
  function overlayIsCurrent(el) {
    if (!el) return false;
    try {
      if (el.getAttribute("data-youneon-login-v") !== LOGIN_V) return false;
    } catch (a) { return false; }
    return !!(el.querySelector(".youneon-welcome-hero") && el.querySelector("button.youneon-signin-btn"));
  }
  function paintLoginOverlay(overlay) {
    if (!overlay) return;
    var nested = overlay.querySelector ? overlay.querySelector(".youneon-static-login") : null;
    if (nested && nested !== overlay) {
      paintLoginOverlay(nested);
      return;
    }
    styleOverlay(overlay);
    if (overlayIsCurrent(overlay)) {
      applyNativeAttrs(overlay);
      return;
    }
    try {
      var cls = String(overlay.className || "");
      if (cls.indexOf("youneon-static-login") < 0) {
        overlay.className = cls ? cls + " youneon-static-login" : "youneon-static-login";
      }
      overlay.setAttribute("data-youneon-signin", "1");
      overlay.setAttribute("data-youneon-login-v", LOGIN_V);
      overlay.setAttribute("aria-label", "Sign in with Pi Network");
      overlay.style.cssText = OVERLAY_CHROME;
      overlay.innerHTML = overlayInnerHtml();
      applyNativeAttrs(overlay);
      try { window.__YOUNEON_LOGIN_V = LOGIN_V; } catch (lv) {}
    } catch (pe) {
      console.log("[Pi] error: " + errMsg(pe));
    }
  }
  function ensureLoginOverlay() {
    if (window.__YOUNEON_PUBLIC_PAGE__ || isPublicLegalPath()) return;
    var overlays = document.querySelectorAll(".youneon-static-login, #youneon-static-login");
    if (!overlays.length) overlays = document.querySelectorAll("[data-youneon-login-host]");
    if (!overlays.length && document.body) {
      var host = document.createElement("div");
      host.className = "youneon-static-login";
      host.id = "youneon-static-login";
      if (document.body.firstChild) document.body.insertBefore(host, document.body.firstChild);
      else document.body.appendChild(host);
      overlays = document.querySelectorAll(".youneon-static-login, #youneon-static-login");
    }
    for (var i = 0; i < overlays.length; i++) paintLoginOverlay(overlays[i]);
  }
  function restoreSigninControls() {
    if (window.__PI_AUTH_OK) {
      hideOverlays();
      return;
    }
    if (window.__YOUNEON_RESTORING_SIGNIN__) return;
    window.__YOUNEON_RESTORING_SIGNIN__ = true;
    try {
      ensureLoginOverlay();
      var overlays = document.querySelectorAll(".youneon-static-login, #youneon-static-login, [data-youneon-login-host]");
      for (var i = 0; i < overlays.length; i++) {
        var overlay = overlays[i];
        styleOverlay(overlay);
        var extras = overlay.querySelectorAll("input.youneon-signin-btn, input[data-youneon-signin]");
        for (var x = 0; x < extras.length; x++) {
          if (extras[x].parentNode) extras[x].parentNode.removeChild(extras[x]);
        }
        var buttons = overlay.querySelectorAll("button.youneon-signin-btn, button[data-youneon-signin]");
        for (var b = 1; b < buttons.length; b++) {
          if (buttons[b].parentNode) buttons[b].parentNode.removeChild(buttons[b]);
        }
        var real = overlay.querySelector("button.youneon-signin-btn, button[data-youneon-signin]");
        if (!real) {
          var fake = overlay.querySelector("[data-youneon-signin], .youneon-signin-btn, #youneon-signin-btn");
          if (fake && fake !== overlay && fake.parentNode) {
            var tag2 = (fake.tagName || "").toUpperCase();
            if (tag2 !== "BUTTON") {
              var holder = document.createElement("div");
              holder.innerHTML = CONTROLS_HTML;
              fake.parentNode.replaceChild(holder, fake);
            }
          }
        }
        if (!overlay.querySelector("button.youneon-signin-btn, button[data-youneon-signin]")) {
          overlay.insertAdjacentHTML("beforeend", CONTROLS_HTML);
        }
        if (!document.getElementById("youneon-pi-status") && !overlay.querySelector("[data-youneon-pi-status]")) {
          overlay.insertAdjacentHTML("beforeend", STATUS_HTML);
        }
      }
      renderStatus();
    } catch (re) {
      console.log("[Pi] error: " + errMsg(re));
    } finally {
      window.__YOUNEON_RESTORING_SIGNIN__ = false;
    }
  }

  function runInitThenAuth() {
    if (window.__YOUNEON_PI_AUTO_AUTH_STARTED__) return;
    window.__YOUNEON_PI_AUTO_AUTH_STARTED__ = true;
    var P = findPi();
    if (!P) {
      setLast("Last: window.Pi missing");
      console.log("[Pi] error: no window.Pi");
      return;
    }
    logSdkLoaded();
    try {
      if (P.init) {
        console.log("[Pi] init start");
        var r = P.init({ version: "2.0", sandbox: true });
        if (r && typeof r.then === "function") {
          r.then(function () { console.log("[Pi] init success"); }, function (e) { console.log("[Pi] error: " + errMsg(e)); });
        } else {
          console.log("[Pi] init success");
        }
      }
    } catch (e) {
      console.log("[Pi] error: " + errMsg(e));
    }
  }

  function loadOfficialSdkIfMissing() {
    if (findPi()) return;
    if (document.querySelector("script[data-youneon-pi-sdk]")) return;
    var preserved = null;
    try { preserved = window.Pi; } catch (pe) { console.log("[Pi] error: " + errMsg(pe)); }
    var s = document.createElement("script");
    s.src = "https://sdk.minepi.com/pi-sdk.js";
    s.async = true;
    s.setAttribute("data-youneon-pi-sdk", "1");
    s.onload = function () {
      if (preserved) {
        try { window.Pi = preserved; } catch (re) { console.log("[Pi] error: " + errMsg(re)); }
      }
      logSdkLoaded();
      renderStatus();
    };
    s.onerror = function () {
      console.log("[Pi] error: failed to load sdk.minepi.com");
      setLast("Last: SDK script failed");
    };
    (document.head || document.documentElement).appendChild(s);
  }

  if (isPublicLegalPath()) {
    window.__YOUNEON_PUBLIC_PAGE__ = true;
    hideOverlays();
  }
  if (!window.__PI_AUTH_OK && !window.__YOUNEON_PUBLIC_PAGE__) showOverlays();
  bindLoginHits();
  restoreSigninControls();
  setTimeout(restoreSigninControls, 0);
  setTimeout(restoreSigninControls, 100);
  setTimeout(restoreSigninControls, 500);
  try {
    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function () { restoreSigninControls(); });
      if (document.documentElement) mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch (moe) { console.log("[Pi] error: " + errMsg(moe)); }

  renderStatus();
  var piPoll = setInterval(function () {
    renderStatus();
    if (!findPi()) return;
    clearInterval(piPoll);
    logSdkLoaded();
    runInitThenAuth();
  }, 200);
  if (findPi()) { clearInterval(piPoll); runInitThenAuth(); }

  if (!window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__) {
    window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__ = true;
    setTimeout(function () {
      if (findPi()) {
        renderStatus();
        return;
      }
      loadOfficialSdkIfMissing();
    }, 500);
  }
})();
