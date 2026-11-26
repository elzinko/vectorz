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
 *   pnpm --dir products/mega-city now        # ou : ezk [--root <projet>] now [--json]
 *
 * `--json` publie le contrat `contracts/now-show/v1/` : les alertes de la cloche de mission control,
 * une par élément (fiche 20261114131612944).
 */
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { suggestNow } from '../src/core/now.js';
import { nowShowData } from '../src/io/now-show.js';
import { nowState } from '../src/io/now-state.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root } = projectRootOrExit(ownRoot);

function lastCommitSubject(repo: string): string | null {
  try {
    return execFileSync('git', ['-C', repo, 'log', '-1', '--format=%s'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

/** La sortie texte de la boussole, inchangée. */
function printCompass(): void {
  const state = nowState(root);
  const { sprintOpenIds, headReady, blockedAhead } = state;
  const last = lastCommitSubject(root);

  console.log('En clair : où tu en es');
  if (last) console.log(`  dernier commit : ${last}`);
  console.log(`  sprint ouvert  : ${sprintOpenIds.length > 0 ? `oui (${sprintOpenIds.join(', ')})` : 'non'}`);
  console.log(
    `  tête du plan   : ${headReady ? `${headReady} (tirable)` : blockedAhead.length > 0 ? `${blockedAhead[0]} (à groomer)` : 'rien de tirable'}`,
  );
  console.log('');
  console.log('Et maintenant ?');
  for (const s of suggestNow(state)) {
    const tag = s.kind === 'suite' ? 'Suite ' : 'Piste ';
    console.log(`  [${tag}] ${s.command} — ${s.reason}`);
  }
}

// `--json` : le contrat versionné `now-show/v1` (alertes, non mesuré, suites). La sortie texte ne change pas.
// Pas de `process.exit` : il couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01).
if (process.argv.includes('--json')) console.log(JSON.stringify(nowShowData(root), null, 1));
else printCompass();
