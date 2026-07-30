/**
 * `registry.ts` — Chargeur du registre de supervision versionné (fiche 0082).
 *
 * Schéma : `{ projects: [{ id, path, method }] }` — zéro champ journal.
 * `path` est un label de localisation (relatif au répertoire du fichier registre,
 * ou absolu). `method` est le nom de méthode attendu (ex. `mega-city`, `bmad`).
 *
 * Module PUR : aucun effet de bord global, toutes les I/O sont en paramètre.
 * Lu UNE SEULE FOIS à l'init — jamais paramètre d'outil.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'yaml';

export const REGISTRY_FILENAME = 'supervision.registry.yaml';

/** Entrée de projet dans le registre. Jamais de champ journal/path-journal. */
export interface RegistryProject {
  id: string;
  /** Chemin vers la racine du projet (relatif au répertoire du registre, ou absolu). */
  path: string;
  /** Nom de la méthode attendue (ex. `mega-city`, `bmad`). */
  method: string;
}

export interface Registry {
  projects: RegistryProject[];
}

/**
 * Champs interdits dans un projet de registre (invariant anti-falsification).
 * Aucun chemin de journal ne doit apparaître dans le registre.
 */
const FORBIDDEN_FIELDS: readonly string[] = [
  'journal',
  'journal_path',
  'journal_dir',
  'supervision_path',
  'log_path',
];

/**
 * Valide un projet brut et retourne un `RegistryProject` propre, ou lance une
 * erreur si les champs obligatoires sont absents ou si un champ interdit est présent.
 */
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
  const filePath = path.join(registryDir, REGISTRY_FILENAME);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
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
  return registry.projects.map((p) =>
    path.isAbsolute(p.path) ? p.path : path.resolve(registryDir, p.path),
  );
}

/**
 * Trouve l'entrée de registre correspondant à une racine résolue.
 * Compare en résolvant les chemins relatifs par rapport au `registryDir`.
 */
export function findProjectByRoot(
  registry: Registry,
  registryDir: string,
  root: string,
): RegistryProject | undefined {
  const normalizedRoot = path.resolve(root);
  return registry.projects.find((p) => {
    const resolved = path.isAbsolute(p.path)
      ? path.resolve(p.path)
      : path.resolve(registryDir, p.path);
    return resolved === normalizedRoot;
  });
}
