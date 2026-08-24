"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LanguageProvider } from "@/contexts/language-context";
import { PiAuthProvider } from "@/contexts/pi-auth-context";

/**
 * Isolates client providers so a throw cannot wipe the SSR login overlay
 * (that overlay lives outside this tree in layout).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ErrorBoundary>
          <PiAuthProvider>{children}</PiAuthProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
