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
  checkLocalRefs,
  countParkDelivered,
  crossCheck,
  type Discrepancy,
  type FicheLine,
  localRefSha,
  parkRatioVerdict,
  parseFicheArg,
  type PrFacts,
  renderRunReport,
  type Tokens,
} from '../src/core/run-report.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { collectHeadFacts, fetchPrFacts, shaOnLocalBranch } from '../src/io/run-facts.js';

function usage(): never {
  console.error(`usage: run:report --fiche "<id>|<état>|<PR>|<gate>|<revue>|<validation>|<raison>" [--fiche …]
                  [--no-github] [--no-fetch] [--base <branche>]
                  [--tokens-used N] [--tokens-cap N] [--tokens-setting lean|cap|full]
                  [--groom-attempted N] [--idea-encountered N]   (ratio parké/livré + couverture de groom)

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
  // Le dépôt visé : --root > EZK_ROOT > le dossier courant (jamais vectorz en silence depuis un
  // projet hôte, fiche 20261013073300242). On retire --root des arguments avant de les parcourir.
  const fallbackCwd = process.env.INIT_CWD ?? process.cwd();
  const { root, rest: argv } = projectRootOrExit(fallbackCwd);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) usage();
  const lines: FicheLine[] = [];
  const errors: string[] = [];
  const tokens: Tokens = {};
  let github = true;
  let fetch = true;
  let base: string | undefined;
  const groom: { attempted?: number; ideaEncountered?: number } = {};
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
    else if (a === '--groom-attempted') groom.attempted = integer(argv[++i], '--groom-attempted');
    else if (a === '--idea-encountered') groom.ideaEncountered = integer(argv[++i], '--idea-encountered');
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

  const cwd = root;
  let state: 'checked' | 'skipped' | 'unreachable' = github ? 'checked' : 'skipped';
  let discrepancies: Discrepancy[] = [];
  if (github) {
    // Les réfs locales `local (<sha>)` ne passent pas par GitHub : on ne les fetch pas, on les
    // vérifie contre le main local (fiche 20261011113632532).
    const prs = new Map<string, PrFacts | null>();
    for (const l of lines) if (l.pr && !localRefSha(l.pr) && !prs.has(l.pr)) prs.set(l.pr, fetchPrFacts(cwd, l.pr));
    const answered = [...prs.values()].some((p) => p !== null);
    if (prs.size > 0 && !answered) state = 'unreachable';
    else {
      const local = checkLocalRefs(lines, (sha) => shaOnLocalBranch(cwd, sha, base ?? 'main'));
      discrepancies = [...crossCheck(lines, prs), ...local];
    }
  }

  const head = collectHeadFacts(cwd, { fetch, ...(base ? { base } : {}) });
  const { parked, delivered } = countParkDelivered(lines);
  const parkRatio = parkRatioVerdict(parked, delivered, groom);
  console.log(renderRunReport({ lines, discrepancies, head, tokens, github: state, parkRatio }));
  // Code dédié : 1 = écart GitHub (prioritaire), 3 = drapeau parké/livré (attention, pas un échec), 0 = rien.
  if (discrepancies.some((d) => d.severity === 'mismatch')) process.exit(1);
  process.exit(parkRatio.flagged ? 3 : 0);
}

main();
