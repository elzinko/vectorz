/**
 * Le VRAI manifeste `ezk-manifest.yml` (fiche 20260903134906920) : il ne doit rien oublier,
 * ne rien inventer, et `ezk board regen` ne doit jamais perdre un bloc du board.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { entrySteps, parseManifest, uncoveredScripts } from '../core/ezk-cli.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = parseManifest(readFileSync(join(megaCity, 'ezk-manifest.yml'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(megaCity, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  bin?: Record<string, string>;
};

describe('ezk-manifest.yml', () => {
  it('couvre tout script de bin/ exposé en script pnpm (routé, ou interne avec sa raison)', () => {
    expect(uncoveredScripts(manifest, pkg.scripts)).toEqual([]);
  });

  it('ne vise que des scripts qui existent', () => {
    const targets = manifest.commands.flatMap((e) => entrySteps(e).map((s) => s.script));
    const missing = [...targets, ...manifest.internal.map((i) => i.script)].filter(
      (s) => !existsSync(join(megaCity, s)),
    );
    expect(missing).toEqual([]);
  });

  it('ne range pas un script à la fois dans le routeur et dans internal', () => {
    const routed = new Set(manifest.commands.flatMap((e) => entrySteps(e).map((s) => s.script)));
    expect(manifest.internal.filter((i) => routed.has(i.script))).toEqual([]);
  });

  it('garde chaque résumé court : une ligne lisible dans « ezk help »', () => {
    const long = manifest.commands.filter((e) => e.summary.length > 90).map((e) => e.summary);
    expect(long).toEqual([]);
  });

  it('un ancien nom renvoie vers un domaine qui existe', () => {
    const domains = new Set(manifest.commands.map((e) => e.domain));
    for (const e of manifest.commands.filter((c) => c.deprecated)) {
      expect(domains.has((e.deprecated ?? '').split(' ')[0] ?? ''), e.domain).toBe(true);
    }
  });

  it('« ezk board regen » lance TOUS les scripts qui écrivent board.html — aucun bloc oublié', () => {
    const writers = readdirSync(join(megaCity, 'bin'))
      .filter((f) => /^regen-.*\.ts$/.test(f))
      .filter((f) => readFileSync(join(megaCity, 'bin', f), 'utf8').includes('board.html'))
      .map((f) => `bin/${f}`)
      .sort();
    const regen = manifest.commands.find((e) => e.domain === 'board' && e.verb === 'regen');
    const steps = regen ? entrySteps(regen).map((s) => s.script) : [];
    expect(writers.length).toBeGreaterThan(0);
    expect([...steps].sort()).toEqual(writers);
  });

  it("expose la commande « ezk » par le champ bin du paquet, via un lanceur qui existe", () => {
    expect(pkg.bin?.ezk).toBe('bin/ezk.mjs');
    expect(existsSync(join(megaCity, 'bin', 'ezk.mjs'))).toBe(true);
  });
});
