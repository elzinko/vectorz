/**
 * sprint-show-contract — le CONTRAT JSON de `ezk sprint show <slug> --json`. PUR (ADR-0003).
 *
 * En clair : un compte rendu de sprint (`docs/sprints/AAAA-MM-JJ-sprint-<slug>.md`) sort en JSON, avec son
 * numéro continu, son but, sa branche, puis ses sections — « En clair », lot scellé, détail, abandon —
 * en champs, non en bloc markdown à redécouper. Fiche 20261114131612204, ADR-086.
 *
 * Le format est décrit UNE fois, ici, en zod ; le schéma JSON rangé dans `contracts/sprint-show/` en est
 * tiré (`pnpm board:contract --write`). Même règle de version que `board-contract.ts` : `schema_version`
 * monte quand un champ disparaît, change de nom ou de sens ; un champ ajouté la laisse telle quelle.
 */
import { z } from 'zod';
import type { SprintDetail, SprintListed } from './sprint-report-summary.js';

/** La version du format. */
export const SPRINT_SHOW_SCHEMA_VERSION = 1;

export const SprintShowSchema = z.strictObject({
  schema_version: z.literal(SPRINT_SHOW_SCHEMA_VERSION),
  sprint: z.strictObject({
    slug: z.string(),
    numero: z
      .number()
      .int()
      .positive()
      .describe('Le numéro continu depuis le début du projet : celui écrit au `close`, sinon le rang du compte rendu dans l’historique.'),
    but: z.string().nullable().describe('Le but complet du sprint ; `null` si le compte rendu ne le dit pas (compte rendu d’avant).'),
    branche: z.string().nullable().describe('La branche sur laquelle le sprint a été clos ; `null` si le compte rendu ne la dit pas.'),
    debut: z.string().nullable().describe('Début de la fenêtre du sprint (ISO 8601) ; `null` si non daté.'),
    fin: z.string().nullable().describe('Fin de la fenêtre du sprint (ISO 8601) ; `null` si non datée.'),
    jour: z.string().describe('Le jour du compte rendu (`AAAA-MM-JJ`), tiré de son nom.'),
    fichier: z.string().describe('Le compte rendu, relatif à la racine du projet.'),
    source: z
      .enum(['json', 'markdown'])
      .describe('D’où viennent les faits : le JSON rangé à côté du compte rendu, ou la relecture du markdown (anciens comptes rendus).'),
  }),
  sections: z.strictObject({
    enClair: z.string().nullable().describe('La section « En clair » du compte rendu ; `null` si elle manque.'),
    lotScelle: z
      .array(
        z.strictObject({
          id: z.string(),
          title: z.string().describe("Le titre de la story ; '' si le lot ne le dit pas."),
          resultat: z.enum(['livree', 'reportee', 'ouverte']).describe('livree = `[x]`, reportee = `[~]`, ouverte = `[ ]` (sprint abandonné).'),
        }),
      )
      .describe('Une entrée par story du lot de CE sprint.'),
    detail: z.strictObject({
      dureeMs: z.number().nullable().describe('Durée du sprint ; `null` si non mesurée (jamais un faux zéro).'),
      tokens: z.number().nullable().describe('Jetons du sprint, au grain `sprint` seulement ; `null` sinon.'),
      blocages: z.number().nullable().describe('Blocages essuyés ; `null` si le compte rendu ne le dit pas.'),
      livrees: z.array(z.strictObject({ id: z.string(), title: z.string() })).describe('Les fiches livrées du lot scellé.'),
    }),
    abandon: z.string().nullable().describe('La raison d’abandon ; `null` pour un sprint scellé normalement.'),
  }),
});

export type SprintShow = z.infer<typeof SprintShowSchema>;

/** Compile le contrat d'un sprint : son compte rendu lu en champs, et son numéro publié (celui de la liste). */
export function buildSprintShow(detail: SprintDetail, numero: SprintListed['numero']): SprintShow {
  return {
    schema_version: SPRINT_SHOW_SCHEMA_VERSION,
    sprint: {
      slug: detail.slug,
      numero,
      but: detail.but,
      branche: detail.branche,
      debut: detail.debut,
      fin: detail.fin,
      jour: detail.jour,
      fichier: detail.fichier,
      source: detail.source,
    },
    sections: {
      enClair: detail.enClair,
      lotScelle: detail.lot.map((e) => ({ id: e.id, title: e.title, resultat: e.resultat })),
      detail: {
        dureeMs: detail.dureeMs,
        tokens: detail.tokens,
        blocages: detail.blocages,
        livrees: detail.livrees.map((f) => ({ id: f.id, title: f.title })),
      },
      abandon: detail.abandon,
    },
  };
}
