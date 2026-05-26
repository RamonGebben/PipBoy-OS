#!/usr/bin/env node
// Reads a PipBoy config.json and emits a URL query string for the UI.
// Searched in order: $PIPBOY_CONFIG, /boot/pipboy.config.json,
// /boot/firmware/pipboy.config.json, ~/.config/pipboy/config.json,
// ./config.json. Missing or invalid file → empty string.
//
// Only the "ui" section is reflected as URL args. Server-only fields
// (port, gpio) are read by the sidecar directly.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const candidates = [
  process.env.PIPBOY_CONFIG,
  "/boot/pipboy.config.json",
  "/boot/firmware/pipboy.config.json",
  path.join(os.homedir(), ".config/pipboy/config.json"),
  path.resolve(process.cwd(), "config.json"),
].filter(Boolean);

const file = candidates.find((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});

if (!file) {
  process.stdout.write("");
  process.exit(0);
}

let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  process.stdout.write("");
  process.exit(0);
}

const ui = (cfg && cfg.ui) || {};
const pairs = [];
const push = (k, v) => {
  if (v === undefined || v === null) return;
  pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
};

push("mode", ui.mode);
push("screen", ui.screen);
push("lock", ui.lock);
push("theme", ui.theme);
push("cycle", ui.cycleMs);
push("scanlines", ui.scanlines);
push("boot", ui.bootAnimation);

process.stdout.write(pairs.join("&"));
