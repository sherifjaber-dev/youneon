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
    try {
      P.authenticate(["username", "payments"], onIncompletePaymentFound);
    } catch (classicErr) {
      console.log("[Pi] error: " + errMsg(classicErr));
      setLast("Last: " + errMsg(classicErr));
    }
    try {
      P.authenticate({ scopes: ["username", "payments"] });
    } catch (objectErr) {
      console.log("[Pi] error: " + errMsg(objectErr));
    }
  }

  window.__youneonFindPi = findPi;
  window.__youneonCallPiAuthenticate = callAuthenticate;
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
    "try{var P=null;try{P=window.Pi;}catch(w){}if(!P){try{P=window.parent.Pi;}catch(p){}}if(!P){try{P=window.top.Pi;}catch(t){}}if(P&&!window.Pi){try{window.Pi=P;}catch(cp){}}var last='';if(!P||typeof P.authenticate!=='function'){last='Last: window.Pi missing';console.log('[Pi] error: no window.Pi');}else{console.log('[Pi] authenticate start');last='Last: authenticate called';try{P.authenticate(['username','payments'],function(payment){try{var x=new XMLHttpRequest();x.open('POST','/api/pi/payment/incomplete',true);x.setRequestHeader('Content-Type','application/json');x.withCredentials=true;x.send(JSON.stringify({paymentId:payment&&payment.identifier,payment:payment}));}catch(ie){console.log('[Pi] error: '+ie);}});}catch(c){console.log('[Pi] error: '+c);last='Last: '+c;}try{P.authenticate({scopes:['username','payments']});}catch(o){console.log('[Pi] error: '+o);}}try{window.__YOUNEON_PI_LAST__=last;var sts=document.querySelectorAll('[data-youneon-pi-status],#youneon-pi-status');for(var si=0;si<sts.length;si++){sts[si].textContent='Pi SDK: '+(P?'yes':'no')+'  ·  '+last;}}catch(su){console.log('[Pi] error: '+su);}if(typeof window.__youneonPiAuth==='function'){try{window.__youneonPiAuth();}catch(au){console.log('[Pi] error: '+au);}}}catch(e){console.log('[Pi] error: '+e)}";
  var CTRL_STYLE =
    "padding:16px 32px;font-size:1.125rem;font-weight:700;border:0;border-radius:16px;color:#ffffff;background-color:#a855f7;background-image:linear-gradient(to right,#a855f7,#ec4899);cursor:pointer;width:100%;max-width:320px;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto;position:relative;z-index:2147483647;touch-action:manipulation;-webkit-tap-highlight-color:rgba(168,85,247,0.5);user-select:none;-webkit-user-select:none;caret-color:transparent";
  var STATUS_STYLE =
    "font-size:0.75rem;color:rgba(233,213,255,0.9);margin:16px 0 0;max-width:320px;pointer-events:none;user-select:none;line-height:1.45;word-break:break-word;font-family:system-ui,-apple-system,Segoe UI,sans-serif";
  var NATIVE_ATTRS =
    'onclick="' + AUTH_JS + '" onpointerdown="' + AUTH_JS + '" onmousedown="' + AUTH_JS + '" ontouchstart="' + AUTH_JS + '" onselectstart="return false" unselectable="on"';
  var CONTROLS_HTML =
    '<button type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' + CTRL_STYLE + '" ' + NATIVE_ATTRS + ">Sign in with Pi Network</button>";
  var STATUS_HTML =
    '<p id="youneon-pi-status" data-youneon-pi-status="1" style="' + STATUS_STYLE + '">Pi SDK: …</p>';

  function isLoginTarget(t) {
    if (!t) return false;
    if (t.nodeType === 3) t = t.parentNode;
    if (!t || !t.closest) return false;
    return !!(
      t.closest(".youneon-static-login") ||
      t.closest("#youneon-static-login") ||
      t.closest("[data-youneon-login-host]") ||
      t.closest("[data-youneon-signin]") ||
      t.closest(".youneon-signin-btn")
    );
  }
  function onLoginHit(ev) {
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
    el.style.webkitTapHighlightColor = "rgba(168,85,247,0.5)";
    el.style.caretColor = "transparent";
    try { el.setAttribute("unselectable", "on"); } catch (u) { console.log("[Pi] error: " + errMsg(u)); }
  }
  function restoreSigninControls() {
    if (window.__YOUNEON_RESTORING_SIGNIN__) return;
    window.__YOUNEON_RESTORING_SIGNIN__ = true;
    try {
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
    var authCalled = false;
    function doAuth() {
      if (authCalled) return;
      authCalled = true;
      callAuthenticate();
    }
    try {
      if (P.init) {
        console.log("[Pi] init start");
        var r = P.init({ version: "2.0", sandbox: true });
        if (r && typeof r.then === "function") {
          r.then(function () { console.log("[Pi] init success"); doAuth(); }, function (e) { console.log("[Pi] error: " + errMsg(e)); doAuth(); });
        } else { console.log("[Pi] init success"); doAuth(); }
      } else { doAuth(); }
    } catch (e) { console.log("[Pi] error: " + errMsg(e)); doAuth(); }
    setTimeout(function () { doAuth(); }, 500);
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
