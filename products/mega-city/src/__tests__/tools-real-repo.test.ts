/**
 * Les outils sur le DÉPÔT RÉEL (fiche 20260917123943914, ADR-0058) : les cas connus doivent
 * être reliés, et aucun faux orphelin ne doit apparaître. Un test sur fixtures ne le dirait pas :
 * ce sont les vrais SKILL.md qui disent quel skill cite quel script.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileGraph, queryGraph } from '../core/compiled-graph.js';
import { CYCLE_DOC } from '../core/cycle.js';
import { validateGraph } from '../core/graph.js';
import { buildMapData } from '../core/map-data.js';
import { catalogSources, loadCatalog } from '../loaders/catalog.js';
import { loadMapSources } from '../loaders/map-sources.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = resolve(megaCity, '..', '..');
const catalog = loadCatalog(megaCity);
const tools = catalog.tools ?? new Map();

describe('les outils du dépôt réel', () => {
  it('chaque skill vit dans un dossier du même nom : c’est ce qui nomme ses scripts', () => {
    for (const id of catalog.skills.keys()) {
      expect(existsSync(join(megaCity, 'skills', id, 'SKILL.md')), `skills/${id}/SKILL.md`).toBe(true);
    }
  });

  it('les outils sont les scripts de bin/ et des scripts/ de skills, jamais les tests', () => {
    const ids = [...tools.keys()];
    expect(ids.length).toBeGreaterThan(30);
    for (const id of ids) {
      expect(id, id).toMatch(/^(bin\/[^/]+|skills\/[^/]+\/scripts\/[^/]+)$/);
      expect(id.split('/').pop(), id).not.toMatch(/^test-/);
      expect(existsSync(join(megaCity, id)), id).toBe(true);
    }
    expect(tools.has('bin/ezk-map.ts')).toBe(true);
    expect(tools.has('bin/test-regen-backlog.sh')).toBe(false);
  });

  it.each([
    ['bin/regen-backlog.sh', 'ezk-backlog'],
    ['bin/pr-evidence.sh', 'ezk-sprint'],
    ['skills/ezk-archive/scripts/check.sh', 'ezk-archive'],
    ['skills/ezk-archive/scripts/handoff.sh', 'ezk-archive'],
    ['skills/ezk-pr/scripts/check-pr-body.sh', 'ezk-pr'],
    ['skills/ezk-apk/scripts/build-preview-apk.sh', 'ezk-apk'],
    // Les skills notent souvent leur propre dossier par un gabarit : ce ne sont pas des orphelins.
    ['skills/ezk-sprint/scripts/check.sh', 'ezk-sprint'], // <chemin-du-skill>/scripts/check.sh
    ['skills/ezk-backlog/scripts/check-layout-version.sh', 'ezk-backlog'], // <skill>/scripts/…
    ['skills/ezk-npm-scripts/scripts/audit.mjs', 'ezk-npm-scripts'], // <skill>/scripts/audit.mjs
    ['skills/ezk-scout/scripts/check-report.sh', 'ezk-scout'], // $SCOUT/scripts/check-report.sh
    ['skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh', 'ezk-backlog'], // ../scripts/… (migrations/)
  ])('cas connu : %s est relié à %s', (tool, skill) => {
    expect(tools.get(tool)?.usedBy, tool).toContain(skill);
  });

  it('zéro faux orphelin sur les cas connus : un outil cité, lancé ou déclaré interne n’est pas orphelin', () => {
    const orphans = new Set(validateGraph(catalog).orphans.filter((o) => o.kind === 'tool').map((o) => o.id));

    for (const known of [
      'bin/regen-backlog.sh', // cité par ezk-backlog
      'skills/ezk-archive/scripts/check.sh', // cité par son propre skill
      'bin/ezk-map.ts', // lancé à la main : `ezk dashboard`
      'bin/ezk.ts', // interne : le routeur lui-même
      'bin/ezk.mjs', // le lanceur installé : `bin` de package.json
      'skills/ezk-backlog/scripts/check-layout-version.sh', // cité par un gabarit : <skill>/scripts/…
    ]) {
      expect(orphans.has(known), known).toBe(false);
    }
  });

  it('le manifeste donne ses commandes à l’outil qu’elles lancent', () => {
    expect(tools.get('bin/ezk-map.ts')?.commands).toEqual(['ezk dashboard']); // l’ancien nom `ezk map` est exclu
    expect(tools.get('bin/ezk.ts')?.internal).toMatch(/routeur/);
    expect(tools.get('bin/ezk.mjs')?.commands).toEqual(['ezk']); // la commande installée par package.json
  });

  it('les liens passent dans le graphe compilé : `utilise` donne les outils d’un skill', () => {
    const graph = compileGraph(catalog);

    expect(queryGraph(graph, 'utilise', { kind: 'skill', id: 'ezk-backlog' })).toContain('bin/regen-backlog.sh');
    expect(queryGraph(graph, 'utilise', { kind: 'tool', id: 'bin/regen-backlog.sh' }, true)).toContain('ezk-backlog');
  });

  it('chaque outil a une source : la carte pointe le fichier, pas une déduction', () => {
    const sources = catalogSources(megaCity, repoRoot);

    for (const id of tools.keys()) {
      expect(sources.get(`tool:${id}`), id).toBe(`products/mega-city/${id}`);
    }
  });

  it('la carte reçoit les outils : sources, skills reliés, et orphelins nommés avec les autres', () => {
    const graph = compileGraph(catalog);
    const data = buildMapData(catalog, graph, loadMethodDoc(megaCity), loadTaxonomieDoc(megaCity), {
      sources: loadMapSources(megaCity, repoRoot),
      cycle: CYCLE_DOC,
    });

    expect(data.counts.tools).toBe(tools.size);
    expect(Object.keys(data.tools)).toEqual([...tools.keys()].sort());
    expect(data.tools['bin/regen-backlog.sh']).toMatchObject({
      source: 'products/mega-city/bin/regen-backlog.sh',
      usedBy: ['ezk-backlog'],
      commands: ['ezk backlog regen'],
    });
    expect(data.skills['ezk-backlog']?.tools).toContain('bin/regen-backlog.sh');
    // Les orphelins de la carte sont ceux du rapport du graphe : rien de plus, rien de moins.
    const reported = validateGraph(catalog).orphans.filter((o) => o.kind === 'tool').map((o) => o.id);
    expect(data.orphans.filter((o) => o.kind === 'tool').map((o) => o.id)).toEqual(reported);
  });

  it('la coque de la carte porte la section « Les outils » et lit le store des outils', () => {
    const html = readFileSync(join(repoRoot, 'diagrams', 'methode-mega-city', 'carte-interactive.html'), 'utf8');

    expect(html).toContain('id="outils-section"');
    expect(html).toContain('id="outils"');
    expect(html).toContain('tool:D.tools'); // le store des puces et des dossiers
  });

  it('le calcul est déterministe : deux chargements donnent les mêmes outils', () => {
    expect(JSON.stringify([...loadCatalog(megaCity).tools?.values() ?? []])).toBe(
      JSON.stringify([...tools.values()]),
    );
  });
});
