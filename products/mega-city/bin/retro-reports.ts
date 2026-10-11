#!/usr/bin/env node
/**
 * retro:reports — liste les comptes rendus de sprint (`docs/sprints/`) écrits DEPUIS la dernière capture
 * de rétro (`docs/captures/`), fiche 20261008072306360 (ADR-0068). Lecture seule.
 *
 *   pnpm --dir products/mega-city retro:reports [--root <projet>]
 *
 * La rétro (`ezk-retro`) les lit au temps 1 (« rassembler les signaux ») : une rétro jouée dans une
 * autre session voit ainsi les sprints qu'elle n'a pas vécus, car tous les comptes rendus atterrissent
 * dans le même `docs/sprints/` committé. Chaque ligne : le chemin, relatif au projet.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportsSince } from '../src/core/sprint-reports-since.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const here = dirname(fileURLToPath(import.meta.url));
const methodRoot = resolve(here, '..', '..', '..');

function namesIn(root: string, sub: string): string[] {
  const dir = join(root, sub);
  return existsSync(dir) ? readdirSync(dir) : [];
}

function main(): void {
  // --help AVANT la résolution de racine : l'aide doit sortir même hors d'un projet résolvable.
  if (process.argv.slice(2).some((a) => a === '--help' || a === '-h')) {
    console.log('usage: retro:reports [--root <projet>]');
    console.log('');
    console.log('Liste les comptes rendus de sprint (docs/sprints/) écrits depuis la dernière capture (docs/captures/).');
    process.exit(0);
  }
  const target = projectRootOrExit(methodRoot);
  const captures = namesIn(target.root, join('docs', 'captures')).filter((n) => n.endsWith('.md'));
  const reports = namesIn(target.root, join('docs', 'sprints')).filter((n) => n.endsWith('.md'));
  const since = reportsSince(captures, reports);
  if (since.length === 0) {
    console.log('Aucun compte rendu de sprint depuis la dernière capture (docs/sprints/).');
    return;
  }
  for (const name of since) console.log(`docs/sprints/${name}`);
}

main();
