"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { CategoryIcon, InterestIcon } from "@/components/icons/interest-icons";
import {
  ALL_INTEREST_TAGS,
  INTEREST_CATEGORIES,
  MAX_INTERESTS,
} from "@/lib/profile-catalog";

export function ProfileInterestsPage({
  selected,
  onChange,
  onBack,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(INTEREST_CATEGORIES[0]?.id || "relationships");

  const activeCategory = INTEREST_CATEGORIES.find((c) => c.id === categoryId) || INTEREST_CATEGORIES[0];
  const q = query.trim().toLowerCase();

  const tags = useMemo(() => {
    if (q) {
      return ALL_INTEREST_TAGS.filter((tag) => tag.toLowerCase().includes(q));
    }
    return activeCategory?.tags || [];
  }, [q, activeCategory]);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
      return;
    }
    if (selected.length >= MAX_INTERESTS) return;
    onChange([...selected, tag]);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#0f0117]">
      <header className="flex min-h-12 shrink-0 items-center gap-1 border-b border-white/8 px-2 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/85 hover:bg-white/10"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="flex-1 text-[17px] font-semibold text-white">Interests</h2>
        <span className="mr-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-pink-200">
          {selected.length} Selected
        </span>
      </header>

      <div className="px-4 pb-2 pt-3">
        <label className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-3.5">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
          />
        </label>
      </div>

      {!q && (
        <div className="shrink-0 overflow-x-auto border-b border-white/8 px-2">
          <div className="flex min-w-max gap-1">
            {INTEREST_CATEGORIES.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`relative flex h-12 items-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-medium transition-colors ${
                    active ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <CategoryIcon id={cat.id} size={15} />
                  {cat.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selected.length >= MAX_INTERESTS && (
          <p className="mb-3 text-[12px] text-white/45">You can pick up to {MAX_INTERESTS} interests.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const on = selected.includes(tag);
            const blocked = !on && selected.length >= MAX_INTERESTS;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                disabled={blocked}
                className={`yn-interest-chip inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium transition-all ${
                  on
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                    : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]"
                } disabled:opacity-40`}
              >
                <InterestIcon tag={tag} size={15} />
                {tag}
              </button>
            );
          })}
          {tags.length === 0 && (
            <p className="py-8 text-center text-[13px] text-white/40">No interests match that search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
