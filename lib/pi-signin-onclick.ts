/**
 * Native HTML event-handler bodies. React strips string `on*` props on JSX,
 * so these must be written as real attributes via raw HTML (dangerouslySetInnerHTML)
 * or element.setAttribute. Uses only single quotes so they are safe inside
 * double-quoted attributes. App Studio detects the Pi.authenticate CALL.
 *
 * No preventDefault/stopPropagation — Pi needs the user gesture.
 * Classic Pi.authenticate(scopesArray, cb) is invoked FIRST (Studio wraps that).
 */
export const PI_SIGNIN_ONCLICK =
  "try{var P=null;try{P=window.Pi;}catch(w){}if(!P){try{P=window.parent.Pi;}catch(p){}}if(!P){try{P=window.top.Pi;}catch(t){}}if(P&&!window.Pi){try{window.Pi=P;}catch(cp){}}function showNeed(){try{var ms=document.querySelectorAll('[data-youneon-signin-msg]');for(var i=0;i<ms.length;i++){ms[i].textContent='Open in Pi Browser';try{ms[i].style.display='block';}catch(ds){}}}catch(sm){}try{window.__YOUNEON_PI_LAST__='Last: window.Pi missing';}catch(sl){}console.log('[Pi] error: no window.Pi');}function wireAuth(p){try{if(p&&typeof p.then==='function')p.then(function(r){try{if(typeof window.__youneonMarkPiAuthOk==='function')window.__youneonMarkPiAuthOk(r);}catch(m){}},function(e){console.log('[Pi] error: '+e);});}catch(w2){}}var last='';if(!P||typeof P.authenticate!=='function'){last='Last: window.Pi missing';showNeed();}else{if(P.init){try{P.init({version:'2.0',sandbox:true});}catch(ie){console.log('[Pi] error: '+ie);}}if(!window.__YOUNEON_PI_AUTH_LOCK__){window.__YOUNEON_PI_AUTH_LOCK__=true;try{setTimeout(function(){window.__YOUNEON_PI_AUTH_LOCK__=false;},2500);}catch(st){}console.log('[Pi] authenticate start');last='Last: authenticate called';var pr=null;try{pr=P.authenticate(['username','payments'],function(payment){try{var x=new XMLHttpRequest();x.open('POST','/api/pi/payment/incomplete',true);x.setRequestHeader('Content-Type','application/json');x.withCredentials=true;x.send(JSON.stringify({paymentId:payment&&payment.identifier,payment:payment}));}catch(ie){console.log('[Pi] error: '+ie);}});wireAuth(pr);}catch(c){console.log('[Pi] error: '+c);last='Last: '+c;}if(!pr){try{pr=P.authenticate({scopes:['username','payments']});wireAuth(pr);}catch(o){console.log('[Pi] error: '+o);}}}}try{window.__YOUNEON_PI_LAST__=last;var sts=document.querySelectorAll('[data-youneon-pi-status],#youneon-pi-status');for(var si=0;si<sts.length;si++){sts[si].textContent='Pi SDK: '+(P?'yes':'no')+(last?'  ·  '+last:'');}}catch(su){console.log('[Pi] error: '+su);}if(typeof window.__youneonPiAuth==='function'){try{window.__youneonPiAuth();}catch(au){console.log('[Pi] error: '+au);}}}catch(e){console.log('[Pi] error: '+e)}";

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
    '<div class="youneon-signin-msg" data-youneon-signin-msg="1" style="display:none;margin:10px 0 0;font-size:12px;line-height:1.45;font-weight:500;color:#fde68a;text-align:center;pointer-events:none;user-select:none;-webkit-user-select:none"></div>'
  );
}

export function piSigninControlsHtml(buttonId: string): string {
  return piSigninButtonHtml(buttonId);
}
