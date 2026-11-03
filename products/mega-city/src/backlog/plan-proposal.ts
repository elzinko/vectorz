/**
 * plan-proposal — les lignes de plan à copier pour des fiches absentes de `features/PLAN.md`
 * (fiche 20261101131506254).
 *
 * En clair : après un découpage, les fiches sœurs n'entraient pas au plan, et `plan-lot` les écartait
 * ensuite « hors plan ». Ce module rédige leur ligne au format du plan, rangée par milestone. Il
 * PROPOSE : le plan reste tenu à la main, rien ne l'écrit. Logique PURE, sans I/O (ADR-0003).
 */

/** Ce qu'il faut savoir d'une fiche pour écrire sa ligne de plan. */
export interface PlanCandidate {
  id: string;
  title: string;
  status: string;
  /** `''` pour une fiche sans milestone. */
  milestone: string;
}

/** Les lignes à copier sous une milestone du plan. */
export interface PlanProposal {
  milestone: string;
  lines: string[];
}

/** La ligne d'une fiche au format du plan : `· build` pour une fiche prête, `· groom` sinon. */
export function planLine(c: PlanCandidate): string {
  return `- \`${c.id}\` — ${c.title} · ${c.status === 'ready' ? 'build' : 'groom'}`;
}

/** Les lignes des fiches absentes du plan, rangées par milestone dans l'ordre où elles arrivent. */
export function proposePlanLines(candidates: readonly PlanCandidate[], planIds: readonly string[]): PlanProposal[] {
  const planned = new Set(planIds);
  const groups = new Map<string, string[]>();
  for (const c of candidates) {
    if (planned.has(c.id)) continue;
    const lines = groups.get(c.milestone) ?? [];
    lines.push(planLine(c));
    groups.set(c.milestone, lines);
  }
  return [...groups].map(([milestone, lines]) => ({ milestone, lines }));
}

/** La sortie lisible : rien quand toutes les fiches sont déjà au plan. */
export function formatPlanProposals(proposals: readonly PlanProposal[]): string[] {
  if (proposals.length === 0) return [];
  const out = ["Au plan : ces fiches n'y sont pas. Copie chaque ligne sous sa milestone dans features/PLAN.md :"];
  for (const p of proposals) {
    out.push(p.milestone === '' ? '  sans milestone (choisis-en une) :' : `  milestone \`${p.milestone}\` :`);
    for (const l of p.lines) out.push(`    ${l}`);
  }
  return out;
}
