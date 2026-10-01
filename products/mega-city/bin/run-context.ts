#!/usr/bin/env node
/**
 * run:context — le bloc « Contexte de run » à afficher AVANT un run autonome (fiche 20260906122942607).
 *
 *   pnpm --dir products/mega-city run:context [--mode auto|manuel] [--delivery per-feature|per-epic]
 *     [--tokens lean|cap|full] [--review] [--max-sprints N] [--fiche <id>] [--no-fetch] [--base <branche>]
 *
 * Il dit d'où le run part (origin/main après un `git fetch`, le retard de HEAD), où il travaille
 * (worktree principal ou secondaire), qui écrit les fichiers (inline ou sous-agent), et le contrat en
 * trois lignes d'après les réglages donnés. Défauts = ceux d'ezk-product-build : auto, per-feature, lean.
 *
 * N'écrit rien dans le dépôt (le fetch met à jour les refs distantes, comme l'exige la règle de fraîcheur).
 * Sans remote joignable, il avertit et sort quand même en 0 : la règle interdit d'en faire un blocage.
 */
import {
  buildRunContext,
  type Delivery,
  type RunMode,
  type RunSettings,
  type TokenSetting,
} from '../src/core/run-context.js';
import { collectRunFacts } from '../src/io/run-facts.js';

function usage(): never {
  console.error(`usage: run:context [--mode auto|manuel] [--delivery per-feature|per-epic] [--tokens lean|cap|full]
                   [--review] [--max-sprints N] [--fiche <id>] [--no-fetch] [--base <branche>]

  défauts : --mode auto --delivery per-feature --tokens lean (ceux d'ezk-product-build)
  --no-fetch    ne rafraîchit pas origin (hors ligne) : la base est alors lue telle qu'elle est`);
  process.exit(2);
}

const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[], flag: string): T => {
  if (value === undefined || !(allowed as readonly string[]).includes(value)) {
    console.error(`${flag} attend ${allowed.join(', ')} (reçu « ${value ?? ''} »).`);
    usage();
  }
  return value as T;
};

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) usage();
  const settings: RunSettings = { mode: 'auto', delivery: 'per-feature', tokens: 'lean' };
  let fetch = true;
  let base: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--mode') settings.mode = oneOf<RunMode>(argv[++i], ['auto', 'manuel'], '--mode');
    else if (a === '--delivery') settings.delivery = oneOf<Delivery>(argv[++i], ['per-feature', 'per-epic'], '--delivery');
    else if (a === '--tokens') settings.tokens = oneOf<TokenSetting>(argv[++i], ['lean', 'cap', 'full'], '--tokens');
    else if (a === '--review') settings.review = true;
    else if (a === '--max-sprints') {
      const n = Number.parseInt(argv[++i] ?? '', 10);
      if (Number.isNaN(n) || n < 1) usage();
      settings.maxSprints = n;
    } else if (a === '--fiche') settings.fiche = argv[++i];
    else if (a === '--no-fetch') fetch = false;
    else if (a === '--base') base = argv[++i];
    else {
      console.error(`option inconnue : ${a}`);
      usage();
    }
  }
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const facts = collectRunFacts(cwd, { fetch, ...(base ? { base } : {}) });
  console.log(buildRunContext(settings, facts).lines.join('\n'));
}

main();
