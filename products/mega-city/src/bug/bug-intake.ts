/**
 * ezk-bug — structuration déterministe d'une fiche bug (fiche 0152).
 *
 * Ce module fait le DÉTERMINISTE : valider un rapport de repro et produire le corps
 * markdown d'une fiche `type: bug` (gabarit inline ; sévérité en ligne de corps — pas de
 * champ `severity:`). Le pilotage réel de l'app (repro) passe par le Playwright MCP
 * partagé, côté skill ; le filing final passe par `ezk-backlog add`. ADR-0001 : le
 * module structure, la glue (SKILL) compose.
 */

/** Résultat d'une tentative de reproduction (statuts de la fiche 0152). */
export type ReproStatus = 'oui' | 'partiel' | 'non' | 'hors-portée';

export interface BugReport {
  title: string;
  /** Symptôme signalé (rapport brut). */
  symptom: string;
  /** Étapes de reproduction, si connues. */
  steps?: string[];
  expected?: string;
  actual?: string;
  environment?: string;
  reproduced: ReproStatus;
  /** Obligatoire dès que `reproduced !== 'oui'` (ce qui a été tenté, hypothèses). */
  reason?: string;
  /** Chemin d'une preuve (screenshot), si disponible. */
  evidence?: string;
  /** Sévérité — rendue en LIGNE de corps, jamais en champ de front-matter. */
  severity?: string;
}

export interface BugIntakeResult {
  ok: boolean;
  errors: string[];
  /** Corps markdown de la fiche bug (vide si erreurs bloquantes). */
  body: string;
}

function bullet(label: string, value: string | undefined): string {
  return value && value.trim() ? `- **${label}** : ${value.trim()}\n` : '';
}

/**
 * Valide un rapport de bug et produit le corps markdown de sa fiche.
 *
 * Règle dure : `raison` est obligatoire dès que la repro n'est pas `oui`. Le corps est
 * produit **même quand la repro échoue** (`non` / `hors-portée`) — un bug non reproduit
 * reste une fiche exploitable, jamais un silence.
 */
export function buildBugCard(report: BugReport): BugIntakeResult {
  const errors: string[] = [];
  if (!report.title?.trim()) errors.push('title manquant');
  if (!report.symptom?.trim()) errors.push('symptom manquant');
  if (report.reproduced !== 'oui' && !report.reason?.trim()) {
    errors.push(`raison obligatoire quand reproduced = "${report.reproduced}"`);
  }
  if (errors.length > 0) return { ok: false, errors, body: '' };

  const parts: string[] = [];
  parts.push(`## Symptôme\n\n${report.symptom.trim()}\n`);

  parts.push('\n## Reproduction\n\n');
  parts.push(bullet('reproduit', report.reproduced));
  if (report.reproduced !== 'oui') parts.push(bullet('raison', report.reason));

  if (report.steps?.length) {
    parts.push('\n### Étapes\n\n');
    report.steps.forEach((step, i) => parts.push(`${i + 1}. ${step}\n`));
  }
  if (report.expected || report.actual) {
    parts.push('\n### Attendu vs obtenu\n\n');
    parts.push(bullet('attendu', report.expected));
    parts.push(bullet('obtenu', report.actual));
  }

  if (report.environment?.trim()) parts.push(`\n## Environnement\n\n${report.environment.trim()}\n`);
  if (report.evidence?.trim()) parts.push(`\n## Preuve\n\n${report.evidence.trim()}\n`);
  if (report.severity?.trim()) parts.push(`\n## Sévérité\n\n${report.severity.trim()}\n`);

  return { ok: true, errors: [], body: parts.join('') };
}
