/**
 * process-contract — le format de `ezk board process --json` (fiche 20261102123552183, ADR-086).
 *
 * Chaque fiche du projet, posée sur son étape (idée, prête, en sprint, en revue, livrée), avec le
 * signal qui l'y place : sa branche de travail, sa PR ouverte, sa session. Le calcul reste celui de
 * `process-data.ts` ; ce module ne fait que décrire et dater le format. Mission control l'affiche tel
 * quel, sans replacer une fiche lui-même.
 */
import { z } from 'zod';
import type { ProcessData } from './process-data.js';

export const PROCESS_SCHEMA_VERSION = 1;

const StageSchema = z.enum(['idee', 'prete', 'en-sprint', 'en-revue', 'livree']);

const ProcessFicheSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  priority: z.string(),
  status: z.string().describe('Le statut écrit dans la fiche.'),
  product: z.string(),
  version: z.string(),
  milestone: z.string(),
  stage: StageSchema,
  file: z.string().describe('La fiche, relative à la racine du projet.'),
  session: z
    .strictObject({ path: z.string(), branch: z.string() })
    .nullable()
    .describe('La session (dossier de travail et branche) qui travaille la fiche, ou null.'),
  branch: z.string().nullable().describe('La branche non livrée qui place la fiche « en sprint », ou null.'),
  pr: z.string().nullable().describe('La PR ouverte qui place la fiche « en revue » (`#12`), ou null.'),
  reviewIndetermine: z.boolean().describe('Vrai quand « en revue » n’a pas pu être évalué : GitHub non lu.'),
});

export const ProcessContractSchema = z.strictObject({
  schema_version: z.literal(PROCESS_SCHEMA_VERSION),
  github: z.boolean().describe('Vrai si GitHub a été lu ; faux si le projet l’a coupé (aucun `gh` lancé).'),
  reviewIndetermine: z.boolean().describe('Vrai si l’étape « en revue » n’a pas pu être calculée.'),
  stages: z
    .array(z.strictObject({ stage: StageSchema, label: z.string(), fiches: z.array(ProcessFicheSchema) }))
    .describe('Les cinq étapes dans l’ordre du flux ; « livrée » porte toutes les livrées, la plus récente d’abord.'),
  filtres: z.strictObject({
    versions: z.array(z.string()),
    milestones: z.array(z.string()),
    priorites: z.array(z.string()),
  }),
});

export type ProcessContract = z.infer<typeof ProcessContractSchema>;

/** Le contrat, à partir des données de la vue et de ce qu'on sait de GitHub. */
export function buildProcessContract(data: ProcessData, github: boolean): ProcessContract {
  return { schema_version: PROCESS_SCHEMA_VERSION, github, ...data };
}
