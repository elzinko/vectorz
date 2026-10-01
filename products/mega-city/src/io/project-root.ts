/**
 * Racine du PROJET désigné — bord I/O (fiche 20260826173221323). Le cœur est
 * `src/core/project-root.ts` (pur) ; ici on lit l'environnement du processus et on vérifie qu'un
 * dossier désigné existe vraiment. Un dossier faux est refusé avec un message clair : sans ça, une
 * faute de frappe donnerait une page vide qui ressemble à un projet sans fiche.
 */
import { statSync } from 'node:fs';
import {
  PROJECT_ROOT_ENV,
  type ResolvedRoot,
  extractRootFlag,
  resolveProjectRoot,
  rootBanner,
} from '../core/project-root.js';

export class ProjectRootError extends Error {}

/** Le dossier désigné existe et c'en est un ; sinon une erreur qui cite le chemin. */
export function checkProjectRoot(root: string): void {
  let isDirectory: boolean;
  try {
    isDirectory = statSync(root).isDirectory();
  } catch {
    throw new ProjectRootError(`Le projet désigné n'existe pas : ${root}`);
  }
  if (!isDirectory) throw new ProjectRootError(`Le projet désigné n'est pas un dossier : ${root}`);
}

export interface ProcessRoot extends ResolvedRoot {
  /** Les arguments, sans `--root`. */
  rest: string[];
}

/**
 * La racine du projet pour CE processus : `--root` (lu dans `argv`) > `EZK_ROOT` > `fallback`.
 * Lève `ProjectRootError` si l'option est mal formée ou si un dossier désigné est faux. Le défaut,
 * lui, n'est jamais contrôlé : c'est le comportement d'avant, il ne doit pas pouvoir changer.
 */
export function projectRootFromProcess(
  fallback: string,
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): ProcessRoot {
  const { flag, rest, error } = extractRootFlag(argv);
  if (error) throw new ProjectRootError(error);
  const resolved = resolveProjectRoot({
    flag,
    env: env[PROJECT_ROOT_ENV],
    fallback,
    initCwd: env.INIT_CWD,
    cwd,
  });
  if (resolved.source !== 'default') checkProjectRoot(resolved.root);
  return { ...resolved, rest };
}

export interface RootOptions {
  /**
   * Annoncer sur stderr quel projet est visé quand ce n'est pas le défaut (oui par défaut). stderr, pas
   * stdout : un `--json` reste du JSON. Un script qui dit déjà quel projet il traite l'éteint.
   */
  announce?: boolean;
}

/** Comme `projectRootFromProcess`, pour un script : une erreur s'écrit sur stderr, code 2. */
export function projectRootOrExit(fallback: string, argv?: string[], options: RootOptions = {}): ProcessRoot {
  try {
    const resolved = projectRootFromProcess(fallback, argv);
    const banner = rootBanner(resolved);
    if (banner && options.announce !== false) console.error(banner);
    return resolved;
  } catch (error) {
    if (!(error instanceof ProjectRootError)) throw error;
    console.error(error.message);
    process.exit(2);
  }
}
