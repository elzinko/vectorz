/**
 * law-show — le CONTRAT JSON de `ezk law show --json`. PUR (ADR-0003).
 *
 * En clair : la méthode connaît chaque règle de son catalogue, qui l'applique et dans quel bundle
 * elle est rangée. Elle sait aussi lire les fichiers de loi installés. Ce module assemble ces faits
 * et dit, pour chaque règle, si elle est vraiment lue (`partout`, `projet`, `demarrage`), seulement
 * citée (`citee`), rangée sans effet (`rangee`) ou orpheline. Fiche 20261101215342537, ADR-086.
 *
 * `demarrage` : la règle n'est installée nulle part, mais un skill ou un agent qui la cite ouvre son
 * texte par `ezk law show <objet>` et la lit au moment où il démarre (fiche 20261102103553108).
 *
 * Le format est décrit UNE fois, ici, en zod. Le schéma JSON rangé dans `contracts/law-show/` en
 * est tiré (`pnpm law:contract --write`) : jamais écrit à la main. Même règle de version que le
 * board : `schema_version` monte quand un champ disparaît, change de nom ou de sens.
 *
 * Le graphe se calcule ici, depuis le catalogue passé en entrée : jamais depuis `.ezk/graph.compiled.json`,
 * qui est périmé dès qu'une règle bouge.
 */
import { z } from 'zod';
import type { Catalog } from '../loaders/catalog.js';
import { type CompiledGraph, compileGraph } from './compiled-graph.js';
import { type Edge, LINK_VERB } from './graph.js';
import { ancestors, bundleRules, enforcingAgents, sourcePath, whoActivates } from './loi-view.js';

export const LAW_SHOW_SCHEMA_VERSION = 1;

export const PORTEES = ['partout', 'projet', 'demarrage', 'citee', 'rangee', 'orpheline'] as const;
export type Portee = (typeof PORTEES)[number];

const count = (): z.ZodNumber => z.number().int().nonnegative();

const LoiInstalleeSchema = z.strictObject({
  chemin: z.string().describe('Où la méthode a cherché ce fichier de loi.'),
  installee: z.boolean().describe('Le fichier existe. Faux : aucune règle ne peut y être lue.'),
});

const LienSchema = z.strictObject({
  id: z.string().describe('Id de la règle.'),
  via: z.string().describe("`direct`, ou `bundle:<id>` quand c'est un bundle qui apporte la règle."),
});

const ApplicationSchema = z.strictObject({
  objet: z.string().describe('`skill:<id>` ou `agent:<id>`.'),
  via: z.string().describe("`direct`, ou `bundle:<id>` quand c'est un bundle qui apporte la règle."),
});

const RegleSchema = z.strictObject({
  id: z.string(),
  titre: z.string().describe("Le titre de la règle, à défaut son id."),
  niveau: z.enum(['MUST', 'SHOULD', 'MAY']),
  categorie: z.string().describe("Le préfixe de l'id, avant le premier `/`."),
  fichier: z.string().describe('Chemin du fichier de la règle, relatif à la racine du dépôt de la méthode.'),
  bundles: z.array(z.string()).describe('Les bundles qui listent la règle.'),
  profils: z.array(z.string()).describe('Les profils qui portent un de ces bundles, héritage compris.'),
  appliqueePar: z.array(ApplicationSchema).describe('Les skills et agents qui citent la règle.'),
  verifieePar: z.array(z.string()).describe('Les agents qui contrôlent la règle (`enforces`).'),
  portee: z.enum(PORTEES),
});

const ObjetSchema = z.strictObject({
  id: z.string().describe('`skill:<id>`, `agent:<id>`, `bundle:<id>` ou `profile:<id>`.'),
  type: z.enum(['skill', 'agent', 'bundle', 'profile']),
  litSesRegles: z
    .boolean()
    .describe("Un skill ou un agent dont le texte lance `ezk law show <objet>` au démarrage. Faux pour un bundle ou un profil."),
  regles: z
    .array(LienSchema)
    .describe(
      "Les règles qui s'attachent à l'objet : `applies` pour un skill, `interactions` pour un agent, " +
        'ses règles pour un bundle, ses bundles pour un profil.',
    ),
});

const ComptesSchema = z
  .strictObject({
    total: count().describe('Toutes les règles du catalogue.'),
    partout: count().describe('Titre présent dans la loi globale installée.'),
    projet: count().describe('Dans la loi du projet, pas dans la globale.'),
    demarrage: count().describe('Installée nulle part, lue au démarrage par un skill ou un agent qui la cite.'),
    citee: count().describe('Citée par un skill ou un agent, installée nulle part, lue par personne.'),
    rangee: count().describe('Dans un bundle, ni installée ni citée.'),
    orpheline: count().describe('Dans aucun bundle, citée par personne.'),
  })
  .describe('Les six portées se partagent les règles : leur somme vaut `total`.');

export const LawShowSchema = z.strictObject({
  schema_version: z.literal(LAW_SHOW_SCHEMA_VERSION),
  lois: z.strictObject({ globale: LoiInstalleeSchema, projet: LoiInstalleeSchema }),
  comptes: ComptesSchema,
  regles: z.array(RegleSchema),
  objets: z.array(ObjetSchema),
});

export type LawShow = z.infer<typeof LawShowSchema>;
type RegleEntry = LawShow['regles'][number];
type Lien = z.infer<typeof LienSchema>;
type ObjetType = LawShow['objets'][number]['type'];

/** Une loi lue : où on l'a cherchée, et son texte (`null` si le fichier est absent). */
export interface LawText {
  chemin: string;
  texte: string | null;
}

export interface LawShowInput {
  catalog: Catalog;
  globale: LawText;
  projet: LawText;
}

/** Les ids de règles installées : ceux qui ouvrent un titre `## <id>` dans le fichier de loi. */
export function installedRuleIds(texte: string | null): Set<string> {
  const ids = new Set<string>();
  // Un « ## <id> » à l'intérieur d'un bloc de code clôturé (``` ou ~~~) n'est pas un titre.
  let fence: string | null = null;
  for (const line of (texte ?? '').split('\n')) {
    const marker = /^(`{3,}|~{3,})/.exec(line)?.[1];
    if (marker) {
      if (fence === null) fence = marker[0] as string;
      else if (marker[0] === fence) fence = null;
      continue;
    }
    const match = fence === null ? /^## (\S+)/.exec(line) : null;
    if (match) ids.add(match[1] as string);
  }
  return ids;
}

const categoryOf = (id: string): string => (id.includes('/') ? id.slice(0, id.indexOf('/')) : id);

const byIdThenVia = (a: Lien, b: Lien): number => a.id.localeCompare(b.id) || a.via.localeCompare(b.via);

function uniqueLiens(liens: Lien[]): Lien[] {
  const seen = new Set<string>();
  return liens
    .filter((l) => {
      const key = `${l.id}\0${l.via}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(byIdThenVia);
}

/** La commande qu'un skill ou un agent lance au démarrage pour lire ses règles : `ezk law show <objet>`. */
export const startupCommand = (objet: string): string => `ezk law show ${objet}`;

/** Vrai si le texte d'un skill ou d'un agent lance la commande qui lui sert ses règles. */
export function readsRulesAtStartup(texte: string, objet: string): boolean {
  return texte.includes(`\`${startupCommand(objet)}\``);
}

/** Le texte d'un skill (`content`) ou d'un agent (`role`) du catalogue ; vide pour tout autre objet. */
function objectText(catalog: Catalog, type: ObjetType, id: string): string {
  if (type === 'skill') return catalog.skills.get(id)?.content ?? '';
  if (type === 'agent') return catalog.agents.get(id)?.role ?? '';
  return '';
}

const edgesFrom = (graph: CompiledGraph, link: Edge['link'], from: string): string[] =>
  graph.edges.filter((e) => e.link === link && e.from === from).map((e) => e.to);

/** Les règles qu'un skill ou un agent applique : en direct, puis par chaque bundle qu'il cite. */
function appliedBy(graph: CompiledGraph, kind: 'skill' | 'agent', id: string): Lien[] {
  const liens: Lien[] = [];
  for (const e of graph.edges) {
    if (e.fromKind !== kind || e.from !== id || LINK_VERB[e.link] !== 'applique') continue;
    if (e.toKind === 'rule') liens.push({ id: e.to, via: 'direct' });
    if (e.toKind === 'bundle') {
      for (const rule of bundleRules(graph, e.to)) liens.push({ id: rule, via: `bundle:${e.to}` });
    }
  }
  return uniqueLiens(liens);
}

/** Les règles qu'un bundle liste lui-même, puis celles qu'il hérite de chaque bundle qu'il étend. */
function bundleLiens(graph: CompiledGraph, id: string): Lien[] {
  const own = edgesFrom(graph, 'bundle-rule', id).map((rule) => ({ id: rule, via: 'direct' }));
  const inherited = [...ancestors(graph, id, 'bundle-extends')].flatMap((parent) =>
    edgesFrom(graph, 'bundle-rule', parent).map((rule) => ({ id: rule, via: `bundle:${parent}` })),
  );
  return uniqueLiens([...own, ...inherited]);
}

/** Les règles qu'un profil porte : celles de ses bundles (héritage compris), et ses interactions. */
function profileLiens(graph: CompiledGraph, id: string): Lien[] {
  const profiles = new Set([id, ...ancestors(graph, id, 'profile-extends')]);
  const fromBundles = whoActivates(graph, id).bundles.flatMap((bundle) =>
    edgesFrom(graph, 'bundle-rule', bundle).map((rule) => ({ id: rule, via: `bundle:${bundle}` })),
  );
  const direct = [...profiles].flatMap((p) =>
    edgesFrom(graph, 'profile-interaction', p).map((rule) => ({ id: rule, via: 'direct' })),
  );
  return uniqueLiens([...fromBundles, ...direct]);
}

function buildObjets(graph: CompiledGraph, catalog: Catalog): LawShow['objets'] {
  const liensOf: Record<ObjetType, (id: string) => Lien[]> = {
    skill: (id) => appliedBy(graph, 'skill', id),
    agent: (id) => appliedBy(graph, 'agent', id),
    bundle: (id) => bundleLiens(graph, id),
    profile: (id) => profileLiens(graph, id),
  };
  const types = Object.keys(liensOf) as ObjetType[];
  return graph.nodes
    .filter((n): n is typeof n & { kind: ObjetType } => (types as string[]).includes(n.kind))
    .map((n) => {
      const id = `${n.kind}:${n.id}`;
      return { id, type: n.kind, litSesRegles: readsRulesAtStartup(objectText(catalog, n.kind, n.id), id), regles: liensOf[n.kind](n.id) };
    });
}

function porteeOf(
  r: { id: string; applique: boolean; lue: boolean; rangee: boolean },
  globale: Set<string>,
  projet: Set<string>,
): Portee {
  if (globale.has(r.id)) return 'partout';
  if (projet.has(r.id)) return 'projet';
  if (r.lue) return 'demarrage';
  if (r.applique) return 'citee';
  return r.rangee ? 'rangee' : 'orpheline';
}

function buildRegles(input: LawShowInput, graph: CompiledGraph, objets: LawShow['objets']): RegleEntry[] {
  const globale = installedRuleIds(input.globale.texte);
  const projet = installedRuleIds(input.projet.texte);
  const profileIds = graph.nodes.filter((n) => n.kind === 'profile').map((n) => n.id);
  const bundlesOfProfile = new Map(profileIds.map((p) => [p, new Set(whoActivates(graph, p).bundles)]));

  return [...input.catalog.rules.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((rule) => {
      const bundles = graph.edges.filter((e) => e.link === 'bundle-rule' && e.to === rule.id).map((e) => e.from).sort();
      const citants = objets.filter((o) => (o.type === 'skill' || o.type === 'agent') && o.regles.some((l) => l.id === rule.id));
      const appliqueePar = citants
        .flatMap((o) => o.regles.filter((l) => l.id === rule.id).map((l) => ({ objet: o.id, via: l.via })))
        .sort((a, b) => a.objet.localeCompare(b.objet) || a.via.localeCompare(b.via));
      return {
        id: rule.id,
        titre: rule.title ?? rule.id,
        niveau: rule.level,
        categorie: categoryOf(rule.id),
        fichier: sourcePath('rule', rule.id),
        bundles,
        profils: profileIds.filter((p) => bundles.some((b) => bundlesOfProfile.get(p)?.has(b))).sort(),
        appliqueePar,
        verifieePar: enforcingAgents(graph, rule.id),
        portee: porteeOf(
          { id: rule.id, applique: citants.length > 0, lue: citants.some((o) => o.litSesRegles), rangee: bundles.length > 0 },
          globale,
          projet,
        ),
      };
    });
}

function countPortees(regles: RegleEntry[]): LawShow['comptes'] {
  const comptes = { total: regles.length, partout: 0, projet: 0, demarrage: 0, citee: 0, rangee: 0, orpheline: 0 };
  for (const r of regles) comptes[r.portee] += 1;
  return comptes;
}

/** Le contrat JSON de la loi : le catalogue de `input`, lu avec les deux fichiers de loi. */
export function buildLawShow(input: LawShowInput): LawShow {
  const graph = compileGraph(input.catalog);
  const objets = buildObjets(graph, input.catalog);
  const regles = buildRegles(input, graph, objets);
  return {
    schema_version: LAW_SHOW_SCHEMA_VERSION,
    lois: {
      globale: { chemin: input.globale.chemin, installee: input.globale.texte !== null },
      projet: { chemin: input.projet.chemin, installee: input.projet.texte !== null },
    },
    comptes: countPortees(regles),
    regles,
    objets,
  };
}

const sourceOf = (a: { objet: string; via: string }): string => (a.via === 'direct' ? a.objet : `${a.objet} (via ${a.via})`);

/** La sortie texte : « En clair » avec les six comptes, puis les règles citées sans être installées. */
export function renderLawText(law: LawShow): string {
  const c = law.comptes;
  const lines = [
    `En clair : ${c.total} règles. ${c.partout} lues partout, ${c.projet} lues dans ce projet seulement, ` +
      `${c.demarrage} lues au démarrage du skill ou de l'agent qui les cite, ${c.citee} citées sans être installées, ` +
      `${c.rangee} rangées sans effet, ${c.orpheline} orphelines.`,
  ];
  if (!law.lois.globale.installee) {
    lines.push('', `Attention : loi globale non installée (rien à lire dans ${law.lois.globale.chemin}). Aucune règle n'est comptée « lue partout ».`);
  }
  if (!law.lois.projet.installee) {
    lines.push('', `Attention : loi du projet non installée (rien à lire dans ${law.lois.projet.chemin}). Aucune règle n'est comptée « lue dans ce projet ».`);
  }
  const citees = law.regles.filter((r) => r.portee === 'citee');
  lines.push('');
  if (citees.length === 0) {
    lines.push('Aucune règle citée sans être installée.');
    return lines.join('\n');
  }
  lines.push('Règles citées sans être installées :');
  for (const r of citees) lines.push(`- ${r.id} — citée par ${r.appliqueePar.map(sourceOf).join(', ')}`);
  return lines.join('\n');
}

/* ------------------------------------------------------------------------------------------------ */
/* Les règles d'UN objet — `ezk law show skill:<id>` (fiche 20261102103553108)                      */
/* ------------------------------------------------------------------------------------------------ */

export const LAW_OBJECT_SCHEMA_VERSION = 1;

const RegleObjetSchema = z.strictObject({
  id: z.string(),
  titre: z.string().describe("Le titre de la règle, à défaut son id."),
  niveau: z.enum(['MUST', 'SHOULD', 'MAY']),
  via: z.string().describe("`direct`, ou `bundle:<id>` quand c'est un bundle qui apporte la règle."),
  installee: z
    .enum(['partout', 'projet'])
    .nullable()
    .describe('La loi installée qui porte déjà la règle, ou `null` si aucune ne la porte.'),
  texte: z
    .string()
    .nullable()
    .describe("Le texte complet de la règle quand aucune loi installée ne la porte ; `null` sinon, la session l'a déjà."),
});

export const LawObjectSchema = z.strictObject({
  schema_version: z.literal(LAW_OBJECT_SCHEMA_VERSION),
  objet: z.string().describe('`skill:<id>` ou `agent:<id>`.'),
  regles: z.array(RegleObjetSchema).describe("Les règles que l'objet applique, triées par id."),
});

export type LawObject = z.infer<typeof LawObjectSchema>;

/** Les règles d'un skill ou d'un agent, avec le texte de celles que la loi installée ne porte pas. `null` si l'objet est inconnu. */
export function buildLawObject(input: LawShowInput, objet: string): LawObject | null {
  const law = buildLawShow(input);
  const entry = law.objets.find((o) => o.id === objet && (o.type === 'skill' || o.type === 'agent'));
  if (!entry) return null;
  const globale = installedRuleIds(input.globale.texte);
  const projet = installedRuleIds(input.projet.texte);
  const regles = entry.regles
    .filter((l, i, all) => all.findIndex((x) => x.id === l.id) === i)
    .flatMap((l) => {
      const rule = input.catalog.rules.get(l.id);
      if (!rule) return [];
      const installee: 'partout' | 'projet' | null = globale.has(l.id) ? 'partout' : projet.has(l.id) ? 'projet' : null;
      return [{ id: l.id, titre: rule.title ?? l.id, niveau: rule.level, via: l.via, installee, texte: installee ? null : rule.content }];
    });
  return { schema_version: LAW_OBJECT_SCHEMA_VERSION, objet, regles };
}

/** La sortie texte : « En clair », une ligne par règle déjà installée, puis le texte complet des autres. */
export function renderLawObjectText(view: LawObject): string {
  const installees = view.regles.filter((r) => r.installee !== null);
  const aLire = view.regles.filter((r) => r.installee === null);
  const lines = [
    `En clair : ${view.objet} applique ${view.regles.length} règle(s). ${installees.length} sont déjà dans ta loi, ` +
      `${aLire.length} sont à lire ci-dessous.`,
  ];
  if (installees.length > 0) {
    lines.push('', 'Déjà dans ta loi :');
    for (const r of installees) lines.push(`- ${r.id} — ${r.titre} (${r.installee === 'partout' ? 'lue partout' : 'lue dans ce projet'})`);
  }
  for (const r of aLire) lines.push('', `## ${r.id}  \`[${r.niveau}]\``, '', r.texte ?? '');
  return lines.join('\n');
}
