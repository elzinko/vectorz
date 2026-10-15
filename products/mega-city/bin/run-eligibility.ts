#!/usr/bin/env tsx
/**
 * run:eligibility — teste l'éligibilité d'une fiche au run autonome AVANT toute délibération
 * (fiche 20261011091553794).
 *
 *   ezk run eligibility --fiche <id> [--all-versions]   (--root <dossier> pour un autre dépôt)
 *
 * Le cœur PUR (`src/backlog/run-eligibility.ts`) tranche depuis la raison `blocked:` typée et la
 * borne de version (ADR-0070). Ici : lecture disque et git (fiches + étiquettes), calcul du
 * périmètre de version, puis affichage du verdict. LECTURE SEULE : rien n'est écrit.
 *
 * Le pilote (`ezk-product-build`) lit la ligne `disposition:` pour décider SANS délibérer :
 *   build → construire · groom → auto-groom · escalate → escalader (journaliser, ne pas délibérer)
 *   · defer → borne de version atteinte, le run s'arrête.
 * Sort toujours en 0 : un verdict n'est pas une erreur. Code 2 = usage (fiche absente).
 */
import { runDisposition } from '../src/backlog/run-eligibility.js';
import { buildVersions } from '../src/backlog/versions.js';
import { versionScope } from '../src/backlog/version-scope.js';
import { localTags } from '../src/io/git-tags.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { loadFiches } from '../src/loaders/fiches.js';

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    'usage : run:eligibility --fiche <id> [--all-versions]   (--root <dossier> pour un autre dépôt)',
  );
  process.exit(2);
}

function main(): void {
  const fallbackCwd = process.env.INIT_CWD ?? process.cwd();
  const { root, rest: argv } = projectRootOrExit(fallbackCwd);
  if (argv.includes('--help') || argv.includes('-h')) usage();

  let fiche: string | undefined;
  let allVersions = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fiche') fiche = argv[++i];
    else if (a === '--all-versions') allVersions = true;
    else usage(`option inconnue : ${a}`);
  }
  if (fiche === undefined || fiche.trim() === '') usage('--fiche <id> est obligatoire');

  const fiches = loadFiches(root);
  const target = fiches.find((f) => f.id === fiche);
  if (target === undefined) {
    console.error(`erreur: aucune fiche ne porte l'id ${fiche} dans ${root}/features.`);
    process.exit(2);
  }

  const scope = versionScope(buildVersions(fiches, localTags(root)), { allVersions });
  const verdict = runDisposition(target, scope);
  console.log(`éligibilité de ${target.id} — ${target.title}`);
  console.log(`  ${verdict.message}`);
  console.log(`disposition: ${verdict.disposition}`);
}

main();
