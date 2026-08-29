import { describe, expect, it } from 'vitest';
import {
  buildSessionsData,
  deriveSessionSlug,
  type CollectedInputs,
} from '../sessions-data.js';

/** Fabrique une entrée de collecte minimale, surchargée par `over`. */
const input = (over: Partial<CollectedInputs> & { worktrees: CollectedInputs['worktrees'] }): CollectedInputs => ({
  mergedBranches: [],
  uncommittedByPath: {},
  lastSessionMtimeByPath: {},
  now: 1_000_000_000_000,
  ...over,
});

describe('deriveSessionSlug (fiche 20260825141012293)', () => {
  it('remplace chaque "/" du chemin worktree par "-" (patron ~/.claude/projects/<slug>)', () => {
    expect(deriveSessionSlug('/Users/elzinko/git/vectorz')).toBe('-Users-elzinko-git-vectorz');
  });
});

describe('buildSessionsData — sujet dérivé du préfixe de branche', () => {
  it.each([
    ['feat/123-slug', 'feat'],
    ['fix/456-bug', 'fix'],
    ['chore/cleanup', 'chore'],
  ])('branche %s → sujet %s', (branch, subject) => {
    const data = buildSessionsData(
      input({ worktrees: [{ path: '/wt/a', branch }] }),
    );
    expect(data.rows[0].subject).toBe(subject);
  });

  it('branche sans préfixe connu → "non précisé"', () => {
    const data = buildSessionsData(input({ worktrees: [{ path: '/wt/a', branch: 'main' }] }));
    expect(data.rows[0].subject).toBe('non précisé');
  });
});

describe('buildSessionsData — activité de session (mtime)', () => {
  const now = 1_000_000_000_000;

  it('mtime récent (< 30 min) → active', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        lastSessionMtimeByPath: { '/wt/a': now - 5 * 60_000 },
        now,
      }),
    );
    expect(data.rows[0].sessionActivity).toBe('active');
  });

  it('mtime ancien (> 30 min) → dormant', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        lastSessionMtimeByPath: { '/wt/a': now - 45 * 60_000 },
        now,
      }),
    );
    expect(data.rows[0].sessionActivity).toBe('dormant');
  });

  it('aucun .jsonl trouvé (mtime absent) → dormant', () => {
    const data = buildSessionsData(
      input({ worktrees: [{ path: '/wt/a', branch: 'feat/x' }], now }),
    );
    expect(data.rows[0].sessionActivity).toBe('dormant');
  });

  it('seuil paramétrable (activeThresholdMinutes)', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        lastSessionMtimeByPath: { '/wt/a': now - 5 * 60_000 },
        activeThresholdMinutes: 2,
        now,
      }),
    );
    expect(data.rows[0].sessionActivity).toBe('dormant');
  });
});

describe('buildSessionsData — supprimable (ADR-0042)', () => {
  const now = 1_000_000_000_000;
  const dormantMtime = now - 45 * 60_000;
  const activeMtime = now - 5 * 60_000;

  it('dormant + propre + branche mergée → supprimable', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        mergedBranches: ['feat/x'],
        lastSessionMtimeByPath: { '/wt/a': dormantMtime },
        now,
      }),
    );
    expect(data.rows[0].deletable).toBe(true);
    expect(data.rows[0].deletableReason).toMatch(/mergée|fusionnée/);
  });

  it('dormant + propre + branche détachée → supprimable', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: '', detached: true }],
        lastSessionMtimeByPath: { '/wt/a': dormantMtime },
        now,
      }),
    );
    expect(data.rows[0].deletable).toBe(true);
  });

  it('dormant + NON commité → JAMAIS supprimable, "travail non sauvé"', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        mergedBranches: ['feat/x'],
        uncommittedByPath: { '/wt/a': ['src/index.ts'] },
        lastSessionMtimeByPath: { '/wt/a': dormantMtime },
        now,
      }),
    );
    expect(data.rows[0].deletable).toBe(false);
    expect(data.rows[0].deletableReason).toMatch(/travail non sauvé/);
  });

  it('actif → jamais supprimable, même mergé et propre', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        mergedBranches: ['feat/x'],
        lastSessionMtimeByPath: { '/wt/a': activeMtime },
        now,
      }),
    );
    expect(data.rows[0].deletable).toBe(false);
  });

  it('dormant + propre + branche PAS mergée ni détachée → garder', () => {
    const data = buildSessionsData(
      input({
        worktrees: [{ path: '/wt/a', branch: 'feat/x' }],
        lastSessionMtimeByPath: { '/wt/a': dormantMtime },
        now,
      }),
    );
    expect(data.rows[0].deletable).toBe(false);
  });
});

describe('buildSessionsData — collisions (intersection de fichiers non commités)', () => {
  it('deux worktrees avec un fichier en commun → collision réciproque', () => {
    const data = buildSessionsData(
      input({
        worktrees: [
          { path: '/wt/a', branch: 'feat/x' },
          { path: '/wt/b', branch: 'feat/y' },
        ],
        uncommittedByPath: {
          '/wt/a': ['src/shared.ts', 'src/only-a.ts'],
          '/wt/b': ['src/shared.ts', 'src/only-b.ts'],
        },
      }),
    );
    const a = data.rows.find((r) => r.path === '/wt/a');
    const b = data.rows.find((r) => r.path === '/wt/b');
    expect(a?.collisionsWith).toHaveLength(1);
    expect(a?.collisionsWith[0].path).toBe('/wt/b');
    expect(a?.collisionsWith[0].files.map((f) => f.file)).toEqual(['src/shared.ts']);
    expect(b?.collisionsWith[0].path).toBe('/wt/a');
  });

  it('fichier chaud (features/*.md) flaggé hot dans la collision', () => {
    const data = buildSessionsData(
      input({
        worktrees: [
          { path: '/wt/a', branch: 'feat/x' },
          { path: '/wt/b', branch: 'feat/y' },
        ],
        uncommittedByPath: {
          '/wt/a': ['features/BACKLOG.md'],
          '/wt/b': ['features/BACKLOG.md'],
        },
      }),
    );
    const a = data.rows.find((r) => r.path === '/wt/a');
    expect(a?.collisionsWith[0].files[0]).toEqual({ file: 'features/BACKLOG.md', hot: true });
  });

  it('fichier ordinaire non chaud → hot: false', () => {
    const data = buildSessionsData(
      input({
        worktrees: [
          { path: '/wt/a', branch: 'feat/x' },
          { path: '/wt/b', branch: 'feat/y' },
        ],
        uncommittedByPath: {
          '/wt/a': ['src/foo.ts'],
          '/wt/b': ['src/foo.ts'],
        },
      }),
    );
    const a = data.rows.find((r) => r.path === '/wt/a');
    expect(a?.collisionsWith[0].files[0]).toEqual({ file: 'src/foo.ts', hot: false });
  });

  it('aucune intersection → collisionsWith vide', () => {
    const data = buildSessionsData(
      input({
        worktrees: [
          { path: '/wt/a', branch: 'feat/x' },
          { path: '/wt/b', branch: 'feat/y' },
        ],
        uncommittedByPath: {
          '/wt/a': ['src/only-a.ts'],
          '/wt/b': ['src/only-b.ts'],
        },
      }),
    );
    expect(data.rows.every((r) => r.collisionsWith.length === 0)).toBe(true);
  });

  it('même répertoire (même path) = tout en collision — cas physique de l’ADR-0042', () => {
    const data = buildSessionsData(
      input({
        worktrees: [
          { path: '/wt/a', branch: 'feat/x' },
          { path: '/wt/a', branch: 'feat/x' },
        ],
        uncommittedByPath: { '/wt/a': ['src/foo.ts'] },
      }),
    );
    expect(data.rows[0].collisionsWith.length).toBeGreaterThan(0);
  });
});
