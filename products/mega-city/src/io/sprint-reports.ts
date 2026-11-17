/**
 * sprint-reports — les comptes rendus de sprint d'un projet, lus au bord (`docs/sprints/`).
 *
 * `ezk board show` en résume les derniers ; `ezk backlog show` y cherche le sprint qui a livré chaque
 * fiche (fiche 20261114131612572). Les deux lisent par ici ; le cœur pur
 * (`core/sprint-report-summary.ts`) découpe les textes.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Le dossier des comptes rendus, relatif à la racine du projet. */
export const SPRINTS_DIR = 'docs/sprints';

/** Les comptes rendus de sprint du projet : nom et texte. */
export function sprintReports(root: string): { name: string; text: string }[] {
  const dir = join(root, SPRINTS_DIR);
  if (!existsSync(dir)) return [];
  // Seuls les comptes rendus (`AAAA-MM-JJ-sprint-<slug>.md`) sont lus, et un dossier homonyme n'est pas lu.
  return readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-sprint-.+\.md$/.test(name))
    .filter((name) => statSync(join(dir, name)).isFile())
    .map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }));
}
