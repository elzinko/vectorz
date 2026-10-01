/**
 * map-assemblage — « qui compose quoi », compilé depuis le graphe (fiche 20260821163346490).
 *
 * La carte montrait six blocs alignés avec des flèches nues : une chaîne de montage qui
 * n'existait pas. La vue d'ensemble est désormais COMPTÉE dans le graphe : une flèche par
 * (brique source, verbe, brique cible), avec le nombre de liens qui la portent. Aucun nombre
 * écrit à la main ; ce que le graphe ne dit pas (le bind) est marqué « déduit ».
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileGraph } from '../core/compiled-graph.js';
import { buildAssemblage } from '../core/assemblage.js';
import { LINK_VERBS } from '../core/graph.js';
import { buildMapData } from '../core/map-data.js';
import type { Catalog } from '../loaders/catalog.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadMapSources } from '../loaders/map-sources.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

/** Un profil qui compose deux bundles, un juge et une commande ; un bundle qui compose une règle. */
const tiny = (): Catalog => ({
  rules: new Map([['r1', { id: 'r1', kind: 'disposition', level: 'MUST', content: '' }]]),
  bundles: new Map([
    ['b1', { id: 'b1', rules: ['r1'] }],
    ['b2', { id: 'b2', rules: [] }],
  ]),
  profiles: new Map([
    ['p1', { id: 'p1', bundles: ['b1', 'b2'], agents: ['a1'], skills: ['s1'] }],
  ]),
  agents: new Map([['a1', { id: 'a1', role: '', competences: [], interactions: [] }]]),
  skills: new Map([['s1', { id: 's1', content: '', roles: ['a1'] }]]),
});

describe('buildAssemblage — compté dans le graphe, jamais écrit à la main', () => {
  it('compte les briques de chaque nature et regroupe les liens par (source, verbe, cible)', () => {
    const catalog = tiny();
    const view = buildAssemblage(compileGraph(catalog));
    expect(view.nodes).toEqual({ rule: 1, agent: 1, skill: 1, bundle: 2, profile: 1 });
    const arrow = (from: string, verb: string, to: string) =>
      view.arrows.find((a) => a.from === from && a.verb === verb && a.to === to)?.count;
    expect(arrow('profile', 'compose', 'bundle')).toBe(2); // p1 → b1, b2 : UNE flèche, nombre 2
    expect(arrow('profile', 'compose', 'agent')).toBe(1);
    expect(arrow('profile', 'compose', 'skill')).toBe(1);
    expect(arrow('bundle', 'compose', 'rule')).toBe(1);
    expect(arrow('skill', 'convoque', 'agent')).toBe(1);
  });

  it('ne perd et ne double aucun lien : la somme des nombres = le nombre d’arêtes', () => {
    for (const catalog of [tiny(), loadCatalog(megaCity)]) {
      const graph = compileGraph(catalog);
      const view = buildAssemblage(graph);
      expect(view.arrows.reduce((n, a) => n + a.count, 0)).toBe(graph.edges.length);
    }
  });

  it('chaque flèche porte un verbe du jeu fermé et un nombre strictement positif', () => {
    const view = buildAssemblage(compileGraph(loadCatalog(megaCity)));
    for (const a of view.arrows) {
      expect(LINK_VERBS, `${a.from} ${a.verb} ${a.to}`).toContain(a.verb);
      expect(a.count).toBeGreaterThan(0);
    }
  });

  it('la sortie est triée : mêmes entrées, même ordre', () => {
    const graph = compileGraph(loadCatalog(megaCity));
    const keys = buildAssemblage(graph).arrows.map((a) => `${a.from} ${a.verb} ${a.to}`);
    expect(keys).toEqual([...keys].sort());
  });

  it('catalogue RÉEL : le profil compose bundles, juges et commandes ; le bundle compose des règles', () => {
    const view = buildAssemblage(compileGraph(loadCatalog(megaCity)));
    const composes = new Set(
      view.arrows.filter((a) => a.verb === 'compose').map((a) => `${a.from}>${a.to}`),
    );
    for (const pair of [
      'profile>bundle',
      'profile>agent',
      'profile>skill',
      'bundle>rule',
    ]) {
      expect(composes.has(pair), pair).toBe(true);
    }
  });
});

describe('assemblage dans le bloc de données de la carte', () => {
  it('le bind n’est pas dans le graphe : compté déduit, avec le code et l’ADR comme sources', () => {
    const catalog = loadCatalog(megaCity);
    const data = buildMapData(catalog, compileGraph(catalog), undefined, undefined, {
      sources: loadMapSources(megaCity, repoRoot),
    });
    expect(data.assemblage.arrows.length).toBeGreaterThan(0);
    expect(data.assemblage.bind.source).toBe('products/mega-city/src/core/bind.ts');
    expect(data.assemblage.bind.adr).toBe(
      'products/mega-city/docs/adr/0003-moteur-bind-plan-pur-coquille-io.md',
    );
    expect(data.provenance.deduit.assemblage).toBe(1);
    expect(data.provenance.prouve.assemblage).toBe(0);
  });

  it('sans source connue, le bind reste dessiné mais sans lien', () => {
    const catalog = tiny();
    const data = buildMapData(catalog, compileGraph(catalog));
    expect(data.assemblage.bind.source).toBeUndefined();
    expect(data.provenance.deduit.assemblage).toBe(1);
  });
});

describe('diagram.mmd (colonne vertébrale) — aucune flèche nue', () => {
  it('chaque flèche porte un verbe : « --> » est toujours suivi de |libellé|', () => {
    const mmd = readFileSync(
      join(repoRoot, 'diagrams', 'methode-mega-city', 'diagram.mmd'),
      'utf8',
    );
    // toutes les formes de lien Mermaid utilisables ici : têtes (-->, -.->, ==>), --x, --o et le lien ouvert ---
    const arrows = [...mmd.matchAll(/(-->|-\.->|==>|--[xo]|---)(.?)/g)];
    expect(arrows.length).toBeGreaterThan(0);
    for (const [, arrow, next] of arrows) {
      expect(next, `flèche nue « ${arrow} » dans diagram.mmd`).toBe('|');
    }
  });
});
