/**
 * plan-head — imprime la « tête réelle » du plan sur la **liste unique**
 * `features/` (fiche 0064 ; ex-0097 cross-liste). 1re carte non-livrée du
 * PLAN.md avec son `product:` et son statut (`status: ready` = tirable), plus les têtes
 * bloquées (fiches `idea` à groomer qui précèdent) et les ids introuvables.
 *
 *   pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]
 *
 * Réutilise `plan:order` (0089) pour l'ordre. Le préfixe `mc-` n'est plus
 * requis (toléré en legacy, normalisé vers l'id nu).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type PlanCard, crossBacklogHead } from '../src/backlog/plan-head.js';
import { parsePlanOrder } from '../src/backlog/plan-order.js';
import { loadFiches } from '../src/loaders/fiches.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

/**
 * Liste unique à la racine (actifs + `done/`) — le produit vient du front-matter (0064). La lecture
 * passe par le loader testé (règle `development/fiche-read-via-loader`) : défauts `—` / `feature` /
 * `idea`, valeurs quotées et commentaires gérés, deux formats d'id (fiche 0180) reconnus.
 */
function collect(root: string): Map<string, PlanCard> {
  const index = new Map<string, PlanCard>();
  for (const f of loadFiches(root)) {
    index.set(f.id, { id: f.id, product: f.product, type: f.type, status: f.status });
  }
  return index;
}

const arg = process.argv[2];
if (arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]');
  console.log('');
  console.log('Imprime la tête réelle du plan sur la liste unique features/ (champ product:).');
  console.log('Défaut du PLAN.md : <racine>/features/PLAN.md.');
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const invokedFrom = process.env.INIT_CWD ?? process.cwd();
const planArg = arg ?? join(root, 'features/PLAN.md');
const planPath = isAbsolute(planArg) ? planArg : resolve(invokedFrom, planArg);
if (!existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);

const planIds = parsePlanOrder(readFileSync(planPath, 'utf8'));
const { head, blockedAhead, unresolved } = crossBacklogHead(planIds, collect(root));

if (head) {
  console.log(`tête : ${head.id} (${head.product}) — ready ✓ TIRABLE`);
} else {
  console.log('tête : aucune fiche tirable (status: ready) dans le plan');
}
if (blockedAhead.length > 0) {
  console.log('bloquées avant (idea — à groomer) :');
  for (const c of blockedAhead) console.log(`  · ${c.id} (${c.product})`);
}
if (unresolved.length > 0) {
  console.log(`introuvables (dans le plan, absentes de features/) : ${unresolved.join(', ')}`);
}
