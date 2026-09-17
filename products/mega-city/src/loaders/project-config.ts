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
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
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
