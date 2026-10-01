#!/usr/bin/env node
/**
 * run:report — le RUN-REPORT de fin de run : une ligne par fiche, HEAD, jetons (fiche 20260906122942607).
 *
 *   pnpm --dir products/mega-city run:report --fiche "<id>|<état>|<PR>|<gate>|<revue>|<validation>|<raison>" [--fiche …]
 *     [--no-github] [--no-fetch] [--base <branche>] [--tokens-used N] [--tokens-cap N] [--tokens-setting lean|cap|full]
 *
 * États : mergée, PR-ouverte, bloquée, sautée. « - » dit « sans objet » ; un champ vide est refusé.
 * La raison est obligatoire hors mergée. Le script compare le déclaré à GitHub (état de la PR, CI, trace
 * de revue) et signale tout écart. Avec --no-github, ou si `gh` ne répond pas, le déclaré est pris tel quel
 * et le rapport le dit.
 *
 * Code 0 : bilan rendu, rien ne le contredit. Code 1 : au moins un écart déclaré contre GitHub.
 * Code 2 : mauvais usage ou ligne de fiche incomplète.
 */
import {
  crossCheck,
  type Discrepancy,
  type FicheLine,
  parseFicheArg,
  type PrFacts,
  renderRunReport,
  type Tokens,
} from '../src/core/run-report.js';
import { collectHeadFacts, fetchPrFacts } from '../src/io/run-facts.js';

function usage(): never {
  console.error(`usage: run:report --fiche "<id>|<état>|<PR>|<gate>|<revue>|<validation>|<raison>" [--fiche …]
                  [--no-github] [--no-fetch] [--base <branche>]
                  [--tokens-used N] [--tokens-cap N] [--tokens-setting lean|cap|full]

  état : mergée | PR-ouverte | bloquée | sautée      « - » = sans objet (jamais de champ vide)
  exemple : --fiche "0080|mergée|#277|verte|GO|faite|-"`);
  process.exit(2);
}

const integer = (value: string | undefined, flag: string): number => {
  const n = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(n) || n < 0) {
    console.error(`${flag} attend un entier positif (reçu « ${value ?? ''} »).`);
    usage();
  }
  return n;
};

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) usage();
  const lines: FicheLine[] = [];
  const errors: string[] = [];
  const tokens: Tokens = {};
  let github = true;
  let fetch = true;
  let base: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fiche') {
      const parsed = parseFicheArg(argv[++i] ?? '');
      if (parsed.line) lines.push(parsed.line);
      else errors.push(parsed.error ?? 'ligne illisible');
    } else if (a === '--no-github') github = false;
    else if (a === '--no-fetch') fetch = false;
    else if (a === '--base') base = argv[++i];
    else if (a === '--tokens-used') tokens.used = integer(argv[++i], '--tokens-used');
    else if (a === '--tokens-cap') tokens.cap = integer(argv[++i], '--tokens-cap');
    else if (a === '--tokens-setting') tokens.setting = argv[++i];
    else {
      console.error(`option inconnue : ${a}`);
      usage();
    }
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`ligne refusée : ${e}`);
    process.exit(2);
  }
  if (lines.length === 0) {
    console.error('au moins une --fiche est attendue.');
    usage();
  }

  const cwd = process.env.INIT_CWD ?? process.cwd();
  let state: 'checked' | 'skipped' | 'unreachable' = github ? 'checked' : 'skipped';
  let discrepancies: Discrepancy[] = [];
  if (github) {
    const prs = new Map<string, PrFacts | null>();
    for (const l of lines) if (l.pr && !prs.has(l.pr)) prs.set(l.pr, fetchPrFacts(cwd, l.pr));
    const answered = [...prs.values()].some((p) => p !== null);
    if (prs.size > 0 && !answered) state = 'unreachable';
    else discrepancies = crossCheck(lines, prs);
  }

  const head = collectHeadFacts(cwd, { fetch, ...(base ? { base } : {}) });
  console.log(renderRunReport({ lines, discrepancies, head, tokens, github: state }));
  process.exit(discrepancies.some((d) => d.severity === 'mismatch') ? 1 : 0);
}

main();
