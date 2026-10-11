#!/usr/bin/env tsx
/**
 * CLI — imprime le CHEMIN RELATIF résolu d'un artefact de process (fiche 20261001192624192).
 *
 * Une seule source de vérité des chemins (`docs/sessions`, `docs/journal`…) pour que le bash
 * ne parse JAMAIS le YAML : il demande `ezk --root <projet> paths <clé>` et reçoit le chemin.
 *
 * Usage (le projet : `ezk --root <projet> paths <clé>`, sinon le dossier courant) :
 *   ezk paths journal          # → docs/journal (défaut legacy), ou scrum/journal si scrum: true
 *   ezk paths sprints | journal | evidence | retroNotes | retroCaptures
 *
 * Clé inconnue ⇒ erreur nommée (les 5 clés listées), jamais une sortie vide trompeuse.
 */
import { SCRUM_PATH_KEYS, type ScrumPathKey } from '../src/core/project-config.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { scrumPaths } from '../src/loaders/project-config.js';

// `pnpm --dir products/mega-city …` change le cwd ; `INIT_CWD` garde le dossier d'invocation.
const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const key = target.rest[0];

if (!key) {
  console.error(
    `usage : ezk [--root <projet>] paths <clé>   (clés : ${SCRUM_PATH_KEYS.join(', ')})`,
  );
  process.exit(1);
}
if (!SCRUM_PATH_KEYS.includes(key as ScrumPathKey)) {
  console.error(`ezk paths : clé inconnue « ${key} ». Clés : ${SCRUM_PATH_KEYS.join(', ')}.`);
  process.exit(1);
}

console.log(scrumPaths(target.root)[key as ScrumPathKey]);
