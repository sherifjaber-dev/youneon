export type SafetyReason = "nudity" | "weapons" | "drugs";

export type SafetyHit = {
  reason: SafetyReason;
  score: number;
};

type NsfwModel = {
  classify: (input: HTMLVideoElement, topK?: number) => Promise<Array<{ className: string; probability: number }>>;
};

type MobileNetModel = {
  classify: (input: HTMLVideoElement, topK?: number) => Promise<Array<{ className: string; probability: number }>>;
};

export type SafetyModels = {
  nsfw: NsfwModel | null;
  mobilenet: MobileNetModel | null;
};

const TFJS_SRC = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
const NSFW_SRC = "https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js";
const NSFW_MODEL = "https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/models/mobilenet_v2/";
const MOBILENET_SRC = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";

const PORN = 0.6;
const HENTAI = 0.68;
const SEXY = 0.9;
const OBJECT = 0.34;

const WEAPON_RE = /assault rifle|rifle|revolver|six-gun|six-shooter|holster|missile|projectile|cannon|scabbard/i;
const DRUG_RE = /syringe|pill bottle|hookah|narghile|nargileh|sheesha|shisha|water pipe/i;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export function safetyLabel(reason: SafetyReason) {
  if (reason === "weapons") return "weapons";
  if (reason === "drugs") return "drugs";
  return "nudity";
}

export async function loadSafetyModels(): Promise<SafetyModels> {
  await loadScript(TFJS_SRC);
  await loadScript(NSFW_SRC);
  const nsfwjs = (window as unknown as { nsfwjs?: { load: (url: string) => Promise<NsfwModel> } }).nsfwjs;
  if (!nsfwjs) throw new Error("nsfwjs missing");
  const nsfw = await nsfwjs.load(NSFW_MODEL);

  let mobilenet: MobileNetModel | null = null;
  try {
    await loadScript(MOBILENET_SRC);
    const mn = (window as unknown as {
      mobilenet?: { load: (opts?: { version?: number; alpha?: number }) => Promise<MobileNetModel> };
    }).mobilenet;
    if (mn) mobilenet = await mn.load({ version: 2, alpha: 0.5 });
  } catch (err) {
    console.warn("[safety] weapon/drug model skipped", err);
  }

  return { nsfw, mobilenet };
}

export async function scanVideoFrame(video: HTMLVideoElement, models: SafetyModels): Promise<SafetyHit | null> {
  if (video.readyState < 2 || video.videoWidth < 16) return null;

  if (models.nsfw) {
    const preds = await models.nsfw.classify(video, 5);
    for (const p of preds) {
      const name = p.className.toLowerCase();
      if (name === "porn" && p.probability >= PORN) return { reason: "nudity", score: p.probability };
      if (name === "hentai" && p.probability >= HENTAI) return { reason: "nudity", score: p.probability };
      if (name === "sexy" && p.probability >= SEXY) return { reason: "nudity", score: p.probability };
    }
  }

  if (models.mobilenet) {
    const preds = await models.mobilenet.classify(video, 5);
    for (const p of preds) {
      if (p.probability < OBJECT) continue;
      if (WEAPON_RE.test(p.className)) return { reason: "weapons", score: p.probability };
      if (DRUG_RE.test(p.className)) return { reason: "drugs", score: p.probability };
    }
  }

  return null;
}
