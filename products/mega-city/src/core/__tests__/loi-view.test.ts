import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundleRules, enforcingAgents, extractLoi, provenancePath, whoActivates } from '../loi-view.js';
import type { LoiGraph } from '../loi-view.js';
import type { CompiledGraph } from '../compiled-graph.js';

// Racine du dépôt (vectorz) : .../products/mega-city/src/core/__tests__ → 5 niveaux au-dessus.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const COMPILED_GRAPH_PATH = join(REPO_ROOT, '.ezk', 'graph.compiled.json');

/**
 * Le graphe compilé réel (fiche 20260821172716537, AC2/AC3). S'il manque, c'est que
 * `pnpm --dir products/mega-city graph:compile` n'a pas encore tourné — on ne le
 * régénère JAMAIS depuis un test (doctrine D5, la carte comme les tests LISENT l'objet).
 */
function loadRealCompiledGraph(): CompiledGraph {
  if (!existsSync(COMPILED_GRAPH_PATH)) {
    throw new Error(
      `Graphe compilé introuvable (${COMPILED_GRAPH_PATH}). ` +
        'Lance : pnpm --dir products/mega-city graph:compile',
    );
  }
  return JSON.parse(readFileSync(COMPILED_GRAPH_PATH, 'utf8')) as CompiledGraph;
}

describe('extractLoi — le sous-graphe LA LOI (règles/bundles/profils), lu du graphe compilé', () => {
  it('AC2 : le compte de nœuds extraits égale exactement le compte du graphe compilé', () => {
    const graph = loadRealCompiledGraph();
    const expected = graph.nodes.filter((n) =>
      (['rule', 'bundle', 'profile'] as const).includes(n.kind as 'rule' | 'bundle' | 'profile'),
    );

    const { nodes } = extractLoi(graph);

    expect(nodes).toHaveLength(expected.length);
    expect(nodes.every((n) => n.kind === 'rule' || n.kind === 'bundle' || n.kind === 'profile')).toBe(
      true,
    );
  });

  it('AC3/D3 : chaque nœud rule/bundle/profile a une provenance qui existe sur le disque', () => {
    const graph = loadRealCompiledGraph();
    const { nodes } = extractLoi(graph);

    expect(nodes.length).toBeGreaterThan(0); // garde contre un filtre qui viderait tout

    for (const node of nodes) {
      const rel = provenancePath(node.kind as 'rule' | 'bundle' | 'profile', node.id);
      const abs = join(REPO_ROOT, rel);
      expect(existsSync(abs), `provenance manquante pour ${node.kind} ${node.id} → ${rel}`).toBe(
        true,
      );
    }
  });

  it('filtre les arêtes : ne garde que celles qui touchent un nœud rule/bundle/profile', () => {
    const graph: CompiledGraph = {
      nodes: [
        { kind: 'rule', id: 'architecture/mvp-first' },
        { kind: 'bundle', id: 'architecture' },
        { kind: 'profile', id: 'global' },
        { kind: 'agent', id: 'ezk-dev' },
        { kind: 'skill', id: 'ezk-backlog' },
      ],
      edges: [
        { from: 'architecture', fromKind: 'bundle', link: 'bundle-rule', to: 'architecture/mvp-first', toKind: 'rule' },
        { from: 'global', fromKind: 'profile', link: 'profile-bundle', to: 'architecture', toKind: 'bundle' },
        { from: 'global', fromKind: 'profile', link: 'profile-skill', to: 'ezk-backlog', toKind: 'skill' },
        // hors-LOI : ne touche ni rule, ni bundle, ni profile
        { from: 'ezk-dev', fromKind: 'agent', link: 'competences', to: 'ezk-backlog', toKind: 'skill' },
      ],
    };

    const { edges } = extractLoi(graph);

    expect(edges).toHaveLength(3);
    expect(edges).not.toContainEqual(
      expect.objectContaining({ from: 'ezk-dev', to: 'ezk-backlog', link: 'competences' }),
    );
  });

  it('provenancePath : chemins conventionnels par kind (D3)', () => {
    expect(provenancePath('rule', 'architecture/mvp-first')).toBe(
      'products/mega-city/rules/architecture/mvp-first.md',
    );
    expect(provenancePath('bundle', 'architecture')).toBe('products/mega-city/bundles/architecture.yml');
    expect(provenancePath('profile', 'global')).toBe('products/mega-city/profiles/global.yml');
  });
});

describe('whoActivates — « qui active quoi », HÉRITAGE compris (AC4, régression revue 2026-08-26)', () => {
  it('P0 : mobile hérite du bundle base, de ses règles et du skill de base (profile-extends + bundle-extends)', () => {
    const loi = extractLoi(loadRealCompiledGraph());
    const wa = whoActivates(loi, 'mobile');

    // mobile profile-extends base ; le bundle `mobile` bundle-extends le bundle `base`.
    expect(wa.bundles).toContain('base'); // HÉRITÉ — omis avant le fix (bug NO-GO)
    expect(wa.bundles).toContain('mobile'); // direct
    expect(wa.rules).toContain('clean-code/no-dead-code'); // via bundle base (hérité)
    expect(wa.rules).toContain('conventional-commits/format'); // via bundle base (hérité)
    expect(wa.skills).toContain('ezk-archive'); // profile-skill de base, hérité
    expect(wa.skills).toContain('ezk-commits'); // direct
  });

  it('synthétique : ferme profile-extends ET bundle-extends, sans doublon, trié', () => {
    const loi: LoiGraph = {
      nodes: [],
      edges: [
        { from: 'child', fromKind: 'profile', link: 'profile-extends', to: 'parent', toKind: 'profile' },
        { from: 'parent', fromKind: 'profile', link: 'profile-bundle', to: 'b-base', toKind: 'bundle' },
        { from: 'child', fromKind: 'profile', link: 'profile-bundle', to: 'b-own', toKind: 'bundle' },
        { from: 'b-own', fromKind: 'bundle', link: 'bundle-extends', to: 'b-base', toKind: 'bundle' },
        { from: 'b-base', fromKind: 'bundle', link: 'bundle-rule', to: 'r-inherited', toKind: 'rule' },
        { from: 'b-own', fromKind: 'bundle', link: 'bundle-rule', to: 'r-own', toKind: 'rule' },
        { from: 'parent', fromKind: 'profile', link: 'profile-skill', to: 's-parent', toKind: 'skill' },
        { from: 'child', fromKind: 'profile', link: 'profile-agent', to: 'a-child', toKind: 'agent' },
      ],
    };

    const wa = whoActivates(loi, 'child');

    expect(wa.bundles).toEqual(['b-base', 'b-own']);
    expect(wa.rules).toEqual(['r-inherited', 'r-own']);
    expect(wa.agents).toEqual(['a-child']);
    expect(wa.skills).toEqual(['s-parent']);
  });
});

describe('enforcingAgents & bundleRules — les liens règle→agent (enforces) et bundle→règle (AC3)', () => {
  it('réel : clean-code/no-dead-code est gardée par ezk-reviewer (enforces)', () => {
    const loi = extractLoi(loadRealCompiledGraph());
    expect(enforcingAgents(loi, 'clean-code/no-dead-code')).toContain('ezk-reviewer');
  });

  it('règle sans enforces → tableau vide', () => {
    const loi: LoiGraph = { nodes: [], edges: [] };
    expect(enforcingAgents(loi, 'peu-importe')).toEqual([]);
  });

  it('réel : le bundle base porte ses règles', () => {
    const loi = extractLoi(loadRealCompiledGraph());
    expect(bundleRules(loi, 'base')).toContain('clean-code/no-dead-code');
  });
});
