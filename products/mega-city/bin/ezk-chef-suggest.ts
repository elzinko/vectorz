/**
 * ezk-chef-suggest (CLI) — bord I/O de `ezk-chef suggest` (fiche 20260831075615809).
 * Le cœur PUR (parsing + détection) vit dans src/core/ezk-chef-suggest.ts ; ICI = lecture
 * disque, refus francs, affichage. Lecture SEULE : n'écrit jamais rien.
 *
 * Usage : ezk-chef suggest <rapport-sprint.json> <recit-session.md>...
 *
 * Les CHEMINS sont fournis explicitement par l'appelant (la rétro) — ce script ne devine
 * ni le sprint ni les sessions qui lui appartiennent (fiche §1).
 */
import { readFileSync } from 'node:fs';
import {
  type ParsedSession,
  detectCandidates,
  parseSessionMarkdown,
} from '../src/core/ezk-chef-suggest.js';
import { SPRINT_REPORT_SCHEMA, type SprintReport } from '../src/sprint-metrics/domain/types.js';

function fail(msg: string): never {
  console.error(`ezk-chef suggest : ${msg}`);
  process.exit(1);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Garde de forme : le JSON lu est-il un SprintReport COMPLET, pas seulement le discriminateur ?
 * On rejette aussi bien `null` (JSON valide mais vide, qui faisait crasher la lecture) qu'un stub
 * tronqué `{"schema":…}` — sinon un artefact corrompu serait accepté comme le sprint explicite
 * (retour Codex PR #214). Contrôle des champs requis, pas une validation exhaustive du domaine.
 */
function isSprintReport(value: unknown): value is SprintReport {
  if (!isObject(value)) return false;
  if (value.schema !== SPRINT_REPORT_SCHEMA) return false;
  const sprint = value.sprint;
  if (!isObject(sprint) || typeof sprint.slug !== 'string') return false;
  if (typeof value.generatedAt !== 'string') return false;
  const window = value.window;
  if (!isObject(window) || typeof window.startTs !== 'string' || typeof window.endTs !== 'string')
    return false;
  if (!isObject(value.kpi)) return false;
  return true;
}

function readReport(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    fail(`rapport de sprint introuvable : "${path}"`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw!);
  } catch {
    fail(`rapport de sprint : JSON invalide "${path}"`);
  }
  if (!isSprintReport(parsed)) {
    fail(
      `rapport de sprint : forme invalide dans "${path}" (attendu un "${SPRINT_REPORT_SCHEMA}" complet : sprint, window, kpi…)`,
    );
  }
}

function readSession(path: string): ParsedSession {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    fail(`récit de session introuvable : "${path}"`);
  }
  return parseSessionMarkdown(raw!, path);
}

function main(): void {
  const [reportPath, ...sessionPaths] = process.argv.slice(2);

  if (!reportPath) {
    fail('sprint explicite requis — usage : ezk-chef suggest <rapport.json> <session.md>...');
  }
  if (sessionPaths.length === 0) {
    fail(
      'au moins un récit de session est requis (les chemins transmis par la rétro) — refus plutôt que deviner.',
    );
  }
  // Refus franc sur la NATURE des arguments : UN seul rapport (.json), le reste = récits (.md).
  // Sans ça, `suggest a.json b.json session.md` lirait b.json comme une session vide et émettrait
  // quand même des candidats — un sprint ambigu doit être refusé (retour Codex PR #214, fiche §1).
  if (!reportPath.endsWith('.json')) {
    fail(`rapport de sprint attendu en .json — reçu "${reportPath}".`);
  }
  const intrus = sessionPaths.filter((p) => !p.endsWith('.md'));
  if (intrus.length > 0) {
    fail(
      `récits de session attendus en .md (un seul rapport de sprint accepté) — inattendu : ${intrus.join(', ')}.`,
    );
  }

  readReport(reportPath); // lu pour identifier le sprint / refuser un rapport corrompu — jamais écrit
  const sessions = sessionPaths.map(readSession);
  const candidates = detectCandidates(sessions);

  if (candidates.length === 0) {
    console.log('ezk-chef suggest : zéro candidat-recette sur ce sprint.');
    return;
  }

  console.log(`ezk-chef suggest : ${candidates.length} candidat(s)-recette :`);
  for (const c of candidates) {
    console.log(`- ${c.ficheId} — ${c.motif}`);
    for (const p of c.pointeurs) console.log(`    ${p}`);
  }
}

main();
