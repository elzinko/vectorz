/**
 * Le VRAI manifeste `ezk-manifest.yml` (fiche 20260903134906920) : il ne doit rien oublier
 * et ne rien inventer.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { entryStep, parseManifest, uncoveredScripts } from '../core/ezk-cli.js';

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
    const targets = manifest.commands.map((e) => entryStep(e).script);
    const missing = [...targets, ...manifest.internal.map((i) => i.script)].filter(
      (s) => !existsSync(join(megaCity, s)),
    );
    expect(missing).toEqual([]);
  });

  it('ne range pas un script à la fois dans le routeur et dans internal', () => {
    const routed = new Set(manifest.commands.map((e) => entryStep(e).script));
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

  it('« ezk views regen » lance le script unique des vues générées (ADR-0055), jamais cinq commandes', () => {
    const regen = manifest.commands.find((e) => e.domain === 'views' && e.verb === 'regen');
    expect(regen && entryStep(regen).script).toBe('bin/views-regen.ts');
  });

  it('le tableau de bord, qui ne fait que servir les fichiers de son dépôt, marche de partout', () => {
    for (const domain of ['dashboard', 'map']) {
      expect(manifest.commands.find((e) => e.domain === domain)?.root, domain).toBe('none');
    }
  });

  it('les commandes qui travaillent sur un projet désigné sont exactement celles-ci (fiches 20260826173221323 et 20260910152227744)', () => {
    const labels = manifest.commands
      .filter((e) => e.project)
      .map((e) => `${e.domain}${e.verb ? ` ${e.verb}` : ''}`)
      .sort();
    expect(labels).toEqual([
      'backlog check',
      'backlog plan-head',
      'board show',
      'dashboard',
      'dor check',
      'dor health',
      'dor show',
      'map',
      'rules apply',
      'rules check',
      'rules show',
    ]);
  });

  it('toute commande « project » lance un script qui lit la racine désignée (jamais une promesse en l’air)', () => {
    for (const entry of manifest.commands.filter((e) => e.project)) {
      const script = readFileSync(join(megaCity, entryStep(entry).script), 'utf8');
      expect(script, entry.domain).toContain('projectRootOrExit');
    }
  });

  it('expose la commande « ezk » par le champ bin du paquet, via un lanceur qui existe', () => {
    expect(pkg.bin?.ezk).toBe('bin/ezk.mjs');
    expect(existsSync(join(megaCity, 'bin', 'ezk.mjs'))).toBe(true);
  });
});
