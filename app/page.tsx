import { StaticPiLogin } from "@/components/static-pi-login";
import { YouNeonApp } from "@/components/youneon-app";

export default function HomePage() {
  return (
    <>
      <StaticPiLogin overlayId="youneon-static-login-page" buttonId="youneon-signin-btn-page" />
      <YouNeonApp />
    </>
  );
}
