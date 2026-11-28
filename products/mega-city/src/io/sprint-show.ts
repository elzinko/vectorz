/**
 * sprint-show — le bord qui assemble `ezk sprint show <slug> --json` (fiche 20261114131612204).
 *
 * Lit les comptes rendus du projet (`io/sprint-reports.ts`, la même source que `board show`), trouve
 * celui du slug et le rend en champs. Deux sprints de même slug : le plus récent. Il ne fait que lire.
 * `bin/sprint-show.ts` et le générateur d'exemples (`io/contract-files.ts`) passent tous deux par ici.
 */
import { allSprints, parseSprintDetail } from '../core/sprint-report-summary.js';
import { type SprintShow, buildSprintShow } from '../core/sprint-show-contract.js';
import { SPRINTS_DIR, sprintReports } from './sprint-reports.js';

/** Le contrat du sprint `slug` du projet `root`, ou `undefined` si aucun compte rendu ne porte ce slug. */
export function sprintShowData(root: string, slug: string): SprintShow | undefined {
  const reports = sprintReports(root);
  const listed = allSprints(SPRINTS_DIR, reports).find((s) => s.slug === slug);
  if (listed === undefined) return undefined;
  const name = listed.fichier.slice(SPRINTS_DIR.length + 1);
  const report = reports.find((r) => r.name === name);
  const detail = report && parseSprintDetail(SPRINTS_DIR, name, report.text, report.json);
  return detail ? buildSprintShow(detail, listed.numero) : undefined;
}
