#!/usr/bin/env tsx
/**
 * `ezk release <vX.Y>` — la passe qualité d'une VERSION entière avant son tag (fiche
 * 20260922175954296, ADR composable). Elle COMPOSE des passes bloquantes déclarées (GO/NO-GO) ;
 * elle ne réimplémente aucune logique de revue. Le verdict est écrit sous
 * `.vectorz/release/<version>.json` et lu par `backlog version close --tag`, qui refuse le tag
 * sur NO-GO (sauf soupape PO journalisée).
 *
 * Désactivable : `.vectorz/config.yml → release.gate: off` → la gate se saute proprement (GO).
 *
 * Bord I/O mince : la décision (agrégation, rendu) vit dans src/core/release-gate.ts.
 */
import { spawnSync } from 'node:child_process';
import {
  type PassResult,
  type ReleaseVerdict,
  aggregate,
  renderReleaseReport,
  substitute,
} from '../src/core/release-gate.js';
import { loadReleasePasses, releaseConfig, writeReleaseVerdict } from '../src/loaders/release-passes.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const root = target.root;
const version = target.rest.find((a) => !a.startsWith('-'));

if (!version) {
  console.error('usage : ezk release <vX.Y>   (--root <projet> pour un autre dépôt)');
  process.exit(2);
}

// Gate désactivée par config : on se saute proprement (le projet ne tague pas de version).
if (!releaseConfig(root).gate) {
  console.log(`En clair : la gate de release est désactivée (release.gate: off) — ${version} passe sans contrôle.`);
  process.exit(0);
}

/** Joue une passe : la commande shell, GO si code 0 ; sinon la 1re ligne utile de sa sortie. */
function runPass(command: string): { go: boolean; detail?: string } {
  const res = spawnSync('bash', ['-lc', command], { cwd: root, encoding: 'utf8' });
  const go = res.status === 0;
  if (go) return { go };
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return { go, detail: out[0] ?? `code ${res.status ?? '?'}` };
}

const passes = loadReleasePasses(root);
const results: PassResult[] = passes.map((p) => {
  const command = substitute(p.command, { root, version });
  const { go, detail } = runPass(command);
  return { id: p.id, title: substitute(p.title, { root, version }), command, go, ...(detail ? { detail } : {}) };
});

const head = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
const verdict: ReleaseVerdict = {
  version,
  verdict: aggregate(results),
  passes: results,
  at: new Date().toISOString(),
  ...(head.status === 0 ? { head: head.stdout.trim() } : {}),
};

const file = writeReleaseVerdict(root, verdict);
console.log(renderReleaseReport(verdict));
console.log('');
console.log(`Verdict écrit : ${file}`);
process.exit(verdict.verdict === 'GO' ? 0 : 1);
