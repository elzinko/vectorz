import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readEnvelopes } from './reader.js';
import { reduceState } from './reduceState.js';
import type { Notice, RunProjection, Violation } from './types.js';

/**
 * Read-model d'affichage d'un run (mode moniteur, fiche 0031 / ADR-028).
 * Réutilise `readEnvelopes` + le reducer d'état partagé `reduceState` — la
 * machine à états (et le verrou DP2 "zéro gate→phase") reste dans un seul
 * endroit, testé contre les mêmes fixtures que `validateRun`. Tokens jamais
 * auto-déclarés (D9) : `provenance` est `'absent'` tant qu'aucune mesure
 * runtime n'est câblée (aucune ne l'est dans ce POC).
 */
export function projectRun(runDir: string): RunProjection {
  const violations: Violation[] = [];
  const notices: Notice[] = [];

  const eventsPath = join(runDir, 'events.jsonl');
  if (!existsSync(eventsPath)) {
    violations.push({
      code: 'envelope.journal_missing',
      message: `Fichier "events.jsonl" introuvable dans le dossier de run "${runDir}"`,
    });
    return {
      runId: basename(runDir),
      state: 'launched',
      gates: [],
      violations,
      notices,
      tokens: { provenance: 'absent' },
    };
  }

  const events = readEnvelopes(eventsPath, violations, notices);
  const { state, gates, lastEventTs, lastEventSeq } = reduceState(events, violations, notices);
  const runId = events[0]?.envelope.run_id ?? basename(runDir);

  return {
    runId,
    state,
    lastEventTs,
    lastEventSeq,
    gates,
    violations,
    notices,
    tokens: { provenance: 'absent' },
  };
}
