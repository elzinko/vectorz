/**
 * Oracle `supervision:analyze --expect` (fiche 0169).
 *
 * Compare la séquence d'events d'un run (déjà résumé par `analyzeSession`/
 * `summarizeRun`, fiche 0104) à une séquence ATTENDUE, déclarée en JSON. Sert
 * de vérification exploitable en CI : `matchRunToScenario` rend un verdict
 * pur (aucun effet de bord), le CLI (`bin/supervision-analyze.ts`) traduit ce
 * verdict en code retour process.
 *
 * Un « scénario » décrit la séquence attendue ET les réponses du siège
 * (gate.resumed / run.finished attendus, avec leurs contraintes de champ) —
 * il n'y a pas de format séparé pour l'un et l'autre.
 */
import { readFileSync } from 'node:fs';
import type { RunSummary } from './analyze.js';

/** Un événement de run tel qu'exposé par `RunSummary.events` (fiche 0104). */
type RunEvent = RunSummary['events'][number];

/**
 * Une étape attendue. `min` encode le quantificateur « + » (ex. `heartbeat+`
 * → `{type:"heartbeat", min:1}`) : au moins N occurrences CONSÉCUTIVES du
 * même `type`, toutes consommées par cette étape. `min:0` rend l'étape
 * OPTIONNELLE (zéro occurrence tolérée). `min` doit être un entier ≥ 0
 * (validé par `loadScenario`). Les champs `gate_id` / `status` / `outcome`
 * sont des contraintes vérifiées sur CHAQUE occurrence consommée (comparaison
 * exacte sur le payload brut de l'event).
 */
export interface ScenarioStep {
  type: string;
  gate_id?: string;
  status?: string;
  outcome?: string;
  min?: number;
}

export interface Scenario {
  name?: string;
  run_id?: string;
  steps: ScenarioStep[];
}

export interface ExpectResult {
  ok: boolean;
  mismatches: string[];
}

const DEFAULT_MIN_OCCURRENCES = 1;

/** Rendu lisible d'une étape pour les messages de divergence : `type(champ=valeur,…)`. */
function describeStep(step: ScenarioStep): string {
  const constraints: string[] = [];
  if (step.gate_id !== undefined) constraints.push(`gate_id=${step.gate_id}`);
  if (step.status !== undefined) constraints.push(`status=${step.status}`);
  if (step.outcome !== undefined) constraints.push(`outcome=${step.outcome}`);
  return constraints.length > 0 ? `${step.type}(${constraints.join(',')})` : step.type;
}

/** Rendu lisible d'un event trouvé, pour la partie « trouvé … » du message. */
function describeFound(event: RunEvent | undefined): string {
  if (!event) return 'fin du run';
  return event.payloadSummary ? `${event.type} (${event.payloadSummary})` : event.type;
}

const CONSTRAINT_FIELDS = ['gate_id', 'status', 'outcome'] as const;

/** Première contrainte de champ non respectée par l'event, sous forme de message, sinon `undefined`. */
function findFieldMismatch(step: ScenarioStep, event: RunEvent): string | undefined {
  for (const field of CONSTRAINT_FIELDS) {
    const expected = step[field];
    if (expected === undefined) continue;
    const actual = event.payload[field];
    if (actual !== expected) {
      return `${field} attendu ${expected}, trouvé ${actual === undefined ? '∅' : String(actual)}`;
    }
  }
  return undefined;
}

/**
 * Vérifie que la séquence d'events du run satisfait la séquence de steps,
 * DANS L'ORDRE : chaque step consomme, à la position courante, les
 * occurrences consécutives de son `type` (au moins `min`, défaut 1). Les
 * events surnuméraires en fin de run (après le dernier step) ne sont pas
 * une divergence — le scénario décrit un préfixe attendu, pas la totalité.
 */
export function matchRunToScenario(run: RunSummary, scenario: Scenario): ExpectResult {
  const events = run.events;
  const mismatches: string[] = [];
  let cursor = 0;

  scenario.steps.forEach((step, index) => {
    const min = step.min ?? DEFAULT_MIN_OCCURRENCES;
    const stepNumber = index + 1;
    const stepLabel = describeStep(step);

    let matched = 0;
    while (cursor + matched < events.length && events[cursor + matched].type === step.type) {
      matched += 1;
    }

    if (matched < min) {
      mismatches.push(
        `step ${stepNumber} attendu ${stepLabel}` +
          (min > DEFAULT_MIN_OCCURRENCES ? ` (x${min} min)` : '') +
          `, trouvé ${describeFound(events[cursor + matched])}`,
      );
      return;
    }

    for (let k = 0; k < matched; k += 1) {
      const event = events[cursor + k];
      const fieldMismatch = findFieldMismatch(step, event);
      if (fieldMismatch) {
        mismatches.push(`step ${stepNumber} attendu ${stepLabel}, trouvé ${event.type} (${fieldMismatch})`);
      }
    }

    cursor += matched;
  });

  return { ok: mismatches.length === 0, mismatches };
}

/** Charge et valide un scénario JSON. Aucune dépendance externe (JSON natif). */
export function loadScenario(filePath: string): Scenario {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`scenario introuvable ou illisible : ${filePath} — ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`scenario invalide (JSON illisible) : ${filePath} — ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`scenario invalide : ${filePath} — attendu un objet JSON avec un champ "steps"`);
  }
  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
    throw new Error(`scenario invalide : ${filePath} — "steps" doit être un tableau non vide`);
  }
  obj.steps.forEach((step, i) => {
    if (!step || typeof step !== 'object' || typeof (step as Record<string, unknown>).type !== 'string') {
      throw new Error(`scenario invalide : ${filePath} — step ${i + 1} doit avoir un champ "type" (string)`);
    }
    const min = (step as Record<string, unknown>).min;
    if (min !== undefined && (typeof min !== 'number' || !Number.isInteger(min) || min < 0)) {
      throw new Error(`scenario invalide : ${filePath} — step ${i + 1} "min" doit être un entier ≥ 0`);
    }
  });

  return {
    name: typeof obj.name === 'string' ? obj.name : undefined,
    run_id: typeof obj.run_id === 'string' ? obj.run_id : undefined,
    steps: obj.steps as ScenarioStep[],
  };
}
