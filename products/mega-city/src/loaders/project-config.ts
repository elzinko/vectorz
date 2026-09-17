/**
 * Loader — lit la config projet `.vectorz/config.yml` (frontière entrante, ADR-0003).
 *
 * Fichier absent → `undefined` : le résolveur applique alors le défaut « tout ON »
 * (non-régression, comportement actuel du repo). YAML via `yaml`, comme le catalogue
 * (`src/loaders/catalog.ts`). Aucune validation de schéma ici : le cœur `resolveGithub`
 * tolère toute forme et retombe sur un défaut sûr.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { type GithubCapabilities, resolveGithub } from '../core/project-config.js';

/** Chemin conventionnel de la config projet (ADR-0050 : `.vectorz/` = le contrat). */
export const PROJECT_CONFIG_PATH = join('.vectorz', 'config.yml');

/**
 * Lit et parse `.vectorz/config.yml` sous `projectRoot`. Renvoie l'objet parsé, ou
 * `undefined` si le fichier n'existe pas (défaut = comportement inchangé).
 */
export function loadProjectConfig(projectRoot: string): unknown {
  const file = join(projectRoot, PROJECT_CONFIG_PATH);
  if (!existsSync(file)) return undefined;
  return parseYaml(readFileSync(file, 'utf8'));
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
