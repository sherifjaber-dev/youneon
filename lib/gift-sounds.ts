export type GiftSoundId =
  | "rose"
  | "heart"
  | "bouquet"
  | "diamond"
  | "gift"
  | "teddy"
  | "naughty"
  | "funny"
  | "beautiful"
  | "cool"
  | "fire"
  | "rabbit";

const SFX_MUTE_KEY = "younn-sfx-muted";

let audioCtx: AudioContext | null = null;

export function isSfxMuted(): boolean {
  try {
    return localStorage.getItem(SFX_MUTE_KEY) === "1" || localStorage.getItem(SFX_MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  opts: {
    freq: number;
    freqEnd?: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    peak?: number;
    attack?: number;
    release?: number;
    detune?: number;
  }
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type || "sine";
  osc.frequency.setValueAtTime(Math.max(40, opts.freq), opts.start);
  if (opts.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), opts.start + opts.duration);
  }
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, opts.start);
  const peak = opts.peak ?? 0.12;
  const attack = opts.attack ?? 0.018;
  const release = opts.release ?? Math.max(0.08, opts.duration * 0.65);
  const t0 = opts.start;
  const tPeak = t0 + attack;
  const tEnd = t0 + opts.duration;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, tPeak);
  gain.gain.setValueAtTime(peak, Math.max(tPeak, tEnd - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
  osc.connect(gain).connect(dest);
  osc.start(t0);
  osc.stop(tEnd + 0.02);
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  opts: { start: number; duration: number; freqFrom: number; freqTo: number; peak?: number; q?: number }
) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * opts.duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const env = Math.pow(1 - i / length, 1.35);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = opts.q ?? 2.2;
  filter.frequency.setValueAtTime(opts.freqFrom, opts.start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, opts.freqTo), opts.start + opts.duration);
  const gain = ctx.createGain();
  const peak = opts.peak ?? 0.16;
  gain.gain.setValueAtTime(0.0001, opts.start);
  gain.gain.exponentialRampToValueAtTime(peak, opts.start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.start + opts.duration);
  src.connect(filter).connect(gain).connect(dest);
  src.start(opts.start);
  src.stop(opts.start + opts.duration + 0.02);
}

function masterChain(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  return master;
}

function playRose(ctx: AudioContext, t: number, dest: AudioNode) {
  const notes = [392, 523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + i * 0.11, duration: 0.85 - i * 0.08, peak: 0.11 - i * 0.012, attack: 0.04, type: "sine" });
    tone(ctx, dest, { freq: freq * 2, start: t + i * 0.11 + 0.02, duration: 0.45, peak: 0.035, attack: 0.06, type: "triangle" });
  });
}

function playHeart(ctx: AudioContext, t: number, dest: AudioNode) {
  [0, 0.32].forEach((offset, beat) => {
    const peak = beat === 0 ? 0.14 : 0.11;
    tone(ctx, dest, { freq: 220, start: t + offset, duration: 0.28, peak: peak * 0.7, attack: 0.01, type: "sine" });
    tone(ctx, dest, { freq: 329.63, start: t + offset, duration: 0.34, peak, attack: 0.012, type: "sine" });
    tone(ctx, dest, { freq: 659.25, start: t + offset + 0.02, duration: 0.42, peak: 0.05, attack: 0.03, type: "triangle" });
  });
  tone(ctx, dest, { freq: 880, freqEnd: 1320, start: t + 0.62, duration: 0.55, peak: 0.06, attack: 0.08, type: "sine" });
}

function playBouquet(ctx: AudioContext, t: number, dest: AudioNode) {
  const sparkle = [783.99, 880, 987.77, 1174.66, 1318.51, 1567.98];
  sparkle.forEach((freq, i) => {
    tone(ctx, dest, {
      freq,
      start: t + i * 0.07,
      duration: 0.38,
      peak: 0.09,
      attack: 0.01,
      type: i % 2 === 0 ? "sine" : "triangle",
    });
  });
  tone(ctx, dest, { freq: 392, start: t, duration: 0.9, peak: 0.07, attack: 0.05, type: "sine" });
}

function playDiamond(ctx: AudioContext, t: number, dest: AudioNode) {
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.14;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.22;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(dest);

  const shimmer = ctx.createGain();
  shimmer.gain.value = 0.85;
  shimmer.connect(dest);
  shimmer.connect(delay);

  [2093, 2489, 2793.83, 3135.96, 3520].forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + i * 0.045, duration: 0.55, peak: 0.07, attack: 0.006, type: "sine" });
    tone(ctx, shimmer, { freq: freq * 0.5, start: t + i * 0.045, duration: 0.7, peak: 0.04, attack: 0.02, type: "triangle" });
  });
}

function playGiftBox(ctx: AudioContext, t: number, dest: AudioNode) {
  noiseBurst(ctx, dest, { start: t, duration: 0.32, freqFrom: 280, freqTo: 2200, peak: 0.14, q: 1.8 });
  tone(ctx, dest, { freq: 196, freqEnd: 523.25, start: t + 0.08, duration: 0.4, peak: 0.09, attack: 0.04, type: "sine" });
  [1046.5, 1318.51, 1567.98].forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + 0.28 + i * 0.09, duration: 0.7, peak: 0.1, attack: 0.015, type: "sine" });
  });
}

function playTeddy(ctx: AudioContext, t: number, dest: AudioNode) {
  tone(ctx, dest, { freq: 174.61, start: t, duration: 0.7, peak: 0.13, attack: 0.03, type: "sine" });
  tone(ctx, dest, { freq: 261.63, start: t + 0.04, duration: 0.62, peak: 0.08, attack: 0.04, type: "triangle" });
  tone(ctx, dest, { freq: 392, start: t + 0.22, duration: 0.55, peak: 0.07, attack: 0.05, type: "sine" });
  tone(ctx, dest, { freq: 587.33, start: t + 0.48, duration: 0.85, peak: 0.08, attack: 0.06, type: "sine" });
}

function playNaughty(ctx: AudioContext, t: number, dest: AudioNode) {
  tone(ctx, dest, { freq: 196, freqEnd: 294, start: t, duration: 0.42, peak: 0.11, attack: 0.04, type: "sine" });
  tone(ctx, dest, { freq: 392, freqEnd: 247, start: t + 0.18, duration: 0.5, peak: 0.08, attack: 0.05, type: "triangle" });
  [523.25, 659.25, 784].forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + 0.38 + i * 0.08, duration: 0.36, peak: 0.07, attack: 0.02, type: "sine" });
  });
}

function playFunny(ctx: AudioContext, t: number, dest: AudioNode) {
  [392, 494, 392, 587].forEach((freq, i) => {
    tone(ctx, dest, {
      freq,
      start: t + i * 0.11,
      duration: 0.22,
      peak: 0.11,
      attack: 0.01,
      type: i % 2 === 0 ? "square" : "triangle",
    });
  });
  tone(ctx, dest, { freq: 784, freqEnd: 1046, start: t + 0.48, duration: 0.4, peak: 0.07, attack: 0.03, type: "sine" });
}

function playBeautiful(ctx: AudioContext, t: number, dest: AudioNode) {
  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + i * 0.1, duration: 0.7 - i * 0.06, peak: 0.09, attack: 0.05, type: "sine" });
    tone(ctx, dest, { freq: freq * 2, start: t + i * 0.1 + 0.03, duration: 0.4, peak: 0.03, attack: 0.06, type: "triangle" });
  });
}

function playCool(ctx: AudioContext, t: number, dest: AudioNode) {
  tone(ctx, dest, { freq: 110, start: t, duration: 0.55, peak: 0.12, attack: 0.02, type: "sine" });
  tone(ctx, dest, { freq: 146.83, start: t + 0.08, duration: 0.5, peak: 0.08, attack: 0.03, type: "triangle" });
  tone(ctx, dest, { freq: 220, freqEnd: 330, start: t + 0.28, duration: 0.45, peak: 0.09, attack: 0.04, type: "sine" });
  tone(ctx, dest, { freq: 880, start: t + 0.52, duration: 0.38, peak: 0.05, attack: 0.02, type: "sine" });
}

function playFire(ctx: AudioContext, t: number, dest: AudioNode) {
  noiseBurst(ctx, dest, { start: t, duration: 0.28, freqFrom: 420, freqTo: 180, peak: 0.07, q: 2.4 });
  tone(ctx, dest, { freq: 196, freqEnd: 330, start: t, duration: 0.42, peak: 0.1, attack: 0.02, type: "sawtooth" });
  tone(ctx, dest, { freq: 392, freqEnd: 523, start: t + 0.16, duration: 0.38, peak: 0.08, attack: 0.03, type: "triangle" });
  tone(ctx, dest, { freq: 784, start: t + 0.4, duration: 0.32, peak: 0.05, attack: 0.02, type: "sine" });
}

function playRabbit(ctx: AudioContext, t: number, dest: AudioNode) {
  [659.25, 783.99, 987.77, 1174.66].forEach((freq, i) => {
    tone(ctx, dest, { freq, start: t + i * 0.07, duration: 0.22, peak: 0.08, attack: 0.01, type: "triangle" });
  });
  tone(ctx, dest, { freq: 1318.51, freqEnd: 1760, start: t + 0.32, duration: 0.45, peak: 0.06, attack: 0.04, type: "sine" });
}

const PLAYERS: Record<GiftSoundId, (ctx: AudioContext, t: number, dest: AudioNode) => void> = {
  rose: playRose,
  heart: playHeart,
  bouquet: playBouquet,
  diamond: playDiamond,
  gift: playGiftBox,
  teddy: playTeddy,
  naughty: playNaughty,
  funny: playFunny,
  beautiful: playBeautiful,
  cool: playCool,
  fire: playFire,
  rabbit: playRabbit,
};

export function playGiftSound(giftId: GiftSoundId, opts?: { muted?: boolean }) {
  if (opts?.muted || isSfxMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const dest = masterChain(ctx);
    PLAYERS[giftId]?.(ctx, ctx.currentTime, dest);
  } catch (e) {
    console.warn(e);
  }
}
