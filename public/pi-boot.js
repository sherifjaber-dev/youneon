(function youneonPiBoot() {
  function errMsg(e) {
    if (!e) return "unknown";
    if (typeof e === "string") return e;
    if (e.message) return e.message;
    try { return JSON.stringify(e); } catch (x) { return String(e); }
  }
  function logSdkLoaded() {
    if (window.__YOUNEON_PI_SDK_LOGGED__ || !window.Pi) return;
    window.__YOUNEON_PI_SDK_LOGGED__ = true;
    console.log("[Pi] SDK loaded");
  }
  function callAuthenticate() {
    console.log("[Pi] authenticate start");
    var P = window.Pi;
    if (!P) { console.log("[Pi] error: no window.Pi"); return; }
    try { return P.authenticate({ scopes: ["username"] }); }
    catch (objectFormError) {
      try { return P.authenticate(["username"], function () {}); }
      catch (arrayFormError) { console.log("[Pi] error: " + errMsg(arrayFormError)); }
    }
  }
  window.__youneonCallPiAuthenticate = callAuthenticate;
  window.__youneonPiAuth = function () {
    var P = window.Pi;
    if (!P) { console.log("[Pi] error: no window.Pi"); return; }
    try { if (P.init) P.init({ version: "2.0", sandbox: true }); } catch (ie) {}
    return callAuthenticate();
  };

  var AUTH_JS =
    "try{var ev=typeof event!=='undefined'?event:window.event;if(ev&&ev.preventDefault)ev.preventDefault();}catch(pe){}" +
    "try{console.log('[Pi] authenticate start');var P=window.Pi;if(!P){console.log('[Pi] error: no window.Pi');}else{if(P.init){try{P.init({version:'2.0',sandbox:true});}catch(i){}}try{P.authenticate({scopes:['username']});}catch(a){try{P.authenticate(['username'],function(){});}catch(e2){console.log('[Pi] error: '+e2);}}}}catch(e){console.log('[Pi] error: '+e)}";
  var CTRL_STYLE =
    "padding:16px 32px;font-size:1.125rem;font-weight:700;border:0;border-radius:16px;color:#ffffff;background-color:#a855f7;background-image:linear-gradient(to right,#a855f7,#ec4899);cursor:pointer;width:100%;max-width:320px;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto;position:relative;z-index:2147483647;touch-action:manipulation;-webkit-tap-highlight-color:rgba(168,85,247,0.5);user-select:none;-webkit-user-select:none;caret-color:transparent";
  var NATIVE_ATTRS =
    'onclick="' + AUTH_JS + '" onpointerdown="' + AUTH_JS + '" onmousedown="' + AUTH_JS + '" ontouchstart="' + AUTH_JS + '" onselectstart="return false" unselectable="on"';
  var CONTROLS_HTML =
    '<button type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' + CTRL_STYLE + '" ' + NATIVE_ATTRS + ">Sign in with Pi Network</button>" +
    '<input type="button" value="Sign in with Pi Network" class="youneon-signin-btn" data-youneon-signin="1" style="' + CTRL_STYLE + ';margin-top:12px" ' + NATIVE_ATTRS + " />";

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
    try { if (ev.preventDefault) ev.preventDefault(); } catch (x) {}
    if (typeof window.__youneonPiAuth === "function") window.__youneonPiAuth();
    else callAuthenticate();
  }
  function bindLoginHits() {
    if (window.__YOUNEON_LOGIN_HIT_BOUND__) return;
    window.__YOUNEON_LOGIN_HIT_BOUND__ = true;
    var types = ["pointerdown", "mousedown", "touchstart", "click"];
    for (var i = 0; i < types.length; i++) {
      try { document.addEventListener(types[i], onLoginHit, true); } catch (he) {}
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
    try { el.setAttribute("unselectable", "on"); } catch (u) {}
  }
  function restoreSigninControls() {
    if (window.__YOUNEON_RESTORING_SIGNIN__) return;
    window.__YOUNEON_RESTORING_SIGNIN__ = true;
    try {
      var overlays = document.querySelectorAll(".youneon-static-login, #youneon-static-login, [data-youneon-login-host]");
      for (var i = 0; i < overlays.length; i++) {
        var overlay = overlays[i];
        styleOverlay(overlay);
        var real = overlay.querySelector("button.youneon-signin-btn, input.youneon-signin-btn, button[data-youneon-signin], input[data-youneon-signin]");
        if (real) {
          var tag = (real.tagName || "").toUpperCase();
          if (tag === "BUTTON" || tag === "INPUT") continue;
        }
        var fake = overlay.querySelector("[data-youneon-signin], .youneon-signin-btn, #youneon-signin-btn");
        if (fake && fake !== overlay) {
          var tag2 = (fake.tagName || "").toUpperCase();
          if (tag2 !== "BUTTON" && tag2 !== "INPUT" && fake.parentNode) {
            var holder = document.createElement("div");
            holder.innerHTML = CONTROLS_HTML;
            fake.parentNode.replaceChild(holder, fake);
            continue;
          }
        }
        if (!overlay.querySelector("button.youneon-signin-btn, input.youneon-signin-btn")) {
          overlay.insertAdjacentHTML("beforeend", CONTROLS_HTML);
        }
      }
    } finally {
      window.__YOUNEON_RESTORING_SIGNIN__ = false;
    }
  }

  function runInitThenAuth() {
    if (window.__YOUNEON_PI_AUTO_AUTH_STARTED__) return;
    window.__YOUNEON_PI_AUTO_AUTH_STARTED__ = true;
    var P = window.Pi;
    if (!P) { console.log("[Pi] error: no window.Pi"); return; }
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
    setTimeout(function () { doAuth(); }, 1000);
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
  } catch (moe) {}
  var piPoll = setInterval(function () {
    if (!window.Pi) return;
    clearInterval(piPoll);
    runInitThenAuth();
  }, 200);
  if (window.Pi) { clearInterval(piPoll); runInitThenAuth(); }
})();
