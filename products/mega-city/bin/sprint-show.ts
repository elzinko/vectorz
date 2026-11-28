#!/usr/bin/env tsx
/**
 * sprint-show — un compte rendu de sprint, lu en entier (fiche 20261114131612204, ADR-086).
 *
 *   ezk sprint show <slug>            # en clair : numéro, but, branche, lot scellé
 *   ezk sprint show <slug> --json     # le contrat JSON versionné (contracts/sprint-show/)
 *   ezk --root <projet> sprint show <slug>
 *
 * Le cœur (src/core/sprint-report-summary.ts) découpe le compte rendu ; ce script est le bord. Un slug
 * qu'aucun compte rendu ne porte rend le code 1 et une phrase.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SprintShow } from '../src/core/sprint-show-contract.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { sprintShowData } from '../src/io/sprint-show.js';

const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root, rest } = projectRootOrExit(ownRoot);

const RESULTAT = { livree: 'livrée', reportee: 'reportée', ouverte: 'restée ouverte' } as const;

/** La sortie lisible : l'en-tête du sprint, puis son lot scellé. */
function inClear(show: SprintShow): string {
  const { sprint, sections } = show;
  const lines = [
    `Sprint ${sprint.numero} — ${sprint.slug}`,
    `But : ${sprint.but ?? '(non dit)'}`,
    `Branche : ${sprint.branche ?? '(non dite)'} · ${sprint.debut ?? '?'} → ${sprint.fin ?? '?'}`,
    `Compte rendu : ${sprint.fichier}`,
    '',
    'Lot scellé',
    ...sections.lotScelle.map((e) => `  ${e.id}${e.title ? ` — ${e.title}` : ''} — ${RESULTAT[e.resultat]}`),
  ];
  if (sections.abandon !== null) lines.push('', `Abandon : ${sections.abandon}`);
  return lines.join('\n');
}

// Pas de `process.exit` après la sortie : il couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01).
const args = rest.filter((a) => a !== '--');
const json = args.includes('--json');
const free = args.filter((a) => a !== '--json');
if (free.length !== 1 || free[0].startsWith('--')) {
  console.error('usage : ezk [--root <projet>] sprint show <slug> [--json]');
  process.exitCode = 2;
} else {
  const show = sprintShowData(root, free[0]);
  if (show === undefined) {
    console.error(`En clair : aucun compte rendu de sprint ne porte le slug « ${free[0]} » dans ${root}/docs/sprints/.`);
    process.exitCode = 1;
  } else {
    console.log(json ? JSON.stringify(show, null, 1) : inClear(show));
  }
}
