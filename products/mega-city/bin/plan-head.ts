/**
 * plan-head — imprime la « tête réelle » du plan À TRAVERS LES DEUX LISTES
 * (fiche mc-0097) : 1re carte non-livrée du PLAN.md, avec sa liste et son état
 * `ready`, plus les têtes bloquées (todo sans ready qui précèdent) et les ids
 * du plan introuvables.
 *
 *   pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]
 *
 * Réutilise `plan:order` (mc-0089) pour l'ordre et la résolution mc-/racine.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { type PlanCard, crossBacklogHead } from '../src/backlog/plan-head.js';
import { parsePlanOrder } from '../src/backlog/plan-order.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

// Les deux listes : produit (racine) et méthode (mega-city). L'emplacement fait
// le produit (ADR-0017 A13) ; le préfixe `mc-` distingue l'id côté PLAN.md.
const BACKLOGS = [
  { product: 'vectorz', dir: 'features', prefix: '' },
  { product: 'mega-city', dir: 'products/mega-city/features', prefix: 'mc-' },
];

function readField(text: string, field: string): string {
  const m = text.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'));
  return m ? m[1].replace(/[ \t]*#.*$/, '').trim() : '';
}

function collect(root: string): Map<string, PlanCard> {
  const index = new Map<string, PlanCard>();
  for (const { product, dir, prefix } of BACKLOGS) {
    const base = join(root, dir);
    // Actifs + livrés (`done/`) : une carte shipped doit être reconnue shipped,
    // pas « introuvable ».
    for (const sub of [base, join(base, 'done')]) {
      if (!existsSync(sub)) continue;
      for (const file of readdirSync(sub)) {
        const idMatch = file.match(/^(\d{4})-.*\.md$/);
        if (!idMatch) continue;
        const text = readFileSync(join(sub, file), 'utf8');
        const id = `${prefix}${idMatch[1]}`;
        index.set(id, {
          id,
          product,
          status: readField(text, 'status') || 'idea',
          ready: readField(text, 'ready') !== '',
        });
      }
    }
  }
  return index;
}

const arg = process.argv[2];
if (arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city plan:head [chemin/vers/PLAN.md]');
  console.log('');
  console.log('Imprime la tête réelle du plan à travers les deux listes (produit + méthode).');
  console.log('Défaut du PLAN.md : <racine>/features/PLAN.md.');
  process.exit(0);
}

// Racine du dépôt = dossier d'invocation (sous `pnpm --dir`, le cwd du script
// est le package ; INIT_CWD garde l'endroit où la commande a été tapée).
const root = process.env.INIT_CWD ?? process.cwd();
const planArg = arg ?? 'features/PLAN.md';
const planPath = isAbsolute(planArg) ? planArg : resolve(root, planArg);
if (!existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);

const planIds = parsePlanOrder(readFileSync(planPath, 'utf8'));
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
  console.log(`introuvables (dans le plan, absentes des deux listes) : ${unresolved.join(', ')}`);
}
