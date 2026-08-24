"use client";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
  piAvailable?: boolean;
  onGuest?: () => void;
}

export function LoginScreen({
  onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
  onGuest,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  return (
    <div
      className="min-h-screen bg-cover flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 70%",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/65 pointer-events-none" />
      <div className="relative z-10 text-center max-w-md w-full">
        <div className="h-[580px]" />
        <p className="text-2xl text-white/95 font-light tracking-wide mb-6">
          Meet the Pi Network – Live video chat with real people
        </p>

        {showPiBrowserHint && (
          <p className="text-amber-200 text-sm mb-4 leading-relaxed">
            Pi authentication only works inside the Pi Browser. Open YouNeon in Pi Browser, then tap
            Log in with Pi Network.
          </p>
        )}

        {showError && (
          <p className="text-red-200 text-sm mb-4 leading-relaxed">{errorMessage}</p>
        )}

        <button
          type="button"
          onClick={() => {
            console.log("[Pi] Sign in button clicked");
            onLogin();
          }}
          className="relative z-20 mx-auto px-10 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/60 hover:shadow-pink-500/80 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
        >
          {isLoggingIn ? "Signing in..." : "Log in with Pi Network"}
        </button>

        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
            disabled={isLoggingIn}
            className="relative z-20 mt-4 block mx-auto text-sm text-white/60 underline underline-offset-4 hover:text-white/90 disabled:opacity-50"
          >
            Continue as guest (demo)
          </button>
        )}

        <p className="text-white/70 text-sm mt-10">Secure • Instant • Powered by Pi Network</p>
      </div>
    </div>
  );
}
