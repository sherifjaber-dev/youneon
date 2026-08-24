"use client";

import { Suspense } from "react";
import HomePage from "./home-page";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-purple-950 via-black to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
