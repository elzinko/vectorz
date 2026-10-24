#!/usr/bin/env tsx
/**
 * backlog-version — bord I/O de `ezk-backlog version` (fiche 20260824204751403).
 *
 *   pnpm --dir products/mega-city backlog:version [list]
 *   pnpm --dir products/mega-city backlog:version check [<X>] [--max <n>] [--no-plan]
 *   pnpm --dir products/mega-city backlog:version close <X> [--tag] [--max <n>] [--no-plan]
 *
 * Le cœur PUR (`src/backlog/versions.ts`) calcule tout depuis le champ `version:` des fiches, les
 * étiquettes git locales et `features/PLAN.md`. Ici : lecture disque et git, puis affichage.
 * LECTURE SEULE, sauf `close --tag` qui crée UNE étiquette git LOCALE (réversible : `git tag -d`).
 * Rien n'est jamais poussé : le `git push` reste un geste du PO, proposé en toutes lettres.
 *
 * Codes de sortie : 0 fait · 1 refus ou erreur de lot (rien d'écrit) · 2 usage ou échec git.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOT_MAX,
  VERSION_FORMAT,
  buildVersions,
  checkVersions,
  closeVersion,
  diffFrozen,
  freezeTagFor,
  freezeTagOf,
  hasErrors,
} from '../src/backlog/versions.js';
import {
  renderFindings,
  renderFrozenDiff,
  renderProposal,
  renderRefusal,
  renderVersionList,
} from '../src/backlog/versions-render.js';
import { localTags } from '../src/io/git-tags.js';
import { loadFiches } from '../src/loaders/fiches.js';
import { readReleaseVerdict, releaseConfig } from '../src/loaders/release-passes.js';

const VERBS = ['list', 'check', 'close', 'freeze', 'unfreeze', 'diff'] as const;
type Verb = (typeof VERBS)[number];

/** Les verbes qui exigent une version en argument. */
const NEEDS_VERSION: ReadonlySet<Verb> = new Set(['close', 'freeze', 'unfreeze', 'diff']);

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    'usage : backlog:version [list] | check [<X>] [--max <n>] [--no-plan] | close <X> [--tag] [--release-ok "<raison>"] | freeze <X> | unfreeze <X> | diff <X>   (--root <dossier> pour un autre dépôt)',
  );
  process.exit(2);
}

interface Args {
  verb: Verb;
  version: string | undefined;
  root: string;
  max: number;
  usePlan: boolean;
  tag: boolean;
  releaseOk: string | undefined;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  let max = LOT_MAX;
  let usePlan = true;
  let tag = false;
  let releaseOk: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--no-plan') usePlan = false;
    else if (arg === '--tag') tag = true;
    else if (arg === '--release-ok') releaseOk = argv[++i] ?? usage('--release-ok attend une raison (soupape PO journalisée)');
    else if (arg === '--root') root = resolve(argv[++i] ?? usage('--root attend un dossier'));
    else if (arg === '--max') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1) usage('--max attend un entier positif');
      max = n;
    } else if (arg.startsWith('--')) usage(`option inconnue : ${arg}`);
    else positional.push(arg);
  }
  const verb = (positional.shift() ?? 'list') as Verb;
  if (!VERBS.includes(verb)) usage(`sous-commande inconnue : ${verb}`);
  const version = positional.shift();
  if (positional.length > 0) usage(`argument en trop : ${positional.join(' ')}`);
  if (version !== undefined && !VERSION_FORMAT.test(version)) {
    usage(`« ${version} » n'a pas le format semver v<n>.<n>.<n> (exemple : v0.3.0)`);
  }
  if (NEEDS_VERSION.has(verb) && version === undefined) usage(`${verb} attend une version (exemple : ${verb} v0.3.0)`);
  if (verb === 'list' && version !== undefined) usage('list ne prend pas de version');
  return { verb, version, root, max, usePlan, tag, releaseOk };
}

/** Sortie d'une commande git dans `root`, ou `undefined` si elle échoue (hors dépôt, référence inconnue). */
function gitOut(root: string, args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return undefined;
  }
}

function say(lines: string[]): void {
  console.log(lines.join('\n'));
}

/**
 * Les ids des fiches qui portaient `version: X` au commit du gel `freezeTag`. On extrait l'arbre
 * `features/` figé (`git archive`) dans un dossier jetable, puis on LIT par le loader (`loadFiches`) —
 * jamais un parseur maison du front-matter (règle `development/fiche-read-via-loader`). Best-effort :
 * hors dépôt, sans `tar`, ou arbre absent → liste vide.
 */
function frozenBaseIds(root: string, version: string, freezeTag: string): string[] {
  let tmp: string | undefined;
  try {
    tmp = mkdtempSync(join(tmpdir(), 'ezk-freeze-base-'));
    const tar = join(tmp, 'tree.tar');
    execFileSync('git', ['archive', '--output', tar, freezeTag, 'features'], {
      cwd: root,
      stdio: 'pipe',
    });
    execFileSync('tar', ['-xf', tar, '-C', tmp], { stdio: 'pipe' });
    return loadFiches(tmp)
      .filter((f) => f.version === version)
      .map((f) => f.id);
  } catch {
    return []; // best-effort : hors dépôt, sans tar, tmp non inscriptible ou arbre absent
  } finally {
    if (tmp !== undefined) rmSync(tmp, { recursive: true, force: true });
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2).filter((a) => a !== '--'));
  const fiches = loadFiches(args.root);
  const tags = localTags(args.root);
  const planPath = join(args.root, 'features', 'PLAN.md');
  const planMd = args.usePlan && existsSync(planPath) ? readFileSync(planPath, 'utf8') : undefined;
  const opts = { max: args.max, planMd };

  if (args.verb === 'list') {
    say(renderVersionList(buildVersions(fiches, tags)));
    return;
  }

  if (args.verb === 'check') {
    if (args.version !== undefined) {
      const known = buildVersions(fiches, tags).lots.some((l) => l.version === args.version);
      if (!known) {
        say([`En clair : aucune fiche ne porte la version ${args.version}.`]);
        process.exit(1);
      }
    }
    const findings = checkVersions(fiches, tags, { ...opts, version: args.version });
    say(renderFindings(findings, args.version ?? 'le backlog'));
    if (planMd === undefined) {
      console.log("Non contrôlé ici : l'accord avec PLAN.md (--no-plan, ou fichier absent).");
    }
    process.exit(hasErrors(findings) ? 1 : 0);
  }

  if (args.verb === 'freeze' || args.verb === 'unfreeze' || args.verb === 'diff') {
    const version = args.version as string; // garanti par parseArgs
    const lot = buildVersions(fiches, tags).lots.find((l) => l.version === version);
    if (!lot) {
      say([`En clair : aucune fiche ne porte la version ${version}.`]);
      process.exit(1);
    }
    const freezeTag = freezeTagFor(version, tags);

    if (args.verb === 'freeze') {
      if (lot.releaseTag !== undefined) {
        say([`En clair : ${version} est déjà livrée (${lot.releaseTag}). Inutile de la figer.`]);
        process.exit(1);
      }
      if (freezeTag !== undefined) {
        say([`En clair : ${version} est déjà figée (${freezeTag}). « diff » pour voir la dérive, « unfreeze » pour la dégeler.`]);
        process.exit(1);
      }
      const head = gitOut(args.root, ['rev-parse', 'HEAD']);
      if (head === undefined) {
        say([`En clair : pas de dépôt git (ou aucun commit) ici : impossible de figer ${version}.`]);
        process.exit(1);
      }
      const dirty = gitOut(args.root, ['status', '--porcelain', '--', 'features']);
      if (dirty) {
        say([
          `En clair : des fiches ne sont pas commitées — figer photographierait un périmètre instable. Rien n'a été écrit.`,
          '',
          "Committe (ou annule) d'abord les changements de features/ :",
          ...dirty.split('\n').slice(0, 5).map((line) => `  ${line}`),
        ]);
        process.exit(1);
      }
      const tag = freezeTagOf(version);
      try {
        execFileSync(
          'git',
          ['tag', '-a', tag, '-m', `Gel du périmètre de ${version} (${new Date().toISOString().slice(0, 10)})`, head],
          { cwd: args.root, stdio: 'pipe' },
        );
      } catch (error) {
        console.error(`✗ gel non posé : ${error instanceof Error ? error.message : String(error)}`);
        process.exit(2);
      }
      say([
        `En clair : ${version} est figée. Le périmètre est photographié par ${tag} sur HEAD (${head.slice(0, 9)}).`,
        `Gel souple : ajouter une fiche reste permis ; « diff » montre l'écart. Dégeler : backlog:version unfreeze ${version}.`,
        `Local, jamais poussé (comme une release). Pour retirer à la main : git tag -d ${tag}.`,
      ]);
      return;
    }

    if (args.verb === 'unfreeze') {
      if (freezeTag === undefined) {
        say([`En clair : ${version} n'est pas figée : rien à dégeler.`]);
        process.exit(1);
      }
      try {
        execFileSync('git', ['tag', '-d', freezeTag], { cwd: args.root, stdio: 'pipe' });
      } catch (error) {
        console.error(`✗ dégel impossible : ${error instanceof Error ? error.message : String(error)}`);
        process.exit(2);
      }
      say([`En clair : ${version} est dégelée (${freezeTag} retiré). Elle revient en brouillon.`]);
      return;
    }

    // diff
    if (freezeTag === undefined) {
      say([`En clair : ${version} n'est pas figée : rien à comparer. Fige-la d'abord : backlog:version freeze ${version}.`]);
      process.exit(1);
    }
    const baseIds = frozenBaseIds(args.root, version, freezeTag);
    const currentIds = fiches.filter((f) => f.version === version).map((f) => f.id);
    say(renderFrozenDiff(version, freezeTag, diffFrozen(baseIds, currentIds)));
    return;
  }

  // close
  const version = args.version as string; // garanti par parseArgs
  const result = closeVersion(fiches, tags, version, opts);
  if (!result.ok) {
    say(renderRefusal(version, result.reasons));
    process.exit(1);
  }

  // L'étiquette vise le commit dont les fiches ont été LUES : HEAD, jamais une autre référence (Codex #286).
  // Si `features/` porte des changements non commités, l'état validé n'est pas celui de HEAD : on refuse.
  const head = gitOut(args.root, ['rev-parse', 'HEAD']);
  if (head === undefined) {
    say(renderRefusal(version, ['pas de dépôt git (ou aucun commit) ici : impossible de proposer une étiquette']));
    process.exit(1);
  }
  const dirty = gitOut(args.root, ['status', '--porcelain', '--', 'features']);
  if (dirty) {
    say([
      `En clair : ${version} est complète, mais les fiches lues ne sont pas toutes commitées. Rien n'a été écrit.`,
      '',
      "Des changements non commités dans features/ : l'état validé n'est pas celui du commit HEAD. Committe (ou annule) d'abord.",
      ...dirty.split('\n').slice(0, 5).map((line) => `  ${line}`),
    ]);
    process.exit(1);
  }
  // Gate de release (fiche 20260922175954296) : le tag est refusé si la passe qualité de la
  // version n'est pas GO — sauf soupape PO journalisée (--release-ok "<raison>"). Désactivée
  // par `release.gate: off`. Un verdict établi sur un autre commit que HEAD est périmé.
  if (args.tag && releaseConfig(args.root).gate) {
    if (args.releaseOk) {
      say([`Soupape PO — gate de release outrepassée pour ${version} : ${args.releaseOk}`, '']);
    } else {
      const v = readReleaseVerdict(args.root, version);
      const reason =
        v === undefined
          ? `aucune gate de release jouée — lance d'abord : ezk release ${version}`
          : v.head && v.head !== head
            ? `gate de release périmée (jouée sur ${v.head.slice(0, 9)}, HEAD = ${head.slice(0, 9)}) — rejoue : ezk release ${version}`
            : v.verdict !== 'GO'
              ? `gate de release NO-GO (passes bloquantes : ${v.passes.filter((p) => !p.go).map((p) => p.id).join(', ') || '—'})`
              : undefined;
      if (reason !== undefined) {
        say(renderRefusal(version, [reason, 'soupape PO : close … --tag --release-ok "<raison>" (journalisée)']));
        process.exit(1);
      }
    }
  }
  if (!args.tag) {
    say(renderProposal(version, result.tag, head, gitOut(args.root, ['rev-parse', 'origin/main'])));
    return;
  }
  try {
    execFileSync('git', ['tag', '-a', result.tag, '-m', `Version ${version}`, head], {
      cwd: args.root,
      stdio: 'pipe',
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`✗ étiquette non créée : ${reason}`);
    process.exit(2);
  }
  say([
    `En clair : ${version} est livrée. L'étiquette ${result.tag} est créée en local sur HEAD (${head.slice(0, 9)}).`,
    `Pour la publier, lance toi-même : git push origin ${result.tag}`,
    `Pour la retirer : git tag -d ${result.tag}`,
  ]);
}

main();
