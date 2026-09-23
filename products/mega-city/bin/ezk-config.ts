/**
 * CLI — LIT et PILOTE les capacités du plugin `github` depuis `.vectorz/config.yml`.
 *
 * Lecture (cran mince, fiche 20260916225506856) : résout et affiche `pr`/`ci`/`codex-review`.
 * Écriture (fiche 20260920111652514) : un interrupteur de terminal pour (dé)brancher GitHub
 * sur un projet, sans éditer le YAML à la main.
 *
 * Usage :
 *   pnpm --dir products/mega-city ezk:config [projectRoot]        # statut (défaut : cwd)
 *   pnpm --dir products/mega-city ezk:config github [status]      # statut
 *   pnpm --dir products/mega-city ezk:config github on|off        # (dé)connecte GitHub
 *   pnpm --dir products/mega-city ezk:config github <cap> on|off  # granulaire (pr|ci|codex-review)
 *
 * `install` / `uninstall` sont HORS PÉRIMÈTRE (axe 1 de la fiche 20260916225506858 —
 * rendre le plugin disponible par projet, non couvert ici).
 */
import { resolve } from 'node:path';
import {
  type GithubCapKey,
  type GithubMutation,
  githubCapabilities,
  writeGithubConfig,
} from '../src/loaders/project-config.js';

// `pnpm --dir products/mega-city …` change le cwd vers products/mega-city ; `INIT_CWD`
// conserve le répertoire d'invocation (la racine du projet). Un chemin relatif comme `.`
// vise donc la racine, pas le cwd de pnpm (revue Codex, PR #250).
const base = process.env.INIT_CWD ?? process.cwd();
const CAP_KEYS: readonly GithubCapKey[] = ['pr', 'ci', 'codex-review'];

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

function printStatus(root: string): void {
  const caps = githubCapabilities(root);
  const flag = (on: boolean): string => (on ? 'ON ' : 'OFF');
  console.log(`Config projet    : ${root}/.vectorz/config.yml`);
  console.log(`github.pr            ${flag(caps.pr)}   (ouvrir une pull request)`);
  console.log(`github.ci            ${flag(caps.ci)}   (attendre la CI cloud)`);
  console.log(`github.codex-review  ${flag(caps.codexReview)}   (revue Codex)`);
}

function parseOnOff(word: string | undefined, ctx: string): boolean {
  if (word === 'on') return true;
  if (word === 'off') return false;
  fail(`ezk:config ${ctx} : attendu 'on' ou 'off', reçu '${word ?? '(rien)'}'.`);
}

const argv = process.argv.slice(2);

// Rétro-compat 856 : sans famille `github`, l'argument est une racine de projet optionnelle.
if (argv[0] !== 'github') {
  const root = argv[0] ? resolve(base, argv[0]) : base;
  printStatus(root);
  process.exit(0);
}

// À partir d'ici : `ezk:config github …` — pilotage de l'activation (cwd = racine).
const root = base;
const sub = argv[1];

if (sub === undefined || sub === 'status') {
  printStatus(root);
  process.exit(0);
}

if (sub === 'install' || sub === 'uninstall') {
  fail(
    `ezk:config github ${sub} : hors périmètre de cette commande (activation on/off seulement).\n` +
      `Rendre le plugin disponible/indisponible par projet = axe 1 de la fiche 20260916225506858 ` +
      `(install-par-projet), non couvert ici.`,
  );
}

let mutation: GithubMutation;
if (sub === 'on' || sub === 'off') {
  mutation = { kind: 'all', enabled: sub === 'on' };
} else if ((CAP_KEYS as readonly string[]).includes(sub)) {
  mutation = { kind: 'cap', cap: sub as GithubCapKey, enabled: parseOnOff(argv[2], `github ${sub}`) };
} else {
  fail(
    `ezk:config github : sous-commande inconnue '${sub}' ` +
      `(attendu : on | off | status | pr|ci|codex-review on|off).`,
  );
}

const file = writeGithubConfig(root, mutation);
console.log(`Écrit : ${file}`);
printStatus(root);
