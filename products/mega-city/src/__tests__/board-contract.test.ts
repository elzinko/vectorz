/**
 * Le contrat de `ezk board show --json` (fiche 20261029112813308, ADR-086).
 *
 * En clair : la sortie respecte le schéma rangé, les comptes suivent les règles de la méthode sur la
 * fixture des cinq cas que mission control lisait mal, les champs d'avant ne bougent pas, et le
 * schéma comme l'exemple rangés pour les consommateurs sont à jour.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { blockedLibelle, ESCALATION_BY_REASON } from '../backlog/run-eligibility.js';
import { buildAvancementData } from '../core/avancement-data.js';
import { type BoardContract, BoardContractSchema, buildBoardContract } from '../core/board-contract.js';
import { TERMINAUX } from '../core/fiche-schema.js';
import {
  BOARD_EXAMPLE_FILE as EXAMPLE_FILE,
  BOARD_SCHEMA_FILE as SCHEMA_FILE,
  FIXTURE_EN_COURS,
  makeContractFixture,
  renderContractFiles,
} from '../io/contract-files.js';
import { boardShowData } from '../io/board-show.js';
import { collectInProgressIds } from '../io/sessions-collect.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';
import { loadMilestoneNoms } from '../loaders/milestones.js';

// La fixture lance des sous-process git, et le test de la commande lance tsx : sous la charge de la
// gate complète, le délai vitest par défaut (5 s) ne suffit pas (revue du 2026-11-01). La fixture
// est construite UNE fois et partagée par tout le fichier.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
let data: BoardContract;

beforeAll(() => {
  fixture = makeContractFixture();
  data = boardShowData(fixture);
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

const fiche = (id: string) => data.actives.find((f) => f.id === id);
const lot = (version: string) => data.versions.lots.find((l) => l.version === version);

describe('board show --json — le contrat', () => {
  it('sort schema_version 1 et respecte le schéma, sans champ en trop', () => {
    expect(data.schema_version).toBe(1);
    expect(BoardContractSchema.safeParse(data).success).toBe(true);
  });

  it('cause 1 — une branche ouverte fait la fiche « en cours » : compte et drapeau', () => {
    expect(data.comptes.enCours).toBe(1);
    expect(fiche(FIXTURE_EN_COURS)?.enCours).toBe(true);
    expect(data.tirables).toBe(1); // la fiche en cours n'est plus du stock tirable
  });

  it('cause 2 — un titre avec « : » garde son statut et sa version', () => {
    expect(fiche('20990101000000002')).toMatchObject({ title: 'Tour Driver.js : tracking', status: 'idea', version: 'v2.0.0' });
  });

  it('cause 3 — la fiche bloquée sort avec sa raison, et dans le compte des bloquées', () => {
    expect(fiche('20990101000000003')?.blocked).toBe('panel');
    expect(data.comptes.bloquees).toBe(1);
  });

  it('cause 4 — la fiche remplacée sort du lot de sa version', () => {
    const v1 = lot('v1.0.0');
    expect([...(v1?.livrees ?? []), ...(v1?.aFaire ?? [])].sort()).toEqual([
      '20990101000000001',
      '20990101000000003',
      '20990101000000006',
    ]);
    expect(data.comptes.closes).toBe(1);
  });

  it('cause 5 — la version V1.1 est listée illisible, jamais avalée', () => {
    expect(data.versions.illisibles.map((f) => [f.id, f.version])).toEqual([['20990101000000005', 'V1.1']]);
    expect(data.versions.lots.map((l) => l.version)).toEqual(['v1.0.0', 'v1.5.0', 'v2.0.0']);
  });

  it('les comptes interprétés : parkées et sans version à part, colonnes qui se partagent les fiches', () => {
    expect(data.comptes).toEqual({
      total: 9,
      idees: 3,
      pretes: 1,
      enCours: 1,
      parkees: 1,
      livrees: 2,
      closes: 1,
      autres: 0,
      bloquees: 1,
      sansVersion: 1,
    });
  });

  it('les lots : état, cycle de vie, et la version en cours nommée', () => {
    expect(data.versions.courante).toBe('v1.0.0');
    expect(data.versions.ecartees).toEqual(['v1.5.0', 'v2.0.0']);
    expect(lot('v1.5.0')).toMatchObject({ etat: 'a-clore', etiquette: null });
    expect(lot('v1.0.0')).toMatchObject({ etat: 'en-cours', cycleDeVie: 'brouillon', etiquette: null });
    expect(lot('v2.0.0')).toMatchObject({ cycleDeVie: 'figee', etiquetteGel: 'freeze/v2.0.0' });
    expect(lot('v1.0.0')?.bloquees).toEqual(['20990101000000003']);
  });

  it('les pouces de revue posés sortent, un fichier illisible est nommé', () => {
    expect(data.verdicts).toEqual({ '20990101000000002': { verdict: 'up', date: '2026-11-01' } });
    expect(data.verdictsIllisibles).toEqual(['features/reviews/verdicts/20990101000000003.json']);
  });

  it('les champs d’avant restent identiques à ceux du board d’avancement', () => {
    const before = buildAvancementData(loadFiches(fixture), collectInProgressIds(fixture), loadMilestoneNoms(fixture));
    const { counts, tirables, actives, milestones, filtres } = data;
    expect({ counts, tirables, actives, milestones, filtres }).toEqual(before);
  });
});

// fiche 20261114131612572 — chaque objectif publié avec son nom, ses livrées et leurs versions.
describe('board show --json — les objectifs publiés comme objets', () => {
  const objectif = (m: string) => data.milestones.find((x) => x.milestone === m);

  it('l’objectif déclaré porte son nom, ses livrées et leurs versions ; children garde les actives', () => {
    expect(objectif('board')).toMatchObject({
      nom: 'Le board dit vrai',
      livrees: ['20990101000000006'],
      versions: ['v1.0.0'],
      children: ['20990101000000008'],
    });
  });

  it('un objectif non déclaré publie un nom vide, jamais un nom inventé', () => {
    expect(objectif('parked')).toMatchObject({ nom: '', livrees: [], versions: [] });
  });
});

// fiche 20261114131612759, volet a — les versions publiées comme coupes, et la prochaine coupe.
describe('board show --json — les versions publiées comme coupes', () => {
  it('chaque lot porte son nom déclaré, ses objectifs et la date de son étiquette (null sans étiquette)', () => {
    expect(lot('v1.0.0')).toMatchObject({ nom: 'Le socle', milestones: ['board'], dateEtiquette: null });
    expect(lot('v2.0.0')).toMatchObject({ nom: '', milestones: [], dateEtiquette: null });
  });

  it('la prochaine coupe : la dernière étiquette, les fiches rangées dans done/ depuis, et leur nombre', () => {
    expect(data.versions.prochaineCoupe).toMatchObject({
      derniereEtiquette: 'v0.9.0',
      livrees: [
        { id: '20990101000000004', titre: 'Remplacée', objectif: '' },
        { id: '20990101000000006', titre: 'Livrée', objectif: 'board' },
        { id: '20990101000000009', titre: 'Lot à clore', objectif: '' },
      ],
      nombre: 3,
      numeroPropose: null,
    });
  });

  it('la prochaine coupe reprend le dernier verdict de la gate ; sans carnet déclaré, carnet vaut null', () => {
    expect(data.versions.prochaineCoupe.gate).toEqual({
      version: 'v0.9.0',
      verdict: 'NO-GO',
      date: '2026-11-16T10:00:00.000Z',
      passes: [
        { id: 'dod-mecanique', title: 'DoD mécanique', go: true, sautee: false },
        { id: 'chasse-aux-bugs', title: 'Chasse aux bugs', go: false, sautee: false },
        { id: 'tests', title: 'Tests du projet', go: true, sautee: true },
      ],
    });
    expect(data.versions.prochaineCoupe.carnet).toBeNull();
  });

  it('cœur pur : une étiquette de release donne sa date ; le carnet publie ses comptes', () => {
    const livree = { ...loadFiches(fixture).find((f) => f.id === '20990101000000006')!, version: 'v0.9.0' };
    const out = buildBoardContract({
      fiches: [livree],
      inProgressIds: new Set(),
      tags: new Set(['v0.9.0']),
      datesEtiquettes: new Map([['v0.9.0', '2026-10-01T10:00:00+02:00']]),
      verdicts: { verdicts: {}, illisibles: [] },
      historique: { sprints: 0, retros: 0 },
      sessions: [],
      coupe: {
        ajoutees: [],
        gate: null,
        carnet: {
          schema_version: 1,
          app: 'mission-control',
          validity_days: 30,
          scope: 'exploration',
          counts: { tested: 3, total: 5, jamais: 2, valide: 2, echec: 1, expire: 0 },
          ignored_entries: 0,
          checks: [],
        },
      },
    });
    expect(out.versions.lots[0]).toMatchObject({ version: 'v0.9.0', etiquette: 'v0.9.0', dateEtiquette: '2026-10-01T10:00:00+02:00' });
    expect(out.versions.prochaineCoupe).toMatchObject({ derniereEtiquette: 'v0.9.0', livrees: [], nombre: 0, gate: null });
    expect(out.versions.prochaineCoupe.carnet).toEqual({
      app: 'mission-control',
      tested: 3,
      total: 5,
      jamais: 2,
      valide: 2,
      echec: 1,
      expire: 0,
    });
  });

  it('un projet sans étiquette ni compte rendu (cas muti) : null ou [], jamais 0, et board show n’écrit rien', () => {
    const root = mkdtempSync(join(tmpdir(), 'board-sans-etiquette-'));
    try {
      mkdirSync(join(root, 'features', 'done'), { recursive: true });
      spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
      const avant = readdirSync(root, { recursive: true }).sort();
      expect(boardShowData(root).versions.prochaineCoupe).toEqual({
        derniereEtiquette: null,
        livrees: [],
        nombre: null,
        gate: null,
        carnet: null,
        numeroPropose: null,
      });
      expect(readdirSync(root, { recursive: true }).sort()).toEqual(avant);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('board show --json — la règle des bloquées (cœur pur)', () => {
  const f = (over: Partial<Fiche>): Fiche =>
    ({ id: '', title: '', type: 'feature', priority: 'P2', status: 'idea', milestone: '', product: '', pr: '',
      labels: [], blocked: '', version: '', file: '', done: false, ...over }) as Fiche;

  it('une fiche bloquée compte si elle est à faire, même en cours ; jamais si elle est parkée ou livrée', () => {
    const contract = buildBoardContract({
      fiches: [
        f({ id: 'a', status: 'ready', blocked: 'panel' }),
        f({ id: 'b', status: 'ready', blocked: 'design' }), // en cours : compte
        f({ id: 'c', status: 'idea', milestone: 'parked', blocked: 'panel' }), // parkée : ne compte pas
        f({ id: 'd', status: 'shipped', done: true, blocked: 'panel' }), // livrée : ne compte pas
      ],
      inProgressIds: new Set(['b']),
      tags: new Set(),
      verdicts: { verdicts: {}, illisibles: [] },
      historique: { sprints: 0, retros: 0 },
      sessions: [],
    });
    expect(contract.comptes.bloquees).toBe(2);
    expect(contract.comptes).toMatchObject({ pretes: 1, enCours: 1, parkees: 1, livrees: 1 });
  });
});

describe('board show --json — ce que la méthode a mené (fiche 20261102104443762)', () => {
  it('compte les comptes rendus de sprint et les captures de rétro du projet, au bon format', () => {
    // La fixture range 2 comptes rendus et 1 capture, plus un fichier de chaque dossier hors format.
    expect(data.historique).toEqual({ sprints: 2, retros: 1 });
  });

  it('un projet sans ces dossiers compte un vrai zéro', () => {
    const root = mkdtempSync(join(tmpdir(), 'board-vide-'));
    try {
      mkdirSync(join(root, 'features'));
      spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
      expect(boardShowData(root).historique).toEqual({ sprints: 0, retros: 0 });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('board show --json — les sessions closes (fiche 20261102123552182)', () => {
  it('une session par récit, README exclu, la plus récente d’abord', () => {
    expect(data.sessions.map((s) => s.file)).toEqual([
      'docs/sessions/2026-10-31-seconde-session.md',
      'docs/sessions/2026-10-30-premiere-session.md',
    ]);
  });

  it('chaque session porte sa date, son titre, ses fiches et ses PR, lus dans le récit', () => {
    expect(data.sessions[1]).toEqual({
      date: '2026-10-30',
      title: 'Première session',
      file: 'docs/sessions/2026-10-30-premiere-session.md',
      fiches: ['20990101000000001'],
      prs: ['12'],
    });
    expect(data.sessions[0]).toMatchObject({ title: 'Seconde session', fiches: [], prs: [] });
  });

  it('un projet sans dossier de récits publie une liste vide, pas une erreur', () => {
    const root = mkdtempSync(join(tmpdir(), 'board-sans-sessions-'));
    try {
      mkdirSync(join(root, 'features'));
      spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
      expect(boardShowData(root).sessions).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('board show --json — sur le vrai dépôt', () => {
  it('la sortie respecte le schéma, et les comptes interprétés recoupent les statuts écrits', () => {
    const real = boardShowData(repoRoot);
    expect(BoardContractSchema.safeParse(real).success).toBe(true);
    // Autant de sessions que de récits au format `AAAA-MM-JJ-<slug>.md` (README et hors format exclus).
    const recits = readdirSync(join(repoRoot, 'docs', 'sessions')).filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f));
    expect(real.sessions).toHaveLength(recits.length);
    // Recoupements qui échouent si une fiche change de colonne à tort (pas une simple somme).
    expect(real.comptes.livrees).toBe(real.counts.shipped ?? 0);
    expect(real.comptes.closes).toBe(TERMINAUX.reduce((n, t) => n + (real.counts[t] ?? 0), 0));
    expect(real.comptes.pretes).toBeLessThanOrEqual(real.counts.ready ?? 0);
    expect(real.comptes.idees + real.comptes.parkees).toBeLessThanOrEqual(real.counts.idea ?? 0);
  });

  it('la prochaine coupe compte les fiches ajoutées à features/done/ depuis la dernière étiquette (commande git de la fiche)', () => {
    const coupe = boardShowData(repoRoot).versions.prochaineCoupe;
    expect(coupe.derniereEtiquette).not.toBeNull();
    const out = spawnSync(
      'git',
      ['-C', repoRoot, 'log', '--no-renames', '--diff-filter=A', '--name-only', '--pretty=format:', `${coupe.derniereEtiquette}..HEAD`, '--', 'features/done'],
      { encoding: 'utf8' },
    ).stdout;
    expect(coupe.nombre).toBe(out.split('\n').filter((l) => l.endsWith('.md')).length);
    expect(coupe.livrees).toHaveLength(coupe.nombre ?? -1);
  });

  it('chaque livrée qui porte un objectif est publiée une fois, dans les livrées de son objectif', () => {
    const real = boardShowData(repoRoot);
    const attendues = loadFiches(repoRoot)
      .filter((f) => f.done && f.milestone !== '' && !TERMINAUX.includes(f.status))
      .map((f) => f.id)
      .sort();
    expect(real.milestones.flatMap((m) => m.livrees).sort()).toEqual(attendues);
    for (const m of real.milestones) expect(m.livrees, m.milestone).toHaveLength(m.shipped);
  });
});

describe('board show --json — blockedLibelle (fiche 20261114131612944)', () => {
  it('toute fiche bloquée porte un libellé non vide, tiré de la table des décisions ; sinon vide', () => {
    for (const f of data.actives) {
      if (f.blocked === '') expect(f.blockedLibelle, f.id).toBe('');
      else expect(f.blockedLibelle, f.id).toBe(blockedLibelle(f.blocked));
    }
    expect(fiche('20990101000000003')?.blockedLibelle).toBe(ESCALATION_BY_REASON.panel);
    expect(fiche('20990101000000003')?.blocked).toBe('panel'); // le mot anglais ne change pas
  });

  it('le numéro de version du contrat ne bouge pas : ajout compatible', () => {
    expect(data.schema_version).toBe(1);
  });
});

describe('board show --json — les fichiers rangés pour les consommateurs', () => {
  it('le schéma et l’exemple sont à jour (sinon : pnpm board:contract --write)', () => {
    for (const [rel, text] of Object.entries(renderContractFiles(fixture))) {
      expect(readFileSync(join(megaCity, rel), 'utf8'), `${rel} n'est plus à jour`).toBe(text);
    }
  });

  it('l’exemple est bien la sortie de la vraie commande sur la fixture', () => {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'avancement.ts'), '--json', '--root', fixture], {
      encoding: 'utf8',
    });
    expect(r.status, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(JSON.parse(readFileSync(join(megaCity, EXAMPLE_FILE), 'utf8')));
  });

  it('l’exemple rangé respecte le schéma ; le producteur décrit chaque champ qu’il sort', () => {
    const example = JSON.parse(readFileSync(join(megaCity, EXAMPLE_FILE), 'utf8'));
    expect(BoardContractSchema.safeParse(example).success).toBe(true);
    // Le schéma zod est strict : un champ sorti sans être décrit ferait échouer ce test.
    expect(BoardContractSchema.safeParse({ ...example, inconnu: 1 }).success).toBe(false);
    const schema = JSON.parse(readFileSync(join(megaCity, SCHEMA_FILE), 'utf8'));
    expect(schema.properties.schema_version.const).toBe(example.schema_version);
    expect(Object.keys(schema.properties).sort()).toEqual(Object.keys(example).sort());
  });

  it('le schéma publié tolère un champ ajouté : il n’interdit aucun champ en plus', () => {
    const text = readFileSync(join(megaCity, SCHEMA_FILE), 'utf8');
    expect(text).not.toContain('"additionalProperties": false');
  });
});

// fiche 20261114131612204 — la liste complète des sprints, avec numéro continu, but, début et branche.
describe('board show --json — sprints[] (fiche 20261114131612204)', () => {
  it('publie autant de sprints que de comptes rendus de docs/sprints/, le plus récent d’abord', () => {
    expect(data.sprints).toHaveLength(data.historique.sprints);
    expect(data.sprints.map((s) => s.slug)).toEqual(['second', 'premier']);
  });

  it('chaque sprint a un numéro : celui écrit au close, sinon son rang dans l’historique', () => {
    expect(data.sprints.map((s) => [s.slug, s.numero])).toEqual([['second', 2], ['premier', 1]]);
  });

  it('un compte rendu daté porte son but, son début et sa branche ; un ancien les publie à null', () => {
    expect(data.sprints[0]).toMatchObject({
      but: 'Publier le second sprint avec son numéro continu',
      debut: '2026-10-31T09:00:00.000Z',
      fin: '2026-10-31T09:42:00.000Z',
      branche: 'main',
      fichier: 'docs/sprints/2026-10-31-sprint-second.md',
    });
    expect(data.sprints[1]).toMatchObject({ but: null, debut: null, branche: null });
  });

  it('`derniersSprints` garde son sens (les 5 derniers) et le contrat reste en version 1', () => {
    const entry = (i: number) => ({
      slug: `s${i}`, numero: i, but: null, debut: null, branche: null, fichier: `docs/sprints/s${i}.md`, jour: '2026-11-01',
      fin: null, dureeMs: null, tokens: null, livrees: [], blocages: null,
    });
    const sprints = Array.from({ length: 7 }, (_, i) => entry(7 - i));
    const out = buildBoardContract({
      fiches: [], inProgressIds: new Set(), tags: new Set(), verdicts: { verdicts: {}, illisibles: [] },
      historique: { sprints: 7, retros: 0 }, sessions: [], sprints,
    });
    expect(out.sprints).toHaveLength(7);
    expect(out.derniersSprints.map((s) => s.numero)).toEqual([7, 6, 5, 4, 3]);
    expect(out.schema_version).toBe(1);
  });

  it('lit le JSON rangé à côté du compte rendu quand il existe (une seule source)', () => {
    const root = mkdtempSync(join(tmpdir(), 'board-sprint-json-'));
    try {
      mkdirSync(join(root, 'docs', 'sprints'), { recursive: true });
      mkdirSync(join(root, 'features'));
      spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
      writeFileSync(join(root, 'docs/sprints/2026-11-20-sprint-x.md'), '# Rapport de sprint — x\n');
      writeFileSync(
        join(root, 'docs/sprints/2026-11-20-sprint-x.json'),
        JSON.stringify({
          schema: 'sprint-report@0.1',
          sprint: { slug: 'x', numero: 41, but: 'Le but du JSON', branche: 'feat/x' },
          window: { startTs: '2026-11-20T08:00:00.000Z', endTs: '2026-11-20T09:00:00.000Z' },
          duration: { ms: 3600000, grain: 'sprint' },
          tokens: { grain: 'sprint', totalTokens: 10 },
          kpi: { blockages: { count: 0 } },
          lot: { entries: [] },
        }),
      );
      expect(boardShowData(root).sprints[0]).toMatchObject({ numero: 41, but: 'Le but du JSON', branche: 'feat/x', debut: '2026-11-20T08:00:00.000Z' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
