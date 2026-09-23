/**
 * Loader — lit la config projet `.vectorz/config.yml` (ou `.yaml`) — frontière entrante (ADR-0003).
 *
 * - Fichier absent → `undefined` : le résolveur applique le défaut « tout ON »
 *   (non-régression, comportement actuel du repo).
 * - YAML MALFORMÉ → erreur explicite (fail-fast, message = chemin) : une config cassée est
 *   une erreur utilisateur à SIGNALER, jamais à masquer — ni en coupant, ni en activant
 *   GitHub par accident. Le cœur `resolveGithub` ne « tolère » que les formes déjà parsées.
 *
 * YAML via `yaml`, comme le catalogue (`src/loaders/catalog.ts`, qui accepte aussi `.ya?ml`).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Document, isMap, parse as parseYaml, parseDocument } from 'yaml';
import { type GithubCapabilities, resolveGithub } from '../core/project-config.js';

/** Dossier conventionnel de la config projet (ADR-0050 : `.vectorz/` = le contrat). */
export const PROJECT_CONFIG_DIR = '.vectorz';
/** Noms acceptés (deux extensions YAML) ; `.yml` prioritaire s'il coexiste avec `.yaml`. */
export const PROJECT_CONFIG_NAMES = ['config.yml', 'config.yaml'] as const;

/**
 * Lit et parse la config projet sous `projectRoot`. Renvoie l'objet parsé, ou `undefined`
 * si aucun fichier n'existe. Lève une erreur claire (avec le chemin) si le YAML est
 * présent mais malformé.
 */
export function loadProjectConfig(projectRoot: string): unknown {
  for (const name of PROJECT_CONFIG_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (!existsSync(file)) continue;
    try {
      return parseYaml(readFileSync(file, 'utf8'));
    } catch (cause) {
      throw new Error(`Config projet illisible (YAML malformé) : ${file}`, { cause });
    }
  }
  return undefined;
}

/**
 * Capacités github effectives pour le projet à `projectRoot`.
 * Compose le loader (I/O) et le cœur pur (résolution).
 */
export function githubCapabilities(projectRoot: string): GithubCapabilities {
  const config = loadProjectConfig(projectRoot);
  const github = (config as { github?: unknown } | undefined)?.github;
  return resolveGithub(github);
}

/** Les trois capacités pilotables de la famille `github` (clés YAML canoniques, kebab). */
export type GithubCapKey = 'pr' | 'ci' | 'codex-review';
const CAP_KEYS: readonly GithubCapKey[] = ['pr', 'ci', 'codex-review'];

/**
 * Mutation de la famille `github` :
 *  - `all` : (dé)connecter GitHub d'un bloc (`github: false` / retour au défaut ON) ;
 *  - `cap` : (dé)brancher UNE capacité (`github: { pr: false }`…).
 */
export type GithubMutation =
  | { readonly kind: 'all'; readonly enabled: boolean }
  | { readonly kind: 'cap'; readonly cap: GithubCapKey; readonly enabled: boolean };

/** Fichier config cible : l'existant (`.yml` prioritaire sur `.yaml`), sinon `config.yml` par défaut. */
function targetConfigFile(projectRoot: string): string {
  for (const name of PROJECT_CONFIG_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (existsSync(file)) return file;
  }
  return join(projectRoot, PROJECT_CONFIG_DIR, PROJECT_CONFIG_NAMES[0]);
}

/**
 * Applique la mutation `github` sur le DOCUMENT yaml (structure seule, aucune I/O).
 * Édite chirurgicalement la clé `github` — les autres clés et les commentaires du
 * document sont préservés par construction.
 */
function applyGithubMutation(doc: Document, mutation: GithubMutation): void {
  if (mutation.kind === 'all') {
    // `on` = retirer la coupure (défaut = tout ON) ; `off` = déconnexion franche.
    if (mutation.enabled) doc.delete('github');
    else doc.set('github', false);
    return;
  }
  const { cap, enabled } = mutation;
  const current = doc.get('github');
  if (enabled) {
    // Rallumer une capacité = retirer sa coupure là où elle est écrite.
    if (isMap(current)) {
      current.delete(cap);
      if (current.items.length === 0) doc.delete('github'); // map vide → défaut tout ON
    } else if (current === false) {
      // Était tout-coupé : rallumer une capacité laisse les DEUX autres coupées
      // (jamais rallumer par accident — symétrie du défaut sûr de resolveGithub).
      const others: Record<string, boolean> = {};
      for (const k of CAP_KEYS) if (k !== cap) others[k] = false;
      doc.set('github', others);
    }
    // sinon (github absent / true / map sans la clé) : déjà ON → rien à faire.
    return;
  }
  // Couper une capacité (granulaire).
  if (current === false) return; // déjà tout coupé → cette capacité l'est → no-op sûr.
  if (isMap(current)) current.set(cap, false); // map existante : préserve les autres clés.
  else doc.set('github', { [cap]: false }); // github absent / true → map à une clé.
}

/**
 * Écrit une mutation de la famille `github` dans `.vectorz/config.yml`, **sans rien
 * détruire d'autre** : les clés voisines et les commentaires du fichier survivent
 * (édition de document `yaml`). Crée `.vectorz/` et le fichier s'ils manquent. Un YAML
 * déjà présent mais **malformé** lève une erreur claire (chemin) **sans écraser** —
 * symétrie de `loadProjectConfig` (fail-fast, jamais de coupure silencieuse). Renvoie le
 * chemin écrit.
 */
export function writeGithubConfig(projectRoot: string, mutation: GithubMutation): string {
  const file = targetConfigFile(projectRoot);
  let doc: Document;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, 'utf8'));
    if (doc.errors.length > 0) {
      throw new Error(`Config projet illisible (YAML malformé) : ${file}`);
    }
  } else {
    doc = new Document();
  }
  applyGithubMutation(doc, mutation);
  // Style BLOC pour un fichier que l'humain lit et édite : sans ça, une map vide `{}`
  // (config vidée puis re-remplie) réhydrate en style « flow » `{ github: { pr: false } }`.
  // On ne touche que le style de la racine ; les clés voisines gardent le leur.
  if (isMap(doc.contents)) doc.contents.flow = false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, doc.toString(), 'utf8');
  return file;
}
