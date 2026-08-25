#!/usr/bin/env node
/**
 * supervision:analyze — post-mortem journal + transcript Claude Code (fiche 0104).
 *
 *   pnpm --dir products/mega-city supervision:analyze [projet] [--run <id>] [--since 2h]
 *     [--transcript <path>] [--out <dir>] [--full] [--json-only]
 *
 * Lecture seule. Écrit un rapport md+json sous docs/dogfood-reports/<stamp>/ par défaut
 * (ou --out). N’appelle pas le LLM, ne démarre pas le Moniteur.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveProjectPath } from '../src/supervision/link-config.js';
import {
  analyzeSession,
  listRunDirs,
  summarizeRun,
  formatReportMarkdown,
  type AnalyzeOptions,
} from '../src/supervision/analyze.js';
import { loadScenario, matchRunToScenario, type Scenario } from '../src/supervision/expect.js';

function usage(): never {
  console.error(`usage: supervision:analyze [projet] [options]

Options:
  --run <id>           Un run précis sous .supervision/runs/
  --since <Nh|Nm|Nd>   Filtrer les runs récents (ex. 2h, 30m)
  --transcript <path>  Fichier .jsonl Claude Code explicite
  --out <dir>          Dossier de sortie (défaut: <projet>/docs/dogfood-reports/<stamp>)
  --full               Inclure un peu plus de métadonnées (pas les prompts complets)
  --json-only          N’écrire que le JSON (stdout si pas --out)
  --stdout             Afficher le markdown sur stdout en plus des fichiers
  --expect <scenario>  Oracle CI (fiche 0169) : compare le run à un scénario JSON déclaratif.
                        Code retour : 0 conforme · 1 divergent · 2 erreur d'usage (scénario
                        absent/illisible/invalide, run introuvable ou ambigu). Remplace le
                        rapport markdown par un verdict compact. Sélection du run : --run,
                        sinon scenario.run_id, sinon le run unique s'il n'y en a qu'un.
`);
  process.exit(2);
}

function parseArgs(argv: string[]): {
  projectArg: string;
  options: AnalyzeOptions & { out?: string; jsonOnly?: boolean; stdout?: boolean; expect?: string };
} {
  let projectArg = '.';
  const options: AnalyzeOptions & { out?: string; jsonOnly?: boolean; stdout?: boolean; expect?: string } = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') usage();
    if (a === '--run') {
      options.runId = argv[++i];
      continue;
    }
    if (a === '--since') {
      options.since = argv[++i];
      continue;
    }
    if (a === '--transcript') {
      options.transcript = argv[++i];
      continue;
    }
    if (a === '--out') {
      options.out = argv[++i];
      continue;
    }
    if (a === '--full') {
      options.full = true;
      continue;
    }
    if (a === '--json-only') {
      options.jsonOnly = true;
      continue;
    }
    if (a === '--stdout') {
      options.stdout = true;
      continue;
    }
    if (a === '--expect') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('-')) {
        console.error('--expect exige un fichier scénario');
        usage();
      }
      options.expect = v;
      continue;
    }
    if (a.startsWith('-')) {
      console.error(`option inconnue : ${a}`);
      usage();
    }
    rest.push(a);
  }
  if (rest[0]) projectArg = rest[0];
  return { projectArg, options };
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Sélectionne le run à confronter au scénario : --run, sinon scenario.run_id, sinon l'unique run. */
function selectRunIdForExpect(
  projectRoot: string,
  options: { runId?: string },
  scenarioRunId: string | undefined,
): string {
  const runIds = listRunDirs(projectRoot);
  const requested = options.runId ?? scenarioRunId;
  if (requested) {
    if (!runIds.includes(requested)) {
      console.error(`supervision:analyze --expect : run "${requested}" introuvable sous .supervision/runs/.`);
      process.exit(2);
    }
    return requested;
  }
  if (runIds.length === 1) return runIds[0];
  if (runIds.length === 0) {
    console.error('supervision:analyze --expect : aucun run sous .supervision/runs/ — passe --run <id>.');
    process.exit(2);
  }
  console.error(
    `supervision:analyze --expect : ${runIds.length} runs trouvés, impossible de choisir — ` +
      `passe --run <id> ou "run_id" dans le scénario.`,
  );
  process.exit(2);
}

/** Mode oracle CI (fiche 0169) : verdict compact + code retour, remplace le rapport markdown. */
function runExpect(projectRoot: string, options: AnalyzeOptions & { expect: string }): never {
  let scenario: Scenario;
  try {
    scenario = loadScenario(options.expect);
  } catch (error) {
    console.error(`supervision:analyze --expect : ${(error as Error).message}`);
    process.exit(2);
  }
  const runId = selectRunIdForExpect(projectRoot, options, scenario.run_id);
  const run = summarizeRun(projectRoot, runId);
  const result = matchRunToScenario(run, scenario);

  if (result.ok) {
    console.log(`OK — run ${runId} conforme au scénario${scenario.name ? ` « ${scenario.name} »` : ''}.`);
    process.exit(0);
  }

  console.log(`DIVERGENT — run ${runId}${scenario.name ? ` (scénario « ${scenario.name} »)` : ''} :`);
  for (const mismatch of result.mismatches) {
    console.log(`- ${mismatch}`);
  }
  process.exit(1);
}

function main(): void {
  const { projectArg, options } = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(projectArg, process.env.INIT_CWD, process.cwd());

  if (options.expect !== undefined) {
    runExpect(projectRoot, { ...options, expect: options.expect });
  }

  const report = analyzeSession(projectRoot, options);
  const md = formatReportMarkdown(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;

  const outDir =
    options.out !== undefined
      ? resolve(options.out)
      : join(projectRoot, 'docs', 'dogfood-reports', stamp());

  if (!options.jsonOnly || options.out !== undefined) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'analyze-report.json'), json, 'utf8');
    if (!options.jsonOnly) {
      writeFileSync(join(outDir, 'analyze-report.md'), md, 'utf8');
    }
    console.error(`Rapport → ${outDir}`);
  }

  if (options.stdout || options.jsonOnly) {
    process.stdout.write(options.jsonOnly ? json : md);
  } else {
    // Affiche les verdicts en console pour un feedback immédiat
    console.log('## Verdicts');
    for (const v of report.verdicts) {
      console.log(`- [${v.code}] ${v.detail}`);
    }
    console.log(`\nDétail : ${join(outDir, 'analyze-report.md')}`);
  }

  const bad = report.verdicts.some((v) =>
    ['emission_gap', 'silence_explained', 'orphan_run', 'mcp_without_journal'].includes(v.code),
  );
  process.exitCode = bad ? 1 : 0;
}

main();
