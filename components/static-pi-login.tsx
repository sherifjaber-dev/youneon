import { escapePiSigninAttr } from "@/lib/pi-signin-onclick";
import { piWelcomeOverlayHtml } from "@/lib/pi-welcome-markup";

/**
 * Server-rendered Pi login as raw HTML. React strips string `on*` handlers on JSX
 * and can hydrate a <button> into a text-selectable div/span — so the overlay and
 * controls are injected with dangerouslySetInnerHTML and never re-rendered as JSX.
 * Only the Sign in with Pi button starts Pi.authenticate (native onclick).
 *
 * First paint stays Studio-safe: dark html/body `#070010`, native onclick on the
 * button, no preventDefault on pointerdown, scopes username + payments.
 */
export function StaticPiLogin({
  buttonId = "youneon-signin-btn",
  overlayId,
}: {
  buttonId?: string;
  overlayId?: string;
}) {
  const html = piWelcomeOverlayHtml({
    overlayId: overlayId ? escapePiSigninAttr(overlayId) : undefined,
    buttonId,
  });

  return (
    <div
      data-youneon-login-host="1"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
