#!/usr/bin/env tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
/**
 * lawgiver — CLI du moteur déterministe (ADR-0003 / ADR-0004).
 *
 *   lawgiver bind <profile> <projet> [host] [--force] (host par défaut : claude-code)
 *   lawgiver bind-global <profile> [--link] [--target <dossier>]  (matérialise dans ~/.claude — fiche 0017/0018)
 *   lawgiver status <profile> [--target <dossier>]   (ce qui est déployé : lien, copie, absent — lecture seule)
 *   lawgiver doctor <profile> [--target <dossier>]   (ce qui est déclaré mais pas installé — lecture seule, code 1 si écart)
 *   lawgiver capture <cible> <kind> --content "<md>"  (kind = rule|skill|agent|interaction)
 *
 * Ce que chaque déploiement écrit — et n'écrit PAS (fiche 20260903134909124, ADR-0056) :
 *   bind <profil> <projet>   ÉCRIT  <projet>/.claude/agents, .claude/skills, .iamthelaw/ENTRY.md (la loi),
 *                                   un bloc dans CLAUDE.md, les hooks git.   N'ÉCRIT PAS  ~/.claude.
 *   bind-global <profil>     ÉCRIT  ~/.claude/skills, ~/.claude/agents, ~/.claude/commands (les slash-commands),
 *                                   ~/.claude/rules/iamthelaw.md (la loi du profil, en copie compilée même avec --link).
 *                                   N'ÉCRIT PAS  ~/.claude/CLAUDE.md, ni de hook, ni rien dans un projet.
 *   --target <dossier>       vise un autre dossier que ~/.claude (essais sur dossier jetable).
 *
 * Parse les args, calcule un plan PUR puis l'applique via la coquille I/O unique.
 * Aucune logique métier ici. Pour `capture`, le markdown est fourni par `--content`
 * (les vrais ports LLM author/judge sont injectés ailleurs ; le POC ne câble aucun
 * appel LLM réel — ADR-0004 §2).
 */
import { fileURLToPath } from 'node:url';
import { bind } from '../src/core/bind.js';
import { planCapture } from '../src/core/capture.js';
import { checkComposition, checkRoles } from '../src/core/composition.js';
import { diagnose, exitCodeOf, renderDiagnosis } from '../src/core/deploy-doctor.js';
import { expectedItems, inspect, renderStatus } from '../src/core/deploy-state.js';
import { expandProfile } from '../src/core/expand.js';
import { parseManifest } from '../src/core/ezk-cli.js';
import { type CommandSpec, IDE_TARGETS, genIdeFiles } from '../src/core/gen-ide.js';
import type { HostId, LearningEntry } from '../src/domain/model.js';
import { applyGlobalPlan, applyPlan, staleFlatSkillFiles } from '../src/io/apply.js';
import { applyCapture } from '../src/io/capture.js';
import { probePath, readText } from '../src/io/deploy-probe.js';
import { loadCatalog } from '../src/loaders/catalog.js';
import { loadRenames } from '../src/loaders/renames.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(): never {
  console.error('Usage: lawgiver bind <profile> <projet> [host] [--force]');
  console.error('       lawgiver bind-global <profile> [--link] [--target <dossier>]');
  console.error('       lawgiver status <profile> [--target <dossier>]');
  console.error('       lawgiver doctor <profile> [--target <dossier>]');
  console.error('       lawgiver capture <cible> <kind> --content "<markdown>" [--for <agentId>]');
  process.exit(2);
}

/** Où `bind-global`, `status` et `doctor` travaillent par défaut : le `~/.claude` de l'utilisateur. */
function defaultTarget(): string {
  return join(homedir(), '.claude');
}

/**
 * La cible de `bind-global`, `status` et `doctor`. `--target <dossier>` si on le donne ; le vrai
 * `~/.claude` seulement quand l'option est ABSENTE. Une option présente sans valeur (« --target »
 * seul, ou suivi d'une autre option) est une faute de frappe : on s'arrête au lieu de retomber
 * en silence sur le vrai `~/.claude`.
 */
function targetOf(args: string[]): { target: string; explicit: boolean } {
  const at = args.indexOf('--target');
  if (at === -1) return { target: defaultTarget(), explicit: false };
  const value = args[at + 1];
  if (value === undefined || value.startsWith('--')) {
    console.error(
      'lawgiver: « --target » attend un dossier (sans lui, la cible serait le vrai ~/.claude).',
    );
    process.exit(2);
  }
  return { target: value, explicit: true };
}

/** Les arguments positionnels : ni option (`--x`), ni valeur d'une option qui en prend une. */
function positional(args: string[], valueFlags: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string;
    if (valueFlags.includes(arg)) i += 1;
    else if (!arg.startsWith('--')) out.push(arg);
  }
  return out;
}

/**
 * doctor — compare ce que `bind-global <profil>` déposerait à ce qui est vraiment installé :
 * élément manquant, lien mort, copie périmée, loi absente ou périmée. LECTURE SEULE. Code retour
 * 1 s'il reste une divergence (composable en gate). `--target` vise un autre dossier que `~/.claude`.
 */
function runDoctor(profile: string, target: string, explicitTarget: boolean): void {
  const root = resolve(target);
  try {
    const plan = bind(profile, root, 'claude-code-global', repoRoot);
    const diagnosis = diagnose(plan, {
      fact: (rel) => probePath(root, rel),
      readText: (rel) => readText(root, rel),
    });
    process.stdout.write(
      renderDiagnosis(profile, root, diagnosis, explicitTarget ? { target: root } : {}),
    );
    process.exitCode = exitCodeOf(diagnosis);
  } catch (error) {
    console.error(`lawgiver: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

/**
 * status — ce que `bind-global <profil>` déposerait, et ce qui y est vraiment (lien, copie,
 * absent, lien mort). LECTURE SEULE : rien n'est écrit. `--target` vise un autre dossier que
 * `~/.claude` (c'est ainsi que les tests le prouvent sur un dossier jetable).
 */
function runStatus(profile: string, target: string): void {
  const root = resolve(target);
  try {
    const plan = bind(profile, root, 'claude-code-global', repoRoot);
    const entries = inspect(expectedItems(plan), (rel) => probePath(root, rel));
    process.stdout.write(renderStatus(profile, root, entries));
  } catch (error) {
    console.error(`lawgiver: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

function runBind(profile: string, projectDir: string, host: HostId, force: boolean): void {
  const absoluteProject = resolve(projectDir);
  const plan = bind(profile, absoluteProject, host, repoRoot);
  applyPlan(plan, absoluteProject, { force });
  const files = plan.files.length;
  const hooks = plan.hooks.length;
  console.log(
    `lawgiver: bind '${profile}' → ${absoluteProject} [${host}] : ${files} fichier(s), ${hooks} hook(s).`,
  );
  // Les skills du projet sont des DOSSIERS depuis la fiche 20260813095351680 : un ancien fichier plat n'est
  // plus écrit ni lu, mais on ne le supprime pas — on le signale.
  for (const rel of staleFlatSkillFiles(plan, absoluteProject)) {
    console.warn(
      `  ⚠️ ancien fichier plat laissé en place : ${rel} (forme d'avant, plus écrite). Supprime-le s'il vient d'un ancien bind.`,
    );
  }
  reportComposition(profile);
}

/**
 * bind-global — matérialise un profil dans `~/.claude` (fiche 0017/0018). SEUL point qui
 * résout la racine globale ; le cœur (cap + plan) la reçoit en paramètre. Coquille
 * I/O non-destructive : ne remplace que ses propres entrées.
 *   - défaut : `copy` (contenu figé) ;
 *   - `--link` : symlink live-update vers la source du catalogue (`catalogRoot = repoRoot`),
 *     un `git pull` dans mega-city met alors à jour partout. La LOI, elle, est un fichier
 *     compilé : écrite en copie dans les deux modes (rejouer la commande après un changement de règle) ;
 *   - `--target <dossier>` : un autre dossier que `~/.claude` (essais sur dossier jetable).
 */
function runBindGlobal(profile: string, link: boolean, target: string): void {
  const root = resolve(target);
  const plan = bind(profile, root, 'claude-code-global', repoRoot);
  const mode = link ? 'link' : 'copy';
  // Registre des renommages (renames.yml) : le re-bind retire proprement les ANCIENS noms.
  const report = applyGlobalPlan(plan, root, {
    mode,
    catalogRoot: repoRoot,
    renames: loadRenames(repoRoot),
  });
  console.log(
    `lawgiver: bind-global '${profile}' → ${root} [claude-code-global] (${mode}) : ${plan.files.length} fichier(s).`,
  );
  for (const rel of report.retires) console.log(`  🧹 renommage nettoyé : ${rel} retiré.`);
  for (const rel of report.residus) {
    console.warn(`  ⚠️ résidu de renommage NON géré, laissé en place : ${rel} (retrait manuel).`);
  }
  reportComposition(profile);
}

/**
 * ADR-0025 — diagnostic NON BLOQUANT : le bind a déjà réussi ci-dessus. `bind()`
 * reste pur et ne retourne pas le profil résolu ; on refait ici le load+expand
 * (bon marché, déterministe) pour éviter de changer sa signature — le bord
 * (CLI) rend visible ce que le cœur calcule, il ne le recalcule pas autrement.
 */
function reportComposition(profileId: string): void {
  const catalog = loadCatalog(repoRoot);
  const profile = catalog.profiles.get(profileId);
  if (!profile) return;
  const resolved = expandProfile(profile, catalog);
  for (const { from, missing } of checkComposition(resolved, catalog)) {
    console.error(
      `⚠️  composition : « ${from} » compose « ${missing} » mais ce composant est absent du profil bindé`,
    );
  }
  for (const { from, missing } of checkRoles(resolved, catalog)) {
    console.error(
      `⚠️  rôles : « ${from} » convoque l'agent « ${missing} » mais il est absent du profil bindé`,
    );
  }
}

const CAPTURE_KINDS: ReadonlyArray<LearningEntry['kind']> = [
  'rule',
  'skill',
  'agent',
  'interaction',
];

function isCaptureKind(value: string): value is LearningEntry['kind'] {
  return (CAPTURE_KINDS as readonly string[]).includes(value);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function runCapture(target: string, kind: string, content: string, forAgentId?: string): void {
  if (!isCaptureKind(kind)) usage();
  const plan = planCapture(target, kind, content, today(), '', forAgentId);
  applyCapture(plan, repoRoot);
  const wired = plan.agentWiring
    ? ` + ${plan.agentWiring.agentPath} (${plan.agentWiring.listField})`
    : '';
  console.log(
    `lawgiver: capture ${kind} '${target}' → ${plan.artifact.path} + journal${wired} + commit.`,
  );
}

function parseFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}

function parseContentFlag(args: string[]): string {
  const content = parseFlag(args, '--content');
  if (!content) usage();
  return content;
}

/**
 * gen-ide — génère, depuis la source unique (le manifeste), un jeu de fichiers PAR IDE
 * (`.claude/`, `.cursor/`, `AGENTS.md`) où seule la syntaxe d'invocation diffère (fiche
 * 20261007151859470, ADR-0073). POC : un sous-ensemble de commandes `ezk`, lecture seule du côté
 * logique (les fichiers générés ne font qu'appeler `ezk`). `--check` échoue si une copie a dérivé.
 */
const GEN_IDE_POC_SUBSET: ReadonlySet<string> = new Set([
  'now',
  'paths',
  'backlog check',
  'graph query',
]);

function genIdeCommandSpecs(): CommandSpec[] {
  const manifest = parseManifest(readFileSync(join(repoRoot, 'ezk-manifest.yml'), 'utf8'));
  const specs: CommandSpec[] = [];
  for (const e of manifest.commands) {
    const name = e.verb ? `${e.domain} ${e.verb}` : e.domain;
    if (!GEN_IDE_POC_SUBSET.has(name)) continue;
    specs.push({ slug: name.replace(/\s+/g, '-'), invocation: `ezk ${name}`, summary: e.summary });
  }
  return specs.sort((a, b) => a.slug.localeCompare(b.slug));
}

function runGenIde(root: string, check: boolean): void {
  const files = genIdeFiles(genIdeCommandSpecs());
  if (check) {
    const drift = files.filter((f) => {
      const abs = join(root, f.path);
      return !existsSync(abs) || readFileSync(abs, 'utf8') !== f.content;
    });
    if (drift.length > 0) {
      console.error(
        `gen-ide --check : ${drift.length} fichier(s) absent(s) ou édité(s) à la main :`,
      );
      for (const f of drift) console.error(`  - ${f.path}`);
      console.error('Régénère : lawgiver gen-ide --root <projet>');
      process.exit(1);
    }
    console.log(`gen-ide --check : ${files.length} fichier(s) à jour (aucune dérive).`);
    return;
  }
  for (const f of files) {
    const abs = join(root, f.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, f.content);
  }
  console.log(
    `gen-ide : ${files.length} fichier(s) sous ${root} (${IDE_TARGETS.join('/')} + AGENTS.md). Régénérable ; ne pas éditer les copies.`,
  );
}

function main(argv: string[]): void {
  const [command, ...rest] = argv;
  if (command === 'gen-ide') {
    const root = parseFlag(rest, '--root') ?? process.env.INIT_CWD ?? process.cwd();
    return runGenIde(resolve(root), rest.includes('--check'));
  }
  if (command === 'bind') {
    const force = rest.includes('--force');
    const [profile, projectDir, host = 'claude-code'] = rest.filter((arg) => arg !== '--force');
    if (!profile || !projectDir) usage();
    return runBind(profile, projectDir, host, force);
  }
  if (command === 'bind-global') {
    const [profile] = positional(rest, ['--target']);
    if (!profile) usage();
    return runBindGlobal(profile, rest.includes('--link'), targetOf(rest).target);
  }
  if (command === 'status') {
    const [profile] = positional(rest, ['--target']);
    if (!profile) usage();
    return runStatus(profile, targetOf(rest).target);
  }
  if (command === 'doctor') {
    const [profile] = positional(rest, ['--target']);
    if (!profile) usage();
    const { target, explicit } = targetOf(rest);
    return runDoctor(profile, target, explicit);
  }
  if (command === 'capture') {
    const [target, kind] = rest;
    if (!target || !kind) usage();
    return runCapture(target, kind, parseContentFlag(rest), parseFlag(rest, '--for'));
  }
  usage();
}

main(process.argv.slice(2));
