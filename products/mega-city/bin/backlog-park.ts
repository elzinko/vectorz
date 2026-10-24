#!/usr/bin/env tsx
/**
 * backlog:park — SORTIR une fiche inconstruisable de sa version (fiche 20261013131852779).
 *
 *   ezk backlog park <id> --reason <raison-typée>   (--root <dossier> pour un autre dépôt)
 *
 * Le cœur PUR (`src/backlog/park-fiche.ts`) met à jour le front-matter : `version` vidée,
 * `status: idea`, `milestone: parked`, `blocked: <raison> — …`. Ici : lecture de la fiche, écriture,
 * et la ligne de journal à reporter (SPRINT.md + RUN-REPORT, état `sautée`). RÉVERSIBLE : la fiche
 * reste au backlog, réveillable au grooming. Aucun `git`, rien n'est committé ni poussé.
 *
 * Codes de sortie : 0 parké · 1 refus (fiche absente, déjà livrée, raison inconnue) · 2 usage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLOCKED_REASONS, type BlockedReason } from '../src/backlog/blocked-reasons.js';
import { parkGuard, parkOutOfVersion } from '../src/backlog/park-fiche.js';
import { runDisposition } from '../src/backlog/run-eligibility.js';
import { versionScope } from '../src/backlog/version-scope.js';
import { buildVersions } from '../src/backlog/versions.js';
import { localTags } from '../src/io/git-tags.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { loadFiches } from '../src/loaders/fiches.js';

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    `usage : backlog park <id> --reason <raison> [--after-groom <ref>]   (--root <dossier> pour un autre dépôt)\n` +
      `  raison ∈ ${BLOCKED_REASONS.join(', ')}\n` +
      `  --after-groom <ref> : atteste une tentative de grooming (SHA d'essai, ligne SPRINT.md) — lève le refus`,
  );
  process.exit(2);
}

function main(): void {
  const { root, rest: argv } = projectRootOrExit(process.env.INIT_CWD ?? process.cwd());
  if (argv.includes('--help') || argv.includes('-h')) usage();

  let id: string | undefined;
  let reason: string | undefined;
  let afterGroom: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--reason') reason = argv[++i];
    else if (a === '--after-groom') {
      afterGroom = argv[++i] ?? usage("--after-groom attend une référence (SHA d'essai ou ligne SPRINT.md)");
    } else if (a.startsWith('--')) usage(`option inconnue : ${a}`);
    else if (id === undefined) id = a;
    else usage(`argument en trop : ${a}`);
  }
  if (id === undefined) usage('<id> est obligatoire');
  if (reason === undefined) usage('--reason <raison typée> est obligatoire');
  if (!(BLOCKED_REASONS as readonly string[]).includes(reason)) {
    usage(`raison « ${reason} » hors liste fermée : ${BLOCKED_REASONS.join(', ')}`);
  }

  const fiches = loadFiches(root);
  const fiche = fiches.find((f) => f.id === id);
  if (fiche === undefined) {
    console.error(`✗ aucune fiche ne porte l'id ${id} dans ${root}/features.`);
    process.exit(1);
  }
  if (fiche.done || fiche.status === 'shipped') {
    console.error(`✗ ${id} est déjà livrée (done/) : on ne parke pas une fiche livrée.`);
    process.exit(1);
  }

  // Garde « tenter avant de parker » (fiche 20261018234206166) : on ne parke pas une fiche qu'on n'a
  // pas tentée. Le filtre d'éligibilité tranche ; `--after-groom <ref>` atteste une tentative passée.
  const scope = versionScope(buildVersions(fiches, localTags(root)));
  const verdict = runDisposition(
    { status: fiche.status, type: fiche.type, blocked: fiche.blocked, version: fiche.version },
    scope,
  );
  const refusal = parkGuard(verdict, afterGroom !== undefined);
  if (refusal !== undefined) {
    console.error(`✗ park refusé — ${id} ${refusal}`);
    process.exit(1);
  }

  const path = join(root, fiche.file);
  const result = parkOutOfVersion(readFileSync(path, 'utf8'), {
    reason: reason as BlockedReason,
    date: new Date().toISOString().slice(0, 10),
  });
  writeFileSync(path, result.text, 'utf8');

  console.log(`✓ ${result.journal}`);
  console.log(`  fiche : ${fiche.file}`);
  console.log('  réveil : repose version: + status: ready (ou idea) et retire blocked:, au grooming.');
  console.log('  pense à régénérer les vues (ezk backlog regen / views:regen) et à committer.');
}

main();
