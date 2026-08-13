/**
 * Fiche 0044 — writer unique, append-only, vers `.improvement/outcomes.jsonl`.
 *
 * PROVISOIRE tant qu'ADR-030 n'est pas ratifié : le transport (dossier
 * `.improvement/`, format d'event) n'est pas gelé (ADR-030 A2 non tranché).
 *
 * AC5 : le chemin d'écriture est CODÉ EN DUR (`IMPROVEMENT_DIR`), jamais
 * paramétrable par l'appelant — aucune fonction de ce module n'accepte de
 * sous-chemin arbitraire, donc aucune écriture ne peut cibler `.supervision/`.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const IMPROVEMENT_DIR = '.improvement';
export const LEDGER_FILENAME = 'outcomes.jsonl';
export const MEASURER_VERSION = '0.1.0-provisoire';

export interface OutcomeMeasuredEvent {
  event: 'outcome.measured';
  ts: string;
  subject: { pr?: number; fiche?: string };
  metrics: Record<string, unknown>;
  measurer_version: string;
}

export function ledgerPath(rootDir: string): string {
  return join(rootDir, IMPROVEMENT_DIR, LEDGER_FILENAME);
}

/** Clé stable de dédup = event + sujet (pas les métriques : une seule mesure par sujet). */
export function eventKey(event: Pick<OutcomeMeasuredEvent, 'event' | 'subject'>): string {
  return `${event.event}:pr=${event.subject.pr ?? ''}:fiche=${event.subject.fiche ?? ''}`;
}

function readExistingKeys(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const keys = new Set<string>();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      keys.add(eventKey(JSON.parse(line)));
    } catch {
      // ligne corrompue : ignorée à la lecture, jamais réécrite (append-only strict)
    }
  }
  return keys;
}

export interface AppendResult {
  written: number;
  skippedDuplicates: number;
}

/**
 * AC5/AC6 — append-only, writer unique, idempotent : les events dont la clé
 * existe déjà dans le fichier sont ignorés (pas de doublon, pas d'écrasement).
 */
export function appendOutcomeEvents(rootDir: string, events: OutcomeMeasuredEvent[]): AppendResult {
  const path = ledgerPath(rootDir);
  mkdirSync(join(rootDir, IMPROVEMENT_DIR), { recursive: true });

  const existingKeys = readExistingKeys(path);
  const newLines: string[] = [];
  let skippedDuplicates = 0;

  for (const event of events) {
    const key = eventKey(event);
    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    existingKeys.add(key);
    newLines.push(JSON.stringify(event));
  }

  if (newLines.length > 0) {
    appendFileSync(path, `${newLines.join('\n')}\n`);
  }

  return { written: newLines.length, skippedDuplicates };
}
