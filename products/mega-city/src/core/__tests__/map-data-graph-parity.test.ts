/**
 * map-data-graph-parity — preuve que le graphe compilé (`compileGraph`) porte déjà tous
 * les liens que `buildMapData` re-dérive aujourd'hui en re-parcourant le catalogue.
 *
 * Fiche 357, sliver ADR-0040 : avant de faire dériver `buildMapData` de `CompiledGraph.edges`
 * (plus de second parcours du catalogue pour les liens), on prouve la PARITÉ sur le
 * catalogue réel — reconstruire chaque champ lien/index à partir des arêtes compilées doit
 * donner EXACTEMENT ce que `buildMapData` produit aujourd'hui.
 */
import { describe, expect, it } from 'vitest';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileGraph } from '../compiled-graph.js';
import type { Edge, LinkType } from '../graph.js';
import { buildMapData } from '../map-data.js';
import { loadCatalog } from '../../loaders/catalog.js';
import { loadTaxonomieDoc } from '../../loaders/taxonomie.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../../..'); // products/mega-city

const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

/** Toutes les cibles `to` des arêtes `link` sortant de `from` (skill/agent/profile/bundle → …). */
function outTo(edges: Edge[], link: LinkType, from: string): string[] {
  return sorted(edges.filter((e) => e.link === link && e.from === from).map((e) => e.to));
}

/** Toutes les origines `from` des arêtes `link` entrant sur `to` (index inverse). */
function inFrom(edges: Edge[], link: LinkType, to: string): string[] {
  return sorted(edges.filter((e) => e.link === link && e.to === to).map((e) => e.from));
}

describe('parité buildMapData ↔ compileGraph(catalog).edges (catalogue réel)', () => {
  const catalog = loadCatalog(megaCity);
  const graph = compileGraph(catalog);
  const data = buildMapData(catalog, graph, undefined, loadTaxonomieDoc(megaCity));

  it('skills — composes/roles (sortant) et composedBy/profiles (index inverse)', () => {
    for (const [id, s] of Object.entries(data.skills)) {
      expect(outTo(graph.edges, 'composes', id), `composes de ${id}`).toEqual(s.composes);
      expect(outTo(graph.edges, 'roles', id), `roles de ${id}`).toEqual(s.roles);
      expect(inFrom(graph.edges, 'composes', id), `composedBy de ${id}`).toEqual(s.composedBy);
      expect(inFrom(graph.edges, 'profile-skill', id), `profiles de ${id}`).toEqual(s.profiles);
    }
  });

  it('agents — competences/interactions (sortant) et convokedBy/profiles (index inverse)', () => {
    for (const [id, a] of Object.entries(data.agents)) {
      expect(outTo(graph.edges, 'competences', id), `competences de ${id}`).toEqual(a.competences);
      expect(outTo(graph.edges, 'interactions', id), `interactions de ${id}`).toEqual(
        a.interactions,
      );
      expect(inFrom(graph.edges, 'roles', id), `convokedBy de ${id}`).toEqual(a.convokedBy);
      expect(inFrom(graph.edges, 'profile-agent', id), `profiles de ${id}`).toEqual(a.profiles);
    }
  });

  it('rules — bundles/agents (index inverse, les enforcements restent hors graphe)', () => {
    for (const [id, r] of Object.entries(data.rules)) {
      expect(inFrom(graph.edges, 'bundle-rule', id), `bundles de ${id}`).toEqual(r.bundles);
      expect(inFrom(graph.edges, 'interactions', id), `agents de ${id}`).toEqual(r.agents);
    }
  });

  it('bundles — extends/rules (sortant) et profiles (index inverse)', () => {
    for (const [id, b] of Object.entries(data.bundles)) {
      expect(outTo(graph.edges, 'bundle-extends', id), `extends de ${id}`).toEqual(b.extends);
      expect(outTo(graph.edges, 'bundle-rule', id), `rules de ${id}`).toEqual(b.rules);
      expect(inFrom(graph.edges, 'profile-bundle', id), `profiles de ${id}`).toEqual(b.profiles);
    }
  });

  it('profiles — extends/bundles/agents/skills/interactions (tout sortant)', () => {
    for (const [id, p] of Object.entries(data.profiles)) {
      expect(outTo(graph.edges, 'profile-extends', id), `extends de ${id}`).toEqual(p.extends);
      expect(outTo(graph.edges, 'profile-bundle', id), `bundles de ${id}`).toEqual(p.bundles);
      expect(outTo(graph.edges, 'profile-agent', id), `agents de ${id}`).toEqual(p.agents);
      expect(outTo(graph.edges, 'profile-skill', id), `skills de ${id}`).toEqual(p.skills);
      expect(outTo(graph.edges, 'profile-interaction', id), `interactions de ${id}`).toEqual(
        p.interactions,
      );
    }
  });
});
