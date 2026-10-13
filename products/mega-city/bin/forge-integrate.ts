#!/usr/bin/env node
/**
 * forge:integrate — intègre une story sur `<base>` par le guichet unique (ADR-0061 D3, ADR-0052,
 * fiche 20261004083838687).
 *
 *   ezk forge integrate --branch <b> [--base main] [--pr <n>] [--subject <s>] [--body <b>]
 *     (dépôt où tu es, ou --root <projet>)
 *
 * Le guichet choisit l'intégration d'après la config `.vectorz/` — l'appelant (ezk-sprint étape 10,
 * ezk-pr `ship`) ne décide plus entre `--local` et `--remote` :
 *   - `pr` allumé        → `gh pr merge --squash` (via ship-merge.sh --remote ; exige --pr).
 *   - `pr` coupé + `local-squash` (défaut) → squash sur le `main` local (ship-merge.sh --local).
 *   - `pr` coupé + `push-ff`               → push en avance rapide sur origin/<base> (muti),
 *                                            marche depuis un worktree (integrate-push-ff.sh).
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { githubCapabilities, integrationStrategy } from '../src/loaders/project-config.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const scriptsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'ezk-pr', 'scripts');

function usage(): never {
  console.error(`usage: forge integrate --branch <b> [--base main] [--pr <n>] [--subject <s>] [--body <b>] [--dry-run]
                       (dépôt où tu es, ou --root <projet>)

  Choisit l'intégration d'après .vectorz/ : pr allumé → gh pr merge --squash (--pr requis) ;
  pr coupé → local-squash (défaut) ou push-ff (clé « integration: push-ff »).`);
  process.exit(2);
}

function run(script: string, args: string[]): never {
  const r = spawnSync('bash', [resolve(scriptsDir, script), ...args], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

function main(): void {
  const { root, rest } = projectRootOrExit(process.env.INIT_CWD ?? process.cwd());
  const opt: Record<string, string> = {};
  let dryRun = false;
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--help' || a === '-h') usage();
    else if (a?.startsWith('--') && rest[i + 1] !== undefined) {
      opt[a.slice(2)] = rest[++i] as string;
    } else {
      console.error(`option inconnue ou valeur manquante : ${a}`);
      usage();
    }
  }
  const branch = opt.branch;
  if (!branch) {
    console.error('--branch est requis.');
    usage();
  }
  const base = opt.base ?? 'main';

  const caps = githubCapabilities(root);
  if (caps.pr) {
    // GitHub allumé : la PR est l'unité d'intégration (gh pr merge --squash via ship-merge --remote).
    if (!opt.pr) {
      console.error('pr allumé : --pr <n> est requis (le guichet merge la PR, comme ship-merge --remote).');
      usage();
    }
    const args = ['--repo', root, '--remote', '--pr', opt.pr, '--branch', branch, '--base', base];
    if (opt.subject) args.push('--subject', opt.subject);
    if (opt.body) args.push('--body', opt.body);
    if (dryRun) args.push('--dry-run');
    run('ship-merge.sh', args);
  }

  const strategy = integrationStrategy(root);
  if (strategy === 'push-ff') {
    const args = ['--repo', root, '--branch', branch, '--base', base];
    if (dryRun) args.push('--dry-run');
    run('integrate-push-ff.sh', args);
  }

  // Défaut sans PR : squash sur le main local (comportement d'avant, ADR-0052 D5).
  const args = ['--repo', root, '--local', '--branch', branch, '--base', base];
  if (opt.subject) args.push('--subject', opt.subject);
  if (opt.body) args.push('--body', opt.body);
  if (dryRun) args.push('--dry-run');
  run('ship-merge.sh', args);
}

main();
