/**
 * Écriture GARDÉE du jeu de règles composé (fiche 20260910152227744, ADR-0050) — le seul module qui écrit
 * `<projet>/.claude/rules/vectorz-project.md`, le dossier que Claude Code charge pour les agents de CE projet.
 *
 * Même discipline que le fichier de loi du cap global (ADR-0056) : on ne remplace que NOTRE fichier, reconnu
 * à son marqueur d'en-tête. Un fichier du même nom écrit par l'utilisateur, ou un lien, est refusé : jamais
 * écrasé. Le dossier visé ne doit pas sortir du projet (un `.claude` en lien vers ailleurs est refusé).
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { PROJECT_RULES_FILE, isManagedProjectRules } from '../core/project-rules.js';

export class ProjectRulesFileError extends Error {}

const isSymlink = (path: string): boolean => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

/** Refuse un fichier qui n'est pas le nôtre : un lien, un dossier, ou un texte sans notre marqueur. */
function assertOurs(target: string): void {
  if (isSymlink(target)) {
    throw new ProjectRulesFileError(
      `refus non destructif : ${target} est un lien ; ezk n'écrit pas à travers un lien. Retire-le à la main.`,
    );
  }
  if (!existsSync(target)) return;
  if (!statSync(target).isFile() || !isManagedProjectRules(readFileSync(target, 'utf8'))) {
    throw new ProjectRulesFileError(
      `refus non destructif : ${target} existe et n'a pas été écrit par « ezk rules apply » (le marqueur d'en-tête manque). Renomme-le ou retire-le à la main.`,
    );
  }
}

/**
 * Le dossier visé reste sous le projet. On regarde le plus proche ancêtre qui EXISTE (le dossier peut ne
 * pas exister encore) : un `.claude` en lien vers l'extérieur est refusé AVANT tout `mkdir`, donc rien
 * n'est créé hors du projet, pas même un dossier vide.
 */
function assertInsideProject(projectRoot: string, dir: string): void {
  let probe = dir;
  while (!existsSync(probe)) probe = dirname(probe);
  const realRoot = realpathSync(projectRoot);
  const realProbe = realpathSync(probe);
  if (realProbe !== realRoot && !realProbe.startsWith(realRoot + sep)) {
    throw new ProjectRulesFileError(
      `refus : ${dir} sort du projet (un lien dans le chemin) ; rien n'a été écrit.`,
    );
  }
}

export type WriteOutcome = 'created' | 'updated' | 'unchanged';

/** Écrit le jeu composé. Idempotent : un contenu identique ne touche pas au disque. */
export function writeProjectRulesFile(projectRoot: string, content: string): WriteOutcome {
  const target = join(projectRoot, PROJECT_RULES_FILE);
  assertOurs(target);
  const existed = existsSync(target);
  if (existed && readFileSync(target, 'utf8') === content) return 'unchanged';
  assertInsideProject(projectRoot, dirname(target));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  return existed ? 'updated' : 'created';
}

export type RemoveOutcome = 'removed' | 'absent';

/** Retire NOTRE fichier quand le contrat a disparu ; un fichier qui n'est pas à nous est refusé. */
export function removeProjectRulesFile(projectRoot: string): RemoveOutcome {
  const target = join(projectRoot, PROJECT_RULES_FILE);
  if (!existsSync(target) && !isSymlink(target)) return 'absent';
  assertOurs(target);
  rmSync(target);
  return 'removed';
}
