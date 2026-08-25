import type { ReactNode } from "react";
import { LegalHeader } from "@/components/legal-header";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-yn-bg text-yn-text">
      <LegalHeader />
      <main className="mx-auto max-w-[42rem] px-5 py-10 pb-20">{children}</main>
    </div>
  );
}
