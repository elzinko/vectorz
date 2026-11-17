/**
 * Loader des OBJETS D'IDENTITÉ (ADR-0088 §7) — frontière entrante (ADR-0003).
 *
 * En clair : un objectif (`features/milestones/<slug>.md`, fiche 20261114131612572) et une version
 * (`features/versions/<vX.Y.Z>.md`, fiche 20261114131612759) peuvent être déclarés par un petit
 * fichier qui porte leur nom en clair. Le front-matter `milestone` (ou `version`) donne la valeur
 * exacte du champ des fiches ; `nom` donne le nom affiché. Sans déclaration, pas de nom : la méthode
 * n'en devine aucun, et ne le lit jamais dans `PLAN.md`.
 *
 * Même lecture que les fiches (`readField`), pas de second parseur de front-matter. Le loader des
 * fiches ne lit aucun de ces deux dossiers.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { frontMatter, readField } from './fiches.js';

/** Le dossier des déclarations d'objectif, relatif à la racine du projet. */
export const MILESTONES_DIR = join('features', 'milestones');

/** Le dossier des déclarations de version, relatif à la racine du projet. */
export const VERSIONS_DIR = join('features', 'versions');

/** Le `nom` de chaque déclaration du dossier `sub`, par valeur exacte de son champ `champ`. */
function loadNoms(root: string, sub: string, champ: string): Map<string, string> {
  const dir = join(root, sub);
  const noms = new Map<string, string>();
  if (!existsSync(dir)) return noms;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || !statSync(join(dir, name)).isFile()) continue;
    const fm = frontMatter(readFileSync(join(dir, name), 'utf8'));
    const cle = readField(fm, champ);
    if (cle !== '') noms.set(cle, readField(fm, 'nom'));
  }
  return noms;
}

/** Le nom en clair de chaque objectif déclaré, par valeur exacte du champ `milestone`. */
export function loadMilestoneNoms(root: string): Map<string, string> {
  return loadNoms(root, MILESTONES_DIR, 'milestone');
}

/** Le nom en clair de chaque version déclarée, par valeur exacte du champ `version` (`v0.23.0`). */
export function loadVersionNoms(root: string): Map<string, string> {
  return loadNoms(root, VERSIONS_DIR, 'version');
}
