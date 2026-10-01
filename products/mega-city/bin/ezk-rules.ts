#!/usr/bin/env tsx
/**
 * ezk rules — les règles PROPRES à un projet (fiche 20260910152227744, ADR-0050).
 *
 *   ezk rules check [--root <projet>]           le méta-lint du contrat (code 1 s'il y a une erreur)
 *   ezk rules show  [--root <projet>] [--json]  le jeu EFFECTIF : projet, commit, empreinte, garantie par règle
 *   ezk rules apply [--root <projet>]           écrit .claude/rules/vectorz-project.md (chargé par Claude Code)
 *
 * Le contrat vit dans le projet : `.vectorz/rules.yml` (bundles choisis, un binding par règle) et
 * `.vectorz/rules/<id>.md` (règles locales). Le projet visé : `--root`, sinon `EZK_ROOT`, sinon la racine
 * git du dossier courant (le dossier courant lui-même hors dépôt git).
 *
 * Bord I/O mince : il résout le projet visé, puis passe la main à `src/io/rules-command.ts` (la commande,
 * éprouvée en mémoire) qui compose avec le cœur pur (`src/core/project-rules.ts`).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRootOrExit } from '../src/io/project-root.js';
import { runRules } from '../src/io/rules-command.js';
import { gitFacts } from '../src/loaders/project-rules.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const here = process.env.INIT_CWD || process.cwd();
// Pas de bandeau « Projet visé » : chaque sortie de `ezk rules` nomme déjà le projet qu'elle traite.
const { root, rest } = projectRootOrExit(gitFacts(here).toplevel ?? resolve(here), undefined, { announce: false });
const [verb, ...flags] = rest;
if (verb !== 'check' && verb !== 'show' && verb !== 'apply') {
  console.error('Usage : ezk rules check|show|apply [--root <projet>] (show : [--json])');
  process.exit(2);
}

// exitCode plutôt que exit() : la sortie, si elle passe par un tube, finit de s'écrire avant l'arrêt.
process.exitCode = runRules({
  verb,
  flags,
  root,
  megaCity,
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
