/**
 * Règles PROJET-LOCAL — cœur PUR (fiche 20260910152227744, ADR-0050).
 *
 * Aujourd'hui les règles de la méthode sont globales. Un projet peut avoir les siennes, déclarées dans
 * son dossier `.vectorz/` (le contrat du projet) :
 *   - `.vectorz/rules.yml`    le manifeste : les bundles globaux qu'il choisit, et un BINDING par règle ;
 *   - `.vectorz/rules/<id>.md` une règle locale, au même format que les règles globales.
 *
 * Ce module ne lit rien et n'écrit rien : il reçoit les règles déjà lues (loaders) et rend le jeu
 * EFFECTIF composé, plus les problèmes. Trois responsabilités de l'ADR : découvrir (le loader, ailleurs),
 * COMPOSER (ici), mesurer (plus tard). L'EXÉCUTION d'un gate appartient au projet : vectorz n'en lance aucun.
 *
 * L'honnêteté est STRUCTURELLE, pas une discipline :
 *   - un MUST local sans enforcement résolvable (un `gate` du projet, ou une `review` a posteriori liée)
 *     est REFUSÉ, jamais rétrogradé en silence ; un MUST ne peut pas être `advisory` ;
 *   - le local peut AJOUTER et DURCIR, jamais DESSERRER une règle globale ;
 *   - chaque règle du jeu porte l'étiquette de sa garantie ; un conseil n'est jamais présenté comme garanti.
 * Les MUST globaux sans garde (23 au 2026-10-01) ne sont pas jugés ici : ils restent chargés, étiquetés
 * « héritage » — la migration du corpus global est une autre fiche.
 */
import { createHash } from 'node:crypto';
import type { Level, Rule } from '../domain/model.js';

/** Où le contrat du projet vit, et où le jeu composé est écrit (Claude Code charge ce dossier nativement). */
export const RULES_MANIFEST_FILE = '.vectorz/rules.yml';
export const PROJECT_RULES_FILE = '.claude/rules/vectorz-project.md';

const MARKER = 'generated-by: ezk rules apply';
const FRONT = `---\n${MARKER}\n---\n`;

/** Ce fichier est-il celui que `ezk rules apply` a écrit ? Le marqueur doit ouvrir le fichier. */
export function isManagedProjectRules(content: string): boolean {
  return content.startsWith(FRONT);
}

/** Comment le projet adosse une règle : un gate qu'il exécute, une revue a posteriori, ou rien (conseil). */
export type Binding =
  | { kind: 'gate'; ref: string }
  | { kind: 'review'; ref: string }
  | { kind: 'advisory' };

export interface RulesManifest {
  /** Bundles GLOBAUX que ce projet choisit. */
  bundles: string[];
  /** Un binding par règle, par id. */
  bindings: Record<string, Binding>;
}

/** Une règle écrite par le projet (`.vectorz/rules/<id>.md`). */
export interface LocalRule {
  id: string;
  level: Level;
  title?: string;
  content: string;
  /** Chemin relatif au projet : sert aux messages d'erreur, jamais à l'empreinte. */
  file: string;
}

export interface Problem {
  message: string;
  file?: string;
  ruleId?: string;
}

/** Ce qui tient vraiment une règle. `unguarded-must` = un MUST global hérité qu'aucune garde ne vérifie. */
export type Guarantee =
  | { kind: 'gate'; ref: string }
  | { kind: 'review'; ref: string }
  | { kind: 'hook' }
  | { kind: 'agent-check'; ref: string }
  | { kind: 'advisory' }
  | { kind: 'unguarded-must' };

export interface EffectiveRule {
  id: string;
  level: Level;
  title?: string;
  content: string;
  origin: 'global' | 'local';
  guarantee: Guarantee;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseBinding(value: unknown): Binding | string {
  if (value === 'advisory') return { kind: 'advisory' };
  if (isRecord(value)) {
    const keys = Object.keys(value);
    const key = keys[0];
    if (keys.length === 1 && (key === 'gate' || key === 'review')) {
      const ref = value[key];
      if (typeof ref === 'string' && ref.trim() !== '') return { kind: key, ref: ref.trim() };
    }
  }
  return 'binding invalide : attendu « advisory », { gate: "<commande ou job CI>" } ou { review: "<agent ou point de revue>" }.';
}

/**
 * Lit le manifeste déjà parsé du YAML. `undefined` = pas de fichier (le projet n'a pas de contrat) ;
 * un fichier vide est un contrat vide. Toute faute est un problème qui cite le fichier : jamais ignorée.
 */
export function parseRulesManifest(
  raw: unknown,
  file: string,
): { manifest: RulesManifest | undefined; problems: Problem[] } {
  if (raw === undefined) return { manifest: undefined, problems: [] };
  const problems: Problem[] = [];
  const bad = (message: string): void => {
    problems.push({ message, file });
  };
  const body = raw === null ? {} : raw;
  if (!isRecord(body)) {
    bad('le manifeste doit être un objet (clés : bundles, bindings).');
    return { manifest: undefined, problems };
  }
  for (const key of Object.keys(body)) {
    if (key !== 'bundles' && key !== 'bindings') bad(`clé inconnue « ${key} » (attendu : bundles, bindings).`);
  }

  let bundles: string[] = [];
  if (body.bundles !== undefined) {
    if (Array.isArray(body.bundles) && body.bundles.every((b) => typeof b === 'string' && b.trim() !== '')) {
      bundles = (body.bundles as string[]).map((b) => b.trim());
    } else {
      bad('« bundles » doit être une liste d’identifiants de bundles.');
    }
  }

  const bindings: Record<string, Binding> = {};
  if (body.bindings !== undefined) {
    if (isRecord(body.bindings)) {
      for (const [id, value] of Object.entries(body.bindings)) {
        const binding = parseBinding(value);
        if (typeof binding === 'string') bad(`« ${id} » : ${binding}`);
        else bindings[id] = binding;
      }
    } else {
      bad('« bindings » doit être un objet : un binding par id de règle.');
    }
  }
  return problems.length > 0 ? { manifest: undefined, problems } : { manifest: { bundles, bindings }, problems };
}

export interface ComposeInput {
  /** `undefined` : le projet n'a pas de contrat, rien n'est composé. */
  manifest: RulesManifest | undefined;
  /** Chemin du manifeste, pour les messages. */
  manifestFile?: string;
  /** TOUTES les règles du catalogue global, par id : sert à juger la précédence. */
  catalog: ReadonlyMap<string, Rule>;
  /** Les bundles que le catalogue connaît. */
  knownBundles: ReadonlySet<string>;
  /** Les règles des bundles choisis, déjà dépliées (`extends` compris). */
  selected: readonly Rule[];
  local: readonly LocalRule[];
}

const RANK: Record<Level, number> = { MUST: 3, SHOULD: 2, MAY: 1 };

function globalGuarantee(rule: Rule): Guarantee {
  const enforcements = rule.enforcements ?? [];
  if (enforcements.some((e) => e.type === 'hook')) return { kind: 'hook' };
  const check = enforcements.find((e) => e.type === 'agent-check');
  if (check) return { kind: 'agent-check', ref: check.agent ?? 'agent' };
  return rule.level === 'MUST' ? { kind: 'unguarded-must' } : { kind: 'advisory' };
}

const NEEDS_BINDING =
  'un MUST local exige un enforcement résolvable : ajoute dans .vectorz/rules.yml un binding « gate: <commande ou job CI> » ou « review: <agent ou point de revue> ».';

/**
 * Compose le jeu EFFECTIF d'un projet : les règles des bundles choisis, puis les règles locales (qui
 * ajoutent, précisent ou durcissent), puis les bindings du projet sur les règles globales. Trié par id.
 * Un problème ne vide pas le jeu : l'appelant refuse d'écrire tant qu'il en reste.
 */
export function composeProjectRules(input: ComposeInput): { rules: EffectiveRule[]; problems: Problem[] } {
  const { manifest } = input;
  if (manifest === undefined) return { rules: [], problems: [] };
  const manifestFile = input.manifestFile ?? RULES_MANIFEST_FILE;
  const problems: Problem[] = [];
  const effective = new Map<string, EffectiveRule>();

  for (const bundle of manifest.bundles) {
    if (!input.knownBundles.has(bundle)) {
      problems.push({ message: `bundle inconnu « ${bundle} » : il n'est pas dans le catalogue.`, file: manifestFile });
    }
  }
  for (const rule of input.selected) {
    effective.set(rule.id, {
      id: rule.id,
      level: rule.level,
      ...(rule.title ? { title: rule.title } : {}),
      content: rule.content,
      origin: 'global',
      guarantee: globalGuarantee(rule),
    });
  }

  const localIds = new Set<string>();
  for (const rule of input.local) {
    const where = { file: rule.file, ruleId: rule.id };
    if (localIds.has(rule.id)) {
      problems.push({ message: `la règle « ${rule.id} » est déclarée deux fois dans .vectorz/rules/.`, ...where });
      continue;
    }
    localIds.add(rule.id);

    const global = input.catalog.get(rule.id);
    if (global && RANK[rule.level] < RANK[global.level]) {
      problems.push({
        message: `desserre le ${global.level} global « ${rule.id} » (${rule.level}) : une règle locale peut ajouter ou durcir, jamais desserrer.`,
        ...where,
      });
      continue;
    }

    const binding = manifest.bindings[rule.id];
    let guarantee: Guarantee;
    if (binding && binding.kind !== 'advisory') {
      guarantee = binding;
    } else if (rule.level === 'MUST') {
      problems.push({
        message: binding ? 'un MUST ne peut pas être « advisory » (un conseil n’est pas une garantie).' : NEEDS_BINDING,
        ...where,
      });
      continue;
    } else {
      guarantee = { kind: 'advisory' };
    }
    effective.set(rule.id, {
      id: rule.id,
      level: rule.level,
      ...(rule.title ? { title: rule.title } : {}),
      content: rule.content,
      origin: 'local',
      guarantee,
    });
  }

  // Les bindings qui ne visent pas une règle locale : une règle globale choisie, ou une faute de frappe.
  for (const [id, binding] of Object.entries(manifest.bindings)) {
    if (localIds.has(id)) continue;
    const target = effective.get(id);
    if (!target) {
      const inCatalog = input.catalog.has(id);
      problems.push({
        message: inCatalog
          ? `binding sur « ${id} » : cette règle globale n'est dans aucun bundle choisi.`
          : `binding sur « ${id} » : aucune règle de ce nom (faute de frappe ?).`,
        file: manifestFile,
        ruleId: id,
      });
    } else if (binding.kind === 'advisory') {
      if (target.level === 'MUST') {
        problems.push({
          message: `desserre le MUST global « ${id} » en le déclarant « advisory » : un projet peut ajouter une garde, jamais en retirer l'exigence.`,
          file: manifestFile,
          ruleId: id,
        });
      }
    } else {
      effective.set(id, { ...target, guarantee: binding });
    }
  }

  return { rules: [...effective.values()].sort(byId), problems };
}

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Le mot qui dit, sans mentir, ce qui tient la règle. */
export function guaranteeLabel(guarantee: Guarantee): string {
  switch (guarantee.kind) {
    // « déclaré » : vectorz lit la déclaration du projet, il ne vérifie pas que le contrôle existe ni qu'il tourne.
    case 'gate':
      return `gate déclaré : ${guarantee.ref} (exécuté par le projet, non vérifié ici)`;
    case 'review':
      return `revue a posteriori déclarée : ${guarantee.ref}`;
    case 'hook':
      return 'hook git (bloquant)';
    case 'agent-check':
      return `revue par l'agent ${guarantee.ref}`;
    case 'unguarded-must':
      return 'MUST sans garde (héritage global, non vérifié)';
    case 'advisory':
      return 'conseil, non garanti';
  }
}

/** Une empreinte courte du jeu EFFECTIF : indépendante de l'ordre d'entrée et des chemins de fichiers. */
export function rulesDigest(rules: readonly EffectiveRule[]): string {
  const canonical = [...rules]
    .sort(byId)
    .map((r) => ({ id: r.id, level: r.level, origin: r.origin, guarantee: r.guarantee, content: r.content }));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 12);
}

const LEGEND =
  'Garanties. « gate déclaré » : le projet déclare un contrôle exécutable pour cette règle ; vectorz ne l’exécute pas ' +
  'et ne vérifie pas qu’il existe. « revue a posteriori déclarée » : le projet dit que la règle est relue après coup. ' +
  '« conseil » : la règle est injectée dans le prompt ; elle n’est jamais présentée comme une garantie.';

/**
 * Le jeu effectif en markdown : ce que Claude Code charge pour les agents de CE projet. Déterministe :
 * ni date ni SHA, pour que le fichier ne change que si le contrat change.
 */
export function renderProjectRules(rules: readonly EffectiveRule[], options: { front?: boolean } = {}): string {
  const sections = rules.map((r) =>
    [`## ${r.id}  \`[${r.level}]\`  ${guaranteeLabel(r.guarantee)}`, '', r.content.trim(), ''].join('\n'),
  );
  const body = [
    '# Règles du projet',
    '',
    `Fichier généré par \`ezk rules apply\` depuis \`${RULES_MANIFEST_FILE}\` (le contrat du projet) : ne l’édite pas, relance la commande.`,
    `Empreinte du jeu effectif : ${rulesDigest(rules)}`,
    '',
    LEGEND,
    '',
    ...(sections.length > 0 ? sections : ['Aucune règle dans ce jeu.', '']),
  ];
  // L'en-tête à marqueur est celui du FICHIER ; `show` l'écarte pour n'imprimer que le texte.
  return `${options.front === false ? '' : FRONT}${body.join('\n').trimEnd()}\n`;
}
