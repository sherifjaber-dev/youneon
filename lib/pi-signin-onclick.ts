/**
 * Native HTML onclick body. React strips string event handlers, so this must
 * be written onto the button via raw HTML (dangerouslySetInnerHTML).
 * Uses only single quotes so it is safe inside a double-quoted attribute.
 * App Studio detects the Pi.authenticate CALL, not login success.
 */
export const PI_SIGNIN_ONCLICK =
  "try{console.log('[Pi] authenticate start');var P=window.Pi;if(!P){console.log('[Pi] error: no window.Pi');return;}if(P.init){try{P.init({version:'2.0',sandbox:true});}catch(i){}}try{P.authenticate({scopes:['username']});}catch(a){try{P.authenticate(['username'],function(){});}catch(e2){console.log('[Pi] error: '+e2);}}}catch(e){console.log('[Pi] error: '+e)}";
