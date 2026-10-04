#!/usr/bin/env tsx
/**
 * ship-fiche — livre 1..n fiches en UNE transaction (fiche 20260830194601233, ADR-0049).
 *
 *   pnpm --dir products/mega-city ship:fiche -- --pr '#270' features/<id>_slug.md [...]
 *   pnpm --dir products/mega-city ship:fiche -- --status superseded --pr 'superseded — raison' features/<id>_slug.md
 *   pnpm --dir products/mega-city ship:fiche -- --dry-run --pr '#999' features/<id>_slug.md
 *   pnpm --dir products/mega-city ship:fiche -- --root ../muti --pr '#273' features/<id>_slug.md
 *
 * `--root <dossier>` : le dépôt dont on livre les fiches, s'il n'est pas vectorz (muti… : même layout
 * `features/` + `done/` + `BACKLOG.md`). Un chemin relatif se lit depuis le dossier où la commande est
 * tapée. Les fiches se donnent relatives à CE dépôt. Seule l'option compte, pas la variable `EZK_ROOT` :
 * une commande qui écrit ne suit pas une variable restée dans le shell (comme `backlog:apply`).
 *
 * Ce que fait la commande, dans l'ordre :
 *   1. vérifie AVANT d'écrire (fiche sous features/, destination libre, statut admis) ;
 *   2. calcule en mémoire `status` + `pr`, le recalage de TOUS les liens relatifs du markdown
 *      (sortants, entrants, entre fiches du lot) et le barrage de l'entrée de PLAN.md ;
 *   3. REFUSE sans rien écrire si les liens cassés augmentent ou si PLAN.md garde la fiche à faire ;
 *   4. applique : écritures, un seul `git mv` groupé, puis `regen-backlog.sh`. Un échec en route
 *      remet le dépôt dans son état initial.
 * Elle ne committe ni ne pousse : le commit reste celui du `ship` (ezk-commits).
 *
 * Codes de sortie : 0 fait · 1 refusé (rien écrit) · 2 échec pendant l'application (retour arrière).
 */
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShipFailure, ShipRefusal, applyShip, planShip } from '../src/backlog/ship-fiche.js';
import { ANNOUNCED_ENV, extractRootFlag, resolveProjectRoot, rootBanner } from '../src/core/project-root.js';
import { ProjectRootError, checkProjectRoot } from '../src/io/project-root.js';
import { nodeRepoFs, nodeShipIo } from '../src/io/ship-fiche-io.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    "usage : ship:fiche [--root <dépôt>] [--status shipped|superseded|merged|split] --pr '<ref>' [--no-bar-plan] [--dry-run] features/<id>_slug.md [...]",
  );
  process.exit(1);
}

const { flag, rest: args, error } = extractRootFlag(process.argv.slice(2).filter((a) => a !== '--'));
if (error) usage(error);
const target = resolveProjectRoot({
  flag,
  fallback: resolve(megaCity, '..', '..'), // racine vectorz
  initCwd: process.env.INIT_CWD,
  cwd: process.cwd(),
});
const repoRoot = target.root;
if (target.source === 'flag') {
  try {
    checkProjectRoot(repoRoot);
  } catch (e) {
    if (!(e instanceof ProjectRootError)) throw e;
    usage(e.message);
  }
}

const files: string[] = [];
let status = 'shipped';
let pr = '';
let barPlan = true;
let dryRun = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--status') status = args[++i] ?? usage();
  else if (arg === '--pr') pr = args[++i] ?? usage();
  else if (arg === '--no-bar-plan') barPlan = false;
  else if (arg === '--dry-run') dryRun = true;
  else if (arg.startsWith('--')) usage();
  else files.push(isAbsolute(arg) ? relative(repoRoot, arg) : arg); // sinon : relatif à la racine du dépôt
}

const fs = nodeRepoFs(repoRoot);
try {
  const plan = planShip(fs, { files, status, pr, barPlan });
  const banner = rootBanner(target);
  // Lancé par `ezk`, le routeur a déjà dit « dépôt visé » : pas de second bandeau.
  if (banner && process.env[ANNOUNCED_ENV] !== repoRoot) console.log(banner);
  console.log(
    `ship:fiche — ${plan.moves.length} fiche(s) → features/done/ (${status} ${pr}${dryRun ? ', à blanc : rien écrit' : ''})`,
  );
  console.log(
    `  liens recalés : ${plan.linksRewritten} · cassés avant : ${plan.brokenBefore}, après : ${plan.brokenAfter}`,
  );
  console.log(`  PLAN.md : ${plan.planBarred.length} entrée(s) barrée(s)`);
  if (dryRun) process.exit(0);

  const regen = (): void => {
    execFileSync('bash', [join(megaCity, 'bin', 'regen-backlog.sh'), repoRoot], { stdio: 'inherit' });
  };
  applyShip(plan, nodeShipIo(repoRoot, regen));
  console.log('  BACKLOG.md : régénéré. Reste à committer (`git add features` puis ezk-commits).');
} catch (error) {
  if (error instanceof ShipRefusal) {
    console.error(`✗ ship refusé — rien n'a été écrit :\n  ${error.reasons.join('\n  ')}`);
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
