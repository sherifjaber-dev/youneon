"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { REPORT_REASONS, type ReportReasonId } from "@/lib/safety";

export function CallReportSheet({
  userName,
  submitting,
  onClose,
  onSubmit,
}: {
  userName: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: { reasonId: ReportReasonId; reasonLabel: string; notes: string; alsoBlock: boolean }) => void;
}) {
  const [reasonId, setReasonId] = useState<ReportReasonId | null>(null);
  const [notes, setNotes] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);

  const selected = REPORT_REASONS.find((r) => r.id === reasonId);

  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <div className="flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-black/8 bg-yn-card text-yn-text">
        <div className="flex items-start gap-3 border-b border-black/6 px-4 py-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-yn-text">Report {userName || "this person"}</h2>
            <p className="mt-0.5 text-[12px] leading-snug text-yn-muted">
              Choose a YouNeon Guidelines reason. We save chat snippets, gift events, and the room id — not a secret video recording.
            </p>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {REPORT_REASONS.map((reason) => {
            const on = reasonId === reason.id;
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => setReasonId(reason.id)}
                className={`w-full rounded-xl px-3.5 py-3 text-left ${
                  on
                    ? "border border-pink-300 bg-gradient-to-r from-fuchsia-50 to-pink-50"
                    : "border border-black/8 bg-yn-bg"
                }`}
              >
                <span className="block text-[14px] font-semibold text-yn-text">{reason.label}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-yn-muted">{reason.hint}</span>
              </button>
            );
          })}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="Optional note (no need to repeat personal details)"
            rows={3}
            className="mt-2 w-full rounded-xl border border-black/10 bg-yn-bg px-3 py-2 text-[13px] text-yn-text outline-none placeholder:text-yn-muted"
          />
          <label className="flex min-h-11 items-center gap-2 px-1 text-[13px] text-yn-text">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="h-4 w-4 accent-pink-500"
            />
            Also block this person
          </label>
        </div>
        <div className="flex gap-2 border-t border-black/6 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-yn-bg text-[14px] font-semibold text-yn-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={() =>
              selected &&
              onSubmit({
                reasonId: selected.id,
                reasonLabel: selected.label,
                notes,
                alsoBlock,
              })
            }
            className="h-12 flex-1 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "Sending…" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
