"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SMILEY_IDS = [
  "wink",
  "smirk",
  "blush",
  "kiss",
  "devil",
  "hearts",
  "tongue",
  "pout",
  "sleepy",
  "laugh",
  "shy",
  "hot",
  "angel",
  "drool",
  "sideeye",
  "shock",
  "cool",
  "bite",
  "sparkle",
  "blowkiss",
] as const;

export type SmileyId = (typeof SMILEY_IDS)[number];

export const SMILEY_META: Record<SmileyId, { label: string }> = {
  wink: { label: "Wink" },
  smirk: { label: "Smirk" },
  blush: { label: "Blush" },
  kiss: { label: "Kiss" },
  devil: { label: "Devil" },
  hearts: { label: "Heart eyes" },
  tongue: { label: "Tongue" },
  pout: { label: "Pout" },
  sleepy: { label: "Sleepy" },
  laugh: { label: "Laugh" },
  shy: { label: "Shy" },
  hot: { label: "Hot" },
  angel: { label: "Angel" },
  drool: { label: "Drool" },
  sideeye: { label: "Side eye" },
  shock: { label: "Shock" },
  cool: { label: "Cool" },
  bite: { label: "Bite lip" },
  sparkle: { label: "Sparkle" },
  blowkiss: { label: "Blow a kiss" },
};

export function smileyToken(id: SmileyId): string {
  return `:${id}:`;
}

const TOKEN_RE = new RegExp(`:(${SMILEY_IDS.join("|")}):`, "g");

export function isSmileyId(value: string): value is SmileyId {
  return (SMILEY_IDS as readonly string[]).includes(value);
}

export type ChatTextPart =
  | { type: "text"; value: string }
  | { type: "smiley"; id: SmileyId };

export function parseSmileys(text: string): ChatTextPart[] {
  if (!text) return [];
  const parts: ChatTextPart[] = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(text))) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    const id = match[1];
    if (isSmileyId(id)) parts.push({ type: "smiley", id });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length ? parts : [{ type: "text", value: text }];
}

function Head({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-g`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="42%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24.5" r="17.4" fill={`url(#${uid}-g)`} stroke="#f0abfc" strokeWidth="1.35" />
      <ellipse cx="18" cy="17.2" rx="7.2" ry="4.1" fill="#fff" opacity="0.2" />
    </>
  );
}

function features(id: SmileyId): ReactNode {
  switch (id) {
    case "wink":
      return (
        <>
          <path d="M13.6 21.2c1.8-2 4.4-2 6.2 0" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="31.2" cy="21.2" r="1.85" fill="#2e1065" />
          <circle cx="31.7" cy="20.6" r="0.55" fill="#fff" />
          <path d="M16.5 30.2c2.4 2.8 6.2 3.6 9.8 2.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "smirk":
      return (
        <>
          <path d="M14.4 19.4c1.4-.9 2.8-.4 3.4.8" fill="none" stroke="#fce7f3" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="16.6" cy="22.4" r="1.55" fill="#2e1065" />
          <circle cx="31" cy="22.6" r="1.55" fill="#2e1065" />
          <circle cx="17" cy="21.8" r="0.45" fill="#fff" />
          <circle cx="31.4" cy="22" r="0.45" fill="#fff" />
          <path d="M18.2 30.4c3.4 1.2 7.6 1.6 11.2-.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "blush":
      return (
        <>
          <circle cx="16.8" cy="22" r="1.55" fill="#2e1065" />
          <circle cx="31.2" cy="22" r="1.55" fill="#2e1065" />
          <circle cx="17.3" cy="21.4" r="0.45" fill="#fff" />
          <circle cx="31.7" cy="21.4" r="0.45" fill="#fff" />
          <ellipse cx="15.4" cy="26.2" rx="3.4" ry="1.7" fill="#fb7185" opacity="0.85" />
          <ellipse cx="32.6" cy="26.2" rx="3.4" ry="1.7" fill="#fb7185" opacity="0.85" />
          <path d="M18.6 30.6c1.8 1.8 4.4 2.4 6.8 1.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case "kiss":
      return (
        <>
          <path d="M14.2 21.4c1.6-1.8 3.8-1.8 5.4 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M28.4 21.4c1.6-1.8 3.8-1.8 5.4 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M24 27.4c-1.4.2-2.2 1.4-1.4 2.4.6.8 1.4.6 1.4-.2 0 .8.8 1 1.4.2.8-1 0-2.2-1.4-2.4z" fill="#fb7185" />
        </>
      );
    case "devil":
      return (
        <>
          <path d="M12.2 12.4 16.6 17M35.8 12.4 31.4 17" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.2 12.4c1.8-.2 3.6 1.4 4.4 4.6M35.8 12.4c-1.8-.2-3.6 1.4-4.4 4.6" fill="#a21caf" stroke="#f472b6" strokeWidth="1.2" />
          <path d="M14.6 20.2c1.2-1.4 2.8-1.2 3.6.2" fill="none" stroke="#fce7f3" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="17.2" cy="22.8" r="1.55" fill="#2e1065" />
          <circle cx="30.8" cy="22.8" r="1.55" fill="#2e1065" />
          <path d="M17.4 31.4c2.8-1.2 6.6-.2 9.6 2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "hearts":
      return (
        <>
          <path d="M16.6 24.2c0-1.7-1.2-2.8-2.6-2.8s-2.6 1.1-2.6 2.8c0 2.6 5.2 5.4 5.2 5.4s5.2-2.8 5.2-5.4c0-1.7-1.2-2.8-2.6-2.8s-2.6 1.1-2.6 2.8z" fill="#fb7185" />
          <path d="M31.4 24.2c0-1.7-1.2-2.8-2.6-2.8s-2.6 1.1-2.6 2.8c0 2.6 5.2 5.4 5.2 5.4s5.2-2.8 5.2-5.4c0-1.7-1.2-2.8-2.6-2.8s-2.6 1.1-2.6 2.8z" fill="#fb7185" />
          <path d="M19.2 33c1.6 1.2 3.8 1.4 5.6.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case "tongue":
      return (
        <>
          <circle cx="17" cy="21.4" r="1.6" fill="#2e1065" />
          <circle cx="31" cy="21.4" r="1.6" fill="#2e1065" />
          <circle cx="17.5" cy="20.8" r="0.45" fill="#fff" />
          <path d="M16.8 28.6c.4 4.2 3.2 6.6 7.2 6.6s6.8-2.4 7.2-6.6" fill="#4c1d95" />
          <path d="M22.2 31.6c.4 3.4 1.6 5.2 2.8 5.2 1.4 0 2.2-2 2-5" fill="#f472b6" />
        </>
      );
    case "pout":
      return (
        <>
          <circle cx="17.2" cy="22.2" r="2.05" fill="#2e1065" />
          <circle cx="30.8" cy="22.2" r="2.05" fill="#2e1065" />
          <circle cx="17.8" cy="21.5" r="0.55" fill="#fff" />
          <circle cx="31.4" cy="21.5" r="0.55" fill="#fff" />
          <ellipse cx="15.6" cy="26.6" rx="3.1" ry="1.5" fill="#fb7185" opacity="0.7" />
          <ellipse cx="32.4" cy="26.6" rx="3.1" ry="1.5" fill="#fb7185" opacity="0.7" />
          <path d="M21.4 32.6c1.6-1.4 4-1.4 5.4 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "sleepy":
      return (
        <>
          <path d="M14.4 22.4c1.8-1.6 4.2-1.6 6 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M27.6 22.4c1.8-1.6 4.2-1.6 6 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19.8 30.8c1.4.8 3.4.8 4.8 0" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M34.8 13.2c1.4-1.8 3.2-2.2 4.4-1.2" fill="none" stroke="#f0abfc" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M36.4 15.6h4.2" fill="none" stroke="#f0abfc" strokeWidth="1.3" strokeLinecap="round" />
        </>
      );
    case "laugh":
      return (
        <>
          <path d="M14 21.6c1.8-2.2 4.6-2.2 6.4 0" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M27.6 21.6c1.8-2.2 4.6-2.2 6.4 0" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.6 28.2c.6 4.6 3.4 7 7.4 7s6.8-2.4 7.4-7" fill="#4c1d95" />
          <path d="M18.4 28.4c1.6 2.2 3.6 3.2 5.6 3.2s4-1 5.6-3.2" fill="#f9a8d4" />
        </>
      );
    case "shy":
      return (
        <>
          <circle cx="17.4" cy="22.6" r="1.4" fill="#2e1065" />
          <circle cx="30.6" cy="22.6" r="1.4" fill="#2e1065" />
          <ellipse cx="15.8" cy="26.4" rx="3.2" ry="1.6" fill="#fb7185" opacity="0.8" />
          <ellipse cx="32.2" cy="26.4" rx="3.2" ry="1.6" fill="#fb7185" opacity="0.8" />
          <path d="M20.4 30.8c1.2.7 2.8.7 4 0" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8.8 28.4c3.4 1.2 7.2.4 9.6-2.2 1.2 3.6-.4 7.4-3.6 8.8-3 1.4-7-1.2-8-5.2z" fill="#f0abfc" opacity="0.92" />
        </>
      );
    case "hot":
      return (
        <>
          <circle cx="17" cy="22" r="1.55" fill="#2e1065" />
          <circle cx="31" cy="22" r="1.55" fill="#2e1065" />
          <ellipse cx="15.6" cy="26.4" rx="3.3" ry="1.7" fill="#fb7185" />
          <ellipse cx="32.4" cy="26.4" rx="3.3" ry="1.7" fill="#fb7185" />
          <path d="M17.2 30.6c2.2 2.6 6.4 3 9.4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M35.6 14.8c1.4 2.2.6 4.2-.8 4.4 2 .2 3.2 2.2 1.6 4.2" fill="none" stroke="#f0abfc" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case "angel":
      return (
        <>
          <ellipse cx="24" cy="9.6" rx="9.2" ry="2.4" fill="none" stroke="#fde68a" strokeWidth="1.7" />
          <circle cx="17.2" cy="22.2" r="1.5" fill="#2e1065" />
          <circle cx="30.8" cy="22.2" r="1.5" fill="#2e1065" />
          <circle cx="17.7" cy="21.6" r="0.4" fill="#fff" />
          <path d="M18.4 30.2c1.8 2 4.6 2.4 7.2 1" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case "drool":
      return (
        <>
          <circle cx="17.2" cy="21.6" r="1.55" fill="#2e1065" />
          <circle cx="30.8" cy="21.6" r="1.55" fill="#2e1065" />
          <path d="M16.8 28.8c.8 3.8 3.2 5.6 7.2 5.6 3.4 0 6-1.6 6.8-4.6" fill="#4c1d95" />
          <path d="M29.6 32.4c.2 3.6 1.2 5.6 2.4 5.6 1.2 0 1.8-2.2 1.4-5.4" fill="#67e8f9" opacity="0.9" />
        </>
      );
    case "sideeye":
      return (
        <>
          <ellipse cx="17.4" cy="22.2" rx="3.1" ry="2.4" fill="#fff" />
          <ellipse cx="30.6" cy="22.2" rx="3.1" ry="2.4" fill="#fff" />
          <circle cx="19.2" cy="22.2" r="1.35" fill="#2e1065" />
          <circle cx="32.4" cy="22.2" r="1.35" fill="#2e1065" />
          <path d="M19.2 31.2h9.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "shock":
      return (
        <>
          <circle cx="17" cy="21.4" r="2.15" fill="#2e1065" />
          <circle cx="31" cy="21.4" r="2.15" fill="#2e1065" />
          <circle cx="17.6" cy="20.6" r="0.6" fill="#fff" />
          <circle cx="31.6" cy="20.6" r="0.6" fill="#fff" />
          <ellipse cx="24" cy="31.4" rx="3.2" ry="4.1" fill="#4c1d95" />
          <ellipse cx="24" cy="30.4" rx="1.6" ry="2" fill="#f9a8d4" />
        </>
      );
    case "cool":
      return (
        <>
          <path d="M12.4 21.2h9.2c.8 2.6-.2 4.8-2.6 5.4-2.6.6-5.2-.8-6.6-3.2z" fill="#2e1065" stroke="#f0abfc" strokeWidth="1.1" />
          <path d="M26.4 21.2h9.2c-1.4 2.4-4 3.8-6.6 3.2-2.4-.6-3.4-2.8-2.6-5.4z" fill="#2e1065" stroke="#f0abfc" strokeWidth="1.1" />
          <path d="M21.6 21.8h4.8" fill="none" stroke="#f0abfc" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18.6 31.4c1.8 1.4 4.4 1.6 6.8.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case "bite":
      return (
        <>
          <circle cx="17" cy="21.8" r="1.55" fill="#2e1065" />
          <circle cx="31" cy="21.8" r="1.55" fill="#2e1065" />
          <ellipse cx="15.8" cy="26" rx="3.1" ry="1.5" fill="#fb7185" opacity="0.8" />
          <path d="M18.8 30.2c1.4 1 3.2 1.4 5 .6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M24.6 29.4c1.6.2 3.4 1.4 3.6 3.2-.8.2-2-.4-2.8-1.4-.2 1.2-1.2 2-2.2 1.8.2-1.2.4-2.8 1.4-3.6z" fill="#f9a8d4" />
        </>
      );
    case "sparkle":
      return (
        <>
          <circle cx="17.2" cy="22" r="1.5" fill="#2e1065" />
          <circle cx="30.8" cy="22" r="1.5" fill="#2e1065" />
          <path d="M17.8 30.4c2.2 2.6 5.8 3.2 8.8 1.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M37.4 13.2 38.2 16l2.8.6-2.8.8-.8 2.8-.8-2.8-2.8-.8 2.8-.6z" fill="#f0abfc" />
          <path d="M10.2 15.2v2.2M9.1 16.3h2.2" stroke="#f9a8d4" strokeWidth="1.3" strokeLinecap="round" />
        </>
      );
    case "blowkiss":
      return (
        <>
          <path d="M14.4 21.6c1.5-1.6 3.6-1.6 5.1 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M28.6 21.6c1.5-1.6 3.6-1.6 5.1 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M24 27.2c-1.2.2-1.8 1.2-1.1 2 .5.6 1.1.5 1.1-.2 0 .7.6.8 1.1.2.7-.8.1-1.8-1.1-2z" fill="#fb7185" />
          <path d="M32.8 16.4c0-1.5-1-2.4-2.2-2.4s-2.2 1-2.2 2.4c0 2.2 4.4 4.6 4.4 4.6s4.4-2.4 4.4-4.6c0-1.5-1-2.4-2.2-2.4s-2.2.9-2.2 2.4z" fill="#fb7185" />
        </>
      );
    default:
      return null;
  }
}

export function YouNeonSmiley({
  id,
  size = 28,
  className,
  title,
}: {
  id: SmileyId;
  size?: number;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("yn-smiley", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Head uid={uid} />
      {features(id)}
    </svg>
  );
}

export function ChatSmileyText({ text, className }: { text: string; className?: string }) {
  const parts = parseSmileys(text);
  const onlySmileys = parts.every(
    (part) => part.type === "smiley" || (part.type === "text" && !part.value.trim())
  );
  const size = onlySmileys ? 40 : 22;

  return (
    <p className={cn("break-words whitespace-pre-wrap", onlySmileys && "flex flex-wrap items-center gap-1", className)}>
      {parts.map((part, i) =>
        part.type === "smiley" ? (
          <YouNeonSmiley key={`${part.id}-${i}`} id={part.id} size={size} title={SMILEY_META[part.id].label} />
        ) : part.value ? (
          <span key={`t-${i}`}>{part.value}</span>
        ) : null
      )}
    </p>
  );
}

export function YouNeonSmileyPicker({
  onSelect,
}: {
  onSelect: (id: SmileyId) => void;
}) {
  return (
    <div className="yn-smiley-picker" data-testid="chat-smiley-picker">
      <p className="yn-smiley-picker-title">YouNeon</p>
      <div className="yn-smiley-grid">
        {SMILEY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="yn-smiley-cell"
            onClick={() => onSelect(id)}
            aria-label={SMILEY_META[id].label}
            data-testid={`smiley-${id}`}
          >
            <YouNeonSmiley id={id} size={32} />
          </button>
        ))}
      </div>
    </div>
  );
}
