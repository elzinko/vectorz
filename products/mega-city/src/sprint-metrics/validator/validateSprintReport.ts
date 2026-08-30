import { readFileSync } from 'node:fs';

export interface Violation {
  code: string;
  message: string;
}

export interface Notice {
  code: string;
  message: string;
}

export interface ValidationResult {
  violations: Violation[];
  notices: Notice[];
  code: 0 | 1;
}

const REQUIRED_TOP_FIELDS = ['schema', 'sprint', 'generatedAt', 'window', 'duration', 'tokens', 'kpi', 'steps'] as const;

/**
 * Un champ présent mais `null` (ou d'un mauvais type) passe le contrôle `field in
 * report` : il faut donc revérifier que chaque section est bien un objet avant d'y
 * accéder, sinon le validateur PLANTE au lieu de rendre une violation — or son rôle est
 * justement d'encaisser un rapport corrompu/tronqué à la main.
 */
function asObject(x: unknown): Record<string, unknown> | null {
  return typeof x === 'object' && x !== null && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}

/**
 * Validateur calqué sur `journal-validator` (cop1) : refuse un rapport de
 * sprint tronqué/incohérent, accepte un rapport complet. Lit un CHEMIN de
 * fichier JSON (pas un objet déjà parsé) pour rester au plus près de l'usage
 * CLI/CI réel — un fichier absent ou mal formé est déjà une violation.
 */
export function validateSprintReport(jsonPath: string): ValidationResult {
  const violations: Violation[] = [];
  const notices: Notice[] = [];

  let raw: string;
  try {
    raw = readFileSync(jsonPath, 'utf8');
  } catch {
    violations.push({ code: 'report.missing', message: `Fichier introuvable : "${jsonPath}"` });
    return { violations, notices, code: 1 };
  }

  let report: Record<string, unknown>;
  try {
    report = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    violations.push({ code: 'report.invalid_json', message: `JSON invalide : "${jsonPath}"` });
    return { violations, notices, code: 1 };
  }

  for (const field of REQUIRED_TOP_FIELDS) {
    if (!(field in report)) {
      violations.push({ code: 'report.missing_field', message: `Champ manquant : "${field}"` });
    }
  }
  if (violations.length > 0) return { violations, notices, code: 1 };

  const sprint = asObject(report.sprint);
  if (!sprint || typeof sprint.slug !== 'string' || sprint.slug.length === 0) {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant/invalide : "sprint.slug"' });
  }

  const window = asObject(report.window);
  if (!window || typeof window.startTs !== 'string' || typeof window.endTs !== 'string') {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant/invalide : "window.startTs"/"window.endTs"' });
  }

  const duration = asObject(report.duration);
  if (!duration || typeof duration.ms !== 'number') {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant/invalide : "duration.ms"' });
  } else if (duration.ms < 0) {
    violations.push({ code: 'duration.negative', message: `duration.ms négatif (${duration.ms})` });
  }

  const tokens = asObject(report.tokens);
  if (!tokens) {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant/invalide : "tokens"' });
  } else {
    if (typeof tokens.grain !== 'string' || !['sprint', 'session'].includes(tokens.grain)) {
      violations.push({
        code: 'tokens.invalid_grain',
        message: `tokens.grain hors {sprint,session} : "${String(tokens.grain)}"`,
      });
    }
    const { inputTokens, outputTokens, totalTokens } = tokens;
    if (typeof inputTokens !== 'number' || typeof outputTokens !== 'number' || typeof totalTokens !== 'number') {
      violations.push({ code: 'report.missing_field', message: 'Champ manquant/invalide : "tokens.{input,output,total}Tokens"' });
    } else if (inputTokens + outputTokens !== totalTokens) {
      violations.push({
        code: 'tokens.sum_mismatch',
        message: `input+output (${inputTokens}+${outputTokens}) ≠ total (${totalTokens})`,
      });
    }
  }

  const kpi = report.kpi as Record<string, unknown> | undefined;
  const shippedFeatures = kpi?.shippedFeatures as Record<string, unknown> | undefined;
  if (shippedFeatures === undefined || typeof shippedFeatures.count !== 'number' || !Array.isArray(shippedFeatures.ids)) {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant : "kpi.shippedFeatures"' });
  } else if (shippedFeatures.count !== shippedFeatures.ids.length) {
    violations.push({
      code: 'kpi.count_mismatch',
      message: `kpi.shippedFeatures.count (${shippedFeatures.count}) ≠ nombre d'ids (${shippedFeatures.ids.length})`,
    });
  }

  const blockages = kpi?.blockages as Record<string, unknown> | undefined;
  if (blockages === undefined || typeof blockages.count !== 'number' || !Array.isArray(blockages.events)) {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant : "kpi.blockages"' });
  } else if (blockages.count !== blockages.events.length) {
    violations.push({
      code: 'kpi.count_mismatch',
      message: `kpi.blockages.count (${blockages.count}) ≠ nombre d'événements (${blockages.events.length})`,
    });
  }

  const prRetouches = kpi?.prRetouches as Record<string, unknown> | undefined;
  if (
    prRetouches === undefined ||
    typeof prRetouches.total !== 'number' ||
    typeof prRetouches.sansRetouche !== 'number' ||
    typeof prRetouches.indetermine !== 'number'
  ) {
    violations.push({ code: 'report.missing_field', message: 'Champ manquant : "kpi.prRetouches"' });
  } else if (prRetouches.sansRetouche + prRetouches.indetermine !== prRetouches.total) {
    violations.push({
      code: 'kpi.sum_mismatch',
      message: `somme(prRetouches) (${prRetouches.sansRetouche}+${prRetouches.indetermine}) ≠ total (${prRetouches.total})`,
    });
  }

  const steps = report.steps as Record<string, unknown> | undefined;
  if (steps?.ventilated === true) {
    const breakdown = (steps as { breakdown?: Array<{ durationMs?: number }> }).breakdown;
    if (Array.isArray(breakdown) && duration !== null && typeof duration.ms === 'number') {
      const sum = breakdown.reduce((acc, s) => acc + (typeof s.durationMs === 'number' ? s.durationMs : 0), 0);
      if (sum !== duration.ms) {
        violations.push({
          code: 'steps.sum_mismatch',
          message: `somme(étapes) (${sum}) ≠ duration.ms (${duration.ms})`,
        });
      }
    }
  } else {
    notices.push({
      code: 'steps.not_ventilated',
      message: 'Rapport non ventilé par étape (MVP : total du sprint seulement).',
    });
  }

  return { violations, notices, code: violations.length === 0 ? 0 : 1 };
}
