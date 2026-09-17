/**
 * CLI — affiche les capacités du plugin `github` effectives depuis `.vectorz/config.yml`.
 *
 * Point de démonstration du cran mince (fiche 20260916225506856) : prouve que le fichier
 * de config projet est lu et résolu. Le câblage effectif (ezk-sprint / ezk-pr sautent les
 * étapes GitHub selon ces capacités) est la couche suivante — hors POC.
 *
 * Usage : pnpm --dir products/mega-city ezk:config [projectRoot]   (défaut : cwd)
 */
import { githubCapabilities } from '../src/loaders/project-config.js';

// `pnpm --dir products/mega-city …` change le cwd vers products/mega-city ; `INIT_CWD`
// conserve le répertoire d'invocation (la racine du projet). Priorité : argument explicite,
// puis INIT_CWD, puis cwd. Sans ça, on lirait products/mega-city/.vectorz/config.yml et un
// `github: false` posé à la racine serait ignoré (revue Codex, PR #250).
const root = process.argv[2] ?? process.env.INIT_CWD ?? process.cwd();
const caps = githubCapabilities(root);
const flag = (on: boolean): string => (on ? 'ON ' : 'OFF');

console.log(`Config projet    : ${root}/.vectorz/config.yml`);
console.log(`github.pr            ${flag(caps.pr)}   (ouvrir une pull request)`);
console.log(`github.ci            ${flag(caps.ci)}   (attendre la CI cloud)`);
console.log(`github.codex-review  ${flag(caps.codexReview)}   (revue Codex)`);
