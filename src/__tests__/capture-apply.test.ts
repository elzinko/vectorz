import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { planCapture } from '../core/capture.js';
import { applyCapture } from '../io/capture.js';
import { capture } from '../core/capture.js';
import type { CapturePorts } from '../core/capture.js';

const DATE = '2026-06-26';

const JOURNAL_FIXTURE = `# Journal d'apprentissages (append-only)

| date | cible | type | résumé | commit |
|------|-------|------|--------|--------|
| 2026-06-25 | (exemple) | — | starter initialisé | — |
`;

function initToyRepo(): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'capture-repo-'));
  execFileSync('git', ['init', '--quiet'], { cwd: rootDir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: rootDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: rootDir });
  mkdirSync(join(rootDir, 'journal'), { recursive: true });
  writeFileSync(join(rootDir, 'journal', 'learnings.md'), JOURNAL_FIXTURE);
  execFileSync('git', ['add', '.'], { cwd: rootDir });
  execFileSync('git', ['commit', '--quiet', '-m', 'chore: seed'], { cwd: rootDir });
  return rootDir;
}

describe('applyCapture (coquille I/O, repo jouet) — ADR-0004', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = initToyRepo();
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("écrit l'artefact à sa destination", () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);
    expect(existsSync(join(rootDir, 'skills/ezk-bisect.md'))).toBe(true);
  });

  it('journal append-only : ajoute en bas sans réécrire la ligne existante (DoD 3)', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);

    const journal = readFileSync(join(rootDir, 'journal', 'learnings.md'), 'utf8');
    // la ligne d'exemple est toujours là
    expect(journal).toContain('| 2026-06-25 | (exemple) | — | starter initialisé | — |');
    // la nouvelle ligne est strictement après l'exemple
    expect(journal.indexOf('ezk-bisect')).toBeGreaterThan(journal.indexOf('(exemple)'));
    expect(journal.endsWith('\n')).toBe(true);
  });

  it('crée un vrai commit conventional chore(capture): <kind> <id> (DoD 4)', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);

    const subject = execFileSync('git', ['log', '-1', '--pretty=%s'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
    expect(subject).toBe('chore(capture): skill ezk-bisect');

    // l'artefact ET le journal sont dans le commit (rien laissé non-stagé)
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
    expect(status).toBe('');
    const files = execFileSync('git', ['show', '--name-only', '--pretty=format:', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
    });
    expect(files).toContain('skills/ezk-bisect.md');
    expect(files).toContain('journal/learnings.md');
  });

  it("commit SCOPÉ : un fichier tiers pré-stagé n'est PAS embarqué (revue 0002)", () => {
    // un changement sans rapport, déjà dans l'index avant la capture
    writeFileSync(join(rootDir, 'pollution.txt'), 'sans rapport');
    execFileSync('git', ['add', '--', 'pollution.txt'], { cwd: rootDir });

    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);

    // le commit de capture ne contient QUE l'artefact + le journal
    const files = execFileSync('git', ['show', '--name-only', '--pretty=format:', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
    });
    expect(files).not.toContain('pollution.txt');

    // le fichier tiers est toujours là, stagé mais NON commité
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: rootDir,
      encoding: 'utf8',
    });
    expect(status).toContain('A  pollution.txt');
  });

  it("journal sans newline final : la ligne ne se colle pas à la précédente (revue 0002)", () => {
    // réécrit le journal SANS newline final
    const noEol = JOURNAL_FIXTURE.replace(/\n$/, '');
    writeFileSync(join(rootDir, 'journal', 'learnings.md'), noEol);

    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);

    const journal = readFileSync(join(rootDir, 'journal', 'learnings.md'), 'utf8');
    // la ligne d'exemple reste intacte sur SA ligne (pas de fusion)
    expect(journal).toContain('| 2026-06-25 | (exemple) | — | starter initialisé | — |\n');
    expect(journal).not.toContain('| — || ');
  });
});

describe('capture (orchestrateur author → judge → planCapture → applyCapture)', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = initToyRepo();
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('rédige via author, consigne et commite ; un avis ok:false ne bloque pas mais est tracé', async () => {
    const author = vi.fn(async () => 'protocole de handoff QA→Dev');
    const judge = vi.fn(async () => ({ ok: false, notes: 'doublon possible' }));
    const ports: CapturePorts = { author, judge };

    await capture('handoff/qa-to-dev', 'interaction', ports, { rootDir, date: DATE });

    // author/judge ont été consultés AVANT l'écriture
    expect(author).toHaveBeenCalledOnce();
    expect(judge).toHaveBeenCalledOnce();

    // l'artefact interaction existe avec le bon kind
    const artifact = readFileSync(join(rootDir, 'rules/handoff/qa-to-dev.md'), 'utf8');
    expect(artifact).toContain('kind: interaction');
    expect(artifact).toContain('protocole de handoff QA→Dev');

    // l'avis non bloquant (ok:false) est tracé dans le journal, pas exécutoire
    const journal = readFileSync(join(rootDir, 'journal', 'learnings.md'), 'utf8');
    expect(journal).toContain('| 2026-06-25 | (exemple) | — | starter initialisé | — |'); // append-only
    expect(journal).toContain('doublon possible');

    // un commit a bien été créé
    const subject = execFileSync('git', ['log', '-1', '--pretty=%s'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
    expect(subject).toBe('chore(capture): interaction handoff/qa-to-dev');
  });
});
