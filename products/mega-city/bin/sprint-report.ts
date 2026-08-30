#!/usr/bin/env node
/**
 * sprint:report — collecte le rapport de sprint (durée + tokens + KPI scrum, fiche
 * 20260826082120062) et l'écrit sous docs/sprints/<AAAA-MM-JJ>-sprint-<slug>.{md,json}.
 * Lecture seule sur journal/transcripts/git ; écrit uniquement le rapport.
 *
 *   pnpm --dir products/mega-city sprint:report <slug>
 *     [--repo-root <path>] [--project-root <path>] [--product <name>] [--out <dir>]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitGhRepoSource } from '../src/sprint-metrics/adapters/repoSource.js';
import { SupervisionJournalSource } from '../src/sprint-metrics/adapters/journalSource.js';
import { ClaudeCodeTranscriptSource } from '../src/sprint-metrics/adapters/transcriptSource.js';
import { collectSprintReport } from '../src/sprint-metrics/collect.js';
import { renderSprintReportMarkdown } from '../src/sprint-metrics/domain/render.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCityRoot = resolve(here, '..');
const repoRootDefault = resolve(here, '..', '..', '..');

function usage(): never {
  console.error(`usage: sprint:report <slug> [options]

Options:
  --repo-root <path>     Racine git (fiches features/done + PR) — défaut : racine du repo
  --project-root <path>  Racine produit (.supervision/ + transcripts) — défaut : products/mega-city
  --product <name>       Nom du produit dans le rapport (défaut : mega-city)
  --out <dir>            Dossier de sortie (défaut : <repo-root>/docs/sprints)
`);
  process.exit(2);
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') usage();
  const slug = argv[0];
  // Le slug entre dans un nom de fichier (`<day>-sprint-<slug>.json`) : le contraindre
  // à un jeu sûr évite qu'un `../` écrive hors de docs/sprints/ (même garde que les
  // gate_id dans supervision/runtime.ts).
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) {
    console.error(`slug invalide : "${slug}" (attendu : lettres, chiffres, ., _, -)`);
    usage();
  }
  let repoRoot = repoRootDefault;
  let projectRoot = megaCityRoot;
  let product = 'mega-city';
  let out: string | undefined;

  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--repo-root') repoRoot = resolve(argv[++i]);
    else if (a === '--project-root') projectRoot = resolve(argv[++i]);
    else if (a === '--product') product = argv[++i];
    else if (a === '--out') out = resolve(argv[++i]);
    else {
      console.error(`option inconnue : ${a}`);
      usage();
    }
  }

  const report = collectSprintReport(
    { projectRoot, repoRoot, slug, product },
    {
      journal: new SupervisionJournalSource(),
      transcript: new ClaudeCodeTranscriptSource(),
      repo: new GitGhRepoSource(),
    },
  );

  const md = renderSprintReportMarkdown(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const day = report.generatedAt.slice(0, 10);
  const outDir = out ?? join(repoRoot, 'docs', 'sprints');
  mkdirSync(outDir, { recursive: true });
  const base = `${day}-sprint-${slug}`;
  writeFileSync(join(outDir, `${base}.json`), json, 'utf8');
  writeFileSync(join(outDir, `${base}.md`), md, 'utf8');
  console.log(`Rapport de sprint → ${join(outDir, base)}.{md,json}`);
}

main();
