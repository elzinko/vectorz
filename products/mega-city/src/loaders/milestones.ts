/**
 * Loader des DÉCLARATIONS d'objectif (`features/milestones/<slug>.md`) — frontière entrante (ADR-0003).
 *
 * En clair : un objectif (`milestone`) peut être déclaré par un petit fichier qui porte son nom en
 * clair (ADR-0088 §7, fiche 20261114131612572). Le front-matter `milestone` donne la valeur exacte du
 * champ des fiches ; `nom` donne le nom affiché. Sans déclaration, l'objectif n'a pas de nom : la
 * méthode n'en devine aucun, et ne le lit jamais dans `PLAN.md`.
 *
 * Même lecture que les fiches (`readField`), pas de second parseur de front-matter.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { frontMatter, readField } from './fiches.js';

/** Le dossier des déclarations, relatif à la racine du projet. Le loader des fiches ne le lit pas. */
export const MILESTONES_DIR = join('features', 'milestones');

/** Le nom en clair de chaque objectif déclaré, par valeur exacte du champ `milestone`. */
export function loadMilestoneNoms(root: string): Map<string, string> {
  const dir = join(root, MILESTONES_DIR);
  const noms = new Map<string, string>();
  if (!existsSync(dir)) return noms;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || !statSync(join(dir, name)).isFile()) continue;
    const fm = frontMatter(readFileSync(join(dir, name), 'utf8'));
    const milestone = readField(fm, 'milestone');
    if (milestone !== '') noms.set(milestone, readField(fm, 'nom'));
  }
  return noms;
}
