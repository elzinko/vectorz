import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRun } from './validateRun.js';

const FIXTURES_ROOT = join(__dirname, '..', 'fixtures');

function fixture(name: string): string {
  return join(FIXTURES_ROOT, name);
}

function realRunToyDir(): string {
  const base = fixture('real-run-toy');
  const [runFolder] = readdirSync(base);
  return join(base, runFolder as string);
}

function messages(entries: { message: string }[]): string[] {
  return entries.map((entry) => entry.message);
}

describe('validateRun — runs nominaux', () => {
  it('le journal réel du kit émetteur passe vert (mode moniteur)', () => {
    const result = validateRun(realRunToyDir());

    expect(result.violations).toEqual([]);
    expect(result.state).toBe('finished');
    expect(result.code).toBe(0);
  });

  it('un run nominal synthétique en mode pilote (commands.jsonl) passe vert', () => {
    const result = validateRun(fixture('nominal-synthetic'));

    expect(result.violations).toEqual([]);
    expect(result.code).toBe(0);
  });

  it("l'absence de commands.jsonl est un mode moniteur légitime", () => {
    const result = validateRun(realRunToyDir());

    expect(result.violations.some((v) => v.code.includes('commands'))).toBe(false);
    expect(result.code).toBe(0);
  });
});

describe('validateRun — invariant gate ouvert', () => {
  it('une activité après un gate.reached sans reprise corrélée est une violation', () => {
    const result = validateRun(fixture('violation-post-gate'));

    expect(result.violations.some((v) => v.seq === 3)).toBe(true);
    expect(result.state).toBe('at_gate');
    expect(result.code).not.toBe(0);
  });

  it('un double gate.reached sans reprise entre les deux est une violation', () => {
    const result = validateRun(fixture('double-gate-open'));

    const violation = result.violations.find((v) => v.seq === 3);
    expect(violation).toBeDefined();
    expect(violation?.code).toBe('state.multiple_gates_open');
    expect(result.code).not.toBe(0);
  });

  it('un gate.resumed orphelin est une violation', () => {
    const result = validateRun(fixture('gate-resumed-orphan'));

    const violation = result.violations.find((v) => v.seq === 2);
    expect(violation).toBeDefined();
    expect(violation?.code).toBe('state.gate_resumed_orphan');
    expect(result.code).not.toBe(0);
  });
});

describe('validateRun — enveloppe et intégrité du fichier', () => {
  it('un trou dans la séquence est détecté comme perte', () => {
    const result = validateRun(fixture('seq-gap'));

    const violation = result.violations.find((v) => v.code === 'envelope.seq_gap');
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('2');
    expect(violation?.message).toContain('4');
    expect(result.code).not.toBe(0);
  });

  it("l'absence de run.started est une violation", () => {
    const result = validateRun(fixture('run-started-missing'));

    expect(result.violations.some((v) => v.code === 'envelope.run_started_missing')).toBe(true);
    expect(result.code).not.toBe(0);
  });

  it("un run.started qui n'est pas le premier événement est une violation", () => {
    const result = validateRun(fixture('run-started-not-first'));

    expect(result.violations.some((v) => v.code === 'envelope.run_started_not_first')).toBe(true);
    expect(result.code).not.toBe(0);
  });

  it('un événement après run.finished est une violation', () => {
    const result = validateRun(fixture('event-post-finished'));

    const violation = result.violations.find((v) => v.seq === 3);
    expect(violation).toBeDefined();
    expect(violation?.code).toBe('envelope.post_finished');
    expect(result.code).not.toBe(0);
  });

  it('une ligne invalide est signalée sans faire planter le validateur', () => {
    expect(() => validateRun(fixture('invalid-line'))).not.toThrow();

    const result = validateRun(fixture('invalid-line'));
    const violation = result.violations.find(
      (v) => v.code === 'contract.violation' && v.line === 2,
    );
    expect(violation).toBeDefined();
    expect(result.code).not.toBe(0);
  });

  it('la dernière ligne tronquée sans retour à la ligne est ignorée', () => {
    const result = validateRun(fixture('truncated-last-line'));

    expect(result.violations).toEqual([]);
    expect(result.state).toBe('at_gate');
  });

  it('un champ ou un type inconnu est toléré et simplement signalé', () => {
    const result = validateRun(fixture('unknown-field-type'));

    expect(result.violations).toEqual([]);
    expect(messages(result.notices).some((m) => m.includes('champ additionnel inconnu'))).toBe(
      true,
    );
    expect(messages(result.notices).some((m) => m.includes("Type d'événement inconnu"))).toBe(true);
    expect(result.code).toBe(0);
  });
});

describe('validateRun — commandes : enum fermée + corrélation', () => {
  it("une commande hors de l'enum fermée continue|hold|abort est une violation", () => {
    const result = validateRun(fixture('commands-invalid-enum'));

    expect(result.violations.some((v) => v.code === 'command.unknown_type')).toBe(true);
    expect(result.code).not.toBe(0);
  });

  it('un continue référençant un gate_event_id inconnu est une violation', () => {
    const result = validateRun(fixture('commands-continue-unknown-gate'));

    expect(result.violations.some((v) => v.code === 'command.unknown_gate')).toBe(true);
    expect(result.code).not.toBe(0);
  });

  it("un re-continue d'un gate déjà continué est un no-op, pas une violation", () => {
    const result = validateRun(fixture('commands-continue-noop'));

    expect(result.violations).toEqual([]);
    expect(result.notices.some((n) => n.code === 'command.noop')).toBe(true);
    expect(result.code).toBe(0);
  });
});

describe('validateRun — journal absent (N1)', () => {
  it('un dossier sans events.jsonl est une violation propre, jamais une exception ENOENT', () => {
    const emptyRunDir = mkdtempSync(join(tmpdir(), 'journal-validator-empty-run-'));

    expect(() => validateRun(emptyRunDir)).not.toThrow();

    const result = validateRun(emptyRunDir);
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'envelope.journal_missing')).toBe(true);
  });
});
