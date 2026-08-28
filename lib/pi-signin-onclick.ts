/**
 * Native HTML event-handler bodies. React strips string `on*` props on JSX,
 * so these must be written as real attributes via raw HTML (dangerouslySetInnerHTML)
 * or element.setAttribute. Uses only single quotes so they are safe inside
 * double-quoted attributes. App Studio detects the Pi.authenticate CALL.
 *
 * No preventDefault/stopPropagation — Pi needs the user gesture.
 * Classic Pi.authenticate(scopesArray, cb) is invoked FIRST (Studio wraps that).
 *
 * onclick is the real auth gesture. ontouchstart only schedules a fallback if
 * click never fires — it must not set AUTH_LOCK or the click is a silent no-op.
 *
 * On pinet.com Chrome, a stub window.Pi.authenticate often never settles.
 * Race it against a 12s timer: restore Sign in with Pi and show the Pi Browser
 * hint. If the real promise later succeeds, still hide the overlay.
 */
export const PI_AUTH_HANG_MS = 12000;

export const PI_SIGNIN_ONCLICK =
  "try{" +
  "var P=null;" +
  "try{P=window.Pi;}catch(w){}" +
  "if(!P){try{P=window.parent.Pi;}catch(p){}}" +
  "if(!P){try{P=window.top.Pi;}catch(t){}}" +
  "if(P&&!window.Pi){try{window.Pi=P;}catch(cp){}}" +
  "function errMsg(e){if(!e)return 'unknown';if(typeof e==='string')return e;if(e.message)return e.message;try{return JSON.stringify(e);}catch(x){return String(e);}}" +
  "function showMsg(text){try{var ms=document.querySelectorAll('[data-youneon-signin-msg]');for(var i=0;i<ms.length;i++){ms[i].textContent=text||'';try{ms[i].style.display=text?'block':'none';}catch(ds){}}}catch(sm){}}" +
  "function failText(e){var s=errMsg(e);if(/cancel/i.test(s))return 'Sign-in was cancelled. Tap Sign in with Pi to try again.';if(/no window\\.Pi|missing|unavailable|PI_SDK|timed out|timeout/i.test(s))return 'Open this app in Pi Browser to sign in';return s||'Could not sign in with Pi. Please try again.';}" +
  "function setBtnBusy(busy){try{var label=busy?'Signing in...':'Sign in with Pi';var btns=document.querySelectorAll('button.youneon-signin-btn,button[data-youneon-signin],#youneon-signin-btn');for(var i=0;i<btns.length;i++){var b=btns[i];try{b.removeAttribute('disabled');b.disabled=false;}catch(db){}var keep=b.querySelector('span');try{b.textContent=label;if(keep)b.insertBefore(keep,b.firstChild);}catch(lb){}}}catch(sb){}}" +
  "function hangMsg(){return 'Open this app in Pi Browser to sign in';}" +
  "function unlockAuth(){try{window.__YOUNEON_PI_AUTH_LOCK__=false;}catch(u){}}" +
  "function resetHang(){unlockAuth();setBtnBusy(false);showMsg(hangMsg());try{window.__YOUNEON_PI_LAST__='Last: authenticate timed out';}catch(sl){}console.log('[Pi] error: authenticate timed out');}" +
  "function armHangTimer(st){function fire(){try{if(st.done||window.__PI_AUTH_OK)return;resetHang();}catch(f){resetHang();}}try{setTimeout(fire," +
  String(PI_AUTH_HANG_MS) +
  ");}catch(t){fire();}}" +
  "function wireAuth(p){try{if(p&&typeof p.then==='function'){var st={done:false};p.then(function(r){st.done=true;unlockAuth();setBtnBusy(false);try{if(typeof window.__youneonMarkPiAuthOk==='function')window.__youneonMarkPiAuthOk(r);}catch(m){}},function(e){st.done=true;unlockAuth();setBtnBusy(false);console.log('[Pi] error: '+errMsg(e));showMsg(failText(e));try{window.__YOUNEON_PI_LAST__='Last: '+errMsg(e);}catch(sl){}});try{if(typeof Promise!=='undefined'&&typeof Promise.race==='function'){Promise.race([p,new Promise(function(res,rej){setTimeout(function(){rej({message:'authenticate timed out'});}," +
  String(PI_AUTH_HANG_MS) +
  ");})]).then(function(){},function(){if(!st.done&&!window.__PI_AUTH_OK)resetHang();});}else{armHangTimer(st);}}catch(tm){armHangTimer(st);}}else if(!p){setBtnBusy(false);}}catch(w2){setBtnBusy(false);console.log('[Pi] error: '+errMsg(w2));showMsg(failText(w2));}}" +
    "function sandboxFlag(){try{var h=String((location&&location.hostname)||'');return h.indexOf('sandbox.minepi.com')!==-1||h==='localhost'||h==='127.0.0.1';}catch(e){return false;}}" +
    "function runAuth(sdk){if(!sdk||typeof sdk.authenticate!=='function'){showMsg('Open this app in Pi Browser to sign in');try{window.__YOUNEON_PI_LAST__='Last: window.Pi missing';}catch(sl){}console.log('[Pi] error: no window.Pi');return;}try{if(sdk.init)sdk.init({version:'2.0',sandbox:sandboxFlag()});}catch(ie){console.log('[Pi] error: '+errMsg(ie));}setBtnBusy(true);showMsg('');console.log('[Pi] authenticate start');try{window.__YOUNEON_PI_LAST__='Last: authenticate called';}catch(ls){}var pr=null;try{pr=sdk.authenticate(['username','payments'],function(payment){return new Promise(function(done){try{var x=new XMLHttpRequest();x.open('POST','/api/pi/payment/incomplete',true);x.setRequestHeader('Content-Type','application/json');x.setRequestHeader('X-Pi-Sandbox',sandboxFlag()?'true':'false');x.withCredentials=true;x.onload=function(){done();};x.onerror=function(){done();};x.send(JSON.stringify({paymentId:payment&&payment.identifier,txid:payment&&payment.transaction&&payment.transaction.txid,payment:payment,sandbox:sandboxFlag()}));}catch(ie){console.log('[Pi] error: '+ie);done();}});});wireAuth(pr);}catch(c){console.log('[Pi] error: '+errMsg(c));try{window.__YOUNEON_PI_LAST__='Last: '+errMsg(c);}catch(cl){}}if(!pr){try{pr=sdk.authenticate({scopes:['username','payments']});wireAuth(pr);}catch(o){console.log('[Pi] error: '+errMsg(o));setBtnBusy(false);showMsg(failText(o));}}if(!pr){setBtnBusy(false);showMsg('Could not start Pi sign-in. Try again.');}}" +
  "var evType='click';try{evType=String((typeof event!=='undefined'&&event&&event.type)||'click');}catch(et){evType='click';}" +
  "if(evType==='touchstart'){try{window.__YOUNEON_PI_TOUCH_AT__=(new Date()).getTime();}catch(ta){}try{setTimeout(function(){var clickAt=window.__YOUNEON_PI_CLICK_AT__||0;var touchAt=window.__YOUNEON_PI_TOUCH_AT__||0;if(!clickAt||clickAt<touchAt){var Q=P;if(!Q){try{Q=window.Pi;}catch(w){}}runAuth(Q);}},400);}catch(st){runAuth(P);}}" +
  "else{try{window.__YOUNEON_PI_CLICK_AT__=(new Date()).getTime();}catch(ca){}if(!P||typeof P.authenticate!=='function'){showMsg('Open this app in Pi Browser to sign in');try{window.__YOUNEON_PI_LAST__='Last: window.Pi missing';}catch(sl2){}console.log('[Pi] error: no window.Pi');if(!window.__YOUNEON_PI_DELAY_AUTH__){window.__YOUNEON_PI_DELAY_AUTH__=1;try{setTimeout(function(){var Q=null;try{Q=window.Pi;}catch(w){}if(!Q){try{Q=window.parent.Pi;}catch(p){}}if(!Q){try{Q=window.top.Pi;}catch(t){}}if(Q&&typeof Q.authenticate==='function')runAuth(Q);else window.__YOUNEON_PI_DELAY_AUTH__=0;},800);}catch(d){}}}else{runAuth(P);}}" +
  "try{var last=window.__YOUNEON_PI_LAST__||'';var sts=document.querySelectorAll('[data-youneon-pi-status],#youneon-pi-status');for(var si=0;si<sts.length;si++){sts[si].textContent='Pi SDK: '+(P?'yes':'no')+(last?'  ·  '+last:'');}}catch(su){console.log('[Pi] error: '+su);}" +
  "}catch(e){console.log('[Pi] error: '+e);try{var ms2=document.querySelectorAll('[data-youneon-signin-msg]');for(var j=0;j<ms2.length;j++){ms2[j].textContent='Could not sign in with Pi. Please try again.';try{ms2[j].style.display='block';}catch(ds2){}}}catch(sm2){}}";

/**
 * Native onclick starts Pi.authenticate. ontouchstart only for webviews that
 * never fire click. Do not bind pointerdown — that consumed the gesture and
 * locked out the real click. Never preventDefault on pointerdown.
 */
export const PI_SIGNIN_NATIVE_ATTRS =
  'onclick="' +
  PI_SIGNIN_ONCLICK +
  '" ontouchstart="' +
  PI_SIGNIN_ONCLICK +
  '" onselectstart="return false" unselectable="on"';

export const PI_SIGNIN_CONTROL_STYLE =
  "height:37px;min-height:37px;padding:0 16px;font-size:14px;font-weight:600;line-height:1;border:0;border-radius:12px;color:#FFFFFF;background-color:#C21875;background-image:none;cursor:pointer;width:100%;max-width:100%;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto !important;position:relative !important;z-index:2147483647 !important;touch-action:manipulation;-webkit-tap-highlight-color:rgba(194,24,117,0.35);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;caret-color:transparent;-webkit-appearance:none;appearance:none;box-shadow:none;letter-spacing:0.01em";

export const PI_SIGNIN_WRAP_STYLE =
  "pointer-events:auto !important;position:relative !important;z-index:10 !important;user-select:none;-webkit-user-select:none;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center";

export const PI_SIGNIN_STATUS_STYLE =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none;-webkit-user-select:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif";

function piNetworkMarkHtml(): string {
  return '<span aria-hidden="true" style="font-size:16px;line-height:1;font-weight:600;pointer-events:none">&#960;</span>';
}

export function escapePiSigninAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const SIGNIN_BUTTON_SEL =
  "button.youneon-signin-btn, button[data-youneon-signin], #youneon-signin-btn";

function armSigninButton(el: HTMLElement): void {
  el.removeAttribute("disabled");
  el.removeAttribute("aria-disabled");
  el.removeAttribute("onpointerdown");
  el.removeAttribute("onmousedown");
  try {
    (el as HTMLButtonElement).disabled = false;
  } catch {
    /* ignore */
  }
  el.style.setProperty("pointer-events", "auto", "important");
  el.style.setProperty("position", "relative", "important");
  el.style.setProperty("z-index", "2147483647", "important");
}

export function applyPiSigninNativeAttrs(el: Element | null): void {
  if (!el) return;
  armSigninButton(el as HTMLElement);
  el.setAttribute("onclick", PI_SIGNIN_ONCLICK);
  el.setAttribute("ontouchstart", PI_SIGNIN_ONCLICK);
  el.setAttribute("onselectstart", "return false");
  el.removeAttribute("onpointerdown");
  el.removeAttribute("onmousedown");
  el.setAttribute("unselectable", "on");
}

/** Overlay / chrome must not start Pi auth — only the Sign in with Pi button. */
export function stripPiSigninNativeAttrs(el: Element | null): void {
  if (!el) return;
  el.removeAttribute("onclick");
  el.removeAttribute("onpointerdown");
  el.removeAttribute("onmousedown");
  el.removeAttribute("ontouchstart");
  if (el.tagName !== "BUTTON") el.removeAttribute("data-youneon-signin");
}

/** Bind native Pi.authenticate handlers to the button inside a host; never the overlay. */
export function bindPiSigninButtonIn(host: Element | null): HTMLElement | null {
  if (!host) return null;
  const self =
    "matches" in host && host.matches(SIGNIN_BUTTON_SEL) ? (host as HTMLElement) : null;
  const btn = self || host.querySelector<HTMLElement>(SIGNIN_BUTTON_SEL);
  if (!self) stripPiSigninNativeAttrs(host);
  applyPiSigninNativeAttrs(btn);
  return btn;
}

export function piSigninButtonHtml(id: string): string {
  return (
    '<button id="' +
    escapePiSigninAttr(id) +
    '" type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' +
    PI_SIGNIN_CONTROL_STYLE +
    '" ' +
    PI_SIGNIN_NATIVE_ATTRS +
    ">" +
    piNetworkMarkHtml() +
    "Sign in with Pi</button>"
  );
}

export function piSigninStatusHtml(): string {
  return (
    '<p id="youneon-pi-status" data-youneon-pi-status="1" style="' +
    PI_SIGNIN_STATUS_STYLE +
    '">Pi SDK: …</p>'
  );
}

export function piSigninErrorHtml(): string {
  return (
    '<div class="youneon-signin-msg" data-youneon-signin-msg="1" style="display:none;margin:10px 0 0;font-size:13px;line-height:1.45;font-weight:500;color:#fde68a;text-align:center;pointer-events:none;user-select:none;-webkit-user-select:none"></div>'
  );
}

export function piSigninControlsHtml(buttonId: string): string {
  return piSigninButtonHtml(buttonId) + piSigninErrorHtml();
}
