#!/usr/bin/env node
/**
 * Design-token ratchet (boss 2026-10-08 "没有强制力"专项).
 * Fails the build only when a file gains NEW bare-hex colors beyond its
 * frozen baseline — current state always passes, violations can only shrink.
 * Whitelist = third-party brand assets (e.g. MetaMask fox orange).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const BASELINE = JSON.parse(readFileSync(new URL("./design-token-baseline.json", import.meta.url), "utf8"));
const WHITELIST = new Set(["#e4761b", "#f6851b", "#e2761b", "#cd6116", "#e4751f"].map((s) => s.toLowerCase()));
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|css)$/.test(name)) yield p;
  }
}

let failed = false;
const current = {};
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const hits = [];
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(HEX_RE)) {
      if (!WHITELIST.has(m[0].toLowerCase())) hits.push({ line: i + 1, hex: m[0] });
    }
  });
  current[rel] = hits.length;
  const base = BASELINE[rel] ?? 0;
  if (hits.length > base) {
    failed = true;
    console.error(`✗ ${rel}: ${base} → ${hits.length} bare-hex colors (ratchet)`);
    for (const h of hits.slice(0, 5)) console.error(`    ${rel}:${h.line} ${h.hex}`);
    console.error(`    → use var(--*) tokens (see DESIGN_SYSTEM.md / AGENTS.md)`);
  }
}

const removed = Object.keys(BASELINE).filter((f) => !(f in current));
for (const f of removed) current[f] = 0;

if (failed) {
  console.error("\nDesign-token ratchet FAILED — new bare-hex colors are not allowed.");
  process.exit(1);
}
const total = Object.values(current).reduce((a, b) => a + b, 0);
console.log(`design-token ratchet OK (${total} grandfathered bare-hex, whitelist=${WHITELIST.size})`);
