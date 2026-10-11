#!/usr/bin/env tsx
/**
 * ezk scout extract — amorçage brownfield (fiche 20261007151859473) : lit un repo existant et
 * PROPOSE des règles candidates (jamais écrites — FIND-ONLY d'ezk-scout, ADR-0001). Le PO arbitre ;
 * une règle validée atterrit ensuite dans `rules/` + un bundle par les voies normales.
 *
 *   pnpm --dir products/mega-city scout:extract --root <repo-cobaye>
 *   ezk [--root <repo>] scout extract
 *
 * POC borné : signaux statiques déterministes (outils de lint/test, tsconfig, convention de commits).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  type RepoSignals,
  extractCandidates,
  renderCandidates,
} from '../src/core/scout-extract.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const base = process.env.INIT_CWD ?? process.cwd();
const { root, rest } = projectRootOrExit(base);
// `ezk scout extract` : le verbe `extract` est consommé ici ; on ignore les positionnels restants.
void rest;

function readDeps(repo: string): string[] {
  const file = join(repo, 'package.json');
  if (!existsSync(file)) return [];
  try {
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  } catch {
    return [];
  }
}

function readConfigFiles(repo: string): string[] {
  const known = [
    'biome.json',
    'tsconfig.json',
    '.eslintrc',
    '.eslintrc.json',
    '.eslintrc.js',
    '.eslintrc.cjs',
  ];
  let entries: string[] = [];
  try {
    entries = readdirSync(repo);
  } catch {
    entries = [];
  }
  return known.filter((f) => entries.includes(f));
}

function readCommitSubjects(repo: string): string[] {
  try {
    return execFileSync('git', ['-C', repo, 'log', '-30', '--format=%s'], { encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const signals: RepoSignals = {
  deps: readDeps(root),
  configFiles: readConfigFiles(root),
  commitSubjects: readCommitSubjects(root),
};

console.log(`ezk scout extract — repo : ${root}`);
console.log('');
console.log(renderCandidates(extractCandidates(signals)));
console.log('');
console.log('Rien n’a été écrit. Valide les règles utiles, puis ajoute-les par les voies normales');
console.log('(`rules/<cat>/<id>.md` + `bundles/<cat>.yml`).');
