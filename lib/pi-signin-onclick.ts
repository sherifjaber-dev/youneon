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
  "try{var P=null;try{P=window.Pi;}catch(w){}if(!P){try{P=window.parent.Pi;}catch(p){}}if(!P){try{P=window.top.Pi;}catch(t){}}if(P&&!window.Pi){try{window.Pi=P;}catch(cp){}}function wireAuth(p){try{if(p&&typeof p.then==='function')p.then(function(r){try{if(typeof window.__youneonMarkPiAuthOk==='function')window.__youneonMarkPiAuthOk(r);}catch(m){}},function(e){console.log('[Pi] error: '+e);});}catch(w2){}}var last='';if(!P||typeof P.authenticate!=='function'){last='Last: window.Pi missing';console.log('[Pi] error: no window.Pi');}else{console.log('[Pi] authenticate start');last='Last: authenticate called';try{wireAuth(P.authenticate(['username','payments'],function(payment){try{var x=new XMLHttpRequest();x.open('POST','/api/pi/payment/incomplete',true);x.setRequestHeader('Content-Type','application/json');x.withCredentials=true;x.send(JSON.stringify({paymentId:payment&&payment.identifier,payment:payment}));}catch(ie){console.log('[Pi] error: '+ie);}}));}catch(c){console.log('[Pi] error: '+c);last='Last: '+c;}try{wireAuth(P.authenticate({scopes:['username','payments']}));}catch(o){console.log('[Pi] error: '+o);}}try{window.__YOUNEON_PI_LAST__=last;var sts=document.querySelectorAll('[data-youneon-pi-status],#youneon-pi-status');for(var si=0;si<sts.length;si++){sts[si].textContent='Pi SDK: '+(P?'yes':'no')+'  ·  '+last;}}catch(su){console.log('[Pi] error: '+su);}if(typeof window.__youneonPiAuth==='function'){try{window.__youneonPiAuth();}catch(au){console.log('[Pi] error: '+au);}}}catch(e){console.log('[Pi] error: '+e)}";

/** pointerdown + mousedown + touchstart + click — some Pi webviews never fire click. */
export const PI_SIGNIN_NATIVE_ATTRS =
  'onclick="' +
  PI_SIGNIN_ONCLICK +
  '" onpointerdown="' +
  PI_SIGNIN_ONCLICK +
  '" onmousedown="' +
  PI_SIGNIN_ONCLICK +
  '" ontouchstart="' +
  PI_SIGNIN_ONCLICK +
  '" onselectstart="return false" unselectable="on"';

export const PI_SIGNIN_CONTROL_STYLE =
  "padding:16px 32px;font-size:1.125rem;font-weight:700;border:0;border-radius:16px;color:#ffffff;background-color:#a855f7;background-image:linear-gradient(to right,#a855f7,#ec4899);cursor:pointer;width:100%;max-width:320px;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto;position:relative;z-index:2147483647;touch-action:manipulation;-webkit-tap-highlight-color:rgba(168,85,247,0.5);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;caret-color:transparent;-webkit-appearance:none;appearance:none";

export const PI_SIGNIN_STATUS_STYLE =
  "font-size:0.75rem;color:rgba(233,213,255,0.9);margin:16px 0 0;max-width:320px;pointer-events:none;user-select:none;-webkit-user-select:none;line-height:1.45;word-break:break-word;font-family:system-ui,-apple-system,Segoe UI,sans-serif";

export function escapePiSigninAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function applyPiSigninNativeAttrs(el: Element | null): void {
  if (!el) return;
  el.setAttribute("onclick", PI_SIGNIN_ONCLICK);
  el.setAttribute("onpointerdown", PI_SIGNIN_ONCLICK);
  el.setAttribute("onmousedown", PI_SIGNIN_ONCLICK);
  el.setAttribute("ontouchstart", PI_SIGNIN_ONCLICK);
  el.setAttribute("onselectstart", "return false");
  el.setAttribute("unselectable", "on");
}

export function piSigninButtonHtml(id: string): string {
  return (
    '<button id="' +
    escapePiSigninAttr(id) +
    '" type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' +
    PI_SIGNIN_CONTROL_STYLE +
    '" ' +
    PI_SIGNIN_NATIVE_ATTRS +
    ">Sign in with Pi Network</button>"
  );
}

export function piSigninStatusHtml(): string {
  return (
    '<p id="youneon-pi-status" data-youneon-pi-status="1" style="' +
    PI_SIGNIN_STATUS_STYLE +
    '">Pi SDK: …</p>'
  );
}

export function piSigninControlsHtml(buttonId: string): string {
  return piSigninButtonHtml(buttonId);
}
