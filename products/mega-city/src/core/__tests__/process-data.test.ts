import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import type { SessionRow } from '../sessions-data.js';
import {
  buildProcessData,
  buildProcessDataBlock,
  ficheIdFromBranch,
  type ProcessInputs,
  type ProcessStage,
} from '../process-data.js';

/** Fiche minimale, surchargée par `over`. Les ids suivent le vrai format (≥ 4 chiffres). */
const fiche = (over: Partial<Fiche> & { id: string }): Fiche => ({
  title: over.title ?? `fiche ${over.id}`,
  type: 'feature',
  priority: 'P2',
  status: 'idea',
  milestone: '',
  version: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  depends: [],
  blocked: '',
  done: false,
  file: `features/${over.id}_slug.md`,
  ...over,
});

/** Session minimale (le reste des champs de SessionRow n'intervient pas dans process-data). */
const session = (path: string, branch: string): SessionRow => ({
  path,
  branch,
  subject: 'feat',
  sessionActivity: 'active',
  merged: false,
  uncommitted: [],
  pr: '—',
  deletable: false,
  deletableReason: '',
  collisionsWith: [],
});

const inputs = (over: Partial<ProcessInputs> & { fiches: Fiche[] }): ProcessInputs => ({
  sessions: [],
  branches: [],
  openPrByBranch: {},
  ...over,
});

/** Étape où une fiche d'id donné a été posée, ou `undefined` si absente de la vue. */
function stageOf(data: ReturnType<typeof buildProcessData>, id: string): ProcessStage | undefined {
  for (const g of data.stages) {
    if (g.fiches.some((f) => f.id === id)) return g.stage;
  }
  return undefined;
}

/** La fiche `id` dans la vue (jette si absente) — pour inspecter ses champs. */
function ficheIn(data: ReturnType<typeof buildProcessData>, id: string) {
  for (const g of data.stages) {
    const found = g.fiches.find((f) => f.id === id);
    if (found) return found;
  }
  throw new Error(`fiche ${id} absente de la vue`);
}

describe('ficheIdFromBranch', () => {
  it.each([
    ['feat/20261002115451315-slug', '20261002115451315'],
    ['fix/0094-bug', '0094'],
    ['chore/0117-refactor', '0117'],
  ])('%s → %s', (branch, id) => {
    expect(ficheIdFromBranch(branch)).toBe(id);
  });

  it.each(['main', 'feat/sans-id', 'develop'])('%s → null (pas de branche de travail à id)', (b) => {
    expect(ficheIdFromBranch(b)).toBeNull();
  });
});

describe('buildProcessData — l’étape se déduit du statut et des signaux (critère 1)', () => {
  it('idea sans branche → Idée ; ready sans branche → Prête', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0001', status: 'idea' }), fiche({ id: '0002', status: 'ready' })],
      }),
    );
    expect(stageOf(data, '0001')).toBe('idee');
    expect(stageOf(data, '0002')).toBe('prete');
  });

  it('une branche feat/<id>-… pose la fiche « en sprint », même sans worktree', () => {
    const data = buildProcessData(
      inputs({ fiches: [fiche({ id: '0007', status: 'ready' })], branches: ['feat/0007-slug'] }),
    );
    expect(stageOf(data, '0007')).toBe('en-sprint');
  });

  // Fiche 20261013131852984, critère 4 : une branche restée après le merge (absorbée par main) ne
  // doit PAS faire croire que la story est encore en cours.
  it('une branche feat/<id>-… ABSORBÉE par main ne pose PAS « en sprint » (reste à son étape de statut)', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0008', status: 'ready' })],
        branches: ['feat/0008-slug'],
        absorbedBranches: ['feat/0008-slug'],
      }),
    );
    expect(stageOf(data, '0008')).toBe('prete');
  });

  it('une branche de SESSION absorbée ne pose pas « en sprint » non plus', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0014', status: 'ready' })],
        sessions: [session('/w', 'feat/0014-slug')],
        absorbedBranches: ['feat/0014-slug'],
      }),
    );
    expect(stageOf(data, '0014')).toBe('prete');
  });

  // Fiche 20261013131852984 : une session sur une branche absorbée ne « travaille » plus la fiche —
  // la pastille de session ne doit pas contredire le stage (sinon « Prête » + « quelqu'un bosse »).
  it('une session sur une branche absorbée n’attache PAS de pastille de session', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0015', status: 'ready' })],
        sessions: [session('/w', 'feat/0015-slug')],
        absorbedBranches: ['feat/0015-slug'],
      }),
    );
    expect(stageOf(data, '0015')).toBe('prete');
    expect(ficheIn(data, '0015').session).toBeNull();
  });

  it('status shipped → Livrée', () => {
    const data = buildProcessData(
      inputs({ fiches: [fiche({ id: '0009', status: 'shipped', done: true })] }),
    );
    expect(stageOf(data, '0009')).toBe('livree');
  });

  // ADR-0077 : `in-progress` n'est plus un status écrivable — « en cours » se déduit des branches.
  // La vue ne pose donc plus une fiche « en sprint » sur la foi du status seul : elle suit les signaux
  // vivants (branche, PR). Le cran de repli sur le status a disparu.
  it('status in-progress SANS signal vivant → suit les signaux, pas d’épinglage « en sprint » (ADR-0077)', () => {
    const data = buildProcessData(
      inputs({ fiches: [fiche({ id: '0012', status: 'in-progress' })] }),
    );
    expect(stageOf(data, '0012')).toBe('idee');
  });

  it('une branche de travail pose « en sprint », quel que soit le status écrit', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0013', status: 'ready' })],
        branches: ['feat/0013-slug'],
      }),
    );
    expect(stageOf(data, '0013')).toBe('en-sprint');
  });

  it('chaque fiche n’est posée que sur UNE étape', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0001', status: 'ready' })],
        branches: ['feat/0001-slug'],
        openPrByBranch: { 'feat/0001-slug': '#3' },
      }),
    );
    const count = data.stages.reduce(
      (n, g) => n + g.fiches.filter((f) => f.id === '0001').length,
      0,
    );
    expect(count).toBe(1);
  });
});

describe('buildProcessData — le signal le plus avancé gagne (critère 2)', () => {
  it('une PR ouverte ET une branche → « en revue », pas « en sprint »', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0005', status: 'ready' })],
        branches: ['feat/0005-slug'],
        openPrByBranch: { 'feat/0005-slug': '#12' },
      }),
    );
    expect(stageOf(data, '0005')).toBe('en-revue');
    expect(ficheIn(data, '0005').reviewIndetermine).toBe(false);
  });
});

describe('buildProcessData — la session qui travaille la fiche (critère 3)', () => {
  it('une fiche avec branche affiche sa session (worktree + branche)', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0008', status: 'ready' })],
        sessions: [session('/wt/feat-8', 'feat/0008-slug')],
      }),
    );
    expect(ficheIn(data, '0008').session).toEqual({ path: '/wt/feat-8', branch: 'feat/0008-slug' });
  });

  it('une fiche sans session n’affiche rien d’inventé (session = null)', () => {
    const data = buildProcessData(inputs({ fiches: [fiche({ id: '0008', status: 'ready' })] }));
    expect(ficheIn(data, '0008').session).toBeNull();
  });
});

describe('buildProcessData — version, milestone et valeurs de filtre', () => {
  it('porte version et milestone de la fiche sur la carte', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0021', status: 'ready', version: 'v0.7.0', milestone: 'rationalisation' })],
      }),
    );
    const f = ficheIn(data, '0021');
    expect(f.version).toBe('v0.7.0');
    expect(f.milestone).toBe('rationalisation');
  });

  it('expose les versions/milestones/priorités distincts présents (pour les menus de filtre)', () => {
    const data = buildProcessData(
      inputs({
        fiches: [
          fiche({ id: '0001', status: 'ready', version: 'v0.8.0', milestone: '', priority: 'P0' }),
          fiche({ id: '0002', status: 'idea', version: 'v0.7.0', milestone: 'rationalisation', priority: 'P1' }),
          fiche({ id: '0003', status: 'ready', version: 'v0.7.0', milestone: '', priority: 'P1' }),
        ],
      }),
    );
    // Triés, dédoublonnés, sans valeur vide.
    expect(data.filtres.versions).toEqual(['v0.7.0', 'v0.8.0']);
    expect(data.filtres.milestones).toEqual(['rationalisation']);
    expect(data.filtres.priorites).toEqual(['P0', 'P1']);
  });

  it('les filtres ne listent QUE ce qui est affiché (une terminale exclue n’y apparaît pas)', () => {
    const data = buildProcessData(
      inputs({
        fiches: [
          fiche({ id: '0001', status: 'ready', version: 'v0.7.0' }),
          fiche({ id: '0002', status: 'superseded', done: true, version: 'v0.1.0' }),
        ],
      }),
    );
    expect(data.filtres.versions).toEqual(['v0.7.0']); // v0.1.0 (superseded) n'est pas dans la vue
  });
});

describe('buildProcessData — le lien vers le détail est porté (critère 4)', () => {
  it('chaque fiche garde son chemin de fichier (la vue en fait un lien)', () => {
    const data = buildProcessData(inputs({ fiches: [fiche({ id: '0003', status: 'ready' })] }));
    expect(ficheIn(data, '0003').file).toBe('features/0003_slug.md');
  });
});

describe('buildProcessData — absence de PR = cas de première classe (critère 6)', () => {
  it('openPrByBranch null : une fiche avec branche reste « en sprint », jamais rétrogradée', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0006', status: 'ready' })],
        branches: ['feat/0006-slug'],
        openPrByBranch: null,
      }),
    );
    expect(stageOf(data, '0006')).toBe('en-sprint');
    expect(ficheIn(data, '0006').reviewIndetermine).toBe(true);
    expect(data.reviewIndetermine).toBe(true);
  });

  it('openPrByBranch présent mais vide (gh a répondu, zéro PR) : review déterminé, pas de drapeau', () => {
    const data = buildProcessData(
      inputs({
        fiches: [fiche({ id: '0006', status: 'ready' })],
        branches: ['feat/0006-slug'],
        openPrByBranch: {},
      }),
    );
    expect(stageOf(data, '0006')).toBe('en-sprint');
    expect(ficheIn(data, '0006').reviewIndetermine).toBe(false);
    expect(data.reviewIndetermine).toBe(false);
  });
});

describe('buildProcessData — bornes et hygiène', () => {
  it('écarte superseded/merged/split et les parkées', () => {
    const data = buildProcessData(
      inputs({
        fiches: [
          fiche({ id: '0001', status: 'superseded', done: true }),
          fiche({ id: '0002', status: 'merged', done: true }),
          fiche({ id: '0003', status: 'split', done: true }),
          fiche({ id: '0004', status: 'idea', milestone: 'parked' }),
          fiche({ id: '0005', status: 'ready' }),
        ],
      }),
    );
    expect(stageOf(data, '0001')).toBeUndefined();
    expect(stageOf(data, '0002')).toBeUndefined();
    expect(stageOf(data, '0003')).toBeUndefined();
    expect(stageOf(data, '0004')).toBeUndefined();
    expect(stageOf(data, '0005')).toBe('prete');
  });

  it('la colonne Livrée porte TOUTES les livrées, plus récent d’abord (la page tronque l’affichage, pas la donnée)', () => {
    const shipped = ['0010', '0020', '0030', '0040'].map((id) =>
      fiche({ id, status: 'shipped', done: true }),
    );
    const data = buildProcessData(inputs({ fiches: shipped }));
    const g = data.stages.find((grp) => grp.stage === 'livree')!;
    // Aucune troncature côté donnée : les 4 sont là, id décroissant → filtrer/chercher une vieille
    // livrée ne renvoie jamais « 0 » à tort (revue P1). La limite d'affichage vit dans la page.
    expect(g.fiches.map((f) => f.id)).toEqual(['0040', '0030', '0020', '0010']);
  });

  it('les cinq étapes sont toujours présentes, dans l’ordre du flux', () => {
    const data = buildProcessData(inputs({ fiches: [] }));
    expect(data.stages.map((g) => g.stage)).toEqual([
      'idee',
      'prete',
      'en-sprint',
      'en-revue',
      'livree',
    ]);
  });

  it('trie par priorité puis id dans une étape', () => {
    const data = buildProcessData(
      inputs({
        fiches: [
          fiche({ id: '0002', status: 'ready', priority: 'P2' }),
          fiche({ id: '0001', status: 'ready', priority: 'P0' }),
          fiche({ id: '0003', status: 'ready', priority: 'P0' }),
        ],
      }),
    );
    const prete = data.stages.find((g) => g.stage === 'prete')!.fiches.map((f) => f.id);
    expect(prete).toEqual(['0001', '0003', '0002']);
  });
});

describe('buildProcessDataBlock — le bloc pour process.data.js', () => {
  it('pose window.EZK_PROCESS entre marqueurs et échappe les < (anti-fermeture de script)', () => {
    const block = buildProcessDataBlock(
      inputs({ fiches: [fiche({ id: '0001', status: 'ready', title: 'a </script> b' })] }),
    );
    expect(block).toContain('window.EZK_PROCESS =');
    expect(block).toContain('/*ezk-process-data:begin*/');
    expect(block).toContain('/*ezk-process-data:end*/');
    expect(block).not.toContain('</script>');
  });
});
