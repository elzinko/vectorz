/**
 * composes-graph — DÉTERMINISTE et PUR (ADR-0025 §5).
 *
 * Construit le bloc Mermaid managé du graphe `composes:` (arêtes internes entre
 * skills du catalogue) et sait le poser dans un texte existant entre des marqueurs
 * délimités, en préservant tout le reste à 100 % — même filet que
 * `catalog-readme.test.ts`. Aucun I/O ici : lire/écrire le fichier est le job du
 * script `bin/regen-composes-graph.ts` (le bord).
 */
import type { Catalog } from '../loaders/catalog.js';

export interface ComposesEdge {
  from: string;
  to: string;
  /** `delegates:` (optionnel, dessiné en pointillé) ; absent pour `composes:` (requis, trait plein). */
  optional?: boolean;
}

export const COMPOSES_GRAPH_BEGIN = '<!-- composes-graph:begin -->';
export const COMPOSES_GRAPH_END = '<!-- composes-graph:end -->';

/**
 * Arêtes `composes:` (requises) puis `delegates:` (optionnelles) de tout le catalogue, internes,
 * dédupliquées et triées stablement. Une cible à la fois composée ET déléguée reste requise.
 */
export function composesEdges(catalog: Catalog): ComposesEdge[] {
  const seen = new Set<string>();
  const edges: ComposesEdge[] = [];
  const skillIds = [...catalog.skills.keys()].sort();
  for (const from of skillIds) {
    const skill = catalog.skills.get(from);
    const tiers: { targets: readonly string[]; optional: boolean }[] = [
      { targets: skill?.composes ?? [], optional: false },
      { targets: skill?.delegates ?? [], optional: true },
    ];
    for (const { targets, optional } of tiers) {
      for (const to of [...targets].sort()) {
        const key = `${from} ${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push(optional ? { from, to, optional } : { from, to });
      }
    }
  }
  return edges;
}

/**
 * Rendu Mermaid `flowchart LR` des arêtes de composition : trait plein (`-->`) pour `composes:`,
 * pointillé (`-.->`) pour `delegates:`. Déterministe.
 */
export function renderComposesGraphMermaid(catalog: Catalog): string {
  const edges = composesEdges(catalog);
  const lines = [
    'flowchart LR',
    ...edges.map(({ from, to, optional }) => `    ${from} ${optional ? '-.->' : '-->'} ${to}`),
  ];
  return lines.join('\n');
}

/** Bloc managé complet (marqueurs + fence Mermaid), prêt à insérer dans un README. */
export function buildComposesGraphBlock(catalog: Catalog): string {
  return [
    COMPOSES_GRAPH_BEGIN,
    '```mermaid',
    renderComposesGraphMermaid(catalog),
    '```',
    COMPOSES_GRAPH_END,
  ].join('\n');
}

/**
 * Pose `block` dans `text` entre les marqueurs : les remplace s'ils existent déjà
 * (contenu intermédiaire compris), sinon ajoute une section neuve en fin de
 * fichier sous un titre dédié. Préserve tout le reste du texte à 100 %.
 */
export function upsertManagedBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(COMPOSES_GRAPH_BEGIN);
  const endIdx = text.indexOf(COMPOSES_GRAPH_END);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = text.slice(0, beginIdx);
    const after = text.slice(endIdx + COMPOSES_GRAPH_END.length);
    return `${before}${block}${after}`;
  }
  const separator = text.endsWith('\n') ? '\n' : '\n\n';
  return `${text}${separator}## Graphe de composition (\`composes:\`)\n\n${block}\n`;
}
