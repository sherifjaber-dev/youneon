"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalHeader() {
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-10 border-b border-black/6 bg-[color:var(--yn-bg)]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[42rem] items-center gap-1 px-2">
        <button
          type="button"
          onClick={goBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-yn-text hover:bg-black/5"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <Link
          href="/"
          className="flex-1 text-[16px] font-semibold tracking-[-0.03em] text-yn-text"
        >
          YouNeon
        </Link>
        <Link
          href="/"
          className="px-3 text-[14px] font-semibold text-yn-accent"
        >
          Home
        </Link>
      </div>
    </header>
  );
}
