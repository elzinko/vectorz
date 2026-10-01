/**
 * law-coverage — une règle « un agent la contrôle » arrive-t-elle vraiment chez cet agent ?
 * (fiche 20260903134909124, ADR-0056 — voie 3 : le cliquet).
 *
 * PUR (ADR-0003). Une règle `enforcements: agent-check` nomme l'agent qui doit la contrôler.
 * Elle n'atteint cet agent que si son prompt la porte : le corps de son rôle la cite par son id
 * ou son titre. La liste `interactions` de l'en-tête ne compte pas : Claude Code retire l'en-tête
 * avant de bâtir le prompt, le modèle ne la lit jamais. Sinon la règle est au catalogue et
 * l'agent ne la lit pas : « panneau sans casques ».
 */
import type { Agent, Rule } from '../domain/model.js';

export interface AgentCheck {
  rule: string;
  agent: string;
  /** L'agent nommé existe-t-il au catalogue ? (un agent inconnu ne cite rien.) */
  agentExists: boolean;
  /** Le prompt de l'agent porte-t-il la règle ? */
  cited: boolean;
}

function cites(agent: Agent, rule: Rule): boolean {
  const title = rule.title?.trim();
  return agent.role.includes(rule.id) || (title !== undefined && title !== '' && agent.role.includes(title));
}

/** Une ligne par couple (règle, agent) déclaré en `agent-check`, trié par règle puis agent. */
export function agentCheckCoverage(rules: Iterable<Rule>, agents: Map<string, Agent>): AgentCheck[] {
  const rows: AgentCheck[] = [];
  for (const rule of rules) {
    for (const enforcement of rule.enforcements ?? []) {
      if (enforcement.type !== 'agent-check' || !enforcement.agent) continue;
      const agent = agents.get(enforcement.agent);
      rows.push({
        rule: rule.id,
        agent: enforcement.agent,
        agentExists: agent !== undefined,
        cited: agent !== undefined && cites(agent, rule),
      });
    }
  }
  return rows.sort((a, b) => (a.rule + a.agent < b.rule + b.agent ? -1 : 1));
}

/** La clé d'un couple, telle qu'elle s'écrit dans la dette. */
export function checkKey(row: Pick<AgentCheck, 'rule' | 'agent'>): string {
  return `${row.rule} → ${row.agent}`;
}

export interface RatchetVerdict {
  /** Règles non citées ET absentes de la dette : une aggravation. */
  newlyUncited: string[];
  /** Entrées de la dette devenues citées, ou dont la règle a disparu : à retirer. */
  staleDebt: string[];
}

/** Compare l'état réel à la dette consignée : la dette peut se vider, jamais grossir. */
export function ratchet(coverage: AgentCheck[], debt: AgentCheckDebt[]): RatchetVerdict {
  const uncited = new Set(coverage.filter((c) => !c.cited).map(checkKey));
  const debtKeys = new Set(debt.map(checkKey));
  return {
    newlyUncited: [...uncited].filter((k) => !debtKeys.has(k)).sort(),
    staleDebt: [...debtKeys].filter((k) => !uncited.has(k)).sort(),
  };
}

export interface AgentCheckDebt {
  rule: string;
  agent: string;
}
