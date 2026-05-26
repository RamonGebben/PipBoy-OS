#!/usr/bin/env node
// Downloads upstream PipBoy assets we reuse.
// Source: https://github.com/SurvivorGrim/PipBoy-Pi5  (PipBoy/images/)
// Target: apps/ui/public/assets/  (gitignored)
//
// Run:  pnpm fetch-assets         # skip files that already exist
//       pnpm fetch-assets --force # re-download everything

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://raw.githubusercontent.com/SurvivorGrim/PipBoy-Pi5/main/PipBoy/images";
const FORCE = process.argv.includes("--force");

// Each entry: [remote path under BASE, local path under apps/ui/public/assets]
const FILES = [
  // Vault Boy body — leg frames
  ...Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    return [`stats/legs1/${n}.png`, `stats/legs1/${n}.png`];
  }),
  // Vault Boy body — head (1 frame is enough; upstream only uses head1/1.png)
  ["stats/head1/1.png", "stats/head1/1.png"],
  // Static T-pose body + head (alternative to the walking-cycle frames)
  ["stats/body_1.png", "stats/body_1.png"],
  ["stats/head_1.png", "stats/head_1.png"],
  // Equipment slot icons
  ["stats/gun.png", "stats/gun.png"],
  ["stats/reticle.png", "stats/reticle.png"],
  ["stats/helmet.png", "stats/helmet.png"],
  ["stats/shield.png", "stats/shield.png"],
  ["stats/bolt.png", "stats/bolt.png"],
  ["stats/radiation.png", "stats/radiation.png"],
];

const TARGET_ROOT = path.join(ROOT, "apps/ui/public/assets");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchOne(remote, local) {
  const url = `${BASE}/${remote}`;
  const dst = path.join(TARGET_ROOT, local);
  if (!FORCE && (await exists(dst))) {
    return { url, dst, skipped: true };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.writeFile(dst, buf);
  return { url, dst, skipped: false, bytes: buf.length };
}

async function main() {
  await fs.mkdir(TARGET_ROOT, { recursive: true });
  console.log(`Fetching ${FILES.length} assets → ${path.relative(ROOT, TARGET_ROOT)}`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const [remote, local] of FILES) {
    try {
      const r = await fetchOne(remote, local);
      if (r.skipped) {
        skipped++;
        console.log(`  · ${local} (skipped)`);
      } else {
        ok++;
        console.log(`  ✓ ${local} (${r.bytes} bytes)`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${local}: ${err.message}`);
    }
  }
  console.log(`\nDone. ${ok} downloaded, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
