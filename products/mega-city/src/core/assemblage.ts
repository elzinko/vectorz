/**
 * assemblage — la vue d'ensemble « qui compose quoi », COMPILÉE depuis le graphe.
 * DÉTERMINISTE et PUR (ADR-0003) — fiche 20260821163346490.
 *
 * POURQUOI : la première carte alignait six blocs (PO → LA LOI → L'ÉQUIPE → profiles/ →
 * caps/host → bind) reliés par des flèches nues : une chaîne de montage qui n'existait pas.
 * Les relations réelles sont de natures différentes. Un profil CONTIENT des bundles, des juges
 * et des commandes ; un bundle CONTIENT des règles ; le bind LIT un profil. Ici on ne dessine
 * que ce que le graphe compilé porte : une flèche par (source, verbe, cible), avec le NOMBRE de
 * liens qui la portent. Aucun nombre n'est écrit à la main.
 *
 * Le bind n'est pas dans le graphe : c'est du code (ADR-0003), pas une brique du catalogue. La
 * carte le dessine à part, en pointillé, et le compte « déduit » (lecture d'auteur).
 * (Ne pas confondre avec `composition.ts`, qui vérifie les `composes:` d'un profil résolu.)
 */
import type { CompiledGraph } from './compiled-graph.js';
import type { LinkVerb, NodeKind } from './graph.js';

export interface AssemblageArrow {
  from: NodeKind;
  verb: LinkVerb;
  to: NodeKind;
  count: number;
}

/** Le bind est hors graphe. `source` (le code) et `adr` sont posés par le bord s'il les connaît. */
export interface AssemblageBind {
  source?: string;
  adr?: string;
}

export interface AssemblageView {
  nodes: Record<NodeKind, number>;
  arrows: AssemblageArrow[];
  bind: AssemblageBind;
}

/** Regroupe les arêtes du graphe par (source, verbe, cible) et les compte. Trié → sortie stable. */
export function buildAssemblage(graph: CompiledGraph, bind: AssemblageBind = {}): AssemblageView {
  const nodes: Record<NodeKind, number> = { rule: 0, agent: 0, skill: 0, bundle: 0, profile: 0 };
  for (const n of graph.nodes) nodes[n.kind] += 1;

  const tally = new Map<string, AssemblageArrow>();
  for (const e of graph.edges) {
    const key = `${e.fromKind} ${e.verb} ${e.toKind}`;
    const arrow = tally.get(key) ?? { from: e.fromKind, verb: e.verb, to: e.toKind, count: 0 };
    arrow.count += 1;
    tally.set(key, arrow);
  }
  const arrows = [...tally].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, a]) => a);

  return { nodes, arrows, bind };
}
