#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
/**
 * Capture Playwright du Moniteur (homepage = vue supervision).
 * Usage: node scripts/dogfood-screenshot.mjs <url> <fichier.png>
 * Dépendance : `npx -y playwright` (navigateur Chromium).
 * Exit 0 = OK, 2 = SKIP/échec (pas de faux vert).
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3];

if (!out) {
  console.error('usage: node scripts/dogfood-screenshot.mjs <url> <out.png>');
  process.exit(2);
}

mkdirSync(dirname(out), { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
  // Laisse le fetch /api/supervision/runs se poser
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`screenshot OK → ${out}`);
} catch (err) {
  console.error(`screenshot SKIP/KO: ${err?.message || err}`);
  process.exit(2);
} finally {
  await browser?.close().catch(() => {});
}
