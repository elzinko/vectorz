/**
 * ezk-cli — cœur PUR du routeur `ezk` (fiche 20260903134906920, ADR-0046 option B).
 *
 * Un manifeste YAML dit quelle commande de terminal (`ezk <domaine> <verbe>`) lance quel
 * script. Ce module lit le manifeste, choisit le script et ses arguments, applique la règle de
 * racine et rend l'aide. Il ne lance AUCUN processus et ne lit AUCUN fichier : le bord I/O
 * (bin/ezk.ts) lui passe le texte du manifeste et exécute l'étape qu'il rend.
 * Le moteur reste « plan pur + coquille I/O » (ADR-0003) ; le CLI n'est qu'un bord de plus.
 */
import { dirname, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

/** Où vit le manifeste, depuis la racine d'un checkout de la méthode : sert à reconnaître un checkout. */
export const MANIFEST_RELPATH = 'products/mega-city/ezk-manifest.yml';

/** `fixed` : lit/écrit les fichiers du dépôt de la méthode. `none` : indépendante du dépôt courant. */
export type RootPolicy = 'fixed' | 'none';

export interface ManifestEntry {
  domain: string;
  /** Absent : le domaine EST la commande, tous les arguments vont au script. */
  verb?: string;
  /**
   * Un script (chemin depuis products/mega-city) + ses arguments fixes, séparés par des espaces
   * (un argument entre guillemets doubles reste entier ; `{root}` = la racine du dépôt de la méthode).
   */
  run: string;
  summary: string;
  root: RootPolicy;
  /** Nouveau nom : l'entrée est un ancien nom, gardé le temps de la transition. */
  deprecated?: string;
}

export interface InternalScript {
  script: string;
  reason: string;
}

export interface Manifest {
  commands: ManifestEntry[];
  internal: InternalScript[];
}

/** Un script à lancer, avec les arguments dans l'ordre : ceux du manifeste, puis ceux de l'utilisateur. */
export interface Step {
  script: string;
  args: string[];
}

export interface RouterEnv {
  /** Racine du checkout qui porte CE routeur (déjà normalisée par le bord). */
  ownRoot: string;
  /** Racine du checkout qui contient le dossier courant, s'il y en a un. */
  checkoutRoot?: string;
  /** Valeur de `--root`, déjà résolue en absolu. */
  rootFlag?: string;
}

export type Resolution =
  | { kind: 'run'; entry: ManifestEntry; step: Step; notices: string[] }
  | { kind: 'help'; topic?: string }
  | { kind: 'error'; message: string; exitCode: 2 };

export interface ChatCommand {
  name: string;
  argHint: string;
  summary: string;
}

const NAME = /^[a-z][a-z0-9-]*$/;

function fail(where: string, problem: string): never {
  throw new Error(`manifeste ezk, ${where} : ${problem}`);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readEntry(raw: unknown, index: number): ManifestEntry {
  const where = `entrée ${index + 1}`;
  if (!isRecord(raw)) fail(where, 'doit être un objet.');
  const { domain, verb, run, summary, root, deprecated } = raw;
  if (typeof domain !== 'string' || !NAME.test(domain)) fail(where, 'domain manquant ou invalide.');
  const label = `${domain}${typeof verb === 'string' ? ` ${verb}` : ''}`;
  if (verb !== undefined && (typeof verb !== 'string' || !NAME.test(verb))) {
    fail(label, 'verb invalide.');
  }
  if (typeof summary !== 'string' || summary.trim() === '') fail(label, 'résumé (summary) manquant.');
  if (/\n/.test(summary)) fail(label, 'le résumé doit tenir sur une ligne.');
  if (typeof run !== 'string' || run.trim() === '') fail(label, 'run (le script à lancer) manquant.');
  const rootPolicy = root ?? 'fixed';
  if (rootPolicy !== 'fixed' && rootPolicy !== 'none') fail(label, "root doit valoir 'fixed' ou 'none'.");
  if (deprecated !== undefined && typeof deprecated !== 'string') fail(label, 'deprecated invalide.');
  return {
    domain,
    ...(typeof verb === 'string' ? { verb } : {}),
    run: run.trim(),
    summary: summary.trim(),
    root: rootPolicy,
    ...(typeof deprecated === 'string' ? { deprecated } : {}),
  };
}

function checkGrammar(commands: ManifestEntry[]): void {
  const seen = new Set<string>();
  const byDomain = new Map<string, ManifestEntry[]>();
  for (const e of commands) {
    const key = `${e.domain} ${e.verb ?? ''}`.trim();
    if (seen.has(key)) fail(key, 'doublon (même domaine et même verbe).');
    seen.add(key);
    byDomain.set(e.domain, [...(byDomain.get(e.domain) ?? []), e]);
  }
  for (const [domain, entries] of byDomain) {
    const withVerb = entries.filter((e) => e.verb !== undefined).length;
    if (withVerb !== 0 && withVerb !== entries.length) {
      fail(domain, 'mêle une entrée sans verbe et des verbes : choisis l’un ou l’autre.');
    }
  }
}

/** Lit et VALIDE le texte du manifeste. Échoue avec un message qui dit quelle entrée est fausse. */
export function parseManifest(text: string): Manifest {
  const doc: unknown = parseYaml(text);
  if (!isRecord(doc) || !Array.isArray(doc.commands)) fail('racine', 'la liste « commands » manque.');
  const commands = doc.commands.map(readEntry);
  checkGrammar(commands);
  const internalRaw: unknown = doc.internal ?? [];
  if (!Array.isArray(internalRaw)) fail('internal', 'doit être une liste.');
  const internal = internalRaw.map((raw, i): InternalScript => {
    if (!isRecord(raw) || typeof raw.script !== 'string' || typeof raw.reason !== 'string') {
      fail(`internal ${i + 1}`, 'script et reason (texte) sont requis.');
    }
    return { script: raw.script, reason: raw.reason };
  });
  return { commands, internal };
}

/** Découpe un `run` : des mots séparés par des espaces ; un argument entre guillemets doubles reste entier. */
function tokenize(run: string): string[] {
  return [...run.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2] ?? '');
}

/**
 * Le `run` d'une entrée = un script puis ses arguments fixes. Un argument fixe peut contenir
 * `{root}` : la racine du dépôt de la méthode (remplacée par `route`).
 */
export function entryStep(entry: ManifestEntry): Step {
  const [script = '', ...args] = tokenize(entry.run);
  return { script, args };
}

/**
 * Les scripts de bin/ que des scripts pnpm lancent, mais que le manifeste ignore : ni routés,
 * ni déclarés `internal`. Un script oublié se voit ici. Les `bin/test-*.sh` sont des tests.
 */
export function uncoveredScripts(manifest: Manifest, pnpmScripts: Record<string, string>): string[] {
  const known = new Set<string>(manifest.internal.map((i) => i.script));
  for (const entry of manifest.commands) known.add(entryStep(entry).script);
  const cited = new Set<string>();
  for (const command of Object.values(pnpmScripts)) {
    for (const match of command.matchAll(/\bbin\/[\w.-]+\.(?:ts|sh)\b/g)) cited.add(match[0]);
  }
  return [...cited].filter((s) => !known.has(s) && !/^bin\/test-[\w.-]+\.sh$/.test(s)).sort();
}

function label(entry: ManifestEntry): string {
  return `${entry.domain}${entry.verb ? ` ${entry.verb}` : ''}`;
}

function rootProblem(entry: ManifestEntry, env: RouterEnv): string | undefined {
  if (entry.root === 'none') return undefined;
  const name = `ezk ${label(entry)}`;
  if (env.rootFlag !== undefined) {
    if (env.rootFlag === env.ownRoot) return undefined;
    // Le chantier qui permettra de viser un autre projet : fiche 20260826173221323 (racine
    // paramétrable des vues). On n'en cite pas le numéro à l'utilisateur.
    return (
      `${name} : « --root ${env.rootFlag} » n'est pas le dépôt de la méthode (${env.ownRoot}). ` +
      "Viser un autre projet n'est pas encore possible : le chantier « racine paramétrable des vues » n'est pas fait."
    );
  }
  if (env.checkoutRoot === env.ownRoot) return undefined;
  const where =
    env.checkoutRoot === undefined
      ? "tu n'es dans aucun dépôt de la méthode"
      : `tu es dans un autre checkout de la méthode (${env.checkoutRoot})`;
  return (
    `${name} : cette commande travaille sur les fichiers du dépôt de la méthode (${env.ownRoot}), mais ${where}.\n` +
    `  Lance-la depuis ce dépôt, ou ajoute « --root ${env.ownRoot} » avant la commande.`
  );
}

const HELP_WORDS = new Set(['help', '--help', '-h']);

/** Choisit quoi faire d'une ligne de commande (sans les options du routeur). Rien n'est exécuté. */
export function route(manifest: Manifest, args: string[], env: RouterEnv): Resolution {
  const [domain, ...tail] = args;
  if (domain === undefined) return { kind: 'help' };
  if (HELP_WORDS.has(domain)) {
    return domain === 'help' && tail[0] !== undefined ? { kind: 'help', topic: tail[0] } : { kind: 'help' };
  }
  const entries = manifest.commands.filter((e) => e.domain === domain);
  if (entries.length === 0) {
    return { kind: 'error', exitCode: 2, message: `ezk : commande inconnue « ${domain} ». Essaie « ezk help ».` };
  }
  let entry = entries.find((e) => e.verb === undefined);
  let userArgs = tail;
  if (!entry) {
    const [verb, ...rest] = tail;
    entry = entries.find((e) => e.verb === verb);
    userArgs = rest;
    if (!entry) {
      const verbs = entries.map((e) => e.verb).join(', ');
      const what = verb === undefined ? 'il manque un verbe' : `verbe inconnu « ${verb} »`;
      return {
        kind: 'error',
        exitCode: 2,
        message: `ezk ${domain} : ${what}. Verbes : ${verbs}. (« ezk help ${domain} » pour le détail.)`,
      };
    }
  }
  const problem = rootProblem(entry, env);
  if (problem) return { kind: 'error', exitCode: 2, message: problem };

  const fixed = entryStep(entry);
  const notices = entry.deprecated
    ? [`« ezk ${label(entry)} » est renommé « ezk ${entry.deprecated} » ; l'ancien nom marche encore le temps de la transition.`]
    : [];
  // `{root}` : la racine du dépôt de la méthode, que la règle de racine vient d'autoriser. Les
  // arguments de l'utilisateur, eux, passent tels quels.
  const fixedArgs = fixed.args.map((a) => a.replaceAll('{root}', env.ownRoot));
  return { kind: 'run', entry, step: { script: fixed.script, args: [...fixedArgs, ...userArgs] }, notices };
}

/** Options du routeur : placées AVANT la commande seulement. Celles d'après sont pour le script. */
export function splitRouterFlags(argv: string[]): {
  rootFlag?: string;
  dryRun: boolean;
  rest: string[];
  error?: string;
} {
  let rootFlag: string | undefined;
  let dryRun = false;
  let i = 0;
  for (; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    if (a === '--dry-run') {
      dryRun = true;
    } else if (a === '--root') {
      const value = argv[i + 1];
      if (value === undefined) return { dryRun, rest: [], error: 'ezk : « --root » attend un dossier.' };
      rootFlag = value;
      i += 1;
    } else if (a.startsWith('--root=')) {
      rootFlag = a.slice('--root='.length);
    } else {
      break;
    }
  }
  return { ...(rootFlag !== undefined ? { rootFlag } : {}), dryRun, rest: argv.slice(i) };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** L'aide : « En clair » d'abord, puis les deux familles de commandes, une ligne par commande. */
export function renderHelp(manifest: Manifest, chat: ChatCommand[]): string {
  const terminal = manifest.commands.filter((e) => !e.deprecated);
  const width = Math.max(...terminal.map((e) => label(e).length), 0);
  const chatWidth = Math.max(...chat.map((c) => c.name.length + 1), 0);
  const termLines = terminal.map((e) => `  ${label(e).padEnd(width)}  ${e.summary}`);
  const chatLines = chat.map((c) => `  ${`/${c.name}`.padEnd(chatWidth)}  ${truncate(c.summary, 100)}`);
  return [
    "En clair. « ezk » est la commande de terminal de la méthode : un seul point d'entrée",
    'qui lance les scripts existants, sans rien recalculer. Deux familles vivent côte à côte :',
    'les commandes de terminal (« ezk <domaine> <verbe> ») et les commandes de chat',
    '(« /ezk-… », dans Claude Code).',
    '',
    'Commandes de terminal',
    ...termLines,
    '',
    'Commandes de chat (dans Claude Code)',
    ...chatLines,
    '',
    'Options du routeur, avant la commande : --root <dépôt> (le dépôt de la méthode visé), --dry-run (montre le script sans le lancer).',
    '« ezk help <domaine> » détaille un domaine ; « ezk help <skill> » détaille une commande de chat.',
    '',
  ].join('\n');
}

/** Le détail d'un domaine : ses verbes, leur résumé et le script lancé. Rien s'il n'existe pas. */
export function renderDomainHelp(manifest: Manifest, domain: string): string | undefined {
  const entries = manifest.commands.filter((e) => e.domain === domain);
  if (entries.length === 0) return undefined;
  const width = Math.max(...entries.map((e) => label(e).length));
  const lines = entries.map((e) => {
    const step = entryStep(e);
    return `  ${label(e).padEnd(width)}  ${e.summary}\n  ${' '.repeat(width)}  lance : ${[step.script, ...step.args].join(' ')}`;
  });
  return `ezk ${domain}\n\n${lines.join('\n')}\n`;
}

/** Le checkout de la méthode qui contient `cwd` : le plus proche ancêtre qui porte le manifeste. */
export function findCheckoutRoot(cwd: string, exists: (path: string) => boolean): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (exists(join(dir, MANIFEST_RELPATH))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
