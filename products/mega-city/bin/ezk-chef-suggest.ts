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
import { validateSprintReport } from '../src/sprint-metrics/validator/validateSprintReport.js';

function fail(msg: string): never {
  console.error(`ezk-chef suggest : ${msg}`);
  process.exit(1);
}

/**
 * Refuse un rapport de sprint absent, mal formé, tronqué ou incohérent — plutôt que de traiter un
 * artefact corrompu comme le sprint explicite (retour Codex PR #214). On RÉUTILISE le validateur du
 * domaine (`validateSprintReport`), qui énumère tous les champs requis et vérifie les sous-structures
 * (durée, tokens, KPI…) : pas de garde ad hoc plus faible ici (retour Codex sur `fd305c6`).
 */
function readReport(path: string): void {
  const { violations, code } = validateSprintReport(path);
  if (code !== 0) {
    fail(`rapport de sprint invalide "${path}" : ${violations.map((v) => v.message).join(' ; ')}`);
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
