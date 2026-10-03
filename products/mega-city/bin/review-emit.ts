/**
 * review-emit — wrapper CLI source→render→markdown-file (fiche 0183, ADR-038).
 *
 *   pnpm --dir products/mega-city review:emit \
 *     --fiche 0183 --branch feat/0183-pack-review-markdown-first \
 *     --product mega-city --method-name ezk-sprint --method-version 0.1.0 \
 *     --status ready-for-review --resume "..." --matrice "..." \
 *     --a-tester "..." --provisioning "..." [--qualite "..."] [--pr <url>] \
 *     [--run-id <id>] [--reviews-root features/reviews] [--github]
 *
 * Construit un `ReviewPack` (couture `ReviewSource`, une seule implémentation
 * en MVP — YAGNI, ADR-038 §5) depuis les arguments CLI, l'écrit toujours via
 * `markdown-file` (SoT), et projette en plus un corps de commentaire GitHub
 * sur stdout si `--github` est passé. L'acte `gh pr comment` reste à la
 * frontière CLI — ce script ne l'exécute jamais lui-même.
 */
import { join, resolve } from 'node:path';
import type { ReviewPack, ReviewStatus } from '../src/review/contract.js';
import { REVIEW_STATUSES, validateReviewPack } from '../src/review/contract.js';
import { createMarkdownFileEmitter } from '../src/review/emitters/markdown-file.js';
import { createGithubCommentEmitter } from '../src/review/emitters/github-comment.js';
import { projectRootOrExit } from '../src/io/project-root.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

interface ParsedArgs {
  values: Record<string, string>;
  github: boolean;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const values: Record<string, string> = {};
  let github = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--github') {
      github = true;
      continue;
    }
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      fail(`option --${key} attend une valeur`);
    }
    values[key] = value;
    i++;
  }
  return { values, github };
}

function requireValue(values: Record<string, string>, key: string): string {
  const value = values[key];
  if (!value) fail(`option --${key} est requise`);
  return value;
}

function buildPackFromArgs(values: Record<string, string>): ReviewPack {
  const status = requireValue(values, 'status');
  if (!REVIEW_STATUSES.includes(status as ReviewStatus)) {
    fail(`--status doit être l'un de ${REVIEW_STATUSES.join(', ')} (reçu "${status}")`);
  }

  const pack: ReviewPack = {
    frontMatter: {
      schema: 'method-review@0.1',
      fiche: requireValue(values, 'fiche'),
      branch: requireValue(values, 'branch'),
      product: requireValue(values, 'product'),
      method: {
        name: requireValue(values, 'method-name'),
        version: requireValue(values, 'method-version'),
      },
      status: status as ReviewStatus,
      created: values.created ?? new Date().toISOString().slice(0, 10),
      run_id: values['run-id'],
      pr: values.pr,
    },
    sections: {
      resume: requireValue(values, 'resume'),
      rendus: values.rendus ? values.rendus.split(',').map((s) => s.trim()) : [],
      matriceValidation: requireValue(values, 'matrice'),
      aTester: requireValue(values, 'a-tester'),
      qualite: values.qualite,
      provisioning: requireValue(values, 'provisioning'),
      trouvailles: values.trouvailles ? values.trouvailles.split(',').map((s) => s.trim()) : undefined,
    },
  };

  validateReviewPack(pack);
  return pack;
}

// `pnpm --dir products/mega-city …` place le cwd dans products/mega-city ; `INIT_CWD`
// conserve le répertoire d'invocation. Le dossier des reviews vit dans le PROJET : celui que désigne
// `ezk` (`--root`, ou le dépôt du dossier courant — fiche 20261003200945204), sinon `INIT_CWD`.
// Jamais `products/mega-city/features/reviews/` du monorepo (trou vu au dogfooding `github: false`).
// Un `--reviews-root` se lit depuis la racine du projet, comme les fiches de `ezk backlog ship` ;
// absolu, il est pris tel quel.
const project = projectRootOrExit(process.env.INIT_CWD ?? process.cwd());
const { values, github } = parseArgs(project.rest);
const pack = buildPackFromArgs(values);
const reviewsRoot = resolve(project.root, values['reviews-root'] ?? join('features', 'reviews'));
const markdownEmitter = createMarkdownFileEmitter({ reviewsRoot });
const writtenPath = markdownEmitter.emit(pack);
console.log(`✓ review écrite : ${writtenPath}`);

if (github) {
  const body = createGithubCommentEmitter().emit(pack);
  console.log('\n--- corps de commentaire GitHub (projection, pas SoT) ---\n');
  console.log(body);
}
