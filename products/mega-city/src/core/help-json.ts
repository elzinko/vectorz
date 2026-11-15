/**
 * help-json — le CONTRAT JSON de `ezk help --json`. PUR (ADR-0003).
 *
 * En clair : l'annuaire de la méthode, pour un écran qui ne relit aucun fichier (ADR-086). Chaque
 * commande de terminal du manifeste, chaque compétence (skill) et chaque agent, avec une ligne en
 * clair et sa place dans la méthode : son étage (methode, modules, librairie) et, pour un module, sa
 * famille. Fiche 20261114131613129.
 *
 * Sources : le manifeste que lit `ezk help` texte, la carte compilée (`buildMapData`) pour les
 * compétences et les agents — leurs valeurs sont celles que la carte sert déjà —, et `taxonomie.yml`
 * pour l'étage des commandes. Les relations (composes, roles, applies, competences) n'y sont pas :
 * elles appartiennent au contrat du graphe.
 *
 * Le format est décrit UNE fois, ici, en zod. Le schéma rangé dans `contracts/help/` en est tiré
 * (`pnpm help:contract --write`). `schema_version` monte quand un champ disparaît, change de nom ou de sens.
 */
import { z } from 'zod';
import type { Manifest, RootPolicy } from './ezk-cli.js';
import { commandLabel } from './ezk-cli.js';
import type { MapData } from './map-data.js';
import { ETAGES, type Etage, FAMILLES, type Famille, type Placement, type TaxonomieDoc, placeCommandes } from './taxonomie.js';

export const HELP_SCHEMA_VERSION = 1;

const ROOT_POLICIES = ['fixed', 'none', 'cwd'] as const satisfies readonly RootPolicy[];

const EtageSchema = z.enum(ETAGES).describe('Le rang de la brique dans la méthode (taxonomie.yml, ADR-0039).');
const FamilleSchema = z.enum(FAMILLES).nullable().describe('Le sous-rang d’un module ; `null` hors de l’étage modules.');

const CommandeSchema = z.strictObject({
  domaine: z.string(),
  verbe: z.string().nullable().describe('`null` : le domaine EST la commande.'),
  enClair: z.string().describe('Le résumé d’une ligne que `ezk help` affiche.'),
  script: z.string().describe('Le script lancé et ses arguments fixes, depuis products/mega-city.'),
  racine: z.enum(ROOT_POLICIES).describe('`fixed` : le dépôt de la méthode ; `none` : de partout ; `cwd` : le dépôt où l’on tape.'),
  projet: z.boolean().describe('La commande travaille sur un projet désigné (--root ou EZK_ROOT).'),
  ecritLeProjet: z.boolean().describe('La commande écrit dans le projet désigné.'),
  deprecie: z.string().nullable().describe('Le nouveau nom quand la commande est un ancien nom ; `null` sinon.'),
  etage: EtageSchema,
  famille: FamilleSchema,
});

const SkillSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  sousCommandes: z.array(z.string()).describe('Les sous-commandes nommées par l’argument-hint du skill.'),
  fichier: z.string().nullable().describe('Le SKILL.md, relatif à la racine du dépôt de la méthode.'),
  etage: EtageSchema,
  famille: FamilleSchema,
});

const AgentSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  fichier: z.string().nullable().describe('Le fichier de l’agent, relatif à la racine du dépôt de la méthode.'),
  etage: EtageSchema,
  famille: FamilleSchema,
  modele: z.string().describe('Le modèle par défaut, lu dans le front-matter de l’agent.'),
  effort: z.string().describe('L’effort par défaut, lu dans le front-matter de l’agent.'),
});

export const HelpJsonSchema = z.strictObject({
  schema_version: z.literal(HELP_SCHEMA_VERSION),
  commandes: z.array(CommandeSchema).describe('Une entrée par commande du manifeste, dans son ordre.'),
  skills: z.array(SkillSchema),
  agents: z.array(AgentSchema),
});

export type HelpJson = z.infer<typeof HelpJsonSchema>;

/** Les sous-commandes d'un argument-hint : le premier groupe `[a|b|…]` de noms. Aucun : liste vide. */
export function sousCommandes(argumentHint: string): string[] {
  const group = /\[([a-z][a-z0-9-]*(?:\|[a-z][a-z0-9-]*)+)\]/.exec(argumentHint)?.[1];
  return group ? group.split('|') : [];
}

const place = (p: Placement): { etage: Etage; famille: Famille | null } => ({
  etage: p.etage,
  famille: p.famille ?? null,
});

export function buildHelpJson(
  manifest: Manifest,
  carte: Pick<MapData, 'skills' | 'agents'>,
  taxonomie: TaxonomieDoc,
): HelpJson {
  const placed = placeCommandes(manifest.commands, taxonomie);
  return {
    schema_version: HELP_SCHEMA_VERSION,
    commandes: manifest.commands.map((e) => ({
      domaine: e.domain,
      verbe: e.verb ?? null,
      enClair: e.summary,
      script: e.run,
      racine: e.root,
      projet: e.project === true,
      ecritLeProjet: e.writes === true,
      deprecie: e.deprecated ?? null,
      ...place(placed[commandLabel(e)] as Placement),
    })),
    skills: Object.values(carte.skills).map((s) => ({
      id: s.id,
      description: s.description,
      sousCommandes: sousCommandes(s.usage),
      fichier: s.source ?? null,
      ...place(s),
    })),
    agents: Object.values(carte.agents).map((a) => ({
      id: a.id,
      description: a.description,
      fichier: a.source ?? null,
      ...place(a),
      modele: a.model,
      effort: a.effort,
    })),
  };
}
