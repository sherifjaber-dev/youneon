#!/usr/bin/env node
/**
 * Find leftover files the app no longer uses.
 *
 *   pnpm cleanup:unused          dry-run (prints what would go)
 *   pnpm cleanup:unused:apply    delete the unused files
 *
 * Never touches Pi payment/auth, Firestore rules, flags, emojis,
 * wait stickers, login assets, or Next/app entrypoints.
 */

import { existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync } from "fs";
import { dirname, extname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json", ".html", ".md"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  "out",
  "build",
  "dist",
]);

const KEEP_PUBLIC_PREFIX = [
  "flags/",
  "emojis/",
  "wait/",
  "demo/",
];
const KEEP_PUBLIC_EXACT = new Set([
  "pi-boot.js",
  "pi-app-manifest.json",
  "manifest.json",
  "robots.txt",
  "sitemap.xml",
  "validation-key.txt",
  "default-avatar.png",
  "youneon-hero.png",
  "youneon-login-logo.png",
]);
const KEEP_PUBLIC_DIR = ["youneon/"];

const KEEP_SOURCE = [
  /^app\//,
  /^middleware\.(ts|js)$/,
  /^next\.config\./,
  /^postcss\.config\./,
  /^components\.json$/,
  /^firestore\.rules$/,
  /^lib\/pi-/,
  /^lib\/firebase/,
  /^lib\/product-config/,
  /^lib\/system-config/,
  /^lib\/utils\./,
  /^contexts\//,
  /^scripts\//,
];

const KEEP_ROOT_MD = new Set(["README.md", "LICENSE.md", "CHANGELOG.md", "SECURITY.md"]);

const ROOT_JUNK_MD = [
  "ACTION_ITEMS.md",
  "ALL_SCREENS_GUIDE.md",
  "APP_ARCHITECTURE.md",
  "ARCHITECTURE_DIAGRAM.md",
  "BROWSER_READY.md",
  "BROWSER_TROUBLESHOOTING.md",
  "BUILD_SUMMARY.md",
  "COMPLETE_BUILD_SUMMARY.md",
  "COMPLETE_IMPLEMENTATION_GUIDE.md",
  "COMPLETE_STATUS.md",
  "DAILY_VIDEO_INTEGRATION.md",
  "DEPLOYMENT_GUIDE.md",
  "DOWNLOAD_AND_SETUP.md",
  "EVERYTHING_YOU_NEED.md",
  "FINAL_LAUNCH_SUMMARY.md",
  "FINAL_OVERVIEW.md",
  "FINAL_SCREENS_SUMMARY.md",
  "FIXES_APPLIED.md",
  "FIXES_DOCUMENTATION.md",
  "FIXES_SUMMARY.md",
  "FIX_COMPLETE.md",
  "IMPLEMENTATION_GUIDE.md",
  "IMPLEMENTATION_SUMMARY.md",
  "LAUNCH_READY.md",
  "NEON_THEME_GUIDE.md",
  "NEXT_STEPS.md",
  "ONBOARDING_REMOVED.md",
  "PI_BROWSER_DEBUG.md",
  "PI_BROWSER_FIX.md",
  "PI_BROWSER_FIXES.md",
  "PROFILE_ONBOARDING_GUIDE.md",
  "QUICK_REFERENCE.md",
  "QUICK_START.md",
  "README_BROWSER_READY.md",
  "SCREENS_CREATED.md",
  "SCREENS_OVERVIEW.md",
  "SCREENS_SUMMARY.md",
  "SETUP_AND_LAUNCH.md",
  "START_HERE.md",
  "TESTING_GUIDE.md",
  "THEME_FIX_COMPLETE.md",
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function rel(p) {
  return relative(ROOT, p).replace(/\\/g, "/");
}

function loadBlob(files) {
  const parts = [];
  for (const f of files) {
    if (!CODE_EXT.has(extname(f))) continue;
    try {
      parts.push(readFileSync(f, "utf8"));
    } catch {
      /* ignore */
    }
  }
  return parts.join("\n");
}

function isKeptPublic(publicRel) {
  if (KEEP_PUBLIC_EXACT.has(publicRel)) return true;
  if (KEEP_PUBLIC_PREFIX.some((p) => publicRel.startsWith(p))) return true;
  if (KEEP_PUBLIC_DIR.some((p) => publicRel.startsWith(p))) return true;
  return false;
}

function publicReferenced(blob, publicRel, fileName) {
  const pathSlash = "/" + publicRel;
  if (blob.includes(pathSlash)) return true;
  if (blob.includes(publicRel)) return true;
  if (blob.includes(fileName) && fileName.length > 6) return true;
  return false;
}

function isKeptSource(sourceRel) {
  return KEEP_SOURCE.some((re) => re.test(sourceRel));
}

function collectImports(files) {
  const imported = new Set();
  const fromRe = /from\s+["']([^"']+)["']/g;
  const dynRe = /import\(\s*["']([^"']+)["']\s*\)/g;
  const reqRe = /require\(\s*["']([^"']+)["']\s*\)/g;
  for (const f of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(f)) continue;
    let text = "";
    try {
      text = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const fromDir = dirname(f);
    for (const re of [fromRe, dynRe, reqRe]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        let spec = m[1];
        if (spec.startsWith("@/")) spec = join(ROOT, spec.slice(2));
        else if (spec.startsWith(".")) spec = resolve(fromDir, spec);
        else continue;
        imported.add(rel(spec));
      }
    }
  }
  return imported;
}

function sourceExistsVariants(sourceRel, imported) {
  const noExt = sourceRel.replace(/\.(ts|tsx|js|jsx|mjs)$/, "");
  return (
    imported.has(sourceRel) ||
    imported.has(noExt) ||
    imported.has(noExt + ".ts") ||
    imported.has(noExt + ".tsx") ||
    imported.has(noExt + "/index") ||
    imported.has(noExt + "/index.ts") ||
    imported.has(noExt + "/index.tsx")
  );
}

function findUnused() {
  const all = walk(ROOT);
  const blob = loadBlob(all);
  const unused = [];

  const publicDir = join(ROOT, "public");
  if (existsSync(publicDir)) {
    for (const f of walk(publicDir)) {
      const publicRel = rel(f).replace(/^public\//, "");
      if (isKeptPublic(publicRel)) continue;
      if (publicReferenced(blob, publicRel, publicRel.split("/").pop() || "")) continue;
      unused.push({ kind: "asset", path: rel(f) });
    }
  }

  const imported = collectImports(all);
  const sourceRoots = ["components", "hooks", "lib"];
  for (const folder of sourceRoots) {
    const dir = join(ROOT, folder);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) {
      if (!/\.(ts|tsx|js|jsx)$/.test(f)) continue;
      const sourceRel = rel(f);
      if (isKeptSource(sourceRel)) continue;
      if (sourceExistsVariants(sourceRel, imported)) continue;
      unused.push({ kind: "source", path: sourceRel });
    }
  }

  for (const name of ROOT_JUNK_MD) {
    const p = join(ROOT, name);
    if (existsSync(p) && !KEEP_ROOT_MD.has(name)) {
      unused.push({ kind: "doc", path: name });
    }
  }

  const extraJunk = ["START_APP.sh", "package-lock.json", "styles/globals.css", "src/lib/createRoom.js", "app/page-debug.tsx"];
  for (const name of extraJunk) {
    const p = join(ROOT, name);
    if (existsSync(p)) unused.push({ kind: "junk", path: name });
  }

  unused.sort((a, b) => a.path.localeCompare(b.path));
  return unused;
}

function pruneEmptyDirs(start) {
  const dir = join(ROOT, start);
  if (!existsSync(dir)) return;
  const stack = [];
  (function collect(d) {
    stack.push(d);
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) collect(full);
    }
  })(dir);
  for (const d of stack.reverse()) {
    if (d === ROOT) continue;
    try {
      if (readdirSync(d).length === 0) rmSync(d);
    } catch {
      /* ignore */
    }
  }
}

const unused = findUnused();

if (unused.length === 0) {
  console.log("Cleanup: nothing unused. Repo is tidy.");
  process.exit(0);
}

const groups = {};
for (const item of unused) {
  (groups[item.kind] ||= []).push(item.path);
}

console.log(APPLY ? "Cleanup: deleting unused files\n" : "Cleanup: unused files (dry-run)\n");
for (const [kind, paths] of Object.entries(groups)) {
  console.log(`  [${kind}] ${paths.length}`);
  for (const p of paths) console.log(`    ${p}`);
  console.log("");
}

if (!APPLY) {
  console.log(`Found ${unused.length} unused file(s).`);
  console.log("Re-run with --apply to delete them:");
  console.log("  pnpm cleanup:unused:apply");
  process.exit(0);
}

for (const item of unused) {
  const full = join(ROOT, item.path);
  try {
    unlinkSync(full);
    console.log("deleted", item.path);
  } catch (err) {
    console.error("failed", item.path, err.message);
  }
}
pruneEmptyDirs("public");
pruneEmptyDirs("components");
pruneEmptyDirs("hooks");
pruneEmptyDirs("lib");
pruneEmptyDirs("src");
pruneEmptyDirs("styles");
console.log(`\nDeleted ${unused.length} unused file(s).`);
