/**
 * Les croisements de l'écran Process (fiche 20261126170000108) : qui appelle qui, agents par étape,
 * commandes partagées. Fonctions pures : tout vient du contrat `ezk process show --json`, rien n'est
 * écrit à la main.
 */
import type { ProcessEtape, ProcessShow, ProcessSkill } from './processShow.js';

/** Les trois niveaux de la méthode, en français. Une valeur inconnue reste telle quelle. */
const TIER_LABEL: Record<string, string> = { high: 'performant', middle: 'standard', low: 'économe' };
export const tierLabel = (tier: string): string => TIER_LABEL[tier] ?? tier;

export interface CallRow {
  skill: ProcessSkill;
  targets: { skill: ProcessSkill; libelle: string }[];
}

/** Pour chaque compétence, celles que les liens publiés lui font appeler. */
export function callLinks(contract: ProcessShow): CallRow[] {
  const byId = new Map(contract.skills.map((s) => [s.id, s]));
  return contract.skills.map((skill) => ({
    skill,
    targets: contract.liens.flatMap((l) => {
      const target = byId.get(l.vers);
      return l.de === skill.id && target ? [{ skill: target, libelle: l.libelle }] : [];
    }),
  }));
}

export interface AgentRow {
  agent: string;
  bySkill: Record<string, ProcessEtape[]>;
  total: number;
}

/** Chaque agent avec les étapes où il joue, par compétence ; le plus occupé d'abord. `known` ajoute ceux qui n'en ont aucune. */
export function agentMatrix(contract: ProcessShow, known: string[]): AgentRow[] {
  const rows = new Map<string, AgentRow>();
  const row = (agent: string): AgentRow => {
    const found = rows.get(agent);
    if (found) return found;
    const created: AgentRow = { agent, bySkill: {}, total: 0 };
    rows.set(agent, created);
    return created;
  };
  for (const skill of contract.skills) {
    for (const etape of skill.etapes) {
      for (const agent of etape.agents) {
        const r = row(agent);
        r.bySkill[skill.id] = [...(r.bySkill[skill.id] ?? []), etape];
        r.total += 1;
      }
    }
  }
  for (const agent of known) row(agent);
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

export interface CommandRow {
  skill: ProcessSkill;
  commands: { command: string; alsoIn: ProcessSkill[] }[];
}

/** Les commandes de chaque compétence, une fois chacune, avec les autres compétences qui les lancent aussi. */
export function commandTable(contract: ProcessShow): CommandRow[] {
  const ownCommands = (skill: ProcessSkill): string[] => [...new Set(skill.etapes.flatMap((e) => e.commandes))];
  return contract.skills.map((skill) => ({
    skill,
    commands: ownCommands(skill).map((command) => ({
      command,
      alsoIn: contract.skills.filter((other) => other.id !== skill.id && ownCommands(other).includes(command)),
    })),
  }));
}
