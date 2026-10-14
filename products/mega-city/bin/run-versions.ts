#!/usr/bin/env tsx
/**
 * run:versions — la SUITE DE VERSIONS qu'un run multi-versions enchaîne (fiche 20261013131852375).
 *
 *   ezk run versions [--versions all|<v1,v2,…>]   (--root <dossier> pour un autre dépôt)
 *
 * Le cœur PUR (`src/backlog/version-sequence.ts`) calcule la liste ordonnée des versions à faire.
 * Ici : lecture disque et git (fiches + étiquettes), puis affichage. LECTURE SEULE : rien n'est écrit.
 *
 * Le pilote (`ezk-product-build run --versions all`) lit cette suite pour enchaîner les versions, avec
 * une frontière (rétro + clôture) à chacune. Défaut sans `--versions` : `all` (toutes les versions à
 * faire). Sort toujours en 0 : une suite vide (tout est livré) n'est pas une erreur.
 */
import { versionSequence } from '../src/backlog/version-sequence.js';
import { buildVersions } from '../src/backlog/versions.js';
import { localTags } from '../src/io/git-tags.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { loadFiches } from '../src/loaders/fiches.js';

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error('usage : run:versions [--versions all|<v1,v2,…>]   (--root <dossier> pour un autre dépôt)');
  process.exit(2);
}

function main(): void {
  const fallbackCwd = process.env.INIT_CWD ?? process.cwd();
  const { root, rest: argv } = projectRootOrExit(fallbackCwd);
  if (argv.includes('--help') || argv.includes('-h')) usage();

  let versions: 'all' | string[] = 'all';
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--versions') {
      const value = argv[++i];
      if (value === undefined) usage('--versions attend « all » ou une liste v1,v2,…');
      versions = value === 'all' ? 'all' : value.split(',').map((v) => v.trim()).filter((v) => v !== '');
    } else usage(`option inconnue : ${a}`);
  }

  const report = buildVersions(loadFiches(root), localTags(root));
  const { sequence, skipped } = versionSequence(report, { versions });

  if (sequence.length === 0) {
    console.log('run multi-versions : aucune version à faire (tout est livré ou parké).');
  } else {
    console.log(`run multi-versions : ${sequence.length} version(s) à enchaîner, dans l'ordre du plan —`);
    console.log(`  ${sequence.join(' → ')}`);
    console.log('  frontière à chaque version : rétro (selon --retro) puis clôture de version.');
  }
  for (const s of skipped) console.log(`  écartée : ${s.version} — ${s.reason}`);
}

main();
