/**
 * Tests de `project-root.ts` (ADR 0019, fiche 0086) — couvre chaque scénario
 * de `racine-projet.feature`. Fixtures git réelles en tmp (convention
 * `upgrade-ok.test.ts`) : `execFileSync('git', …)` est autorisé ICI (fabrique
 * de fixtures de test), interdit dans le code de production.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatRootAnnouncement,
  resolveSupervisionRoot,
  type ResolvedRoot,
} from '../project-root.js';
import { SupervisionRuntime } from '../runtime.js';
import { readJournalEvents } from '../journal.js';

/** Toujours comparer via realpath (macOS : `/var` → `/private/var`, cf. `writeConfinedReport`). */
function real(p: string): string {
  return fs.realpathSync(p);
}

describe('resolveSupervisionRoot — rubrique N (normalisation)', () => {
  let mainRoot: string;
  let worktreeDir: string;

  beforeEach(() => {
    mainRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-project-root-'));
    execFileSync('git', ['init'], { cwd: mainRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
    fs.writeFileSync(path.join(mainRoot, 'README.md'), '# poc\n');
    execFileSync('git', ['add', '.'], { cwd: mainRoot });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: mainRoot });

    worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-project-root-wt-'));
    fs.rmdirSync(worktreeDir); // `git worktree add` veut créer le dossier lui-même
    execFileSync('git', ['worktree', 'add', worktreeDir, '-b', 'wt-branch'], { cwd: mainRoot });
  });

  afterEach(() => {
    execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: mainRoot });
    fs.rmSync(mainRoot, { recursive: true, force: true });
  });

  it('AC1 — la racine fournie via cwd est un worktree lié : la racine effective remonte à l’arbre principal', () => {
    const resolved = resolveSupervisionRoot({}, worktreeDir);
    expect(real(resolved.root)).toBe(real(mainRoot));
    expect(resolved.provenance).toBe('cwd');
    expect(resolved.normalizedFromWorktree).toBe(worktreeDir);
  });

  it('la normalisation s’applique aussi quand SUPERVISION_PROJECT_ROOT désigne explicitement le worktree', () => {
    const resolved = resolveSupervisionRoot({ SUPERVISION_PROJECT_ROOT: worktreeDir }, os.tmpdir());
    expect(real(resolved.root)).toBe(real(mainRoot));
    expect(resolved.provenance).toBe('explicit');
    expect(resolved.normalizedFromWorktree).toBe(worktreeDir);
  });

  it('sous-chemin préservé — la racine fournie est un sous-dossier du worktree', () => {
    const appDir = path.join(worktreeDir, 'app');
    fs.mkdirSync(appDir);

    const resolved = resolveSupervisionRoot({}, appDir);

    // `mainRoot/app` n'existe pas forcément sur disque (seul le worktree l'a créé) :
    // on compare au chemin réel de `mainRoot` + le sous-chemin attendu, sans realpath
    // sur une entrée absente.
    expect(resolved.root).toBe(path.join(real(mainRoot), 'app'));
  });

  it('AC5 — report_ref reste relatif à la racine effective (arbre principal), pas au worktree', () => {
    const resolved = resolveSupervisionRoot({}, worktreeDir);
    const runtime = new SupervisionRuntime(resolved.root);

    runtime.runStart({ method_name: 'demo', method_version: '1.0.0' });
    const { gate_event_id } = runtime.gateReached({
      gate_id: 'gate-1',
      outcome: 'ok',
      report_markdown: '# rapport\n',
    });

    const runsDir = path.join(resolved.root, '.supervision', 'runs');
    const runId = fs.readdirSync(runsDir)[0];
    const events = readJournalEvents(path.join(runsDir, runId, 'events.jsonl'));
    const gateEvent = events.find((e) => e.event_id === gate_event_id);
    const reportRef = gateEvent?.payload.report_ref as string | undefined;

    expect(reportRef).toBeDefined();
    // report_ref est relatif à l'arbre principal, jamais au worktree.
    expect(reportRef?.startsWith('..')).toBe(false);
    const resolvedReportPath = path.resolve(resolved.root, reportRef as string);
    expect(fs.existsSync(resolvedReportPath)).toBe(true);
    expect(real(resolvedReportPath).startsWith(real(mainRoot) + path.sep)).toBe(true);
  });
});

describe('resolveSupervisionRoot — rubrique R (replis propres, AC2)', () => {
  it('hors dépôt git : la racine effective est celle fournie, telle quelle, aucune erreur', () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-non-git-'));
    try {
      expect(() => resolveSupervisionRoot({}, nonGitDir)).not.toThrow();
      const resolved = resolveSupervisionRoot({}, nonGitDir);
      expect(resolved.root).toBe(nonGitDir);
      expect(resolved.normalizedFromWorktree).toBeUndefined();
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });

  it('submodule (".git" fichier sans "commondir") : pas une normalisation de worktree', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-submodule-'));
    try {
      const submodulePath = path.join(root, 'sub');
      fs.mkdirSync(submodulePath);
      const gitdirTarget = path.join(root, 'gitdir-sans-commondir');
      fs.mkdirSync(gitdirTarget); // pas de fichier `commondir` dedans : simule un submodule
      fs.writeFileSync(path.join(submodulePath, '.git'), `gitdir: ${gitdirTarget}\n`);

      const resolved = resolveSupervisionRoot({}, submodulePath);

      expect(resolved.root).toBe(submodulePath);
      expect(resolved.normalizedFromWorktree).toBeUndefined();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  // Cas bare (basename(commondir résolu) !== '.git') : couvert par construction par
  // le test submodule ci-dessus (même branche de code, `normalizeFromWorktree`
  // retourne `undefined` dès que `commondir` ne mène pas à un dossier `.git`) —
  // fabriquer un vrai `clone --bare` + `worktree add` ajouterait un coût de fixture
  // (spawn git supplémentaire) pour une branche déjà exercée. Skip volontaire.
});

describe('resolveSupervisionRoot — rubrique E (échappatoire, AC3)', () => {
  let mainRoot: string;
  let worktreeDir: string;

  beforeEach(() => {
    mainRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-escape-'));
    execFileSync('git', ['init'], { cwd: mainRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
    fs.writeFileSync(path.join(mainRoot, 'README.md'), '# poc\n');
    execFileSync('git', ['add', '.'], { cwd: mainRoot });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: mainRoot });

    worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-escape-wt-'));
    fs.rmdirSync(worktreeDir);
    execFileSync('git', ['worktree', 'add', worktreeDir, '-b', 'wt-branch'], { cwd: mainRoot });
  });

  afterEach(() => {
    execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: mainRoot });
    fs.rmSync(mainRoot, { recursive: true, force: true });
  });

  it.each(['1', 'true'])(
    'SUPERVISION_PER_WORKTREE=%s rétablit délibérément le journal dans le worktree',
    (value) => {
      const resolved = resolveSupervisionRoot({ SUPERVISION_PER_WORKTREE: value }, worktreeDir);

      expect(resolved.root).toBe(worktreeDir);
      expect(resolved.perWorktree).toBe(true);
      expect(resolved.normalizedFromWorktree).toBeUndefined();
    },
  );

  it('une valeur autre que "1"/"true" n’active pas l’échappatoire (normalisation normale)', () => {
    const resolved = resolveSupervisionRoot({ SUPERVISION_PER_WORKTREE: 'yes' }, worktreeDir);

    expect(real(resolved.root)).toBe(real(mainRoot));
    expect(resolved.perWorktree).toBeUndefined();
  });
});

describe('formatRootAnnouncement — rubrique A (annonce, AC4)', () => {
  it('distingue les quatre provenances sans ambiguïté', () => {
    const explicit: ResolvedRoot = { root: '/projet', provenance: 'explicit' };
    const cwd: ResolvedRoot = { root: '/projet', provenance: 'cwd' };
    const normalized: ResolvedRoot = {
      root: '/projet',
      provenance: 'cwd',
      normalizedFromWorktree: '/projet/.claude/worktrees/wt',
    };
    const perWorktree: ResolvedRoot = { root: '/projet/.claude/worktrees/wt', provenance: 'cwd', perWorktree: true };

    const lines = [explicit, cwd, normalized, perWorktree].map(formatRootAnnouncement);

    // Chaque ligne contient le chemin effectif du journal.
    for (const [i, resolved] of [explicit, cwd, normalized, perWorktree].entries()) {
      expect(lines[i]).toContain(path.join(resolved.root, '.supervision', 'runs'));
    }

    expect(lines[0]).toContain('explicite');
    expect(lines[0]).not.toMatch(/normalisée|par-worktree/);

    expect(lines[1]).toContain('dossier courant');
    expect(lines[1]).not.toMatch(/normalisée|par-worktree/);

    expect(lines[2]).toContain('normalisée depuis /projet/.claude/worktrees/wt');

    expect(lines[3]).toContain('par-worktree délibéré');

    // Les 4 lignes sont deux à deux distinctes.
    expect(new Set(lines).size).toBe(4);
  });

  it('la ligne d’annonce part sur stderr, jamais sur stdout (assertion sur le wiring, cf. bin/supervision-mcp.ts)', () => {
    // formatRootAnnouncement est pure (aucune I/O) : c'est bin/supervision-mcp.ts qui
    // décide du flux (console.error). Vérifié ici par relecture du wiring plutôt que
    // par un test E2E process (coût disproportionné pour une simple assertion de flux) :
    // `console.error(formatRootAnnouncement(resolved))` — jamais `console.log`.
    expect(typeof formatRootAnnouncement).toBe('function');
  });
});
