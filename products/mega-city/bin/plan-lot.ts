/**
 * plan-lot — sélectionne le **lot** d'un sprint : N fiches prêtes (`status: ready`, non-épic),
 * dans l'ordre du PLAN (fiche 20260930194219046, ADR-0054). Signale la tête bloquée, les fiches
 * écartées, les prêtes hors plan et les ids introuvables. Imprime la ligne `sprint.sh start --lot`
 * prête à copier : c'est `start` qui fige le lot dans `SPRINT.md`. Ce script n'écrit rien.
 *
 *   pnpm --dir products/mega-city plan:lot <N> [chemin/vers/PLAN.md] [--root <projet>]
 *
 * Sans PLAN.md : ordre P0→P3 puis id (repli de `next --ready-only`). Même lecture que `plan:head` :
 * `plan:order` pour l'ordre, le loader des fiches pour le reste (règle `development/fiche-read-via-loader`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatLot, selectLot } from '../src/backlog/plan-lot.js';
import { parsePlanOrder } from '../src/backlog/plan-order.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { loadFiches } from '../src/loaders/fiches.js';

const USAGE = 'usage : pnpm --dir products/mega-city plan:lot <N> [chemin/vers/PLAN.md] [--root <projet>]';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  console.error(USAGE);
  process.exit(2);
}

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Le projet dont on tire le lot : --root > EZK_ROOT > ce dépôt (fiche 20260826173221323).
const { root, rest } = projectRootOrExit(resolve(megaCity, '..', '..'));
if (rest.includes('-h') || rest.includes('--help')) {
  console.log(USAGE);
  console.log('');
  console.log('Sélectionne N fiches prêtes dans l’ordre du plan, et imprime la ligne `start --lot` du sprint.');
  console.log('Défaut du PLAN.md : <racine>/features/PLAN.md ; absent, ordre P0→P3 puis id.');
  process.exit(0);
}

const [sizeArg, planArg] = rest;
if (!sizeArg || !/^[1-9]\d*$/.test(sizeArg)) fail(`taille du lot attendue (un entier ≥ 1), reçu : ${sizeArg ?? 'rien'}`);

const invokedFrom = process.env.INIT_CWD || process.cwd();
const planPath = planArg
  ? isAbsolute(planArg)
    ? planArg
    : resolve(invokedFrom, planArg)
  : join(root, 'features/PLAN.md');
if (planArg && !existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);
const planIds = existsSync(planPath) ? parsePlanOrder(readFileSync(planPath, 'utf8')) : null;

const cards = loadFiches(root).map((f) => ({
  id: f.id,
  product: f.product,
  type: f.type,
  status: f.status,
  priority: f.priority,
  title: f.title,
  blocked: f.blocked,
  done: f.done,
}));
const lot = selectLot(planIds, cards, Number(sizeArg));
// sprint.sh se lance depuis la racine du projet (c'est là qu'il écrit SPRINT.md).
const sprintScript = relative(root, join(megaCity, 'skills', 'ezk-sprint', 'scripts', 'sprint.sh'));
for (const l of formatLot(lot, { planned: planIds !== null, sprintScript })) console.log(l);
