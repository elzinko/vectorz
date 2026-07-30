/**
 * `registry.ts` — Chargeur minimal du registre de supervision (fiche 0082).
 *
 * Copie légère du module canonique `products/mega-city/src/supervision/registry.ts`
 * pour éviter une dépendance circulaire entre cop1 et mega-city.
 * Identique dans le contrat : même nom de fichier, même schéma YAML, même API.
 *
 * Module PUR : aucun effet de bord global.
 * Lu UNE SEULE FOIS à l'init du daemon — jamais paramètre d'outil.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { parse } from 'yaml';

export const REGISTRY_FILENAME = 'supervision.registry.yaml';

export interface RegistryProject {
  id: string;
  path: string;
  method: string;
}

export interface Registry {
  projects: RegistryProject[];
}

const FORBIDDEN_FIELDS: readonly string[] = [
  'journal',
  'journal_path',
  'journal_dir',
  'supervision_path',
  'log_path',
];

function validateProject(raw: unknown, index: number): RegistryProject {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`projects[${index}] doit être un objet`);
  }
  const obj = raw as Record<string, unknown>;

  for (const forbidden of FORBIDDEN_FIELDS) {
    if (forbidden in obj) {
      throw new Error(
        `projects[${index}] contient le champ interdit "${forbidden}" — le registre ne stocke jamais de chemin de journal (fiche 0082)`,
      );
    }
  }

  const { id, path: projectPath, method } = obj;
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`projects[${index}].id doit être une chaîne non vide`);
  }
  if (typeof projectPath !== 'string' || projectPath.trim().length === 0) {
    throw new Error(`projects[${index}].path doit être une chaîne non vide`);
  }
  if (typeof method !== 'string' || method.trim().length === 0) {
    throw new Error(`projects[${index}].method doit être une chaîne non vide`);
  }

  return { id: id.trim(), path: projectPath.trim(), method: method.trim() };
}

/**
 * Charge et valide `supervision.registry.yaml` depuis `registryDir`.
 * Retourne `null` si le fichier n'existe pas (rollback v1).
 * Lance une erreur si le fichier existe mais est invalide.
 */
export function loadRegistry(registryDir: string): Registry | null {
  const filePath = join(registryDir, REGISTRY_FILENAME);
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, 'utf-8');
  const raw: unknown = parse(content);

  if (!raw || typeof raw !== 'object') {
    throw new Error(`${REGISTRY_FILENAME} : contenu invalide (attendu un objet YAML)`);
  }

  const obj = raw as Record<string, unknown>;
  const rawProjects = obj.projects;

  if (!Array.isArray(rawProjects)) {
    throw new Error(`${REGISTRY_FILENAME} : "projects" doit être un tableau`);
  }

  const projects = rawProjects.map((p, i) => validateProject(p, i));
  return { projects };
}

/**
 * Résout les racines de watch depuis les projets du registre.
 * Les chemins relatifs sont résolus par rapport au `registryDir`.
 */
export function resolveWatchRoots(registry: Registry, registryDir: string): string[] {
  return registry.projects.map((p) => (isAbsolute(p.path) ? p.path : resolve(registryDir, p.path)));
}

/**
 * Remonte depuis chaque `startDir` jusqu'à trouver `supervision.registry.yaml`.
 * Retourne le dossier contenant le fichier, ou `null`.
 */
export function findRegistryDir(startDirs: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const start of startDirs) {
    let dir = resolve(start);
    for (;;) {
      if (!seen.has(dir)) {
        seen.add(dir);
        if (existsSync(join(dir, REGISTRY_FILENAME))) return dir;
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

export interface LocatedRegistry {
  dir: string;
  registry: Registry;
}

/**
 * Découvre puis charge le registre. `null` si absent.
 * Propage les erreurs si le fichier existe mais est invalide.
 */
export function locateRegistry(startDirs: readonly string[]): LocatedRegistry | null {
  const dir = findRegistryDir(startDirs);
  if (dir === null) return null;
  const registry = loadRegistry(dir);
  if (registry === null) return null;
  return { dir, registry };
}
