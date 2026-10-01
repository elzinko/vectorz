#!/usr/bin/env tsx
/**
 * ezk dor — la DoR extensible par projet (fiche 20260815080414006, ADR-0016 amendé, ADR-0050).
 *
 *   ezk dor show   [--root <projet>]        les slots déclarés dans .vectorz/dor.yml, et le seuil de lot
 *   ezk dor check  <id> [--root <projet>]   la fiche tient-elle les slots du projet ? (code 1 sinon)
 *   ezk dor health [--root <projet>]        prêtes / pas prêtes, et le seuil de lot (code 1 s'il est insuffisant)
 *
 * Le contrat vit dans le projet : `.vectorz/dor.yml` (voir `.vectorz/dor.example.yml`). ABSENT = le socle
 * 3+1 seul, rien ne change. Le projet visé : `--root`, sinon `EZK_ROOT`, sinon la racine git du dossier
 * courant (le dossier courant lui-même hors dépôt git).
 *
 * Bord I/O mince : il résout le projet visé, puis passe la main à `src/io/dor-command.ts` (la commande,
 * éprouvée en mémoire) qui compose avec le cœur pur (`src/core/dor-manifest.ts`).
 */
import { resolve } from 'node:path';
import { runDor } from '../src/io/dor-command.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { gitFacts } from '../src/loaders/project-rules.js';

const here = process.env.INIT_CWD || process.cwd();
// Pas de bandeau « Projet visé » : chaque sortie de `ezk dor` nomme déjà ce qu'elle traite.
const { root, rest } = projectRootOrExit(gitFacts(here).toplevel ?? resolve(here), undefined, { announce: false });
const [verb, ...args] = rest;
if (verb !== 'check' && verb !== 'show' && verb !== 'health') {
  console.error('Usage : ezk dor show|health [--root <projet>] · ezk dor check <id> [--root <projet>]');
  process.exit(2);
}

// exitCode plutôt que exit() : la sortie, si elle passe par un tube, finit de s'écrire avant l'arrêt.
process.exitCode = runDor({
  verb,
  args,
  root,
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
