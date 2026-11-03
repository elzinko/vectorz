/**
 * config-contract — le CONTRAT JSON de `ezk config show --json`. PUR (ADR-0003).
 *
 * En clair : la méthode est le seul programme qui lit `.vectorz/config.yml` et en tire les
 * réglages effectifs (ADR-086). Ce module publie ce qu'elle résout : le fichier lu (ou son
 * absence), les capacités GitHub, l'intégration sans PR, la gate de release et le modèle de
 * chaque agent. Mission control l'affiche sans relire le YAML ni rejouer les défauts.
 *
 * Le format est décrit UNE fois, ici, en zod. Le schéma JSON rangé dans `contracts/config-show/`
 * en est tiré (`pnpm board:contract --write`). Même règle de version que `board-contract.ts` :
 * `schema_version` monte quand un champ disparaît, change de nom ou de sens ; un champ ajouté le
 * laisse tel quel.
 */
import { z } from 'zod';
import type { GroomingTechniques } from './grooming-config.js';
import { EFFORTS, type ModelConfig, ROLES, TIERS, resolveAgent } from './model-config.js';
import {
  ADVERSE_REVIEW_MODES,
  type AdverseReview,
  type GithubCapabilities,
  INTEGRATION_STRATEGIES,
  type IntegrationStrategy,
} from './project-config.js';
import type { ReleaseConfig } from './release-gate.js';

/** La version du format. Un consommateur qui lit une autre valeur le dit, et n'affiche rien de faux. */
export const CONFIG_SCHEMA_VERSION = 1;

const AgentResolvedSchema = z.strictObject({
  agent: z.string(),
  tier: z.enum(TIERS),
  model: z.string(),
  effort: z.enum(EFFORTS),
  source: z
    .enum(['agent', 'tier-projet', 'defaut'])
    .describe("D'où vient la valeur : réglage de l'agent, tier du projet, ou défaut de la méthode."),
});

const AgentInvalidSchema = z.strictObject({
  agent: z.string(),
  error: z.string().describe("La config de cet agent est mal saisie : la raison, qui nomme la clé et la valeur."),
});

export const ConfigShowSchema = z.strictObject({
  schema_version: z.literal(CONFIG_SCHEMA_VERSION),
  file: z
    .string()
    .nullable()
    .describe('Le fichier de config lu, relatif à la racine du projet ; null si le projet n’en a pas (défauts de la méthode).'),
  github: z.strictObject({ pr: z.boolean(), ci: z.boolean(), codexReview: z.boolean() }),
  integration: z.enum(INTEGRATION_STRATEGIES).describe('Sans PR : comment une story arrive sur main.'),
  releaseGate: z.boolean().describe('La gate de release bloque-t-elle le tag d’une version ?'),
  groomingTechniques: z
    .union([
      z.strictObject({ mode: z.literal('menu') }),
      z.strictObject({ mode: z.enum(['all', 'none', 'selection']), ids: z.array(z.string()) }),
      z.strictObject({ mode: z.literal('error'), error: z.string() }),
    ])
    .describe("Le menu de `groom` pré-réglé par la config : `menu` (rien de posé), `all`, `none`, une sélection d'ids du catalogue, ou l'erreur qui nomme la clé fautive."),
  adverseReview: z
    .enum(ADVERSE_REVIEW_MODES)
    .describe('La revue adverse locale d’un sprint : `run` (le plancher) ou `skip` (mode POC, posé par un humain).'),
  agents: z.array(z.union([AgentResolvedSchema, AgentInvalidSchema])),
});

export type ConfigShow = z.infer<typeof ConfigShowSchema>;

/** Ce que le bord a lu ; le cœur ne fait que résoudre et ranger. */
export interface ConfigShowInput {
  file: string | null;
  github: GithubCapabilities;
  integration: IntegrationStrategy;
  release: ReleaseConfig;
  adverseReview: AdverseReview;
  groomingTechniques: GroomingTechniques;
  models: ModelConfig;
}

/** Le contrat de la config d'un projet. Un agent mal configuré sort avec son erreur, les autres restent lisibles. */
export function buildConfigShow(input: ConfigShowInput): ConfigShow {
  return {
    schema_version: CONFIG_SCHEMA_VERSION,
    file: input.file,
    github: { pr: input.github.pr, ci: input.github.ci, codexReview: input.github.codexReview },
    integration: input.integration,
    releaseGate: input.release.gate,
    groomingTechniques: input.groomingTechniques,
    adverseReview: input.adverseReview,
    agents: ROLES.map((agent) => {
      try {
        const r = resolveAgent(input.models, agent);
        return { agent, tier: r.tier, model: r.model, effort: r.effort, source: r.source };
      } catch (err) {
        return { agent, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  };
}
