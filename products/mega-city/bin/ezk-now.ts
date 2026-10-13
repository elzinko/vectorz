#!/usr/bin/env tsx
/**
 * ezk now — la BOUSSOLE de session (fiche 20261010091118580) : « que faire maintenant ? ».
 *
 * Pendant TIRÉ du bloc « Et maintenant ? » que les skills poussent. Lit toujours les traces du
 * dépôt (SPRINT.md, tête du plan, dernier commit) comme socle déterministe — répond même en
 * session neuve. Rend 1 à 3 suites motivées (règle `next-step-affordance`). Le cœur pur
 * (`src/core/now.ts`) décide ; ce bord lit l'état. L'ordre vient des tables des skills, pas du
 * graphe (ADR-0072).
 *
 *   pnpm --dir products/mega-city now        # ou : ezk [--root <projet>] now
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type PlanCard, crossBacklogHead } from '../src/backlog/plan-head.js';
import { parsePlanOrder } from '../src/backlog/plan-order.js';
import { applyVersionScope, versionScope } from '../src/backlog/version-scope.js';
import { buildVersions } from '../src/backlog/versions.js';
import { suggestNow } from '../src/core/now.js';
import { localTags } from '../src/io/git-tags.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { type Fiche, loadFiches } from '../src/loaders/fiches.js';

const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root } = projectRootOrExit(ownRoot);

/** Stories encore ouvertes dans SPRINT.md : les lignes `- [ ] <id> — …`. SPRINT.md est gitignoré. */
function openSprintIds(repo: string): string[] {
  const file = join(repo, 'SPRINT.md');
  if (!existsSync(file)) return [];
  const ids: string[] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*-\s*\[\s\]\s*`?([0-9]{4,17})`?\b/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/** La tête du plan, via les mêmes briques pures que `plan:head` (périmètre de version ADR-0070). */
function planHead(repo: string): { headReady: string | null; blockedAhead: string[] } {
  const planPath = join(repo, 'features/PLAN.md');
  if (!existsSync(planPath)) return { headReady: null, blockedAhead: [] };
  const planIds = parsePlanOrder(readFileSync(planPath, 'utf8'));
  const allFiches = loadFiches(repo);
  const scope = versionScope(buildVersions(allFiches, localTags(repo)), { allVersions: false });
  const { kept, deferred } = applyVersionScope(allFiches, scope);
  const deferredIds = new Set(deferred.map((f: Fiche) => f.id));
  const index = new Map<string, PlanCard>();
  // `crossBacklogHead` applique désormais l'éligibilité `blocked:` lui-même (fiche 20261013131632277,
  // même règle que `plan-lot`). La boussole lui passe TOUTES les fiches avec leur drapeau et ne
  // filtre plus elle-même : une fiche prête mais bloquée n'est jamais proposée comme tête.
  for (const f of kept)
    index.set(f.id, { id: f.id, product: f.product, type: f.type, status: f.status, blocked: f.blocked ?? '' });
  const { head, blockedAhead } = crossBacklogHead(
    planIds.filter((id) => !deferredIds.has(id)),
    index,
  );
  return { headReady: head?.id ?? null, blockedAhead: blockedAhead.map((c) => c.id) };
}

function lastCommitSubject(repo: string): string | null {
  try {
    return execFileSync('git', ['-C', repo, 'log', '-1', '--format=%s'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

const sprintOpenIds = openSprintIds(root);
const { headReady, blockedAhead } = planHead(root);
const last = lastCommitSubject(root);

console.log('En clair : où tu en es');
if (last) console.log(`  dernier commit : ${last}`);
console.log(
  `  sprint ouvert  : ${sprintOpenIds.length > 0 ? `oui (${sprintOpenIds.join(', ')})` : 'non'}`,
);
console.log(
  `  tête du plan   : ${headReady ? `${headReady} (tirable)` : blockedAhead.length > 0 ? `${blockedAhead[0]} (à groomer)` : 'rien de tirable'}`,
);
console.log('');
console.log('Et maintenant ?');
for (const s of suggestNow({ sprintOpenIds, headReady, blockedAhead })) {
  const tag = s.kind === 'suite' ? 'Suite ' : 'Piste ';
  console.log(`  [${tag}] ${s.command} — ${s.reason}`);
}
