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
import { applyVersionScope, formatVersionScope, versionScope } from '../src/backlog/version-scope.js';
import { buildVersions } from '../src/backlog/versions.js';
import type { Fiche } from '../src/loaders/fiches.js';
import { localTags } from '../src/io/git-tags.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { loadFiches } from '../src/loaders/fiches.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

/**
 * Index des fiches fournies — le produit vient du front-matter (0064). Les fiches sont lues par le
 * loader testé (règle `development/fiche-read-via-loader`), puis déjà filtrées par le garde-fou de
 * version (ADR-0070) : seule la version en cours (et les sans-version) arrive ici.
 */
function indexOf(fiches: readonly Fiche[]): Map<string, PlanCard> {
  const index = new Map<string, PlanCard>();
  for (const f of fiches) {
    index.set(f.id, { id: f.id, product: f.product, type: f.type, status: f.status });
  }
  return index;
}

// Le projet dont on lit le plan : --root > EZK_ROOT > ce dépôt (fiche 20260826173221323).
const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root, rest } = projectRootOrExit(ownRoot);
// La soupape --all-versions lève le périmètre de version (ADR-0070) ; on la retire des positionnels.
const allVersions = rest.includes('--all-versions');
const positional = rest.filter((a) => a !== '--all-versions');
const arg = positional[0];
if (arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md] [--all-versions] [--root <projet>]');
  console.log('');
  console.log('Imprime la tête réelle du plan sur la liste unique features/ (champ product:).');
  console.log('Défaut : seule la version en cours est tirable (ADR-0070) ; --all-versions lève le périmètre.');
  console.log('Défaut du PLAN.md : <racine>/features/PLAN.md. --root (ou EZK_ROOT) : le plan d’un autre projet.');
  process.exit(0);
}

const invokedFrom = process.env.INIT_CWD ?? process.cwd();
const planArg = arg ?? join(root, 'features/PLAN.md');
const planPath = isAbsolute(planArg) ? planArg : resolve(invokedFrom, planArg);
if (!existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);

const planIds = parsePlanOrder(readFileSync(planPath, 'utf8'));
// Garde-fou de séquence : on écarte les fiches de version supérieure AVANT la sélection (ADR-0070).
const allFiches = loadFiches(root);
const scope = versionScope(buildVersions(allFiches, localTags(root)), { allVersions });
const { kept, deferred } = applyVersionScope(allFiches, scope);
const deferredIds = new Set(deferred.map((f) => f.id));
const scopedPlanIds = planIds.filter((id) => !deferredIds.has(id));
const { head, blockedAhead, unresolved } = crossBacklogHead(scopedPlanIds, indexOf(kept));

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
for (const l of formatVersionScope(scope)) console.log(l);
