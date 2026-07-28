/**
 * plan-head — imprime la « tête réelle » du plan sur la **liste unique**
 * `features/` (fiche 0064 / ex-mc-0097) : 1re carte non-livrée du PLAN.md, avec
 * son `product:` et son état `ready`, plus les têtes bloquées et les ids
 * introuvables.
 *
 *   pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]
 *
 * Compat : un id legacy `mc-XXXX` est résolu comme `XXXX+2000` (migration 0064).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type PlanCard, crossBacklogHead } from '../src/backlog/plan-head.js';
import { parsePlanOrder } from '../src/backlog/plan-order.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

/** Legacy `mc-XXXX` → `XXXX+2000` (offset migration 0064). */
function canonicalId(raw: string): string {
  const m = raw.match(/^mc-(\d{4})$/);
  if (m) return String(Number(m[1]) + 2000).padStart(4, '0');
  return raw;
}

function readField(text: string, field: string): string {
  const m = text.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'));
  return m ? m[1].replace(/[ \t]*#.*$/, '').trim() : '';
}

function collect(root: string): Map<string, PlanCard> {
  const index = new Map<string, PlanCard>();
  const base = join(root, 'features');
  for (const sub of [base, join(base, 'done')]) {
    if (!existsSync(sub)) continue;
    for (const file of readdirSync(sub)) {
      const idMatch = file.match(/^(\d{4})-.*\.md$/);
      if (!idMatch) continue;
      const text = readFileSync(join(sub, file), 'utf8');
      const id = idMatch[1];
      const product = readField(text, 'product') || 'vectorz';
      const card: PlanCard = {
        id,
        product,
        type: readField(text, 'type') || 'feature',
        status: readField(text, 'status') || 'idea',
        ready: readField(text, 'ready') !== '',
      };
      index.set(id, card);
      // Alias legacy pour les ids méthode déplacés (2xxx) : mc-(id-2000)
      const n = Number(id);
      if (n >= 2000 && n < 3000) {
        index.set(`mc-${String(n - 2000).padStart(4, '0')}`, { ...card, id: `mc-${String(n - 2000).padStart(4, '0')}` });
      }
    }
  }
  return index;
}

const arg = process.argv[2];
if (arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]');
  console.log('');
  console.log('Imprime la tête réelle du plan (liste unique features/).');
  console.log('Défaut du PLAN.md : <racine>/features/PLAN.md.');
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const invokedFrom = process.env.INIT_CWD ?? process.cwd();
const planArg = arg ?? join(root, 'features/PLAN.md');
const planPath = isAbsolute(planArg) ? planArg : resolve(invokedFrom, planArg);
if (!existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);

const planIds = parsePlanOrder(readFileSync(planPath, 'utf8')).map(canonicalId);
const { head, blockedAhead, unresolved } = crossBacklogHead(planIds, collect(root));

if (head) {
  console.log(`tête : ${head.id} (${head.product}) — ready ✓ TIRABLE`);
} else {
  console.log('tête : aucune fiche tirable (todo + ready) dans le plan');
}
if (blockedAhead.length > 0) {
  console.log('bloquées avant (todo sans ready — à groomer) :');
  for (const c of blockedAhead) console.log(`  · ${c.id} (${c.product})`);
}
if (unresolved.length > 0) {
  console.log(`introuvables (dans le plan, absentes de features/) : ${unresolved.join(', ')}`);
}
