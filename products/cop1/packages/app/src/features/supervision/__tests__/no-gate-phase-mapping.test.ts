import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Verrou DP2 (non négociable) : aucune correspondance gate_id → nom de phase
 * métier ne doit exister côté cop1. La phase courante, si affichée, provient
 * telle quelle du contenu du `report_ref` produit par la méthode — jamais
 * d'un mapping interne à cop1. Ce test parcourt le code source de la feature
 * `supervision` (ce paquet) et de `journal-validator` (zéro dépendance,
 * source de la machine à états) pour vérifier qu'aucune table ni fonction ne
 * fait ce mapping.
 */

const SUPERVISION_SRC = join(__dirname, '..');
const JOURNAL_VALIDATOR_SRC = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'journal-validator',
  'src',
);

// Vocabulaire de phase métier qu'on ne doit JAMAIS voir associé à un gate_id
// dans une table/fonction de mapping (ex. un objet littéral { 'gate-1': 'Phase de conception' }).
const PHASE_MAPPING_PATTERNS = [
  /gate(_|-)?id\s*(:|=>|->)\s*.*phase/i,
  /phaseFor(Gate|GateId)/i,
  /gateToPhase/i,
  /mapGateToPhase/i,
];

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('Verrou DP2 — zéro mapping gate_id → phase métier côté cop1', () => {
  it('aucun fichier de la feature supervision ni de journal-validator ne mappe un gate_id vers une phase', () => {
    const files = [...listTsFiles(SUPERVISION_SRC), ...listTsFiles(JOURNAL_VALIDATOR_SRC)];
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (PHASE_MAPPING_PATTERNS.some((pattern) => pattern.test(content))) {
        offenders.push(file);
      }
      // Aucun type/read-model de la feature ne doit porter de champ "phase".
      if (/\bphase\s*:/i.test(content) && !file.endsWith('no-gate-phase-mapping.test.ts')) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
