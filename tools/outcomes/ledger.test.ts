import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  IMPROVEMENT_DIR,
  type OutcomeMeasuredEvent,
  appendOutcomeEvents,
  ledgerPath,
} from './ledger.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), '0044-ledger-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function event(subject: OutcomeMeasuredEvent['subject']): OutcomeMeasuredEvent {
  return {
    event: 'outcome.measured',
    ts: '2026-08-13T00:00:00Z',
    subject,
    metrics: { pr_sans_retouche: true },
    measurer_version: '0.1.0-provisoire',
  };
}

describe('appendOutcomeEvents — AC5 écrit uniquement dans .improvement/', () => {
  it('écrit le fichier sous .improvement/outcomes.jsonl', () => {
    appendOutcomeEvents(root, [event({ pr: 1 })]);
    expect(existsSync(ledgerPath(root))).toBe(true);
    expect(ledgerPath(root)).toBe(join(root, IMPROVEMENT_DIR, 'outcomes.jsonl'));
  });

  it('ne crée jamais de dossier .supervision', () => {
    appendOutcomeEvents(root, [event({ pr: 1 }), event({ fiche: '0044' })]);
    expect(existsSync(join(root, '.supervision'))).toBe(false);
  });

  it('IMPROVEMENT_DIR est figé à .improvement (aucun chemin arbitraire possible)', () => {
    expect(IMPROVEMENT_DIR).toBe('.improvement');
  });

  it('append : le contenu déjà présent est conservé (pas d’écrasement)', () => {
    appendOutcomeEvents(root, [event({ pr: 1 })]);
    appendOutcomeEvents(root, [event({ pr: 2 })]);
    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });
});

describe('appendOutcomeEvents — AC6 idempotence', () => {
  it('deux exécutions successives sur les mêmes events ⇒ aucun doublon', () => {
    const events = [event({ pr: 1 }), event({ fiche: '0044' })];

    const first = appendOutcomeEvents(root, events);
    expect(first).toEqual({ written: 2, skippedDuplicates: 0 });

    const second = appendOutcomeEvents(root, events);
    expect(second).toEqual({ written: 0, skippedDuplicates: 2 });

    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('un nouvel event distinct est bien ajouté sans dupliquer les anciens', () => {
    appendOutcomeEvents(root, [event({ pr: 1 })]);
    const result = appendOutcomeEvents(root, [event({ pr: 1 }), event({ pr: 2 })]);
    expect(result).toEqual({ written: 1, skippedDuplicates: 1 });
    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('persiste une reclassification : même sujet, métriques changées ⇒ nouvel event (finding Codex #1)', () => {
    // Une reprise post-merge est découverte APRÈS la mesure initiale.
    appendOutcomeEvents(root, [{ ...event({ pr: 1 }), metrics: { reprise_post_merge: false } }]);
    const r = appendOutcomeEvents(root, [
      { ...event({ pr: 1 }), metrics: { reprise_post_merge: true } },
    ]);
    expect(r).toEqual({ written: 1, skippedDuplicates: 0 });
    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2); // false puis true, les deux conservés (le dernier fait foi)
  });
});
