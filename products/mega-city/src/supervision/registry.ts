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
import { parse, stringify } from 'yaml';

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
 * Remonte depuis chaque `startDir` jusqu'à trouver `supervision.registry.yaml`.
 * Le registre vit au siège (racine vectorz) — un projet ancré ailleurs doit
 * quand même le découvrir (walk-up, `SUPERVISION_REGISTRY_DIR`, ou siège packagé).
 * Retourne le dossier contenant le fichier, ou `null` si aucun n'est trouvé.
 */
export function findRegistryDir(startDirs: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const start of startDirs) {
    let dir = path.resolve(start);
    for (;;) {
      if (!seen.has(dir)) {
        seen.add(dir);
        if (fs.existsSync(path.join(dir, REGISTRY_FILENAME))) return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

/**
 * Résultat d'une découverte + charge du registre central.
 * `dir` = dossier du fichier (base de résolution des `path` relatifs).
 */
export interface LocatedRegistry {
  dir: string;
  registry: Registry;
}

/**
 * Découvre puis charge le registre. `null` si aucun fichier trouvé.
 * Propage les erreurs de validation si le fichier existe mais est invalide
 * (ne jamais traiter un registre cassé comme « absent »).
 */
export function locateRegistry(startDirs: readonly string[]): LocatedRegistry | null {
  const dir = findRegistryDir(startDirs);
  if (dir === null) return null;
  const registry = loadRegistry(dir);
  if (registry === null) return null;
  return { dir, registry };
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

/**
 * fiche 0063 — chemin à stocker dans le registre : relatif au siège si possible,
 * sinon absolu.
 */
export function pathLabelForRegistry(registryDir: string, absoluteRoot: string): string {
  const abs = path.resolve(absoluteRoot);
  const rel = path.relative(path.resolve(registryDir), abs);
  if (rel === '') return '.';
  if (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel)) {
    return rel;
  }
  return abs;
}

/**
 * fiche 0063 — ajoute un projet au registre (écriture humaine / CLI siège).
 * Refuse les doublons d'`id` ou de racine résolue. Recrée le YAML (commentaires
 * du fichier perdu — acceptable pour le POC).
 */
export function appendRegistryProject(
  registryDir: string,
  project: RegistryProject,
  writeFile: (filePath: string, content: string) => void = (filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8');
  },
): Registry {
  const existing = loadRegistry(registryDir) ?? { projects: [] };
  const labelPath = project.path.trim();
  const resolvedNew = path.isAbsolute(labelPath)
    ? path.resolve(labelPath)
    : path.resolve(registryDir, labelPath);

  for (const p of existing.projects) {
    if (p.id === project.id.trim()) {
      throw new Error(`projet déjà présent dans le registre (id=${p.id})`);
    }
    const resolved = path.isAbsolute(p.path)
      ? path.resolve(p.path)
      : path.resolve(registryDir, p.path);
    if (resolved === resolvedNew) {
      throw new Error(`projet déjà présent dans le registre (path=${p.path})`);
    }
  }

  const nextProject: RegistryProject = {
    id: project.id.trim(),
    path: labelPath,
    method: project.method.trim(),
  };
  const next: Registry = { projects: [...existing.projects, nextProject] };
  writeFile(
    path.join(registryDir, REGISTRY_FILENAME),
    `${stringify(next).trimEnd()}\n`,
  );
  return next;
}
