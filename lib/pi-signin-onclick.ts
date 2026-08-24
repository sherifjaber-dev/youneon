/**
 * Native HTML event-handler bodies. React strips string `on*` props on JSX,
 * so these must be written as real attributes via raw HTML (dangerouslySetInnerHTML)
 * or element.setAttribute. Uses only single quotes so they are safe inside
 * double-quoted attributes. App Studio detects the Pi.authenticate CALL.
 */
export const PI_SIGNIN_ONCLICK =
  "try{var ev=typeof event!=='undefined'?event:window.event;if(ev&&ev.preventDefault)ev.preventDefault();}catch(pe){}" +
  "try{console.log('[Pi] authenticate start');var P=window.Pi;if(!P){console.log('[Pi] error: no window.Pi');}else{if(P.init){try{P.init({version:'2.0',sandbox:true});}catch(i){}}try{P.authenticate({scopes:['username']});}catch(a){try{P.authenticate(['username'],function(){});}catch(e2){console.log('[Pi] error: '+e2);}}}}catch(e){console.log('[Pi] error: '+e)}";

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

export function piSigninInputHtml(id: string): string {
  return (
    '<input id="' +
    escapePiSigninAttr(id) +
    '" type="button" value="Sign in with Pi Network" class="youneon-signin-btn" data-youneon-signin="1" style="' +
    PI_SIGNIN_CONTROL_STYLE +
    ';margin-top:12px" ' +
    PI_SIGNIN_NATIVE_ATTRS +
    " />"
  );
}

export function piSigninControlsHtml(buttonId: string): string {
  return piSigninButtonHtml(buttonId) + piSigninInputHtml(buttonId + "-input");
}
