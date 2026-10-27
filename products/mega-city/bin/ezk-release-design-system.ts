#!/usr/bin/env tsx
/**
 * `ezk design check <vX.Y>` — la revue design-system d'une version (fiche 20261011153019643).
 *
 * Passe composable d'`ezk-release` : déclarée en DONNÉE dans `.vectorz/release-passes.yml`
 *   (`command: ezk --root {root} design check {version}`), elle rend GO/NO-GO.
 *
 * Elle NE JUGE PAS elle-même (comme la chasse aux bugs du socle) : un agent de revue enregistre
 * le verdict (`.vectorz/release/<version>.design-system.json`) ; ce bin le relit. Référentiel du
 * projet absent → la passe se saute proprement (GO, exit 0).
 *
 * Bord I/O mince : la décision (skip/go/no-go/pending) vit dans src/core/design-system-review.ts.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { decideDesignSystem } from '../src/core/design-system-review.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { designSystemConfig, readDesignSystemVerdict } from '../src/loaders/release-passes.js';

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const root = target.root;
const version = target.rest.find((a) => !a.startsWith('-'));

if (!version) {
  console.error('usage : ezk design check <vX.Y>   (--root <projet> pour un autre dépôt)');
  process.exit(2);
}

const { reference } = designSystemConfig(root);
const referencePresent = existsSync(join(root, reference));
const verdict = referencePresent ? readDesignSystemVerdict(root, version) : undefined;
const outcome = decideDesignSystem({ version, reference, referencePresent, ...(verdict ? { verdict } : {}) });

console.log(outcome.report);
process.exit(outcome.exitCode);
