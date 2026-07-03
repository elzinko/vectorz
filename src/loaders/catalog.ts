/**
 * Loader de catalogue — frontière entrante, PURE vis-à-vis du métier (ADR-0003).
 *
 * Lit les dossiers du repo et indexe CHAQUE entité par l'`id` de son frontmatter,
 * jamais par le nom de fichier (`rules/clean-code.md` → id `clean-code/no-dead-code`).
 * Markdown+frontmatter via gray-matter ; YAML via `yaml`.
 *
 * Tolérances (données réelles) :
 *   - `kind` absent ⇒ 'disposition' (ADR-0002).
 *   - skills = sous-dossiers `skills/<name>/SKILL.md` (id = `name`) ; sous-dossier sans SKILL.md ignoré.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import type { Agent, Bundle, Profile, Rule, RuleKind, Skill } from '../domain/model.js';

export interface Catalog {
  rules: Map<string, Rule>;
  agents: Map<string, Agent>;
  skills: Map<string, Skill>;
  bundles: Map<string, Bundle>;
  profiles: Map<string, Profile>;
}

const MARKDOWN = /\.md$/;
const YAML = /\.ya?ml$/;

/**
 * Un `id` devient un segment de chemin de sortie (`.claude/agents/<id>.md`).
 * On rejette tout id qui pourrait s'échapper du projet hôte : segment `..`,
 * chemin absolu, antislash ou NUL. Le `/` interne reste autorisé (ids légitimes
 * comme `clean-code/no-dead-code`). Validation à la frontière entrante (F1).
 */
const UNSAFE_ID = /(^|\/)\.\.(\/|$)|^\/|\\|\0/;

export function assertSafeId(id: string): string {
  if (id.length === 0 || UNSAFE_ID.test(id)) {
    throw new Error(`id non sûr (traversal de chemin refusé) : ${JSON.stringify(id)}`);
  }
  return id;
}

function listFiles(dir: string, match: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => match.test(name))
    .sort() // tri stable : « dernier-gagne » déterministe en cas de collision d'id (F4)
    .map((name) => join(dir, name));
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(assertSafeId(item.id), item); // dernier-gagne (ADR-0003)
  return map;
}

function readRule(file: string): Rule | undefined {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  if (typeof data.id !== 'string') return undefined;
  const kind: RuleKind = data.kind === 'interaction' ? 'interaction' : 'disposition';
  return {
    id: data.id,
    kind,
    level: data.level,
    content: content.trim(),
    enforcements: data.enforcements,
    participants: data.participants,
  };
}

function readAgent(file: string): Agent | undefined {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  // Agents mega-city : `id` ; sous-agents Claude Code migrés : `name`. On accepte les deux.
  const id = typeof data.name === 'string' ? data.name : data.id;
  if (typeof id !== 'string') return undefined;
  return {
    id,
    role: content.trim(),
    competences: data.competences ?? [],
    interactions: data.interactions ?? [],
  };
}

/** Skills : id = `name` du frontmatter, à défaut `id`, à défaut le nom du dossier. */
function readSkill(file: string, fallbackId: string): Skill {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  const id =
    typeof data.name === 'string'
      ? data.name
      : typeof data.id === 'string'
        ? data.id
        : fallbackId;
  return { id, content: content.trim() };
}

const SKILL_FILE = 'SKILL.md';

/**
 * Skills = sous-dossiers `skills/<name>/SKILL.md` (convention mega-city, cf.
 * skills/README.md et ADR-0007). Un sous-dossier sans SKILL.md est ignoré
 * (tolérant). Tri stable des dossiers ; index par l'`id` (= `name` du frontmatter).
 */
function loadSkills(skillsRoot: string): Map<string, Skill> {
  if (!existsSync(skillsRoot)) return new Map();
  const items = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => ({ name, file: join(skillsRoot, name, SKILL_FILE) }))
    .filter(({ file }) => existsSync(file))
    .map(({ name, file }) => readSkill(file, name));
  return indexById(items);
}

function readYamlEntity<T>(file: string): T {
  return parseYaml(readFileSync(file, 'utf8')) as T;
}

function loadMarkdown<T extends { id: string }>(
  dir: string,
  read: (file: string) => T | undefined,
): Map<string, T> {
  const items = listFiles(dir, MARKDOWN)
    .map(read)
    .filter((item): item is T => item !== undefined);
  return indexById(items);
}

function loadYaml<T extends { id: string }>(dir: string): Map<string, T> {
  const items = listFiles(dir, YAML).map((file) => readYamlEntity<T>(file));
  return indexById(items);
}

/** Charge tout le catalogue depuis la racine du repo. Pur (lecture seule, déterministe). */
export function loadCatalog(rootDir: string): Catalog {
  return {
    rules: loadMarkdown(join(rootDir, 'rules'), readRule),
    agents: loadMarkdown(join(rootDir, 'agents'), readAgent),
    skills: loadSkills(join(rootDir, 'skills')),
    bundles: loadYaml<Bundle>(join(rootDir, 'bundles')),
    profiles: loadYaml<Profile>(join(rootDir, 'profiles')),
  };
}
