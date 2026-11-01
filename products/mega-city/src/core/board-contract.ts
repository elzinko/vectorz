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
import { buildAvancementData } from './avancement-data.js';
import { TERMINAUX } from './fiche-schema.js';
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
  version: z.string().describe("Version ciblée telle qu'écrite, '' sans version."),
  enCours: z.boolean().describe('Une branche de travail est ouverte pour la fiche (ADR-0077).'),
  file: z.string().describe('Chemin de la fiche, relatif à la racine du projet.'),
});

const BoardMilestoneSchema = z.strictObject({
  milestone: z.string(),
  status: z.string(),
  total: count(),
  shipped: count(),
  counts: z.record(z.string(), count()),
  children: z.array(z.string()),
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
  etat: z.enum(['en-cours', 'a-clore', 'livree', 'rouverte', 'vide']),
  cycleDeVie: z.enum(['brouillon', 'figee', 'livree']),
  etiquette: z.string().nullable().describe('Étiquette git de release (`v1.2.0`), null si la version n’est pas sortie.'),
  etiquetteGel: z.string().nullable().describe('Étiquette de gel (`freeze/v1.2.0`), null sans gel.'),
  livrees: z.array(z.string()).describe('Ids des fiches livrées du lot.'),
  aFaire: z.array(z.string()).describe('Ids des fiches restant à livrer, hors parkées.'),
  pretes: z.array(z.string()).describe('Parmi aFaire : les fiches prêtes.'),
  bloquees: z.array(z.string()).describe('Parmi aFaire : les fiches bloquées.'),
  intrus: z.array(z.string()).describe('Fiches parkées qui portent pourtant cette version : hors lot.'),
});

const VersionsSchema = z.strictObject({
  courante: z.string().nullable().describe('La version en cours : le premier lot sans étiquette (ADR-0070).'),
  ecartees: z.array(z.string()).describe('Versions après la version en cours, écartées du tirage.'),
  lots: z.array(LotSchema).describe('Un lot par version bien écrite. Les fiches closes sans livraison n’y sont pas.'),
  illisibles: z
    .array(z.strictObject({ id: z.string(), title: z.string(), version: z.string(), file: z.string() }))
    .describe('Fiches dont la version est mal écrite : dans aucun lot, jamais ignorées.'),
});

const VerdictSchema = z.strictObject({ verdict: z.enum(['up', 'down']), date: z.string() });

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
}

const isParked = (f: Fiche): boolean => f.status === 'idea' && f.milestone === 'parked';
const ids = (fs: readonly Fiche[]): string[] => fs.map((f) => f.id);

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

/** Compile le contrat. Tout est trié : la même entrée donne toujours la même sortie. */
export function buildBoardContract(input: BoardContractInput): BoardContract {
  const { fiches, inProgressIds, tags, verdicts } = input;
  const board = buildAvancementData([...fiches], inProgressIds);
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
        etat: lot.state,
        cycleDeVie: lifecycleOf(lot),
        etiquette: lot.releaseTag ?? null,
        etiquetteGel: lot.freezeTag ?? null,
        livrees: ids(lot.shipped),
        aFaire: ids(lot.todo),
        pretes: ids(lot.ready),
        bloquees: ids(lot.blocked),
        intrus: ids(lot.intruders),
      })),
      illisibles: report.malformed.map((f) => ({ id: f.id, title: f.title, version: f.version, file: f.file })),
    },
    verdicts: Object.fromEntries(Object.entries(verdicts.verdicts).sort(([a], [b]) => (a < b ? -1 : 1))),
    verdictsIllisibles: [...verdicts.illisibles].sort(),
  };
}
