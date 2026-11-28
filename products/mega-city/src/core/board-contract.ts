/**
 * board-contract — le CONTRAT JSON de `ezk board show --json`. PUR (ADR-0003).
 *
 * En clair : la méthode est le seul programme qui interprète une fiche (ADR-086). Ce module publie
 * tout ce qu'elle calcule sur le plan d'un projet, dans un format versionné : un autre programme
 * (mission control, un script, un LLM) l'affiche sans rien recalculer. Fiche 20261029112813308.
 *
 * Le format est décrit UNE fois, ici, en zod. Le schéma JSON rangé dans `contracts/board-show/` en
 * est tiré (`pnpm board:contract --write`) : jamais écrit à la main.
 *
 * Règle de version : `schema_version` monte quand un champ disparaît, change de nom ou de sens.
 * Un champ ajouté le laisse tel quel. Un consommateur lit les champs qu'il connaît.
 *
 * Le schéma zod est STRICT : il refuse un champ qu'il ne décrit pas. C'est le contrôle du
 * producteur (tout ce qui sort est décrit). Le schéma JSON publié, lui, tolère un champ ajouté
 * (`io/contract-files.ts`), pour qu'un consommateur qui le valide ne casse pas à un ajout.
 *
 * Nommage : les clés suivent le board d'avancement (`tirables`, `actives`, `filtres`). Seule
 * `schema_version` garde la forme courante des formats versionnés : c'est la clé qu'un
 * consommateur lit avant de savoir quoi que ce soit d'autre.
 */
import { z } from 'zod';
import { lifecycleOf, buildVersions } from '../backlog/versions.js';
import { versionScope } from '../backlog/version-scope.js';
import type { Fiche } from '../loaders/fiches.js';
import type { RunReport } from '../loaders/runs.js';
import { buildAvancementData } from './avancement-data.js';
import type { CartoStatus } from './carto.js';
import { derniereEtiquette, livreesDepuis } from './coupe.js';
import { isParked, TERMINAUX } from './fiche-schema.js';
import type { ReleaseVerdict } from './release-gate.js';
import { DERNIERS_SPRINTS, type SprintListed } from './sprint-report-summary.js';
import type { VerdictsData } from './verdicts.js';

/** La version du format. Un consommateur qui lit une autre valeur le dit, et n'affiche rien de faux. */
export const BOARD_SCHEMA_VERSION = 1;

/** Un compte : un entier jamais négatif. */
const count = (): z.ZodNumber => z.number().int().nonnegative();

const BoardFicheSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  priority: z.string(),
  status: z.string(),
  milestone: z.string(),
  product: z.string(),
  pr: z.string(),
  labels: z.array(z.string()),
  blocked: z.string().describe("Raison du blocage (`blocked:`), '' si la fiche n'est pas bloquée."),
  blockedLibelle: z
    .string()
    .describe("La raison du blocage en français : la décision attendue, même table que `ezk now --json` ; '' sans blocage."),
  version: z.string().describe("Version ciblée telle qu'écrite, '' sans version."),
  enCours: z.boolean().describe('Une branche de travail est ouverte pour la fiche (ADR-0077).'),
  file: z.string().describe('Chemin de la fiche, relatif à la racine du projet.'),
});

const BoardMilestoneSchema = z.strictObject({
  milestone: z.string(),
  nom: z
    .string()
    .describe("Nom en clair, lu dans la déclaration `features/milestones/<slug>.md` ; '' sans déclaration. Jamais lu dans PLAN.md."),
  status: z.string(),
  total: count(),
  shipped: count(),
  counts: z.record(z.string(), count()),
  children: z.array(z.string()).describe('Ids des fiches actives (hors done/) de l’objectif, triés.'),
  livrees: z.array(z.string()).describe('Ids des fiches livrées (rangées dans done/) de l’objectif, triés : autant que shipped.'),
  versions: z.array(z.string()).describe('Versions distinctes et non vides de ces livrées, dans l’ordre des versions.'),
});

const ComptesSchema = z
  .strictObject({
    total: count().describe('Toutes les fiches du projet.'),
    idees: count().describe('Idées, hors parkées et hors en cours.'),
    pretes: count().describe('Prêtes sans branche ouverte : le stock tirable.'),
    enCours: count().describe('Fiches avec une branche de travail ouverte (ADR-0077).'),
    parkees: count().describe('Idées rangées dans la milestone `parked`.'),
    livrees: count().describe('Statut `shipped`.'),
    closes: count().describe('Closes sans livraison : superseded, merged, split.'),
    autres: count().describe('Statut inconnu de la méthode (le validateur le signale).'),
    bloquees: count().describe(
      'Drapeau : fiches à faire (idées, prêtes, en cours, autres) qui portent `blocked:`. Recoupe les colonnes.',
    ),
    sansVersion: count().describe('Drapeau : fiches à faire sans version, hors parkées. Recoupe les colonnes.'),
  })
  .describe(
    'Comptes interprétés par les règles de la méthode. Les colonnes de idees à autres se partagent les fiches : leur somme vaut total.',
  );

const LotSchema = z.strictObject({
  version: z.string(),
  nom: z
    .string()
    .describe("Nom en clair, lu dans la déclaration `features/versions/<vX.Y.Z>.md` (ADR-0088 §7) ; '' sans déclaration. Jamais lu dans PLAN.md."),
  milestones: z.array(z.string()).describe('Objectifs distincts et non vides des fiches du lot (livrées et à faire), triés.'),
  etat: z.enum(['en-cours', 'a-clore', 'livree', 'rouverte', 'vide']),
  cycleDeVie: z.enum(['brouillon', 'figee', 'livree']),
  etiquette: z.string().nullable().describe('Étiquette git de release (`v1.2.0`), null si la version n’est pas sortie.'),
  dateEtiquette: z
    .string()
    .nullable()
    .describe('Date ISO 8601 de l’étiquette de release (`git for-each-ref`), null sans étiquette.'),
  etiquetteGel: z.string().nullable().describe('Étiquette de gel (`freeze/v1.2.0`), null sans gel.'),
  livrees: z.array(z.string()).describe('Ids des fiches livrées du lot.'),
  aFaire: z.array(z.string()).describe('Ids des fiches restant à livrer, hors parkées.'),
  pretes: z.array(z.string()).describe('Parmi aFaire : les fiches prêtes.'),
  bloquees: z.array(z.string()).describe('Parmi aFaire : les fiches bloquées.'),
  intrus: z.array(z.string()).describe('Fiches parkées qui portent pourtant cette version : hors lot.'),
});

const ProchaineCoupeSchema = z
  .strictObject({
    derniereEtiquette: z
      .string()
      .nullable()
      .describe('La plus haute étiquette `vX.Y.Z` ; null sans étiquette (non publié, jamais une valeur inventée).'),
    livrees: z
      .array(z.strictObject({ id: z.string(), titre: z.string(), objectif: z.string().describe("'' sans objectif.") }))
      .describe('Fiches ajoutées à `features/done/` depuis la dernière étiquette, triées par id ; [] sans étiquette.'),
    nombre: count()
      .nullable()
      .describe('Le nombre de ces fiches ; null sans étiquette (non publié, jamais 0).'),
    gate: z
      .strictObject({
        version: z.string(),
        verdict: z.enum(['GO', 'NO-GO']),
        date: z.string().describe('Quand le verdict a été établi (ISO 8601).'),
        passes: z.array(
          z.strictObject({
            id: z.string(),
            title: z.string(),
            go: z.boolean(),
            sautee: z.boolean().describe('La passe n’a pas tourné : ni GO ni NO-GO.'),
          }),
        ),
      })
      .nullable()
      .describe('Le dernier verdict écrit par `ezk release` (`.vectorz/release/<version>.json`) ; null si aucun.'),
    carnet: z
      .strictObject({
        app: z.string(),
        tested: count(),
        total: count(),
        jamais: count(),
        valide: count(),
        echec: count(),
        expire: count(),
      })
      .nullable()
      .describe('Les comptes de `ezk carto status --json` ; null sans carnet déclaré (une seule app).'),
    numeroPropose: z.null().describe('Le numéro proposé pour la coupe : null tant que la règle n’est pas tranchée.'),
  })
  .describe('Ce qui attend la prochaine coupe : tout ce qui a été livré depuis la dernière étiquette (fiche 20261114131612759).');

const VersionsSchema = z.strictObject({
  courante: z.string().nullable().describe('La version en cours : le premier lot sans étiquette (ADR-0070).'),
  ecartees: z.array(z.string()).describe('Versions après la version en cours, écartées du tirage.'),
  lots: z.array(LotSchema).describe('Un lot par version bien écrite. Les fiches closes sans livraison n’y sont pas.'),
  illisibles: z
    .array(z.strictObject({ id: z.string(), title: z.string(), version: z.string(), file: z.string() }))
    .describe('Fiches dont la version est mal écrite : dans aucun lot, jamais ignorées.'),
  prochaineCoupe: ProchaineCoupeSchema,
});

const VerdictSchema = z.strictObject({ verdict: z.enum(['up', 'down']), date: z.string() });

const SessionSchema = z.strictObject({
  date: z.string().describe('`AAAA-MM-JJ`, lue du nom du récit.'),
  title: z.string().describe('Le premier titre du récit, ou son nom à défaut.'),
  file: z.string().describe('Le récit, relatif à la racine du projet.'),
  fiches: z.array(z.string()).describe('Fiches travaillées (ligne `fiches:` du récit).'),
  prs: z.array(z.string()).describe('Numéros de PR cités dans le récit.'),
});

/** Un sprint publié : `sprints[]` et `derniersSprints[]` partagent ce format. */
const SprintEntrySchema = z.strictObject({
  slug: z.string(),
  numero: z
    .number()
    .int()
    .positive()
    .describe('Le numéro continu depuis le début du projet : celui écrit au `close`, sinon le rang du compte rendu dans l’historique. Jamais le compteur du journal de branche.'),
  but: z.string().nullable().describe('Le but complet du sprint ; `null` si le compte rendu ne le dit pas (compte rendu d’avant).'),
  debut: z.string().nullable().describe('Début de la fenêtre du sprint (ISO 8601) ; `null` si non daté.'),
  branche: z.string().nullable().describe('La branche sur laquelle le sprint a été clos ; `null` si le compte rendu ne la dit pas.'),
  fichier: z.string().describe('Le compte rendu, relatif à la racine du projet.'),
  jour: z.string().describe('Le jour du compte rendu (`AAAA-MM-JJ`), tiré de son nom.'),
  fin: z.string().nullable().describe('Fin de la fenêtre du sprint (ISO 8601) ; `null` si non datée.'),
  dureeMs: z.number().nullable().describe('Durée du sprint ; `null` si non mesurée (jamais un faux zéro).'),
  tokens: z
    .number()
    .nullable()
    .describe('Jetons du sprint, au grain `sprint` seulement ; `null` sinon (le grain session compte tout le run).'),
  livrees: z.array(z.strictObject({ id: z.string(), title: z.string() })).describe('Les fiches livrées du lot scellé.'),
  blocages: z.number().nullable().describe('Blocages essuyés ; `null` si le compte rendu ne le dit pas.'),
});

export const BoardContractSchema = z.strictObject({
  schema_version: z.literal(BOARD_SCHEMA_VERSION),
  counts: z
    .record(z.string(), count())
    .describe('Hérité : fiches par statut écrit, brut, sans interprétation. Pour afficher, lire comptes.'),
  tirables: count(),
  actives: z.array(BoardFicheSchema).describe('Fiches à faire, hors parkées, triées priorité puis id.'),
  milestones: z.array(BoardMilestoneSchema),
  filtres: z.strictObject({
    statuts: z.array(z.string()),
    priorites: z.array(z.string()),
    produits: z.array(z.string()),
    labels: z.array(z.string()),
    milestones: z.array(z.string()),
  }),
  comptes: ComptesSchema,
  versions: VersionsSchema,
  verdicts: z.record(z.string(), VerdictSchema).describe('Pouces de revue posés, par id de fiche (ADR-0057).'),
  historique: z
    .strictObject({
      sprints: count().describe('Comptes rendus de sprint (`docs/sprints/AAAA-MM-JJ-sprint-<slug>.md`).'),
      retros: count().describe('Captures de rétro (`AAAA-MM-JJ-retro-<slug>.md`, dossier `scrum:` du projet).'),
    })
    .describe('Ce que la méthode a mené dans le projet. Zéro = rien trouvé, compté (fiche 20261102104443762).'),
  sprints: z
    .array(SprintEntrySchema)
    .describe(
      'Tous les comptes rendus de sprint de `docs/sprints/`, le plus récent d’abord, chacun avec son numéro continu, son but, son début et sa branche (fiche 20261114131612204).',
    ),
  derniersSprints: z
    .array(SprintEntrySchema)
    .describe('Les 5 derniers comptes rendus de sprint, le plus récent d’abord (fiche 20261104090517904) : les 5 premiers de `sprints`.'),
  sessions: z
    .array(SessionSchema)
    .describe('Sessions closes, une par récit du dossier `scrum:` du projet, la plus récente d’abord (fiche 20261102123552182).'),
  verdictsIllisibles: z.array(z.string()).describe('Fichiers de verdict illisibles, jamais ignorés en silence.'),
});

export type BoardContract = z.infer<typeof BoardContractSchema>;

export interface BoardContractInput {
  fiches: readonly Fiche[];
  /** Ids des fiches dont une branche de travail est ouverte (ADR-0077), lus au bord. */
  inProgressIds: ReadonlySet<string>;
  /** Étiquettes git locales, lues au bord. */
  tags: ReadonlySet<string>;
  /** Pouces de revue, lus au bord (`io/verdicts.ts`). */
  verdicts: VerdictsData;
  /** Comptes rendus de sprint et captures de rétro, comptés au bord (`io/board-show.ts`). */
  historique: { sprints: number; retros: number };
  /** Récits des sessions closes, lus au bord (`loaders/runs.ts`), la plus récente d'abord. */
  sessions: readonly RunReport[];
  /** Tous les sprints, résumés au bord depuis leurs comptes rendus, le plus récent d'abord (`core/sprint-report-summary.ts`). */
  sprints?: readonly SprintListed[];
  /** Le nom en clair des objectifs déclarés, lus au bord (`loaders/milestones.ts`). */
  nomsMilestones?: ReadonlyMap<string, string>;
  /** Le nom en clair des versions déclarées, lus au bord (`loaders/milestones.ts`). */
  nomsVersions?: ReadonlyMap<string, string>;
  /** La date ISO de chaque étiquette, lue au bord (`io/git-coupe.ts`). */
  datesEtiquettes?: ReadonlyMap<string, string>;
  /** Les faits de la prochaine coupe, lus au bord (`io/board-show.ts`). */
  coupe?: {
    /** Fichiers ajoutés à `features/done/` depuis la dernière étiquette (`io/git-coupe.ts`). */
    ajoutees: readonly string[];
    /** Le dernier verdict de `ezk release`, ou null. */
    gate: ReleaseVerdict | null;
    /** L'état du carnet de tests, ou null. */
    carnet: CartoStatus | null;
  };
}

const ids = (fs: readonly Fiche[]): string[] => fs.map((f) => f.id);

/** Les objectifs distincts et non vides d'un ensemble de fiches, triés. */
const objectifsOf = (fs: readonly Fiche[]): string[] => [...new Set(fs.map((f) => f.milestone).filter((m) => m !== ''))].sort();

/**
 * La colonne d'une fiche. Chaque fiche tombe dans UNE colonne, dans cet ordre : close, livrée, en
 * cours, parkée, prête, idée, autre. Une branche ouverte passe avant le statut écrit (ADR-0077).
 */
type Colonne = 'closes' | 'livrees' | 'enCours' | 'parkees' | 'pretes' | 'idees' | 'autres';

/** Les colonnes « à faire » : celles où un blocage compte (comme dans les lots, parkées exclues). */
const A_FAIRE: ReadonlySet<Colonne> = new Set(['idees', 'pretes', 'enCours', 'autres']);
function colonneOf(f: Fiche, inProgressIds: ReadonlySet<string>): Colonne {
  if (TERMINAUX.includes(f.status)) return 'closes';
  if (f.status === 'shipped') return 'livrees';
  if (inProgressIds.has(f.id) || f.status === 'in-progress') return 'enCours';
  if (isParked(f)) return 'parkees';
  if (f.status === 'ready') return 'pretes';
  if (f.status === 'idea') return 'idees';
  return 'autres';
}

const copySprint = (s: SprintListed): SprintListed => ({ ...s, livrees: s.livrees.map((f) => ({ ...f })) });

/** Compile le contrat. Tout est trié : la même entrée donne toujours la même sortie. */
export function buildBoardContract(input: BoardContractInput): BoardContract {
  const { fiches, inProgressIds, tags, verdicts, historique, sessions, sprints = [], nomsMilestones } = input;
  const { nomsVersions = new Map<string, string>(), datesEtiquettes = new Map<string, string>() } = input;
  const coupe = input.coupe ?? { ajoutees: [], gate: null, carnet: null };
  const board = buildAvancementData([...fiches], inProgressIds, nomsMilestones);
  const report = buildVersions(fiches, tags);
  const scope = versionScope(report);

  const comptes = {
    total: fiches.length,
    idees: 0,
    pretes: 0,
    enCours: 0,
    parkees: 0,
    livrees: 0,
    closes: 0,
    autres: 0,
    bloquees: 0,
    sansVersion: report.unversioned.total - report.unversioned.parked,
  };
  for (const f of fiches) {
    const colonne = colonneOf(f, inProgressIds);
    comptes[colonne] += 1;
    if (f.blocked !== '' && A_FAIRE.has(colonne)) comptes.bloquees += 1;
  }

  return {
    schema_version: BOARD_SCHEMA_VERSION,
    ...board,
    comptes,
    versions: {
      courante: scope.current ?? null,
      ecartees: [...scope.deferred],
      lots: report.lots.map((lot) => ({
        version: lot.version,
        nom: nomsVersions.get(lot.version) ?? '',
        milestones: objectifsOf([...lot.shipped, ...lot.todo]),
        etat: lot.state,
        cycleDeVie: lifecycleOf(lot),
        etiquette: lot.releaseTag ?? null,
        dateEtiquette: lot.releaseTag === undefined ? null : (datesEtiquettes.get(lot.releaseTag) ?? null),
        etiquetteGel: lot.freezeTag ?? null,
        livrees: ids(lot.shipped),
        aFaire: ids(lot.todo),
        pretes: ids(lot.ready),
        bloquees: ids(lot.blocked),
        intrus: ids(lot.intruders),
      })),
      illisibles: report.malformed.map((f) => ({ id: f.id, title: f.title, version: f.version, file: f.file })),
      prochaineCoupe: prochaineCoupeOf(fiches, tags, coupe),
    },
    verdicts: Object.fromEntries(Object.entries(verdicts.verdicts).sort(([a], [b]) => (a < b ? -1 : 1))),
    verdictsIllisibles: [...verdicts.illisibles].sort(),
    historique: { sprints: historique.sprints, retros: historique.retros },
    sprints: sprints.map(copySprint),
    derniersSprints: sprints.slice(0, DERNIERS_SPRINTS).map(copySprint),
    sessions: sessions.map((s) => ({ date: s.date, title: s.title, file: s.file, fiches: s.fiches, prs: s.prs })),
  };
}

/** La prochaine coupe. Sans étiquette, rien n'est publié : null ou [], jamais un faux zéro. */
function prochaineCoupeOf(
  fiches: readonly Fiche[],
  tags: ReadonlySet<string>,
  coupe: NonNullable<BoardContractInput['coupe']>,
): BoardContract['versions']['prochaineCoupe'] {
  const etiquette = derniereEtiquette(tags);
  const livrees = etiquette === null ? [] : livreesDepuis(coupe.ajoutees, fiches);
  const { gate, carnet } = coupe;
  return {
    derniereEtiquette: etiquette,
    livrees,
    nombre: etiquette === null ? null : livrees.length,
    gate:
      gate === null
        ? null
        : {
            version: gate.version,
            verdict: gate.verdict,
            date: gate.at,
            passes: gate.passes.map((p) => ({ id: p.id, title: p.title, go: p.go, sautee: p.skipped === true })),
          },
    carnet: carnet === null ? null : { app: carnet.app, ...carnet.counts },
    numeroPropose: null,
  };
}
