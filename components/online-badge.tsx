"use client";

export function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full border border-green-400">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-xs font-semibold text-green-700">Online</span>
    </div>
  );
}
