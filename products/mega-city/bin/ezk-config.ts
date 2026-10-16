/**
 * CLI — LIT et PILOTE les capacités du plugin `github` depuis `.vectorz/config.yml`.
 *
 * Lecture (cran mince, fiche 20260916225506856) : résout et affiche `pr`/`ci`/`codex-review`.
 * Écriture (fiche 20260920111652514) : un interrupteur de terminal pour (dé)brancher GitHub
 * sur un projet, sans éditer le YAML à la main.
 *
 * Usage (le projet : `ezk --root <projet> config …`, sinon le dossier courant) :
 *   ezk config [show]                    # statut
 *   ezk config <projectRoot>             # statut d'un autre dossier (ancienne forme, gardée)
 *   ezk config github [status]           # statut
 *   ezk config github on|off             # (dé)connecte GitHub
 *   ezk config github <cap> on|off       # granulaire (pr|ci|codex-review)
 *
 * `install` / `uninstall` sont HORS PÉRIMÈTRE (axe 1 de la fiche 20260916225506858 —
 * rendre le plugin disponible par projet, non couvert ici).
 */
import { resolve } from 'node:path';
import {
  type GithubCapKey,
  type GithubMutation,
  githubCapabilities,
  integrationStrategy,
  writeGithubConfig,
} from '../src/loaders/project-config.js';
import { githubStatusText } from '../src/core/project-config.js';
import { EFFORTS, ROLES, TIERS, resolveAgent } from '../src/core/model-config.js';
import { type ModelMutation, loadModelConfig, writeModelConfig } from '../src/loaders/model-config.js';
import { projectRootOrExit } from '../src/io/project-root.js';

// `pnpm --dir products/mega-city …` change le cwd vers products/mega-city ; `INIT_CWD`
// conserve le répertoire d'invocation (la racine du projet). Un chemin relatif comme `.`
// vise donc la racine, pas le cwd de pnpm (revue Codex, PR #250).
const base = process.env.INIT_CWD ?? process.cwd();
// Le projet désigné (`ezk --root <projet> config …`) prime sur le dossier courant.
const target = projectRootOrExit(base);
const CAP_KEYS: readonly GithubCapKey[] = ['pr', 'ci', 'codex-review'];

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

function printStatus(root: string): void {
  console.log(githubStatusText(`${root}/.vectorz/config.yml`, githubCapabilities(root)));
  // La stratégie d'intégration sans PR (ADR-0061 D3, fiche 20261004083838687).
  console.log(`integration          ${integrationStrategy(root)}   (sans PR : comment une story arrive sur main)`);
}

/** Affiche, pour chaque agent : tier, modèle, effort et la SOURCE de la valeur. */
function printModels(root: string): void {
  const config = loadModelConfig(root);
  console.log('');
  console.log('Modèle par agent     tier     modèle               effort   source');
  for (const role of ROLES) {
    try {
      const r = resolveAgent(config, role);
      console.log(
        `  ${role.padEnd(16)} ${r.tier.padEnd(7)} ${r.model.padEnd(18)} ${String(r.effort).padEnd(7)} ${r.source}`,
      );
    } catch (err) {
      // Config invalide (tier/effort mal saisi à la main dans config.yml) : on dégrade
      // ligne par ligne comme printStatus, au lieu de casser toute la commande.
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ${role.padEnd(16)} — config invalide : ${msg}`);
    }
  }
}

function failUnknownTier(ctx: string, value: string): never {
  fail(`ezk:config ${ctx} : tier inconnu « ${value} » (attendus : ${TIERS.join(', ')}).`);
}

/**
 * Règle la config des modèles. Trois portées :
 *  - `roles set <agent> <tier>`   : le tier d'un rôle (portée projet) ;
 *  - `modeles set <tier> <modèle> [effort]` : la soupape projet tier→modèle ;
 *  - `agents set <agent> <modèle> [effort]` : le repli direct par agent ;
 *  - `<portée> unset <clé>`        : revenir au défaut.
 */
function handleModels(root: string, argv: readonly string[]): void {
  const scope = argv[0] as 'roles' | 'modeles' | 'agents';
  const verb = argv[1];
  if (verb !== 'set' && verb !== 'unset') {
    fail(`ezk:config ${scope} : attendu 'set' ou 'unset', reçu '${verb ?? '(rien)'}'.`);
  }
  const key = argv[2];
  const what = scope === 'modeles' ? 'un tier' : 'un agent';
  if (!key) fail(`ezk:config ${scope} ${verb} : il faut nommer ${what}.`);
  // Refus d'une clé inconnue AVANT d'écrire (pas de remplacement silencieux).
  if (scope === 'modeles') {
    if (!(TIERS as readonly string[]).includes(key)) failUnknownTier('modeles', key);
  } else if (!(ROLES as readonly string[]).includes(key)) {
    fail(`ezk:config ${scope} : agent inconnu « ${key} » (connus : ${ROLES.join(', ')}).`);
  }

  let mutation: ModelMutation;
  if (verb === 'unset') {
    if (scope === 'modeles') mutation = { scope: 'modeles', tier: key, unset: true };
    else if (scope === 'roles') mutation = { scope: 'roles', role: key, unset: true };
    else mutation = { scope: 'agents', role: key, unset: true };
  } else if (scope === 'roles') {
    const tier = argv[3];
    if (!tier) fail('ezk:config roles set <agent> <tier> : tier manquant.');
    if (!(TIERS as readonly string[]).includes(tier)) failUnknownTier('roles set', tier);
    mutation = { scope: 'roles', role: key, tier };
  } else {
    const model = argv[3];
    const effort = argv[4];
    if (effort !== undefined && !(EFFORTS as readonly string[]).includes(effort)) {
      fail(`ezk:config ${scope} set : effort inconnu « ${effort} » (attendus : ${EFFORTS.join(', ')}).`);
    }
    if (scope === 'modeles') {
      if (!model) fail('ezk:config modeles set <tier> <modèle> [effort] : modèle manquant.');
      mutation = effort !== undefined ? { scope, tier: key, model, effort } : { scope, tier: key, model };
    } else {
      if (!model && effort === undefined) fail('ezk:config agents set <agent> <modèle> [effort] : rien à régler.');
      mutation = {
        scope,
        role: key,
        ...(model ? { model } : {}),
        ...(effort !== undefined ? { effort } : {}),
      };
    }
  }

  const file = writeModelConfig(root, mutation);
  console.log(`Écrit : ${file}`);
  printModels(root);
}

function parseOnOff(word: string | undefined, ctx: string): boolean {
  if (word === 'on') return true;
  if (word === 'off') return false;
  fail(`ezk:config ${ctx} : attendu 'on' ou 'off', reçu '${word ?? '(rien)'}'.`);
}

const argv = target.rest;

// `roles` / `modeles` / `agents` : régler la config des modèles (projet visé).
if (argv[0] === 'roles' || argv[0] === 'modeles' || argv[0] === 'agents') {
  handleModels(target.root, argv);
  process.exit(0);
}

// `show` (ou rien) : le statut du projet + le modèle par agent.
// Rétro-compat 856 : un autre mot est une racine de projet.
if (argv[0] !== 'github') {
  const root = argv[0] && argv[0] !== 'show' ? resolve(base, argv[0]) : target.root;
  printStatus(root);
  printModels(root);
  process.exit(0);
}

// À partir d'ici : `ezk config github …` — pilotage de l'activation du projet.
const root = target.root;
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
