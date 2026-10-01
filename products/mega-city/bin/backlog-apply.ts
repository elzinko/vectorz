#!/usr/bin/env tsx
/**
 * backlog-apply — applique pour de vrai une fusion ou un découpage de fiches (fiche 20260910231201744,
 * ADR-0051 : `aggregate` PROPOSE, le PO tranche, ce geste SÉPARÉ applique).
 *
 *   pnpm --dir products/mega-city backlog:apply merge --into <id> <source> [<source>…] [--dry-run]
 *   pnpm --dir products/mega-city backlog:apply split <source> --into <idA>,<idB>[,…] [--dry-run]
 *
 * Fusion : chaque source passe `merged` (+ `merged_into`) et part dans `features/done/` ; la résultante
 * reste active et cite ses sources (`merged_from`). Découpage : la source passe `split` (+ `split_into`)
 * et part dans `done/` ; chaque enfant cite la source (`split_from`). La résultante ou les enfants
 * doivent EXISTER : créer une fiche, c'est `ezk-backlog add`.
 *
 * C'est la transaction de `ship:fiche` (liens recalés, PLAN.md barré, un seul `git mv`, BACKLOG.md
 * régénéré, retour arrière au moindre échec) : rien d'autre à comprendre. Elle ne committe ni ne pousse.
 *
 * Codes de sortie : 0 fait · 1 refusé ou usage (rien écrit) · 2 échec pendant l'application (retour arrière).
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ApplyGesture, planAggregateApply } from '../src/backlog/aggregate-apply.js';
import { ShipFailure, ShipRefusal, applyShip } from '../src/backlog/ship-fiche.js';
import { nodeRepoFs, nodeShipIo } from '../src/io/ship-fiche-io.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    'usage : backlog:apply merge --into <id> <source>… [--dry-run] [--no-bar-plan]\n' +
      '        backlog:apply split <source> --into <idA>,<idB>… [--dry-run] [--no-bar-plan]\n' +
      '        (--root <dossier> pour un autre dépôt)',
  );
  process.exit(1);
}

interface Args {
  gesture: ApplyGesture;
  root: string;
  dryRun: boolean;
  barPlan: boolean;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let into: string[] | undefined;
  let root = resolve(megaCity, '..', '..');
  let dryRun = false;
  let barPlan = true;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--no-bar-plan') barPlan = false;
    else if (arg === '--into') {
      const value = argv[++i];
      if (value === undefined) usage('--into attend un ou plusieurs ids (séparés par des virgules)');
      into = value.split(',').filter((id) => id !== '');
    } else if (arg === '--root') root = resolve(argv[++i] ?? usage('--root attend un dossier'));
    else if (arg.startsWith('--')) usage(`option inconnue : ${arg}`);
    else positional.push(arg);
  }
  const verb = positional.shift();
  if (verb === 'merge') {
    if (into === undefined || into.length !== 1) usage('merge attend exactement une résultante : --into <id>');
    return { gesture: { kind: 'merge', into: into[0], sources: positional }, root, dryRun, barPlan };
  }
  if (verb === 'split') {
    if (positional.length !== 1) usage('split attend exactement une source : split <source> --into <a>,<b>');
    if (into === undefined) usage('split attend les enfants : --into <idA>,<idB>');
    return { gesture: { kind: 'split', source: positional[0], into }, root, dryRun, barPlan };
  }
  return usage(verb === undefined ? 'sous-commande manquante (merge ou split)' : `sous-commande inconnue : ${verb}`);
}

function describe(gesture: ApplyGesture, n: number): string {
  return gesture.kind === 'merge'
    ? `En clair : fusion de ${n} fiche(s) dans ${gesture.into}. Elles passent « merged » et partent dans features/done/.`
    : `En clair : découpage de ${gesture.source} en ${gesture.into.length} fiches. Elle passe « split » et part dans features/done/.`;
}

function main(): void {
  const { gesture, root, dryRun, barPlan } = parseArgs(process.argv.slice(2).filter((a) => a !== '--'));
  const fs = nodeRepoFs(root);
  try {
    const plan = planAggregateApply(fs, gesture, { barPlan });
    console.log(describe(gesture, plan.moves.length) + (dryRun ? " À blanc : rien n'est écrit." : ''));
    console.log(
      `  liens recalés : ${plan.linksRewritten} · cassés avant : ${plan.brokenBefore}, après : ${plan.brokenAfter}`,
    );
    console.log(`  PLAN.md : ${plan.planBarred.length} entrée(s) barrée(s)`);
    console.log(
      gesture.kind === 'merge'
        ? `  provenance : merged_into sur chaque source, merged_from sur ${gesture.into}`
        : `  provenance : split_into sur ${gesture.source}, split_from sur chaque enfant`,
    );
    if (dryRun) return;

    const regen = (): void => {
      execFileSync('bash', [join(megaCity, 'bin', 'regen-backlog.sh'), root], { stdio: 'inherit' });
    };
    applyShip(plan, nodeShipIo(root, regen));
    console.log('  BACKLOG.md : régénéré. Reste à committer (`git add features` puis ezk-commits).');
  } catch (error) {
    if (error instanceof ShipRefusal) {
      console.error(`✗ apply refusé — rien n'a été écrit :\n  ${error.reasons.join('\n  ')}`);
      process.exit(1);
    }
    if (error instanceof ShipFailure) {
      console.error(
        error.rolledBack
          ? `✗ échec pendant l'application — dépôt remis à l'état initial : ${error.message}`
          : `✗ ${error.message}`,
      );
      process.exit(2);
    }
    throw error;
  }
}

main();
