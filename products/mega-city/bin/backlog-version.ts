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
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOT_MAX,
  VERSION_FORMAT,
  buildVersions,
  checkVersions,
  closeVersion,
  hasErrors,
} from '../src/backlog/versions.js';
import {
  renderFindings,
  renderProposal,
  renderRefusal,
  renderVersionList,
} from '../src/backlog/versions-render.js';
import { loadFiches } from '../src/loaders/fiches.js';

const VERBS = ['list', 'check', 'close'] as const;
type Verb = (typeof VERBS)[number];

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    'usage : backlog:version [list] | check [<X>] [--max <n>] [--no-plan] | close <X> [--tag] [--max <n>] [--no-plan]   (--root <dossier> pour un autre dépôt)',
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
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  let max = LOT_MAX;
  let usePlan = true;
  let tag = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--no-plan') usePlan = false;
    else if (arg === '--tag') tag = true;
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
    usage(`« ${version} » n'a pas le format V<n>.<n> (exemple : V0.3)`);
  }
  if (verb === 'close' && version === undefined) usage('close attend une version (exemple : close V0.3)');
  if (verb === 'list' && version !== undefined) usage('list ne prend pas de version');
  return { verb, version, root, max, usePlan, tag };
}

/** Les étiquettes git locales. Hors dépôt git (ou sans git) : aucune, et l'état se calcule sans. */
function localTags(root: string): Set<string> {
  try {
    const out = execFileSync('git', ['tag', '-l'], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return new Set(out.split('\n').filter((t) => t !== ''));
  } catch {
    return new Set();
  }
}

/** Le commit à étiqueter : `origin/main` si on le connaît, sinon `HEAD`. SHA complet, jamais une branche. */
function targetSha(root: string): { sha: string; ref: string } {
  for (const ref of ['origin/main', 'HEAD']) {
    try {
      const sha = execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
      return { sha: sha.trim(), ref };
    } catch {
      /* ref inconnue : on essaie la suivante */
    }
  }
  return { sha: 'HEAD', ref: 'HEAD' };
}

function say(lines: string[]): void {
  console.log(lines.join('\n'));
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

  // close
  const version = args.version as string; // garanti par parseArgs
  const result = closeVersion(fiches, tags, version, opts);
  if (!result.ok) {
    say(renderRefusal(version, result.reasons));
    process.exit(1);
  }
  const { sha, ref } = targetSha(args.root);
  if (!args.tag) {
    say(renderProposal(version, result.tag, sha, ref));
    return;
  }
  try {
    execFileSync('git', ['tag', '-a', result.tag, '-m', `Version ${version}`, sha], {
      cwd: args.root,
      stdio: 'pipe',
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`✗ étiquette non créée : ${reason}`);
    process.exit(2);
  }
  say([
    `En clair : ${version} est livrée. L'étiquette ${result.tag} est créée en local sur ${ref} (${sha.slice(0, 9)}).`,
    `Pour la publier, lance toi-même : git push origin ${result.tag}`,
    `Pour la retirer : git tag -d ${result.tag}`,
  ]);
}

main();
