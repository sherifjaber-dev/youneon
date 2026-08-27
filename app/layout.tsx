import type React from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { AppProviders } from "@/components/app-providers";
import { StaticPiLogin } from "@/components/static-pi-login";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const CRITICAL_CSS =
  "html{color-scheme:dark}" +
  "html,body,#__next,#youneon-app-tree{background:#070010 !important;background-color:#070010 !important;color:#fff !important;margin:0;min-height:100%;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
  "#youneon-static-login,.youneon-static-login,[data-youneon-login-host]{background:#070010 !important;background-color:#070010 !important;color:#fff !important}" +
  "html.youneon-signed-in,html.youneon-signed-in body,html.youneon-signed-in #__next,html.youneon-signed-in #youneon-app-tree{background:#05050d !important;background-color:#05050d !important;color:#1f1f23 !important}" +
  "html.youneon-legal{color-scheme:light}" +
  "html.youneon-legal,html.youneon-legal body,html.youneon-legal #__next,html.youneon-legal #youneon-app-tree{background:#F6F4F8 !important;background-color:#F6F4F8 !important;color:#1f1f23 !important}" +
  "@keyframes youneonLivePulse{0%,100%{opacity:1}50%{opacity:.4}}" +
  ".youneon-live-dot{animation:youneonLivePulse 1.4s ease-in-out infinite}" +
  "#youneon-static-login,.youneon-static-login,#youneon-static-login *,.youneon-static-login *{user-select:none !important;-webkit-user-select:none !important;-moz-user-select:none !important;-ms-user-select:none !important;-webkit-touch-callout:none !important;caret-color:transparent !important}" +
  "#youneon-static-login,.youneon-static-login{background:#070010;pointer-events:auto !important;z-index:2147483647 !important;position:fixed !important;top:0;right:0;bottom:0;left:0;cursor:default !important;touch-action:manipulation !important;-webkit-tap-highlight-color:transparent !important}" +
  "#youneon-static-login h1,.youneon-static-login h1,#youneon-static-login p,.youneon-static-login p,.youneon-welcome-card svg,.youneon-welcome-card img,.youneon-welcome-hero,.youneon-welcome-wordmark,.youneon-welcome-wordmark-wrap{pointer-events:none !important;cursor:default !important}" +
  ".youneon-signin-wrap{pointer-events:auto !important;position:relative !important;z-index:10 !important}" +
  ".youneon-welcome-wordmark-wrap,.youneon-welcome-wordmark{background:transparent !important}" +
  ".youneon-welcome-wordmark{display:block;width:min(80vw,280px);max-width:280px;height:auto;mix-blend-mode:screen;-webkit-mix-blend-mode:screen}" +
  ".youneon-welcome-footer{position:relative !important;left:auto !important;right:auto !important;top:auto !important;bottom:auto !important;z-index:auto !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:flex-start !important;width:100%;margin:12px 0 0 !important;gap:10px !important;flex-shrink:0 !important;transform:none !important}" +
  ".youneon-welcome-hint{position:relative !important;margin:0 !important;flex-shrink:0 !important}" +
  ".youneon-welcome-legal,.youneon-welcome-legal a{pointer-events:auto !important;cursor:pointer !important}" +
  ".youneon-welcome-legal{position:relative !important;left:auto !important;right:auto !important;top:auto !important;bottom:auto !important;inset:auto !important;z-index:auto !important;display:flex !important;align-items:center !important;justify-content:center !important;gap:6px !important;margin:0 !important;flex-shrink:0 !important;transform:none !important}" +
  "#youneon-signin-btn,.youneon-signin-btn,button[data-youneon-signin],input[data-youneon-signin]{pointer-events:auto !important;position:relative !important;z-index:2147483647 !important;cursor:pointer !important;touch-action:manipulation !important;-webkit-tap-highlight-color:rgba(194,24,117,0.5) !important}" +
  "#youneon-app-tree{pointer-events:none;position:relative;z-index:0}" +
  "html.youneon-signed-in #youneon-static-login,html.youneon-signed-in .youneon-static-login,html.youneon-signed-in [data-youneon-login-host],html.youneon-signed-in [data-youneon-login-hidden='1'],html.youneon-legal #youneon-static-login,html.youneon-legal .youneon-static-login,html.youneon-legal [data-youneon-login-host],html.youneon-legal [data-youneon-login-hidden='1']{display:none !important;visibility:hidden !important;pointer-events:none !important;z-index:0 !important}" +
  "html.youneon-signed-in #youneon-app-tree,html.youneon-legal #youneon-app-tree{pointer-events:auto !important;z-index:1}";

/**
 * Vanilla ES5 boot script. No async/await, no arrow functions, no template
 * literals in the output — old Pi App Studio webviews throw on those.
 * Never loads sdk.minepi.com if App Studio / Pi Browser already injected window.Pi,
 * and never on pinet.com (that URL hangs the ecosystem iframe). Remote SDK load is
 * timed out at 3s. Pi.init is official only: { version: "2.0", sandbox: true }.
 * Classic Pi.authenticate(scopesArray, cb) runs FIRST so Studio can hook it.
 * Authenticate is raced against 12s so a hanging stub Pi on pinet.com Chrome
 * cannot leave Sign in stuck on Signing in... If auth later succeeds, hide overlay.
 */
const PI_BOOT_SCRIPT =
  "(function youneonPiEarly() {" +
  "try { window.__YOUNEON_PI_CLIENT_ID__ = " +
  JSON.stringify(PI_NETWORK_CONFIG.CLIENT_ID || "") +
  "; } catch (cid) {}" +
  "function errMsg(e) {" +
  "if (!e) return 'unknown';" +
  "if (typeof e === 'string') return e;" +
  "if (e.message) return e.message;" +
  "try { return JSON.stringify(e); } catch (x) { return String(e); }" +
  "}" +
  "function piInitOptions() {" +
  "return { version: '2.0', sandbox: true };" +
  "}" +
  "var PI_WAIT_MS = 3000;" +
  "var PI_AUTH_HANG_MS = 12000;" +
  "function onPinetHost() {" +
  "try { var h = String((location && location.hostname) || ''); return h.indexOf('pinet.com') !== -1; } catch (e) { return false; }" +
  "}" +
  "function safePiInit(P, onOk) {" +
  "if (!P || !P.init) { if (onOk) onOk(); return; }" +
  "console.log('[Pi] init start');" +
  "var done = false;" +
  "function finish(ok) { if (done) return; done = true; if (ok) console.log('[Pi] init success'); if (onOk) onOk(); }" +
  "try {" +
  "var r = P.init(piInitOptions());" +
  "if (r && typeof r.then === 'function') {" +
  "r.then(function () { finish(true); }, function (e) { console.log('[Pi] error: ' + errMsg(e)); finish(false); });" +
  "} else { finish(true); }" +
  "} catch (e) { console.log('[Pi] error: ' + errMsg(e)); finish(false); }" +
  "try { setTimeout(function () { finish(false); }, PI_WAIT_MS); } catch (t) { finish(false); }" +
  "}" +
  "function findPi() {" +
  "var found = null;" +
  "try { if (window.Pi) found = window.Pi; } catch (w) {}" +
  "if (!found) { try { if (window.parent && window.parent.Pi) found = window.parent.Pi; } catch (p) {} }" +
  "if (!found) { try { if (window.top && window.top.Pi) found = window.top.Pi; } catch (t) {} }" +
  "if (found && !window.Pi) { try { window.Pi = found; } catch (cp) { console.log('[Pi] error: ' + errMsg(cp)); } }" +
  "try { return window.Pi || found; } catch (r) { return found; }" +
  "}" +
  "function renderStatus() {" +
  "var nodes = document.querySelectorAll('[data-youneon-pi-status], #youneon-pi-status');" +
  "if (!nodes.length) return;" +
  "var P = findPi();" +
  "var last = window.__YOUNEON_PI_LAST__ || '';" +
  "var text = 'Pi SDK: ' + (P ? 'yes' : 'no') + (last ? '  ·  ' + last : '');" +
  "for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;" +
  "}" +
  "function setLast(text) { window.__YOUNEON_PI_LAST__ = text; renderStatus(); }" +
  "function showAuthMsg(text) {" +
  "var nodes = document.querySelectorAll('[data-youneon-signin-msg]');" +
  "for (var mi = 0; mi < nodes.length; mi++) { nodes[mi].textContent = text || ''; try { nodes[mi].style.display = text ? 'block' : 'none'; } catch (ds) {} }" +
  "}" +
  "function failAuthText(e) {" +
  "var s = errMsg(e);" +
  "if (/cancel/i.test(s)) return 'Sign-in was cancelled. Tap Sign in with Pi to try again.';" +
  "if (/no window\\.Pi|missing|unavailable|PI_SDK|timed out|timeout/i.test(s)) return 'Open this app in Pi Browser to sign in';" +
  "return s || 'Could not sign in with Pi. Please try again.';" +
  "}" +
  "function setSigninBusy(busy) {" +
  "var label = busy ? 'Signing in...' : 'Sign in with Pi';" +
  "var btns = document.querySelectorAll('button.youneon-signin-btn, button[data-youneon-signin], #youneon-signin-btn');" +
  "for (var bi = 0; bi < btns.length; bi++) {" +
  "var b = btns[bi];" +
  "try { b.removeAttribute('disabled'); b.disabled = false; } catch (db) {}" +
  "var keep = b.querySelector('span');" +
  "try { b.textContent = label; if (keep) b.insertBefore(keep, b.firstChild); } catch (lb) {}" +
  "}" +
  "}" +
  "function showPiMissing() {" +
  "setLast('Last: window.Pi missing');" +
  "console.log('[Pi] error: no window.Pi');" +
  "showAuthMsg('Open this app in Pi Browser to sign in');" +
  "}" +
  "function giveUpWaitingForPi() {" +
  "if (window.__YOUNEON_PI_WAIT_DONE__) return;" +
  "window.__YOUNEON_PI_WAIT_DONE__ = true;" +
  "try { if (window.__YOUNEON_PI_POLL__) clearInterval(window.__YOUNEON_PI_POLL__); } catch (c) {}" +
  "if (!findPi()) showPiMissing();" +
  "}" +
  "function isPublicLegalPath() {" +
  "try { var p = String((location && location.pathname) || ''); return p === '/privacy' || p === '/terms' || p.indexOf('/privacy/') === 0 || p.indexOf('/terms/') === 0; } catch (e) { return false; }" +
  "}" +
  "function hideOverlays() {" +
  "try { if (document.documentElement.classList) document.documentElement.classList.add('youneon-signed-in'); else document.documentElement.className += ' youneon-signed-in'; } catch (c) {}" +
  "var nodes = document.querySelectorAll('.youneon-static-login, #youneon-static-login, [data-youneon-login-host]');" +
  "for (var i = 0; i < nodes.length; i++) { nodes[i].style.display = 'none'; nodes[i].style.visibility = 'hidden'; nodes[i].style.pointerEvents = 'none'; try { nodes[i].setAttribute('data-youneon-login-hidden', '1'); } catch (a) {} }" +
  "var tree = document.getElementById('youneon-app-tree'); if (tree) tree.style.pointerEvents = 'auto';" +
  "}" +
  "function showOverlays() {" +
  "if (window.__YOUNEON_PUBLIC_PAGE__ || isPublicLegalPath()) { hideOverlays(); return; }" +
  "try { if (document.documentElement.classList) document.documentElement.classList.remove('youneon-signed-in'); else document.documentElement.className = String(document.documentElement.className || '').replace(/youneon-signed-in/g, ''); } catch (c) {}" +
  "var nodes = document.querySelectorAll('.youneon-static-login, #youneon-static-login, [data-youneon-login-host]');" +
  "for (var i = 0; i < nodes.length; i++) { nodes[i].style.display = 'flex'; nodes[i].style.visibility = 'visible'; nodes[i].style.pointerEvents = 'auto'; try { nodes[i].removeAttribute('data-youneon-login-hidden'); } catch (a) {} }" +
  "var tree = document.getElementById('youneon-app-tree'); if (tree) tree.style.pointerEvents = 'none';" +
  "}" +
  "function pickUser(result) {" +
  "var rec = result || {}; var nested = rec.user && typeof rec.user === 'object' ? rec.user : null; var source = nested || rec;" +
  "var uid = source && source.uid ? String(source.uid) : ''; var username = source && source.username ? String(source.username) : '';" +
  "var token = rec.accessToken ? String(rec.accessToken) : '';" +
  "if (!(uid || username)) { if (!token) return null; return { uid: 'pi', username: 'Pi user', accessToken: token }; }" +
  "return { uid: uid || username, username: username || uid, accessToken: token };" +
  "}" +
  "function markOk(result) {" +
  "var picked = pickUser(result); if (!picked) return;" +
  "if (window.__PI_AUTH_OK) { hideOverlays(); return; }" +
  "window.__PI_AUTH_OK = true;" +
  "try { localStorage.setItem('youneon_pi_session_lite', JSON.stringify({ uid: picked.uid, username: picked.username })); localStorage.setItem('youneon_authenticated', '1'); localStorage.setItem('youneon_pi_current_user', JSON.stringify({ uid: picked.uid, username: picked.username })); } catch (ls) {}" +
  "hideOverlays(); setLast('Last: signed in' + (picked.username ? ' as ' + picked.username : '')); console.log('[Pi] authenticate success');" +
  "try { window.dispatchEvent(new CustomEvent('youneon:pi-auth-ok', { detail: { uid: picked.uid, username: picked.username } })); } catch (ev) { try { window.dispatchEvent(new Event('youneon:pi-auth-ok')); } catch (ev2) {} }" +
  "if (picked.accessToken && picked.accessToken !== 'restored') { try { var x = new XMLHttpRequest(); x.open('POST', '/api/pi/auth', true); x.setRequestHeader('Content-Type', 'application/json'); x.withCredentials = true; x.send(JSON.stringify({ accessToken: picked.accessToken })); } catch (pe) { console.log('[Pi] error: ' + errMsg(pe)); } }" +
  "}" +
  "function clearAuth() {" +
  "window.__PI_AUTH_OK = false;" +
  "try { localStorage.removeItem('youneon_pi_session_lite'); localStorage.removeItem('youneon_authenticated'); localStorage.removeItem('youneon_pi_current_user'); } catch (c) {}" +
  "showOverlays();" +
  "try { window.dispatchEvent(new CustomEvent('youneon:pi-auth-logout')); } catch (ev) { try { window.dispatchEvent(new Event('youneon:pi-auth-logout')); } catch (ev2) {} }" +
  "}" +
  "function hangMsg() { return 'Open this app in Pi Browser to sign in'; }" +
  "function unlockAuth() { try { window.__YOUNEON_PI_AUTH_LOCK__ = false; } catch (u) {} }" +
  "function resetAuthHang() { unlockAuth(); setSigninBusy(false); showAuthMsg(hangMsg()); setLast('Last: authenticate timed out'); console.log('[Pi] error: authenticate timed out'); }" +
  "function wireAuth(p) { try { if (p && typeof p.then === 'function') { var done = false; p.then(function (r) { done = true; unlockAuth(); setSigninBusy(false); markOk(r); }, function (e) { done = true; unlockAuth(); setSigninBusy(false); console.log('[Pi] error: ' + errMsg(e)); setLast('Last: ' + errMsg(e)); showAuthMsg(failAuthText(e)); }); try { if (typeof Promise !== 'undefined' && typeof Promise.race === 'function') { Promise.race([p, new Promise(function (res, rej) { setTimeout(function () { rej({ message: 'authenticate timed out' }); }, PI_AUTH_HANG_MS); })]).then(function () {}, function () { if (!done && !window.__PI_AUTH_OK) resetAuthHang(); }); } else { setTimeout(function () { if (!done && !window.__PI_AUTH_OK) resetAuthHang(); }, PI_AUTH_HANG_MS); } } catch (tm) { try { setTimeout(function () { if (!done && !window.__PI_AUTH_OK) resetAuthHang(); }, PI_AUTH_HANG_MS); } catch (t2) {} } } else if (!p) setSigninBusy(false); } catch (w) { setSigninBusy(false); console.log('[Pi] error: ' + errMsg(w)); showAuthMsg(failAuthText(w)); } }" +
  "window.__youneonMarkPiAuthOk = markOk;" +
  "window.__youneonClearPiAuth = clearAuth;" +
  "if (isPublicLegalPath()) { window.__YOUNEON_PUBLIC_PAGE__ = true; hideOverlays(); }" +
  "if (window.__PI_AUTH_OK !== true && !window.__YOUNEON_PUBLIC_PAGE__) showOverlays();" +
  "function callAuthenticate() {" +
  "var P = findPi();" +
  "if (!P || typeof P.authenticate !== 'function') {" +
  "showPiMissing();" +
  "if (!window.__YOUNEON_PI_DELAY_AUTH__) {" +
  "window.__YOUNEON_PI_DELAY_AUTH__ = true;" +
  "try { setTimeout(function () { window.__YOUNEON_PI_DELAY_AUTH__ = false; var Q = findPi(); if (Q && typeof Q.authenticate === 'function') callAuthenticate(); }, 800); } catch (d) {}" +
  "}" +
  "return;" +
  "}" +
  "if (window.__YOUNEON_PI_AUTH_LOCK__) { setSigninBusy(true); return window.__YOUNEON_PI_AUTH_PROMISE__; }" +
  "window.__YOUNEON_PI_AUTH_LOCK__ = true;" +
  "try { setTimeout(function () { window.__YOUNEON_PI_AUTH_LOCK__ = false; }, 2500); } catch (st) {}" +
  "try { if (P.init) P.init(piInitOptions()); } catch (ie) { console.log('[Pi] error: ' + errMsg(ie)); }" +
  "setSigninBusy(true);" +
  "showAuthMsg('');" +
  "console.log('[Pi] authenticate start');" +
  "setLast('Last: authenticate called');" +
  "var promise = null;" +
  "try { promise = P.authenticate(['username','payments'], function (payment) { try { var x = new XMLHttpRequest(); x.open('POST', '/api/pi/payment/incomplete', true); x.setRequestHeader('Content-Type', 'application/json'); x.withCredentials = true; x.send(JSON.stringify({ paymentId: payment && payment.identifier, payment: payment })); } catch (ie) { console.log('[Pi] error: ' + errMsg(ie)); } }); wireAuth(promise); } catch (classicErr) { console.log('[Pi] error: ' + errMsg(classicErr)); setLast('Last: ' + errMsg(classicErr)); }" +
  "if (!promise) { try { promise = P.authenticate({ scopes: ['username','payments'] }); wireAuth(promise); } catch (objectErr) { console.log('[Pi] error: ' + errMsg(objectErr)); setSigninBusy(false); showAuthMsg(failAuthText(objectErr)); } }" +
  "if (!promise) { setSigninBusy(false); showAuthMsg('Could not start Pi sign-in. Try again.'); }" +
  "window.__YOUNEON_PI_AUTH_PROMISE__ = promise;" +
  "return promise;" +
  "}" +
  "window.__youneonFindPi = findPi;" +
  "window.__youneonCallPiAuthenticate = callAuthenticate;" +
  "window.__youneonPiAuth = function () {" +
  "var P = findPi();" +
  "if (!P) { showPiMissing(); return; }" +
  "try { if (P.init) P.init(piInitOptions()); } catch (ie) { console.log('[Pi] error: ' + errMsg(ie)); }" +
  "return callAuthenticate();" +
  "};" +
  "function runInitThenAuth() {" +
  "if (window.__YOUNEON_PI_AUTO_AUTH_STARTED__) return;" +
  "window.__YOUNEON_PI_AUTO_AUTH_STARTED__ = true;" +
  "var P = findPi();" +
  "if (!P) { setLast('Last: window.Pi missing'); console.log('[Pi] error: no window.Pi'); return; }" +
  "if (!window.__YOUNEON_PI_SDK_LOGGED__) { window.__YOUNEON_PI_SDK_LOGGED__ = true; console.log('[Pi] SDK loaded'); }" +
  "try { safePiInit(P); } catch (e) { console.log('[Pi] error: ' + errMsg(e)); }" +
  "}" +
  "renderStatus();" +
  "if (!window.__YOUNEON_PI_POLL_STARTED__) {" +
  "window.__YOUNEON_PI_POLL_STARTED__ = true;" +
  "var waited = 0;" +
  "var piPoll = setInterval(function () {" +
  "waited += 200; renderStatus();" +
  "if (findPi()) { clearInterval(piPoll); window.__YOUNEON_PI_WAIT_DONE__ = true; runInitThenAuth(); return; }" +
  "if (waited >= PI_WAIT_MS) { clearInterval(piPoll); giveUpWaitingForPi(); }" +
  "}, 200);" +
  "window.__YOUNEON_PI_POLL__ = piPoll;" +
  "if (findPi()) { clearInterval(piPoll); window.__YOUNEON_PI_WAIT_DONE__ = true; runInitThenAuth(); }" +
  "else { try { setTimeout(giveUpWaitingForPi, PI_WAIT_MS); } catch (wt) { giveUpWaitingForPi(); } }" +
  "}" +
  "if (!window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__) {" +
  "window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__ = true;" +
  "function abortSdkScript(s, watch, reason) {" +
  "try { clearInterval(watch); } catch (cw) {}" +
  "try { s.onload = null; s.onerror = null; } catch (h) {}" +
  "try { s.src = 'about:blank'; } catch (b) {}" +
  "try { if (s.parentNode) s.parentNode.removeChild(s); } catch (r) {}" +
  "console.log('[Pi] error: ' + reason); setLast('Last: ' + reason); showPiMissing();" +
  "}" +
  "function loadOfficialSdkIfMissing() {" +
  "if (findPi() || onPinetHost()) return;" +
  "if (document.querySelector('script[data-youneon-pi-sdk]')) return;" +
  "var nativePi = null; try { nativePi = findPi(); } catch (pe) { console.log('[Pi] error: ' + errMsg(pe)); }" +
  "if (nativePi) return;" +
  "var finished = false;" +
  "var watch = setInterval(function () { try { if (window.Pi && !nativePi) nativePi = window.Pi; } catch (we) {} }, 40);" +
  "var s = document.createElement('script');" +
  "s.async = true;" +
  "s.setAttribute('data-youneon-pi-sdk', '1');" +
  "s.onload = function () { if (finished) return; finished = true; try { clearInterval(watch); } catch (cw) {} if (nativePi) { try { window.Pi = nativePi; } catch (re) { console.log('[Pi] error: ' + errMsg(re)); } } renderStatus(); if (findPi()) runInitThenAuth(); else showPiMissing(); };" +
  "s.onerror = function () { if (finished) return; finished = true; abortSdkScript(s, watch, 'failed to load sdk.minepi.com'); };" +
  "try { setTimeout(function () { if (finished) return; finished = true; abortSdkScript(s, watch, 'SDK script timeout'); }, PI_WAIT_MS); } catch (st) {}" +
  "s.src = 'https://sdk.minepi.com/pi-sdk.js';" +
  "(document.head || document.documentElement).appendChild(s);" +
  "}" +
  "function tryLoadSdk() { if (findPi()) { renderStatus(); return; } if (onPinetHost()) return; loadOfficialSdkIfMissing(); }" +
  "function afterPaint() { try { setTimeout(tryLoadSdk, 0); } catch (e) { tryLoadSdk(); } }" +
  "if (document.readyState === 'complete') afterPaint();" +
  "else { try { window.addEventListener('load', afterPaint); } catch (le) { setTimeout(tryLoadSdk, PI_WAIT_MS); } }" +
  "}" +
  "})();";

const PUBLIC_LEGAL_PATH_SCRIPT =
  "(function(){" +
  "try{" +
  "var p=String((location&&location.pathname)||'');" +
  "if(p==='/privacy'||p==='/terms'||p.indexOf('/privacy/')===0||p.indexOf('/terms/')===0){" +
  "window.__YOUNEON_PUBLIC_PAGE__=true;" +
  "var d=document.documentElement;" +
  "if(d.classList){d.classList.add('youneon-legal');d.classList.add('youneon-signed-in');}" +
  "else{d.className+=' youneon-legal youneon-signed-in';}" +
  "}" +
  "}catch(e){}" +
  "})();";

const DEFER_FONTS_SCRIPT =
  "(function(){" +
  "function load(){" +
  "try{var h=String((location&&location.hostname)||'');if(h.indexOf('pinet.com')!==-1)return;}catch(pe){}" +
  "if(document.querySelector('link[data-youneon-pacifico]'))return;" +
  "var l=document.createElement('link');" +
  "l.rel='stylesheet';" +
  "l.href='https://fonts.googleapis.com/css2?family=Pacifico&display=swap';" +
  "l.setAttribute('data-youneon-pacifico','1');" +
  "l.media='print';" +
  "l.onload=function(){l.media='all'};" +
  "(document.head||document.documentElement).appendChild(l);" +
  "}" +
  "function later(){try{setTimeout(load,0);}catch(e){load();}}" +
  "if(document.readyState==='complete')later();" +
  "else{try{window.addEventListener('load',later);}catch(e){later();}}" +
  "})();";

function isPublicLegalPath(pathname: string) {
  const p = pathname.split("?")[0] || "";
  return p === "/privacy" || p === "/terms" || p.startsWith("/privacy/") || p.startsWith("/terms/");
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "YouNeon - Random Video Chat",
  description: "Random live video chat with people from all over the world. Meet new friends, have fun conversations and experience the unexpected in a cool neon universe.",
  generator: "v0.app",
  applicationName: "YouNeon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YouNeon"
  },
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.json",
  keywords: ["video chat", "random chat", "social", "meet people", "live streaming"],
  authors: [{ name: "YouNeon Team" }],
  alternates: {
    canonical: APP_URL
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "YouNeon - Random Video Chat",
    description: "Connect with random people from around the world instantly. Meet new friends and have fun conversations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YouNeon"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "YouNeon",
    description: "Random video chat with people worldwide"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070010"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const isPublicLegal = isPublicLegalPath(headerList.get("x-youneon-pathname") || "");
  const pageBg = isPublicLegal ? "#F6F4F8" : "#070010";
  const pageColor = isPublicLegal ? "#1f1f23" : "#ffffff";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={isPublicLegal ? "youneon-legal youneon-signed-in" : undefined}
      style={{
        background: pageBg,
        backgroundColor: pageBg,
        colorScheme: isPublicLegal ? "light" : "dark",
        minHeight: "100%",
        height: "100%",
      }}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YouNeon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={isPublicLegal ? "#F6F4F8" : "#070010"} />
        <meta name="color-scheme" content={isPublicLegal ? "light" : "dark"} />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PUBLIC_LEGAL_PATH_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        style={{
          background: pageBg,
          backgroundColor: pageBg,
          minHeight: "100%",
          height: "100%",
          margin: 0,
          color: pageColor,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {isPublicLegal ? null : <StaticPiLogin overlayId="youneon-static-login" />}
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <script type="text/javascript" src="/pi-boot.js?v=signin-auth-3"></script>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: DEFER_FONTS_SCRIPT }} />
        <div
          id="youneon-app-tree"
          style={{
            background: pageBg,
            backgroundColor: pageBg,
            position: "relative",
            zIndex: 0,
            isolation: "isolate",
            pointerEvents: isPublicLegal ? "auto" : "none",
            minHeight: "100%",
          }}
        >
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
