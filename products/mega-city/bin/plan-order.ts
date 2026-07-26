/**
 * plan-order — imprime la séquence d'ids ordonnée d'un `features/PLAN.md`
 * (fiche mc-0089), un id par ligne sur stdout.
 *
 *   pnpm --dir products/mega-city plan:order <chemin-du-PLAN.md>
 */
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { parsePlanOrder } from '../src/backlog/plan-order.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

const arg = process.argv[2];
if (!arg || arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city plan:order <chemin-du-PLAN.md>');
  console.log('');
  console.log("Imprime la séquence d'ids ordonnée d'un PLAN.md (NOW puis NEXT puis LATER),");
  console.log('un id par ligne sur stdout.');
  process.exit(arg ? 0 : 2);
}

// Résolution contre INIT_CWD (dossier d'invocation) : sous `pnpm --dir`, le cwd
// du script est le package, pas là où l'utilisateur a tapé la commande. Un chemin
// relatif comme `features/PLAN.md` vise ainsi le bon fichier (même piège et même
// parade que bin/supervision-link.ts, revue Codex PR #51).
const planPath = isAbsolute(arg) ? arg : resolve(process.env.INIT_CWD ?? process.cwd(), arg);
if (!existsSync(planPath)) fail(`PLAN.md introuvable : ${planPath}`);

const planMd = readFileSync(planPath, 'utf8');
for (const id of parsePlanOrder(planMd)) {
  console.log(id);
}
