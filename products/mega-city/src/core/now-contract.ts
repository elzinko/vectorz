/**
 * now-contract — le CONTRAT JSON de `ezk now --json`. PUR (ADR-0003).
 *
 * En clair : la cloche de mission control liste ce qui attend une décision du PO. La méthode la
 * publie, une alerte par élément, tirée de ce qu'elle publie déjà (le plan, les lots, la dernière
 * rétro). Mission control n'en déduit rien (ADR-086). Fiche 20261114131612944.
 *
 * Le format est décrit UNE fois, ici, en zod ; le schéma JSON rangé dans `contracts/now-show/` en est
 * tiré (`pnpm board:contract --write`). Même règle de version que `board-contract.ts` : `schema_version`
 * monte quand un champ disparaît ou change de sens, jamais pour un champ ajouté.
 *
 * Ce que la méthode ne sait pas encore calculer ne devient jamais un zéro : `non_mesure[]` le dit en mots.
 */
import { z } from 'zod';
import { blockedLibelle } from '../backlog/run-eligibility.js';
import type { BoardContract } from './board-contract.js';
import type { NowSuggestion } from './now.js';
import type { RetroCapture } from './retro-capture.js';

export const NOW_SCHEMA_VERSION = 1;

export const ALERT_TYPES = [
  'fiche-bloquee',
  'idee-a-groomer',
  'proposition-retro',
  'question-session',
  'version-a-poser',
  'sprint-sans-retro',
] as const;

const AlerteSchema = z.strictObject({
  type: z.enum(ALERT_TYPES),
  id: z.string().describe('Identifiant de l’élément : id de fiche, version, ou `<capture>#<rang>` pour une proposition de rétro.'),
  titre: z.string(),
  raison: z.string().describe('Pourquoi l’élément alerte : le mot de `blocked:`, le genre de la proposition, l’état du lot.'),
  decision: z.string().describe('La décision attendue du PO, en français.'),
  fichier: z.string().describe("Le fichier source, relatif à la racine du projet ; '' si la source n'est pas un fichier."),
  date: z.string().describe("Date de l'élément (`AAAA-MM-JJ`) ; '' si la méthode ne la connaît pas."),
});

const SuiteSchema = z.strictObject({
  kind: z.enum(['suite', 'piste']),
  command: z.string(),
  reason: z.string(),
});

export const NowShowSchema = z.strictObject({
  schema_version: z.literal(NOW_SCHEMA_VERSION),
  alertes: z.array(AlerteSchema).describe('Une alerte par élément, jamais de regroupement.'),
  non_mesure: z
    .array(z.string())
    .describe('Ce que la méthode ne calcule pas encore, en mots. Un type listé ici n’a aucune alerte, ce n’est pas un zéro.'),
  suites: z.array(SuiteSchema).describe('Les suites de la boussole, comme la sortie texte de `ezk now`.'),
});

export type NowShow = z.infer<typeof NowShowSchema>;
export type NowAlert = NowShow['alertes'][number];

type Active = BoardContract['actives'][number];
type Lot = BoardContract['versions']['lots'][number];

export interface NowShowInput {
  /** Fiches à faire du plan (`board show` : `actives`). */
  actives: readonly Pick<Active, 'id' | 'title' | 'status' | 'blocked' | 'enCours' | 'file'>[];
  /** Lots de version (`board show` : `versions.lots`). */
  lots: readonly Pick<Lot, 'version' | 'nom' | 'etat' | 'etiquette'>[];
  /** Date de création des fiches, par id, lue au bord ; absente = '' . */
  dates: ReadonlyMap<string, string>;
  /** La dernière capture de rétro, ou null. */
  retro: RetroCapture | null;
  /** Le fichier de la dernière capture quand son en-tête est illisible : dit en mots, jamais ignoré. */
  retroIllisible?: string;
  /** Les suites de la boussole (`suggestNow`). */
  suites: readonly NowSuggestion[];
}

const NON_MESURE = [
  'Questions posées par la méthode dans une session (`question-session`) : pas encore calculées, aucune alerte de ce type n’est publiée.',
  'Sprints clos sans rétro (`sprint-sans-retro`) : pas encore calculables, le compte rendu d’un sprint ne dit pas s’il a eu sa rétro.',
];

function ficheAlert(f: NowShowInput['actives'][number], dates: ReadonlyMap<string, string>): NowAlert | null {
  const date = dates.get(f.id) ?? '';
  if (f.blocked !== '') {
    const decision = blockedLibelle(f.blocked);
    return { type: 'fiche-bloquee', id: f.id, titre: f.title, raison: f.blocked, decision, fichier: f.file, date };
  }
  if (f.status === 'idea' && !f.enCours) {
    const raison = 'idée pas encore préparée';
    const decision = 'groomer la fiche jusqu’à ce qu’elle soit tirable';
    return { type: 'idee-a-groomer', id: f.id, titre: f.title, raison, decision, fichier: f.file, date };
  }
  return null;
}

function versionAlert(lot: NowShowInput['lots'][number]): NowAlert {
  return {
    type: 'version-a-poser',
    id: lot.version,
    titre: lot.nom === '' ? lot.version : lot.nom,
    raison: 'toutes les fiches du lot sont livrées, aucune étiquette posée',
    decision: `poser l’étiquette ${lot.version}`,
    fichier: lot.nom === '' ? '' : `features/versions/${lot.version}.md`,
    date: '',
  };
}

function retroAlerts(retro: RetroCapture | null): NowAlert[] {
  if (retro === null) return [];
  return retro.actions.flatMap((action, index) =>
    action.status !== '⏳'
      ? []
      : [
          {
            type: 'proposition-retro' as const,
            id: `${retro.file}#${index + 1}`,
            titre: action.proposition,
            raison: `proposition de rétro (${action.kind}) en attente`,
            decision: 'accepter ou refuser la proposition',
            fichier: retro.file,
            date: retro.date,
          },
        ],
  );
}

/** Compile le contrat. Même entrée, même sortie : l'ordre suit celui des entrées. */
export function buildNowShow(input: NowShowInput): NowShow {
  const fiches = input.actives.flatMap((f) => ficheAlert(f, input.dates) ?? []);
  const versions = input.lots.filter((l) => l.etat === 'a-clore' && l.etiquette === null).map(versionAlert);
  return {
    schema_version: NOW_SCHEMA_VERSION,
    alertes: [...fiches, ...retroAlerts(input.retro), ...versions],
    non_mesure: [
      ...NON_MESURE,
      ...(input.retroIllisible === undefined
        ? []
        : [`Propositions de rétro (\`proposition-retro\`) : la dernière capture, ${input.retroIllisible}, est illisible, aucune proposition n’est publiée.`]),
    ],
    suites: input.suites.map((s) => ({ kind: s.kind, command: s.command, reason: s.reason })),
  };
}
