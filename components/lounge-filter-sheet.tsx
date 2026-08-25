"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { CountryLabel } from "@/components/country-flag";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  LOUNGE_LANGUAGES,
  type LoungeFilters,
  type LoungeGenderFilter,
} from "@/lib/lounge-service";

interface LoungeFilterSheetProps {
  draft: LoungeFilters;
  onChange: (next: LoungeFilters) => void;
  onSave: () => void;
  onClose: () => void;
}

function GenderArt({ kind }: { kind: LoungeGenderFilter }) {
  if (kind === "all") {
    return (
      <svg viewBox="0 0 80 72" className="h-[58px] w-[70px]" aria-hidden="true">
        <circle cx="28" cy="20" r="10" fill="#f9a8d4" />
        <path d="M12 62c1-16 8-24 16-24s15 8 16 24" fill="#e879f9" />
        <circle cx="54" cy="18" r="10" fill="#c4b5fd" />
        <path d="M38 62c2-17 9-26 16-26s15 9 16 26" fill="#a78bfa" />
      </svg>
    );
  }
  if (kind === "female") {
    return (
      <svg viewBox="0 0 80 72" className="h-[58px] w-[58px]" aria-hidden="true">
        <path
          d="M40 8c8 0 14 6 14 14 0 2-.4 4-1 6 4 1 7 4 8 8-6-1-12 0-16 3-4-3-10-4-16-3 1-4 4-7 8-8-.6-2-1-4-1-6 0-8 6-14 14-14z"
          fill="#f9a8d4"
        />
        <circle cx="40" cy="24" r="9" fill="#fbcfe8" />
        <path d="M18 66c2-18 10-28 22-28s20 10 22 28" fill="#e879f9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 72" className="h-[58px] w-[58px]" aria-hidden="true">
      <circle cx="40" cy="20" r="10" fill="#ddd6fe" />
      <path d="M22 66c2-18 8-28 18-28s16 10 18 28" fill="#a78bfa" />
    </svg>
  );
}

export function LoungeFilterSheet({
  draft,
  onChange,
  onSave,
  onClose,
}: LoungeFilterSheetProps) {
  const [picker, setPicker] = useState<null | "country" | "language">(null);
  const [query, setQuery] = useState("");

  const countryRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = ["All", ...COUNTRY_OPTIONS];
    if (!q) return all;
    return all.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const languageRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = ["All", ...LOUNGE_LANGUAGES];
    if (!q) return all;
    return all.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const openPicker = (kind: "country" | "language") => {
    setQuery("");
    setPicker(kind);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/55 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border-t border-[#a855f7]/35 px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-2 text-[#f5f0ff] shadow-[0_-16px_40px_rgba(88,28,135,0.4)]"
        style={{ background: "linear-gradient(180deg, #160c22 0%, #0b0614 100%)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Filter"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#c084fc]/35" />

        {picker ? (
          <>
            <div className="flex h-12 items-center gap-1">
              <button
                type="button"
                onClick={() => setPicker(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#b9a8c9] transition active:scale-95"
                aria-label="Back to filters"
              >
                <ChevronLeft size={22} />
              </button>
              <h3 className="text-[20px] font-bold tracking-tight text-white">
                {picker === "country" ? "Preferred Country" : "Preferred Language"}
              </h3>
            </div>
            <div className="relative mt-2">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b9a8c9]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-11 w-full rounded-full border border-[#a855f7]/28 bg-[#07040f] pl-10 pr-4 text-[14px] text-[#f5f0ff] outline-none placeholder:text-[#8b8098] focus:border-[#c084fc] focus:shadow-[0_0_12px_rgba(168,85,247,0.35)]"
              />
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-2">
              {(picker === "country" ? countryRows : languageRows).map((value) => {
                const selected =
                  picker === "country" ? draft.country === value : draft.language === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onChange(
                        picker === "country"
                          ? { ...draft, country: value }
                          : { ...draft, language: value }
                      );
                      setPicker(null);
                    }}
                    className="flex h-12 w-full items-center justify-between border-b border-[#a855f7]/18 text-left"
                  >
                    <span className={`flex min-w-0 items-center text-[15px] ${selected ? "font-semibold text-white" : "text-[#b9a8c9]"}`}>
                      {picker === "country" && value !== "All" ? (
                        <CountryLabel country={value} size={18} />
                      ) : (
                        value
                      )}
                    </span>
                    {selected ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff4ec8] shadow-[0_0_10px_rgba(255,78,200,0.7)]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[26px] font-bold tracking-tight text-white">Filter</h3>

            <p className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#a78bfa]">
              Preferred Gender
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "female", label: "Female" },
                  { id: "male", label: "Male" },
                ] as const
              ).map((opt) => {
                const selected = draft.gender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...draft, gender: opt.id })}
                    className={`flex h-[118px] flex-col items-center justify-center rounded-2xl border transition ${
                      selected
                        ? "border-[#c084fc] bg-[#a855f7]/16 text-white shadow-[0_0_16px_rgba(168,85,247,0.28)]"
                        : "border-[#a855f7]/22 bg-[#0c0616]/85 text-[#b9a8c9]"
                    }`}
                  >
                    <GenderArt kind={opt.id} />
                    <span
                      className={`mt-1 text-[14px] font-semibold ${
                        selected ? "text-white" : "text-[#b9a8c9]"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => openPicker("country")}
              className="mt-2 flex h-14 w-full items-center justify-between border-b border-[#a855f7]/18"
            >
              <span className="text-[15px] text-[#b9a8c9]">Preferred Country</span>
              <span className="flex min-w-0 items-center gap-1 text-[15px] font-semibold text-white">
                {draft.country !== "All" ? (
                  <CountryLabel country={draft.country} size={18} />
                ) : (
                  draft.country
                )}
                <ChevronRight size={18} className="text-[#8b8098]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => openPicker("language")}
              className="flex h-14 w-full items-center justify-between border-b border-[#a855f7]/18"
            >
              <span className="text-[15px] text-[#b9a8c9]">Preferred Language</span>
              <span className="flex items-center gap-1 text-[15px] font-semibold text-white">
                {draft.language}
                <ChevronRight size={18} className="text-[#8b8098]" />
              </span>
            </button>

            <div className="flex min-h-14 items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">Around My Age</p>
                <p className="mt-0.5 text-[12px] text-[#b9a8c9]">Show users around my age</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.aroundMyAge}
                aria-label="Around my age"
                onClick={() => onChange({ ...draft, aroundMyAge: !draft.aroundMyAge })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  draft.aroundMyAge
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#ff2bd6] shadow-[0_0_12px_rgba(255,43,214,0.35)]"
                    : "bg-white/12"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition ${
                    draft.aroundMyAge ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={onSave}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ff2bd6] text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(192,38,211,0.32),0_0_18px_rgba(255,78,200,0.28)]"
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}
