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
import { SPRINT_REPORT_SCHEMA } from '../src/sprint-metrics/domain/types.js';
import { type ParsedSession, detectCandidates, parseSessionMarkdown } from '../src/core/ezk-chef-suggest.js';

function fail(msg: string): never {
  console.error(`ezk-chef suggest : ${msg}`);
  process.exit(1);
}

function readReport(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    fail(`rapport de sprint introuvable : "${path}"`);
  }
  let report: { schema?: unknown };
  try {
    report = JSON.parse(raw!) as { schema?: unknown };
  } catch {
    fail(`rapport de sprint : JSON invalide "${path}"`);
  }
  if (report!.schema !== SPRINT_REPORT_SCHEMA) {
    fail(`rapport de sprint : schéma inattendu dans "${path}" (attendu "${SPRINT_REPORT_SCHEMA}")`);
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
    fail('au moins un récit de session est requis (les chemins transmis par la rétro) — refus plutôt que deviner.');
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
