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
  var piPoll = setInterval(function () {
    if (!window.Pi) return;
    clearInterval(piPoll);
    runInitThenAuth();
  }, 200);
  if (window.Pi) { clearInterval(piPoll); runInitThenAuth(); }
})();
