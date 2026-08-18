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
import { resolve } from 'node:path';
import type { ReviewPack, ReviewStatus } from '../src/review/contract.js';
import { REVIEW_STATUSES, validateReviewPack } from '../src/review/contract.js';
import { createMarkdownFileEmitter } from '../src/review/emitters/markdown-file.js';
import { createGithubCommentEmitter } from '../src/review/emitters/github-comment.js';

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

const { values, github } = parseArgs(process.argv.slice(2));
const pack = buildPackFromArgs(values);

const reviewsRoot = resolve(values['reviews-root'] ?? 'features/reviews');
const markdownEmitter = createMarkdownFileEmitter({ reviewsRoot });
const writtenPath = markdownEmitter.emit(pack);
console.log(`✓ review écrite : ${writtenPath}`);

if (github) {
  const body = createGithubCommentEmitter().emit(pack);
  console.log('\n--- corps de commentaire GitHub (projection, pas SoT) ---\n');
  console.log(body);
}
