"use client";

import { type ReactNode, type SVGProps } from "react";
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

const INK = "#6b21a8";
const PINK = "#ec4899";
const LILAC = "#f0abfc";
const PURPLE = "#a855f7";

const line: SVGProps<SVGPathElement> = {
  fill: "none",
  stroke: INK,
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Face() {
  return (
    <circle
      cx="12"
      cy="13.15"
      r="7.95"
      fill="#fce7f3"
      stroke="#7e22ce"
      strokeWidth="1.8"
    />
  );
}

function DotEyes({ y = 11.85 }: { y?: number }) {
  return (
    <>
      <circle cx="9.05" cy={y} r="1.5" fill={INK} />
      <circle cx="14.95" cy={y} r="1.5" fill={INK} />
    </>
  );
}

function ClosedEyes({ y = 12 }: { y?: number }) {
  return (
    <>
      <path d={`M7.15 ${y}c1.15-1.45 3.05-1.45 4.2 0`} {...line} strokeWidth={1.85} />
      <path d={`M12.65 ${y}c1.15-1.45 3.05-1.45 4.2 0`} {...line} strokeWidth={1.85} />
    </>
  );
}

function Blush() {
  return (
    <>
      <ellipse cx="7.85" cy="14.35" rx="1.85" ry="1.05" fill={PINK} opacity="0.72" />
      <ellipse cx="16.15" cy="14.35" rx="1.85" ry="1.05" fill={PINK} opacity="0.72" />
    </>
  );
}

function MiniHeart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-1.05c-.65-1.1-2.2-.2-1.55 1.05C-.75.75 0 1.85 0 1.85S.75.75 1.55 0C2.2-1.25.65-2.15 0-1.05z"
      fill={PINK}
    />
  );
}

function Spark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-2.05.5-.5 2.05 0 .5.5 0 2.05-.5.5-2.05 0-.5-.5z"
      fill={PURPLE}
    />
  );
}

function features(id: SmileyId): ReactNode {
  switch (id) {
    case "wink":
      return (
        <>
          <path d="M7.1 12c1.2-1.5 3.15-1.5 4.35 0" {...line} />
          <circle cx="15" cy="11.85" r="1.45" fill={INK} />
          <path d="M8.2 16.55c1.7 2.05 4.5 2.45 7.05 1.1" {...line} />
        </>
      );
    case "smirk":
      return (
        <>
          <path d="M7.15 10.15c1.05-.7 2.15-.2 2.55.85" {...line} strokeWidth={1.45} />
          <DotEyes />
          <path d="M8.35 16.7c2.35 1.25 5.55 1.15 7.55-.7" {...line} />
        </>
      );
    case "blush":
      return (
        <>
          <DotEyes />
          <Blush />
          <path d="M9.2 16.7c1.15 1.2 2.85 1.35 4.15.35" {...line} />
        </>
      );
    case "kiss":
      return (
        <>
          <ClosedEyes />
          <ellipse
            cx="12"
            cy="16.55"
            rx="1.45"
            ry="1.85"
            fill={PINK}
            stroke={INK}
            strokeWidth="1.25"
          />
        </>
      );
    case "devil":
      return (
        <>
          <path
            d="M6.35 7.15 4.55 2.85 8.7 6.7z"
            fill={PINK}
            stroke={INK}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M17.65 7.15 19.45 2.85 15.3 6.7z"
            fill={PINK}
            stroke={INK}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path d="M7.2 10.35c1.05-.85 2.25-.35 2.55.7" {...line} strokeWidth={1.4} />
          <path d="M14.25 11.05c.35-1.05 1.5-1.55 2.55-.7" {...line} strokeWidth={1.4} />
          <DotEyes y={12.15} />
          <path d="M8.2 16.85c2.2-1.15 5.5-.35 7.35 1.55" {...line} />
        </>
      );
    case "hearts":
      return (
        <>
          <MiniHeart x={9.05} y={12.05} s={1.7} />
          <MiniHeart x={14.95} y={12.05} s={1.7} />
          <path d="M8.55 16.85c1.55 1.55 3.85 1.65 5.65.35" {...line} />
        </>
      );
    case "tongue":
      return (
        <>
          <DotEyes y={11.55} />
          <path
            d="M8.15 15.35c.35 3.35 2.45 5.15 3.85 5.15s3.5-1.8 3.85-5.15z"
            fill={INK}
          />
          <path
            d="M10.85 17.35c.25 2.55 1.1 3.85 2.15 3.85 1.15 0 1.85-1.4 1.7-3.7"
            fill={PINK}
          />
        </>
      );
    case "pout":
      return (
        <>
          <circle cx="9.05" cy="11.85" r="1.55" fill={INK} />
          <circle cx="14.95" cy="11.85" r="1.55" fill={INK} />
          <Blush />
          <path d="M9.35 17.45c1.4-1.35 3.9-1.35 5.3 0" {...line} />
        </>
      );
    case "sleepy":
      return (
        <>
          <ClosedEyes y={12.15} />
          <path d="M10.2 16.85c1.15.7 2.55.7 3.7 0" {...line} strokeWidth={1.5} />
          <path d="M18.15 3.35 20.35 3.1 18.35 5.55h2.15" {...line} stroke={PURPLE} strokeWidth={1.45} />
          <path d="M16.55 6.05 18.05 5.9 16.7 7.55h1.45" {...line} stroke={LILAC} strokeWidth={1.25} />
        </>
      );
    case "laugh":
      return (
        <>
          <path d="M7.1 12.05c1.2-1.65 3.2-1.65 4.4 0" {...line} />
          <path d="M12.5 12.05c1.2-1.65 3.2-1.65 4.4 0" {...line} />
          <path
            d="M8.05 15.25c.4 3.55 2.5 5.45 3.95 5.45s3.55-1.9 3.95-5.45z"
            fill={INK}
          />
          <path d="M9.35 15.4c1.15 1.7 2.5 2.45 3.65 2.45s2.5-.75 3.65-2.45" fill={LILAC} />
        </>
      );
    case "shy":
      return (
        <>
          <DotEyes y={12.05} />
          <Blush />
          <path d="M10.35 16.55c.85.55 1.95.55 2.8 0" {...line} strokeWidth={1.45} />
          <path
            d="M4.15 14.55c2.15 1.05 4.35.25 5.45-1.55.55 2.15-.55 4.35-2.45 5.15-1.95.8-4.25-1-4.85-2.85z"
            fill={LILAC}
            stroke={INK}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        </>
      );
    case "hot":
      return (
        <>
          <DotEyes />
          <Blush />
          <path d="M8.25 16.65c1.7 2 4.55 2.25 6.75.45" {...line} />
          <path
            d="M18.35 4.15c1.05 1.65.4 3.15-.7 3.25 1.55.15 2.4 1.7 1.15 3.2"
            {...line}
            stroke={PINK}
            strokeWidth={1.55}
          />
        </>
      );
    case "angel":
      return (
        <>
          <ellipse
            cx="12"
            cy="3.35"
            rx="5.35"
            ry="1.35"
            fill="none"
            stroke="#ca8a04"
            strokeWidth="1.7"
          />
          <DotEyes />
          <path d="M8.55 16.55c1.55 1.85 3.9 2.1 5.85.7" {...line} />
        </>
      );
    case "drool":
      return (
        <>
          <DotEyes y={11.6} />
          <path
            d="M8.2 15.45c.55 3.05 2.4 4.55 3.8 4.55 2.55 0 4.35-1.45 4.85-3.85"
            fill={INK}
          />
          <path
            d="M15.35 18.35c.15 2.55.9 3.95 1.75 3.95.9 0 1.3-1.55 1.05-3.85"
            fill="#67e8f9"
            stroke={INK}
            strokeWidth="1.1"
          />
        </>
      );
    case "sideeye":
      return (
        <>
          <ellipse cx="9.05" cy="12" rx="2.35" ry="1.85" fill="#fff" stroke={INK} strokeWidth="1.25" />
          <ellipse cx="15.15" cy="12" rx="2.35" ry="1.85" fill="#fff" stroke={INK} strokeWidth="1.25" />
          <circle cx="10.25" cy="12" r="1.15" fill={INK} />
          <circle cx="16.35" cy="12" r="1.15" fill={INK} />
          <path d="M8.85 16.85h6.3" {...line} />
        </>
      );
    case "shock":
      return (
        <>
          <circle cx="9.05" cy="11.55" r="1.75" fill={INK} />
          <circle cx="14.95" cy="11.55" r="1.75" fill={INK} />
          <ellipse cx="12" cy="17.05" rx="2.05" ry="2.55" fill={INK} />
          <ellipse cx="12" cy="16.55" rx="1.05" ry="1.25" fill={LILAC} />
        </>
      );
    case "cool":
      return (
        <>
          <rect
            x="5.35"
            y="11.05"
            width="13.3"
            height="3.7"
            rx="1.85"
            fill={INK}
            stroke={PURPLE}
            strokeWidth="1.15"
          />
          <path d="M8.7 16.95c1.5 1.35 3.7 1.45 5.5.3" {...line} />
        </>
      );
    case "bite":
      return (
        <>
          <DotEyes />
          <ellipse cx="7.9" cy="14.2" rx="1.85" ry="1.05" fill={PINK} opacity="0.85" />
          <path d="M8.45 16.55c1.45 1.15 3.35 1.4 5.05.4" {...line} />
          <ellipse
            cx="14.85"
            cy="17.15"
            rx="1.55"
            ry="1.15"
            fill={PINK}
            stroke={INK}
            strokeWidth="1.15"
          />
        </>
      );
    case "sparkle":
      return (
        <>
          <DotEyes />
          <path d="M8.35 16.55c1.7 2.05 4.55 2.4 6.85.85" {...line} />
          <Spark x={19.05} y={4.15} s={0.95} />
          <Spark x={4.55} y={6.35} s={0.7} />
        </>
      );
    case "blowkiss":
      return (
        <>
          <ClosedEyes />
          <ellipse
            cx="12"
            cy="16.55"
            rx="1.45"
            ry="1.85"
            fill={PINK}
            stroke={INK}
            strokeWidth="1.25"
          />
          <MiniHeart x={19.15} y={5.05} s={1.45} />
        </>
      );
    default:
      return null;
  }
}

export function YouNeonSmiley({
  id,
  size = 24,
  className,
  title,
}: {
  id: SmileyId;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("yn-smiley", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      <Face />
      {features(id)}
    </svg>
  );
}

export function ChatSmileyText({ text, className }: { text: string; className?: string }) {
  const parts = parseSmileys(text);
  const onlySmileys = parts.every(
    (part) => part.type === "smiley" || (part.type === "text" && !part.value.trim())
  );
  const size = onlySmileys ? 24 : 20;

  return (
    <p className={cn("yn-chat-smiley-text break-words whitespace-pre-wrap", onlySmileys && "flex flex-wrap items-center gap-1", className)}>
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
            <YouNeonSmiley id={id} size={40} />
          </button>
        ))}
      </div>
    </div>
  );
}
