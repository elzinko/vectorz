/**
 * CLI — affiche les capacités du plugin `github` effectives depuis `.vectorz/config.yml`.
 *
 * Point de démonstration du cran mince (fiche 20260916225506856) : prouve que le fichier
 * de config projet est lu et résolu. Le câblage effectif (ezk-sprint / ezk-pr sautent les
 * étapes GitHub selon ces capacités) est la couche suivante — hors POC.
 *
 * Usage : pnpm --dir products/mega-city ezk:config [projectRoot]   (défaut : cwd)
 */
import { resolve } from 'node:path';
import { githubCapabilities } from '../src/loaders/project-config.js';

// `pnpm --dir products/mega-city …` change le cwd vers products/mega-city ; `INIT_CWD`
// conserve le répertoire d'invocation (la racine du projet). Un argument (chemin de projet)
// est résolu contre cette base — un chemin relatif comme `.` vise donc la racine, pas le cwd
// de pnpm (revue Codex, PR #250) ; un chemin absolu est pris tel quel.
const base = process.env.INIT_CWD ?? process.cwd();
const root = process.argv[2] ? resolve(base, process.argv[2]) : base;
const caps = githubCapabilities(root);
const flag = (on: boolean): string => (on ? 'ON ' : 'OFF');

console.log(`Config projet    : ${root}/.vectorz/config.yml`);
console.log(`github.pr            ${flag(caps.pr)}   (ouvrir une pull request)`);
console.log(`github.ci            ${flag(caps.ci)}   (attendre la CI cloud)`);
console.log(`github.codex-review  ${flag(caps.codexReview)}   (revue Codex)`);
