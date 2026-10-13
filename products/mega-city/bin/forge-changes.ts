#!/usr/bin/env node
/**
 * forge:changes — le guichet unique vers GitHub (ADR-0061, fiche 20261013074251752).
 *
 *   ezk forge changes --open|--merged   (dépôt où tu es, ou --root <projet>)
 *
 * Lit la config `.vectorz/` UNE fois, puis répond par trois états (cœur `src/core/forge.ts`) :
 *   - `off`          la config coupe GitHub (`github: false` / `pr: false`) → aucun appel `gh`.
 *   - `unavailable`  config allumée mais `gh` absent ou non authentifié.
 *   - `ok`           config allumée et `gh` prêt → la liste des PR (ouvertes ou mergées).
 *
 * Codes de sortie : 0 pour `ok` et `off` (réponse rendue, l'état est la 1re ligne), 3 pour
 * `unavailable` (guichet injoignable). Détail et raison : `src/core/forge.ts`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { FORGE_EXIT, type ForgeState, decideForgeState } from '../src/core/forge.js';
import { findGitRoot } from '../src/core/ezk-cli.js';
import { githubCapabilities } from '../src/loaders/project-config.js';
import { projectRootOrExit } from '../src/io/project-root.js';

type PrState = 'open' | 'merged';

function usage(): never {
  console.error(`usage: forge changes --open | --merged   (dépôt où tu es, ou --root <projet>)

  Trois états en sortie, jamais confondus :
    ok           GitHub allumé et joignable → la liste des PR
    off          la config coupe GitHub (.vectorz/config.yml) → aucun appel gh
    unavailable  gh absent ou non authentifié (config allumée)
  Codes : 0 pour ok et off (réponse rendue), 3 pour unavailable.`);
  process.exit(2);
}

/** `gh` présent ET authentifié sur ce dépôt. Toute panne (binaire absent, non connecté) → false. */
function ghReady(cwd: string): boolean {
  try {
    execFileSync('gh', ['auth', 'status'], { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** La liste des PR de l'état demandé, via `gh` (appelée seulement quand l'état est `ok`). */
function listPrs(cwd: string, state: PrState): string {
  const raw = execFileSync('gh', ['pr', 'list', '--state', state, '--limit', '200', '--json', 'number,title,headRefName'], {
    cwd,
    encoding: 'utf8',
  });
  const prs = JSON.parse(raw) as { number: number; title: string; headRefName: string }[];
  if (prs.length === 0) return `  (aucune PR ${state === 'open' ? 'ouverte' : 'mergée'})`;
  return prs.map((p) => `  #${p.number} ${p.title} [${p.headRefName}]`).join('\n');
}

function main(): void {
  // Le dépôt visé : --root > EZK_ROOT > la racine git du dossier courant (fiche 20261013073300242).
  const invokedFrom = process.env.INIT_CWD ?? process.cwd();
  const fallbackRoot = findGitRoot(invokedFrom, existsSync) ?? invokedFrom;
  const { root, rest } = projectRootOrExit(fallbackRoot);

  let prState: PrState | undefined;
  for (const a of rest) {
    if (a === '--open') prState = 'open';
    else if (a === '--merged') prState = 'merged';
    else if (a === '--help' || a === '-h') usage();
    else {
      console.error(`option inconnue : ${a}`);
      usage();
    }
  }
  if (prState === undefined) {
    console.error('précise --open ou --merged.');
    usage();
  }

  const caps = githubCapabilities(root);
  // Un projet coupé ne touche JAMAIS gh : on ne sonde l'outil que si la config l'autorise
  // (critère « aucun appel gh en off »). Sinon decideForgeState rend `off` d'office.
  const ready = caps.pr ? ghReady(root) : false;
  const state: ForgeState = decideForgeState(caps.pr, ready);

  if (state === 'off') {
    console.log('forge: off — GitHub est coupé par la config (.vectorz/config.yml) ; aucun appel gh.');
  } else if (state === 'unavailable') {
    console.log('forge: unavailable — gh est absent ou non authentifié (config allumée). Lance `gh auth login`.');
  } else {
    // gh est authentifié, mais `pr list` peut encore échouer (réseau, remote illisible) : on rend
    // alors `unavailable` proprement, jamais une pile d'exception.
    let listed: string;
    try {
      listed = listPrs(root, prState);
    } catch {
      console.log('forge: unavailable — gh est authentifié mais `gh pr list` a échoué (réseau ou remote illisible).');
      process.exit(FORGE_EXIT.unavailable);
    }
    console.log(`forge: ok — PR ${prState === 'open' ? 'ouvertes' : 'mergées'} :`);
    console.log(listed);
  }
  process.exit(FORGE_EXIT[state]);
}

main();
