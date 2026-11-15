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
  type EffectivePass,
  type PassResult,
  type PassVerdict,
  type ReleaseConfig,
  type ReleaseVerdict,
  aggregate,
  decidePassVerdict,
  effectivePasses,
  renderReleaseReport,
  skippedTestsResult,
  substitute,
} from '../src/core/release-gate.js';
import {
  readPassVerdict,
  readProjectPasses,
  releaseConfig,
  writePassVerdict,
  writeReleaseVerdict,
} from '../src/loaders/release-passes.js';
import { projectRootOrExit } from '../src/io/project-root.js';

/** Résout les réglages release (gate + tests) proprement : un réglage invalide sort en code 2, jamais en crash. */
function releaseConfigOrExit(root: string): ReleaseConfig {
  try {
    return releaseConfig(root);
  } catch (err) {
    console.error(`En clair : réglage release invalide — ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}

/** Les passes effectives (socle composé/remplacé + tests) proprement : un fichier de passes invalide sort en code 2. */
function effectivePassesOrExit(root: string, testsCommand: string | null): readonly EffectivePass[] {
  try {
    const { passes, replace } = readProjectPasses(root);
    return effectivePasses(passes, replace, testsCommand);
  } catch (err) {
    console.error(`En clair : passes de release invalides — ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}

/** Le commit HEAD du projet, ou '' s'il est indéterminé (pas de dépôt, etc.). */
function headOf(root: string): string {
  const r = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

/** Le nom d'auteur git du projet, ou `undefined` s'il n'est pas lisible. */
function gitUserName(root: string): string | undefined {
  const r = spawnSync('git', ['-C', root, 'config', 'user.name'], { encoding: 'utf8' });
  const name = r.status === 0 ? r.stdout.trim() : '';
  return name === '' ? undefined : name;
}

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const root = target.root;

// Sous-commande « passes » : voir les contrôles de la gate. `list` les affiche avec leur source ;
// `add`/`remove` (réglage par commande) arrivent dans une story suivante (fiche 20261114131616085).
if (target.rest[0] === 'passes') {
  const sub = target.rest[1];
  if (sub === 'list') {
    const entries = effectivePassesOrExit(root, releaseConfigOrExit(root).tests);
    console.log(`Passes de la gate de release — ${entries.length} contrôle(s), dans l'ordre où elles sont jouées :`);
    for (const e of entries) {
      const src = e.source === 'defaut' ? 'socle ' : 'projet';
      const note = e.run ? '' : '  (sautée : release.tests absent)';
      console.log(`  [${src}] ${e.id} — ${e.title}${note}`);
    }
    process.exit(0);
  }
  if (sub === 'add' || sub === 'remove') {
    console.error(
      `ezk release passes ${sub} : pas encore disponible. Édite .vectorz/release-passes.yml à la main — une liste ` +
        '`passes:` de { id, title, command }, avec `replace: true` en tête pour remplacer le socle au lieu de le compléter. ' +
        'Le réglage par commande arrive dans une story suivante (fiche 20261114131616085).',
    );
    process.exit(2);
  }
  console.error('usage : ezk release passes list   (add|remove à venir — fiche 20261114131616085)');
  process.exit(2);
}

// Sous-commande « verdict » : poser le verdict d'une passe à jugement (chasse aux bugs…).
if (target.rest[0] === 'verdict') {
  const passe = target.rest[1];
  const ver = target.rest[2];
  const decision = target.rest[3];
  const motif = target.rest.slice(4).join(' ').trim();
  if (!passe || !ver || (decision !== 'go' && decision !== 'no-go')) {
    console.error('usage : ezk release verdict <passe> <version> go|no-go "<motif>"');
    process.exit(2);
  }
  if (motif === '') {
    console.error('✗ verdict refusé : un motif est requis — ezk release verdict <passe> <version> go|no-go "<motif>"');
    process.exit(2);
  }
  // La passe doit exister dans les passes effectives du projet.
  const entries = effectivePassesOrExit(root, releaseConfigOrExit(root).tests);
  if (!entries.some((e) => e.id === passe)) {
    console.error(
      `✗ verdict refusé : la passe « ${passe} » n'est pas une passe effective de ce projet (voir : ezk release passes list).`,
    );
    process.exit(1);
  }
  const auteur = gitUserName(root);
  const head = headOf(root);
  const verdict: PassVerdict = {
    version: ver,
    passe,
    verdict: decision === 'go' ? 'GO' : 'NO-GO',
    motif,
    at: new Date().toISOString(),
    ...(auteur !== undefined ? { auteur } : {}),
    ...(head !== '' ? { head } : {}),
  };
  const file = writePassVerdict(root, verdict);
  console.log(`Verdict ${verdict.verdict} posé pour « ${passe} » (${ver}) : ${file}`);
  process.exit(0);
}

// Sous-commande interne « verdict-check » : la passe du socle lit son verdict et décide (péremption comprise).
if (target.rest[0] === 'verdict-check') {
  const passe = target.rest[1];
  const ver = target.rest[2];
  if (!passe || !ver) {
    console.error('usage : ezk release verdict-check <passe> <version>');
    process.exit(2);
  }
  const decided = decidePassVerdict(readPassVerdict(root, ver, passe), headOf(root));
  if (decided.detail) console.log(decided.detail);
  process.exit(decided.go ? 0 : 1);
}

const version = target.rest.find((a) => !a.startsWith('-'));

if (!version) {
  console.error('usage : ezk release <vX.Y>   (--root <projet> pour un autre dépôt)');
  process.exit(2);
}

// Réglage release résolu une fois (gate + commande de tests). Un release.tests mal typé sort en code 2.
const cfg = releaseConfigOrExit(root);

// Gate désactivée par config : on se saute proprement (le projet ne tague pas de version).
if (!cfg.gate) {
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

// Les passes effectives, dans l'ordre : socle (dod, chasse, tests) complété ou remplacé par le projet.
// Une passe sautée (run:false, aujourd'hui la seule est tests sans release.tests) devient un résultat
// SAUTÉ ; les autres se jouent.
const results: PassResult[] = effectivePassesOrExit(root, cfg.tests).map((e) => {
  if (!e.run) return skippedTestsResult();
  const command = substitute(e.command, { root, version });
  const { go, detail } = runPass(command);
  return { id: e.id, title: substitute(e.title, { root, version }), command, go, ...(detail ? { detail } : {}) };
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
