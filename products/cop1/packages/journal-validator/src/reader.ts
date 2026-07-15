import { readFileSync } from 'node:fs';
import type { Envelope, EnvelopeEntry, Notice, Violation } from './types.js';

export interface RawLine {
  lineNumber: number;
  text: string;
}

/**
 * Découpe un contenu JSONL en lignes lisibles, 1-based.
 *
 * Règle "dernière ligne tronquée" (positionnelle, pas liée à la validité JSON) :
 * si le fichier ne se termine pas par un "\n", la toute dernière ligne physique
 * est considérée tronquée et purement ignorée (ni violation, ni événement traité).
 * Les lignes vides sont ignorées silencieusement.
 */
export function readLines(content: string): RawLine[] {
  if (content.length === 0) return [];
  const rawLines = content.split('\n');
  // Que le fichier se termine par \n (dernier élément = "") ou non (dernier
  // élément = ligne tronquée), dans les deux cas on retire le dernier élément.
  const usableLines = rawLines.slice(0, -1);
  return usableLines
    .map((text, index) => ({ lineNumber: index + 1, text }))
    .filter((line) => line.text.length > 0);
}

export type ParsedLine =
  | { lineNumber: number; ok: true; value: Record<string, unknown> }
  | { lineNumber: number; ok: false };

/**
 * Parse tolérant : une ligne qui n'est pas du JSON valide est signalée (ok:false)
 * mais ne casse jamais la lecture des lignes suivantes.
 */
export function parseLines(lines: RawLine[]): ParsedLine[] {
  return lines.map(({ lineNumber, text }) => {
    try {
      const value = JSON.parse(text);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { lineNumber, ok: false };
      }
      return { lineNumber, ok: true, value: value as Record<string, unknown> };
    } catch {
      return { lineNumber, ok: false };
    }
  });
}

const REQUIRED_ENVELOPE_FIELDS = [
  'event_id',
  'run_id',
  'seq',
  'ts',
  'contract',
  'type',
  'payload',
] as const;
const KNOWN_ENVELOPE_FIELDS = new Set<string>(REQUIRED_ENVELOPE_FIELDS);

/**
 * Lit le fichier, découpe en lignes tolérantes et vérifie l'enveloppe de base.
 * Partagé par `validateRun` (batch) et `projectRun` (read-model live) : seul
 * point de lecture/parse des journaux, pour que la sémantique "ligne invalide
 * ⇒ violation, jamais une exception" reste à un seul endroit.
 */
export function readEnvelopes(
  filePath: string,
  violations: Violation[],
  notices: Notice[],
): EnvelopeEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const parsed = parseLines(readLines(content));

  const result: EnvelopeEntry[] = [];
  for (const line of parsed) {
    if (!line.ok) {
      violations.push({
        code: 'contract.violation',
        message: `Ligne ${line.lineNumber} n'est pas un JSON d'enveloppe valide`,
        line: line.lineNumber,
      });
      continue;
    }

    const missing = REQUIRED_ENVELOPE_FIELDS.filter((field) => !(field in line.value));
    if (missing.length > 0) {
      violations.push({
        code: 'contract.violation',
        message: `Ligne ${line.lineNumber} : champ(s) d'enveloppe manquant(s) : ${missing.join(', ')}`,
        line: line.lineNumber,
      });
      continue;
    }

    for (const field of Object.keys(line.value)) {
      if (!KNOWN_ENVELOPE_FIELDS.has(field)) {
        notices.push({
          code: 'contract.notice',
          message: `Ligne ${line.lineNumber} : champ additionnel inconnu "${field}"`,
          line: line.lineNumber,
        });
      }
    }

    result.push({
      envelope: line.value as unknown as Envelope,
      lineNumber: line.lineNumber,
    });
  }
  return result;
}
