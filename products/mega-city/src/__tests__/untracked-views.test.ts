/**
 * Vues générées NON committées (ADR-0055, fiche 20260830194601376).
 *
 * Avant : un test comparait le bloc de données COMMITTÉ dans la page au bloc régénéré. Deux
 * sessions parallèles régénéraient le même bloc et leurs PR entraient en conflit. Maintenant les
 * données ne sont dans aucun commit : la fidélité est garantie PAR CONSTRUCTION (on prouve que le
 * constructeur dit vrai sur le dépôt réel), et la frontière « non committé » est tenue par un test
 * plutôt que par la mémoire de quelqu'un (un `git add -f` ferait rougir celui-ci).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { AVANCEMENT_DATA_BEGIN } from '../core/avancement-data.js';
import { TERMINAUX } from '../core/fiche-schema.js';
import { buildProcessData } from '../core/process-data.js';
import { PLAN_DELTA_BEGIN } from '../core/plan-delta-data.js';
import { PLAN_DATA_BEGIN } from '../core/plan-view-data.js';
import {
  DATA_VIEWS,
  UNTRACKED_VIEW_PATHS,
  dataViewForPath,
  writeDataViews,
} from '../io/derived-views.js';
import { loadFiches } from '../loaders/fiches.js';
import { loadRuns } from '../loaders/runs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

/** Exécute un fichier de données dans un faux `window` et rend ce qu'il y a posé. */
function evalData(js: string): Record<string, unknown> {
  const sandbox: { window: Record<string, unknown> } = { window: {} };
  runInNewContext(js, sandbox);
  return sandbox.window;
}

const view = (id: string) => {
  const found = DATA_VIEWS.find((v) => v.id === id);
  if (!found) throw new Error(`vue inconnue : ${id}`);
  return found;
};

describe('frontière « non committé » (tenue par un test, pas par la mémoire)', () => {
  it.each([...UNTRACKED_VIEW_PATHS])('%s est ignoré par git et absent de l’index', (path) => {
    expect(() =>
      execFileSync('git', ['check-ignore', '-q', path], { cwd: repoRoot, stdio: 'pipe' }),
    ).not.toThrow();
    const tracked = execFileSync('git', ['ls-files', '--', path], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(tracked.trim()).toBe('');
  });

  it.each([...DATA_VIEWS])(
    '$id : la coque charge $out par <script src> et n’embarque aucune donnée',
    (v) => {
      const html = readFileSync(join(repoRoot, v.page), 'utf8');
      expect(html).toContain(`<script src="${basename(v.out)}"></script>`);
      // aucune affectation de données en ligne (EZK_AVANCEMENT… du board, EZK seul de la carte)
      expect(html).not.toMatch(/window\.EZK(?:_[A-Z_]+)?\s*=[^=]/);
      expect(html).not.toMatch(/\/\*ezk-[a-z-]+:begin\*\//); // ni bloc géré résiduel
    },
  );

  it('carte : sans son fichier de données (clone neuf, file://), la coque le dit au lieu de planter', () => {
    const html = readFileSync(join(repoRoot, view('carte').page), 'utf8');
    expect(html).toContain('if(!D){');
    expect(html).toContain('données absentes');
  });
});

describe('fidélité par construction (dépôt réel)', () => {
  it('board : les fiches actives du backlog y sont, aucune livrée ni terminale', () => {
    const w = evalData(view('board').build(repoRoot));
    const av = w.EZK_AVANCEMENT as { actives: { id: string }[] };
    const ids = new Set(av.actives.map((a) => a.id));
    expect(ids.size).toBeGreaterThan(0);
    for (const f of loadFiches(repoRoot)) {
      if (f.done || TERMINAUX.includes(f.status)) {
        expect(ids.has(f.id), `${f.id} (${f.status}) ne doit pas être active`).toBe(false);
      } else if (f.status === 'ready' || f.status === 'in-progress') {
        expect(ids.has(f.id), `${f.id} (${f.status}) doit figurer au board`).toBe(true);
      }
    }
    expect(Array.isArray((w.EZK_PLAN as { lanes: unknown[] }).lanes)).toBe(true);
    expect(Array.isArray((w.EZK_PLAN_DELTA as { recent: unknown[] }).recent)).toBe(true);
  });

  it('board : les trois blocs gérés cohabitent dans board.data.js, marqueurs disjoints', () => {
    const js = view('board').build(repoRoot);
    for (const marker of [AVANCEMENT_DATA_BEGIN, PLAN_DATA_BEGIN, PLAN_DELTA_BEGIN]) {
      expect(js.split(marker)).toHaveLength(2); // présent, et une seule fois
    }
  });

  it('pilotage : le nombre de runs est celui de docs/sessions/', () => {
    const w = evalData(view('pilotage').build(repoRoot));
    const p = w.EZK_PILOTAGE as { milestones: unknown[]; runs: { total: number } };
    expect(Array.isArray(p.milestones)).toBe(true);
    expect(p.runs.total).toBe(loadRuns(repoRoot).length);
  });

  it('runs : un récit par fichier de docs/sessions/', () => {
    const w = evalData(view('runs').build(repoRoot));
    const r = w.EZK_RUNS as { runs: unknown[]; counts: { total: number } };
    const expected = loadRuns(repoRoot).length;
    expect(r.runs).toHaveLength(expected);
    expect(r.counts.total).toBe(expected);
  });

  it('process : chaque fiche active du backlog RÉEL est posée sur UNE étape, les terminales en sont absentes', () => {
    // Critère n°5 de la fiche : prouver sur le backlog RÉEL, pas une fixture. On injecte des signaux
    // git/gh VIDES (déterministe, sans réseau) : ce qu'on vérifie ici, c'est le placement par STATUT
    // et l'exclusion des terminales/parkées sur les vraies fiches du dépôt. La logique branche/PR est
    // prouvée purement dans process-data.test.ts.
    const fiches = loadFiches(repoRoot);
    const data = buildProcessData({ fiches, sessions: [], branches: [], openPrByBranch: {} });

    const placed = new Map<string, number>();
    for (const g of data.stages) {
      for (const f of g.fiches) placed.set(f.id, (placed.get(f.id) ?? 0) + 1);
    }
    // Aucune fiche posée en double (une fiche, une étape).
    for (const [id, n] of placed) expect(n, `${id} apparaît ${n} fois`).toBe(1);

    for (const f of fiches) {
      const parked = f.status === 'idea' && f.milestone === 'parked';
      const terminalHorsVue = TERMINAUX.includes(f.status) && f.status !== 'shipped';
      if (terminalHorsVue || parked) {
        expect(placed.has(f.id), `${f.id} (${f.status}) ne doit pas être dans la vue`).toBe(false);
      } else if (!f.done && f.status !== 'shipped') {
        // Une fiche active (features/, non terminale, non parkée) : toujours posée quelque part.
        expect(placed.has(f.id), `${f.id} (${f.status}) doit être posée`).toBe(true);
      }
      // shipped : seules les plus récentes sont montrées → présence non garantie, pas assertée.
    }

    // Les cinq étapes sont toujours là ; au moins une fiche active du vrai backlog est posée.
    expect(data.stages.map((g) => g.stage)).toEqual(['idee', 'prete', 'en-sprint', 'en-revue', 'livree']);
    expect(placed.size).toBeGreaterThan(0);
  });
});

describe('construction à la demande', () => {
  /** Dépôt jetable minimal : une fiche, un plan vide, un récit de run. */
  function fixtureRepo(): string {
    const root = mkdtempSync(join(tmpdir(), 'derived-views-'));
    mkdirSync(join(root, 'features', 'done'), { recursive: true });
    mkdirSync(join(root, 'docs', 'sessions'), { recursive: true });
    writeFileSync(
      join(root, 'features', '20260101000000001_une-fiche.md'),
      '---\nid: "20260101000000001"\ntitle: "Une fiche"\ntype: feature\npriority: P1\nproduct: mega-city\nstatus: ready\npr:\ncreated: 2026-01-01\n---\n\ncorps\n',
    );
    writeFileSync(
      join(root, 'docs', 'sessions', '2026-01-02-un-run.md'),
      '# Un run\n\nfiches: [20260101000000001]\n',
    );
    return root;
  }

  // Deux vues ne lisent pas le dépôt jetable, on les écarte de ce test hermétique :
  //  - `carte` lit le catalogue de la MÉTHODE (prouvée sur le dépôt réel dans map-data.test.ts) ;
  //  - `process` lit le git/gh AMBIANT (branches, worktrees, PR), pas la fixture — ses signaux sont
  //    prouvés purement dans process-data.test.ts, où l'I/O est injecté.
  const FIXTURE_VIEWS = DATA_VIEWS.filter((v) => v.id !== 'carte' && v.id !== 'process');

  it('writeDataViews écrit les trois fichiers, et un second passage n’écrit rien', () => {
    const root = fixtureRepo();
    const first = writeDataViews(root, FIXTURE_VIEWS);
    expect(first.written.sort()).toEqual(FIXTURE_VIEWS.map((v) => v.out).sort());
    expect(first.unchanged).toEqual([]);
    const board = readFileSync(join(root, 'diagrams/avancement/board.data.js'), 'utf8');
    expect(board).toContain('20260101000000001');
    expect(board.startsWith('// Généré — NE PAS committer')).toBe(true);

    const second = writeDataViews(root, FIXTURE_VIEWS);
    expect(second.written).toEqual([]);
    expect(second.unchanged.sort()).toEqual(FIXTURE_VIEWS.map((v) => v.out).sort());
  });

  it('la carte décrit la MÉTHODE : le projet visé (--root, EZK_ROOT) ne change pas son fichier', () => {
    // `ezk:map --root <projet>` passe la racine de CE projet aux vues : la carte l'ignore, sinon elle
    // chercherait un catalogue dans un dépôt qui n'en a pas (fiche 20260826173221323).
    expect(view('carte').build(fixtureRepo())).toBe(view('carte').build(repoRoot));
  });

  it('une fiche ajoutée apparaît au board sans autre étape (jamais périmé)', () => {
    const root = fixtureRepo();
    const before = evalData(view('board').build(root)).EZK_AVANCEMENT as { actives: unknown[] };
    expect(before.actives).toHaveLength(1);
    writeFileSync(
      join(root, 'features', '20260101000000002_autre.md'),
      '---\nid: "20260101000000002"\ntitle: "Autre"\ntype: feature\npriority: P2\nproduct: mega-city\nstatus: idea\npr:\ncreated: 2026-01-01\n---\n',
    );
    const after = evalData(view('board').build(root)).EZK_AVANCEMENT as { actives: unknown[] };
    expect(after.actives).toHaveLength(2);
  });

  it('sans PLAN.md, le board se construit quand même (vue Plan vide)', () => {
    const root = fixtureRepo(); // la fixture n'a pas de features/PLAN.md
    const w = evalData(view('board').build(root));
    expect((w.EZK_PLAN as { lanes: unknown[] }).lanes).toEqual([]);
  });

  it('dataViewForPath ne reconnaît que les fichiers de données déclarés', () => {
    expect(dataViewForPath('diagrams/avancement/board.data.js')?.id).toBe('board');
    expect(dataViewForPath('./diagrams/pilotage/pilotage.data.js')?.id).toBe('pilotage');
    expect(dataViewForPath('diagrams\\runs\\runs.data.js')?.id).toBe('runs');
    expect(dataViewForPath('diagrams/methode-mega-city/carte-interactive.data.js')?.id).toBe('carte');
    expect(dataViewForPath('diagrams/methode-mega-city/carte-interactive.html')).toBeUndefined();
    expect(dataViewForPath('diagrams/avancement/board.html')).toBeUndefined();
    expect(dataViewForPath('diagrams/../etc/passwd')).toBeUndefined();
  });
});
