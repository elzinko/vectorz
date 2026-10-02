/**
 * Commandes CITÉES dans un texte markdown : relevé + vérification d'existence.
 *
 * En clair : un document qui nomme une commande doit nommer une commande qui existe. Ce petit
 * outil lit un texte, relève chaque commande citée dans du code (entre accents graves ou dans un
 * bloc ```), et dit lesquelles n'existent pas. Il sert aux tests de fraîcheur (FAQ « comment
 * faire », tables « Et maintenant ? » des skills) : une commande fantôme rend la CI rouge.
 *
 * Trois sortes de mentions :
 *  - `/ezk-xxx [sous-commande]` : un skill (`skills/<nom>/SKILL.md`) ou une commande
 *    (`commands/<nom>.md`). La sous-commande doit figurer dans l'`argument-hint` du skill
 *    (seulement quand cet indice est une liste `[a|b|c]`).
 *  - `ezk-xxx` seul : un skill, une commande ou un agent (`agents/<nom>.md`).
 *  - `pnpm <script>` : un script du package.json racine ou de `products/mega-city`.
 * Les chemins, la prose et tout ce qui n'est pas dans du code sont ignorés.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface Mention {
  /** Numéro de ligne (1-based) dans le texte analysé. */
  line: number;
  kind: 'slash' | 'name' | 'pnpm';
  /** Nom du skill/commande/agent, ou script pnpm. */
  name: string;
  /** Sous-commande citée juste après `/ezk-xxx`, si le mot ressemble à une sous-commande. */
  sub?: string;
  raw: string;
}

export interface CommandIndex {
  /** nom du skill → texte intégral du SKILL.md */
  skills: Map<string, string>;
  commands: Set<string>;
  agents: Set<string>;
  /** scripts pnpm connus (racine + products/mega-city) */
  scripts: Set<string>;
}

const NAME = /^(?:ezk|vz|supervision)-[a-z0-9-]+$/;
const SLASH = /^\/((?:ezk|vz|supervision)-[a-z0-9-]+)(?:\s+(.*))?$/;

/** Sous-commandes natives de pnpm : elles ne sont pas des scripts du projet. */
const PNPM_BUILTINS = new Set([
  'add',
  'audit',
  'dedupe',
  'dlx',
  'exec',
  'fetch',
  'i',
  'init',
  'install',
  'link',
  'list',
  'ls',
  'outdated',
  'pack',
  'prune',
  'publish',
  'rebuild',
  'remove',
  'run',
  'store',
  'unlink',
  'up',
  'update',
  'why',
]);

function dirNames(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => keep(e.name))
    .map((e) => e.name);
}

function scriptsOf(packageJsonPath: string): string[] {
  if (!existsSync(packageJsonPath)) return [];
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return Object.keys(pkg.scripts ?? {});
}

/** Construit l'index des commandes existantes. `repoRoot` = racine du monorepo vectorz. */
export function loadCommandIndex(repoRoot: string): CommandIndex {
  const mega = join(repoRoot, 'products', 'mega-city');
  const skills = new Map<string, string>();
  for (const name of dirNames(join(mega, 'skills'), (n) => !n.startsWith('.'))) {
    const file = join(mega, 'skills', name, 'SKILL.md');
    if (existsSync(file)) skills.set(name, readFileSync(file, 'utf8'));
  }
  return {
    skills,
    commands: new Set(
      dirNames(join(mega, 'commands'), (n) => n.endsWith('.md')).map((n) => n.replace(/\.md$/, '')),
    ),
    agents: new Set(
      dirNames(join(mega, 'agents'), (n) => n.endsWith('.md')).map((n) => n.replace(/\.md$/, '')),
    ),
    scripts: new Set([
      ...scriptsOf(join(repoRoot, 'package.json')),
      ...scriptsOf(join(mega, 'package.json')),
    ]),
  };
}

/** Première cible d'une ligne `pnpm …` : saute `--dir <chemin>`, `--filter <x>` et les options. */
function pnpmTarget(raw: string): string | undefined {
  const tokens = raw.split(/\s+/);
  if (tokens[0] !== 'pnpm') return undefined;
  let i = 1;
  while (i < tokens.length) {
    const t = tokens[i] ?? '';
    if (t === '#') return undefined;
    if (['--dir', '-C', '--filter', '-F'].includes(t)) {
      i += 2;
      continue;
    }
    if (t.startsWith('-')) {
      i += 1;
      continue;
    }
    return t;
  }
  return undefined;
}

/** Relève les mentions de commandes dans le code d'un texte markdown. */
export function findMentions(markdown: string): Mention[] {
  const out: Mention[] = [];
  let inFence = false;
  markdown.split('\n').forEach((text, i) => {
    const line = i + 1;
    if (/^\s*```/.test(text)) {
      inFence = !inFence;
      return;
    }
    const spans = inFence
      ? [text.trim()]
      : [...text.matchAll(/`([^`]+)`/g)].map((m) => (m[1] ?? '').trim());
    for (const raw of spans) {
      const slash = SLASH.exec(raw);
      if (slash) {
        const first = (slash[2] ?? '').split(/\s+/)[0] ?? '';
        const sub = /^[a-z][a-z-]*$/.test(first) ? first : undefined;
        out.push({ line, kind: 'slash', name: slash[1] ?? '', ...(sub ? { sub } : {}), raw });
      } else if (NAME.test(raw)) {
        out.push({ line, kind: 'name', name: raw, raw });
      } else {
        const target = pnpmTarget(raw);
        if (target) out.push({ line, kind: 'pnpm', name: target, raw });
      }
    }
  });
  return out;
}

/** Sous-commandes déclarées par l'`argument-hint` d'un skill, si c'est une liste `[a|b|c]`. */
function declaredSubcommands(skillMd: string): Set<string> | undefined {
  const hint = /^argument-hint:\s*["']?(.+?)["']?\s*$/m.exec(skillMd)?.[1];
  const group = hint ? /^\[([a-z][a-z0-9|-]*)\]/.exec(hint)?.[1] : undefined;
  return group ? new Set(group.split('|')) : undefined;
}

/** Texte lisible expliquant pourquoi une mention est fausse, ou `undefined` si elle existe. */
export function whyGhost(m: Mention, index: CommandIndex): string | undefined {
  if (m.kind === 'pnpm') {
    return index.scripts.has(m.name) || PNPM_BUILTINS.has(m.name)
      ? undefined
      : `script pnpm inconnu « ${m.name} »`;
  }
  const isSkill = index.skills.has(m.name);
  const known = isSkill || index.commands.has(m.name) || index.agents.has(m.name);
  if (m.kind === 'name') {
    return known ? undefined : `ni skill, ni commande, ni agent « ${m.name} »`;
  }
  if (!isSkill && !index.commands.has(m.name)) return `ni skill, ni commande « /${m.name} »`;
  if (isSkill && m.sub) {
    const allowed = declaredSubcommands(index.skills.get(m.name) ?? '');
    if (allowed && !allowed.has(m.sub)) {
      return `sous-commande inconnue « ${m.sub} » pour /${m.name} (connues : ${[...allowed].join(', ')})`;
    }
  }
  return undefined;
}

/** Une ligne par mention fausse : `L12: <texte> — <raison>`. Liste vide = tout existe. */
export function ghostMentions(markdown: string, index: CommandIndex): string[] {
  const ghosts: string[] = [];
  for (const m of findMentions(markdown)) {
    const why = whyGhost(m, index);
    if (why) ghosts.push(`L${m.line}: \`${m.raw}\` — ${why}`);
  }
  return ghosts;
}
