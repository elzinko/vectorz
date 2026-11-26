/**
 * now-state — le bord qui lit l'état du dépôt pour la boussole (`ezk now`, fiche 20261010091118580)
 * et pour son contrat JSON (`ezk now --json`, fiche 20261114131612944). Lecture seule.
 *
 * Les traces lues : `SPRINT.md` (stories ouvertes) et la tête du plan. Le cœur pur
 * (`core/now.ts`) décide des suites ; ce bord ne fait que lire.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type PlanCard, crossBacklogHead } from '../backlog/plan-head.js';
import { parsePlanOrder } from '../backlog/plan-order.js';
import { applyVersionScope, versionScope } from '../backlog/version-scope.js';
import { buildVersions } from '../backlog/versions.js';
import type { NowState } from '../core/now.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';
import { localTags } from './git-tags.js';

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

/** L'état du dépôt que lit la boussole. */
export function nowState(repo: string): NowState {
  const { headReady, blockedAhead } = planHead(repo);
  return { sprintOpenIds: openSprintIds(repo), headReady, blockedAhead };
}
