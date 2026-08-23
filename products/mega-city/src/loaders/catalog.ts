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
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import type {
  Agent,
  Bundle,
  Enforcement,
  Profile,
  Rule,
  RuleKind,
  Skill,
  SkillAsset,
} from '../domain/model.js';

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

/**
 * Liste les fichiers d'un dossier qui matchent `match`. `recursive` descend dans les
 * sous-dossiers : requis pour `rules/`, dont les ids slashés (`clean-code/no-todo`)
 * produisent des sous-dossiers `rules/<ns>/<name>.md` (capture, fiche 0037 ; migration
 * fiche 0006). Tri stable sur le chemin complet → « dernier-gagne » déterministe (F4).
 */
function listFiles(dir: string, match: RegExp, recursive = false): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...listFiles(full, match, true));
    } else if (match.test(entry.name)) {
      files.push(full);
    }
  }
  return files.sort();
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(assertSafeId(item.id), item); // dernier-gagne (ADR-0003)
  return map;
}

/** `path` est-il `root` lui-même ou un descendant de `root` ? Comparaison sur des chemins déjà résolus. */
function isInside(root: string, path: string): boolean {
  return path === root || path.startsWith(root + sep);
}

/**
 * Résout `enforcement.hook.script` d'un chemin (frontmatter, ex. 'hooks/commit-msg.sh')
 * vers son CONTENU (fiche 0011) : le cap (pur, ADR-0003) ne fait plus d'I/O, il reçoit
 * déjà le script prêt à écrire.
 *
 * Défense en profondeur (même schéma que src/io/apply.ts:resolveInsideProject / F1) :
 * un chemin qui s'échapperait de `rootDir` (ex. '../../etc/passwd') est REFUSÉ — au
 * même niveau de garantie qu'assertSafeId côté id. `assertSafeId` protège les ids,
 * pas ce champ ; sans ce garde-fou, une règle malveillante ferait lire (et écrire en
 * hook exécutable via le cap) un fichier arbitraire hors du dépôt.
 *
 * DEUX passes, pas une : (1) lexicale sur le chemin résolu — attrape `../etc/passwd`
 * avant même de toucher le disque ; (2) après `existsSync`, sur le chemin RÉEL
 * (`realpathSync`, symlinks déréférencés) — un symlink commité dans `rules/` et
 * pointant hors du dépôt passerait la passe (1) (lexicalement sous `root`) mais est
 * rejeté ici. `root` lui-même est résolu en réel pour une comparaison cohérente
 * (ex. macOS : /tmp est un symlink vers /private/tmp).
 * Un chemin légitime dont le fichier n'existe pas encore reste TOLÉRÉ (laissé tel
 * quel) — ADR-0003 §4, ce n'est pas un risque, juste un asset pas encore migré.
 */
function resolveHookScript(enforcement: Enforcement, rootDir: string): Enforcement {
  if (enforcement.type !== 'hook' || !enforcement.hook) return enforcement;
  const root = resolve(rootDir);
  const scriptPath = resolve(root, enforcement.hook.script);
  if (!isInside(root, scriptPath)) {
    throw new Error(
      `chemin de hook non sûr (traversal de chemin refusé) : ${JSON.stringify(enforcement.hook.script)}`,
    );
  }
  if (!existsSync(scriptPath)) return enforcement;
  const realRoot = realpathSync(root);
  const realScript = realpathSync(scriptPath);
  if (!isInside(realRoot, realScript)) {
    throw new Error(
      `chemin de hook non sûr (symlink hors dépôt refusé) : ${JSON.stringify(enforcement.hook.script)}`,
    );
  }
  return {
    ...enforcement,
    hook: { ...enforcement.hook, script: readFileSync(scriptPath, 'utf8') },
  };
}

function readRule(file: string, rootDir: string): Rule | undefined {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  if (typeof data.id !== 'string') return undefined;
  const kind: RuleKind = data.kind === 'interaction' ? 'interaction' : 'disposition';
  const enforcements = Array.isArray(data.enforcements)
    ? data.enforcements.map((e: Enforcement) => resolveHookScript(e, rootDir))
    : data.enforcements;
  return {
    id: data.id,
    kind,
    level: data.level,
    ...(typeof data.title === 'string' ? { title: data.title } : {}),
    content: content.trim(),
    enforcements,
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
    ...(typeof data.description === 'string' ? { description: data.description } : {}),
    role: content.trim(),
    competences: data.competences ?? [],
    interactions: data.interactions ?? [],
    ...(typeof data.model === 'string' ? { model: data.model } : {}),
    ...(typeof data.model_spare === 'string' ? { model_spare: data.model_spare } : {}),
    ...(typeof data.effort === 'string' ? { effort: data.effort } : {}),
    ...(typeof data.isolation === 'string' ? { isolation: data.isolation } : {}),
  };
}

/** Un tableau de strings, sinon `undefined` (frontmatter mal formé → toléré, ADR-0025). */
function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : undefined;
}

/**
 * Skills : id = `name` du frontmatter, à défaut `id`, à défaut le nom du dossier.
 *
 * ADR-0025 : `composes:` / `composes-external:` (kebab en YAML → camelCase en TS)
 * portent les dépendances inter-skills MÉCANIQUES. Absents ⇒ champ non posé
 * (rétro-compat totale, un skill sans composition se charge comme avant). Chaque
 * id composé passe par `assertSafeId` — même garde-fou de frontière que le reste
 * du loader (F1) : un id composé devient potentiellement un chemin de sortie.
 */
function readSkill(file: string, fallbackId: string, skillDir: string): Skill {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  const id =
    typeof data.name === 'string' ? data.name : typeof data.id === 'string' ? data.id : fallbackId;
  const composes = stringArray(data.composes)?.map(assertSafeId);
  const composesExternal = stringArray(data['composes-external'])?.map(assertSafeId);
  // ADR-0020 (amendement) : agents convoqués. Même garde-fou de frontière que `composes`.
  const roles = stringArray(data.roles)?.map(assertSafeId);
  const assets = readSkillAssets(skillDir);
  return {
    id,
    ...(typeof data.description === 'string' ? { description: data.description } : {}),
    ...(typeof data['argument-hint'] === 'string' ? { argumentHint: data['argument-hint'] } : {}),
    content: content.trim(),
    ...(composes ? { composes } : {}),
    ...(composesExternal ? { composesExternal } : {}),
    ...(roles ? { roles } : {}),
    ...(assets.length > 0 ? { assets } : {}),
  };
}

const SKILL_FILE = 'SKILL.md';

/**
 * Fichiers auxiliaires d'un dossier de skill (ADR-0027), triés par chemin relatif POSIX
 * (déterminisme, F4). Descend récursivement mais N'EMBARQUE que des fichiers RÉGULIERS :
 *   - `SKILL.md` (racine) exclu — déjà porté par `content` ;
 *   - dotfiles / dot-dossiers (`.DS_Store`…) sautés → le plan reste déterministe vis-à-vis
 *     du CONTENU versionné, pas de l'état du FS local ;
 *   - symlinks (et toute entrée non-fichier) IGNORÉS — même garantie anti-exfiltration que
 *     `resolveHookScript` : un lien commité pointant hors dépôt ne peut pas embarquer de
 *     contenu externe (on n'ouvre jamais un lien), sans le double-pass realpath.
 * `path` en séparateurs POSIX (contrat des chemins de plan) ; `assertSafeId` maintient
 * l'invariant anti-traversal (F1) même si `readdir` ne produit pas de segment dangereux.
 * `content` VERBATIM (utf8) — non normalisé, contrairement au `SKILL.md` (fidélité byte).
 */
function readSkillAssets(skillDir: string): SkillAsset[] {
  const assets: SkillAsset[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue; // dotfiles/dot-dossiers : hors périmètre versionné
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
      } else if (entry.isFile()) {
        if (rel === SKILL_FILE) continue; // le playbook lui-même vit dans `content`
        assertSafeId(rel);
        const executable = (statSync(full).mode & 0o111) !== 0;
        assets.push({
          path: rel,
          content: readFileSync(full, 'utf8'),
          ...(executable ? { executable } : {}),
        });
      }
      // sinon (symlink, socket…) : ignoré (défense anti-exfiltration).
    }
  };
  walk(skillDir, '');
  // Tri par unités de code (locale-indépendant, comme `listFiles`) → déterminisme (F4).
  return assets.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

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
    .map((name) => ({ name, dir: join(skillsRoot, name) }))
    .filter(({ dir }) => existsSync(join(dir, SKILL_FILE)))
    .map(({ name, dir }) => readSkill(join(dir, SKILL_FILE), name, dir));
  return indexById(items);
}

function readYamlEntity<T>(file: string): T {
  return parseYaml(readFileSync(file, 'utf8')) as T;
}

function loadMarkdown<T extends { id: string }>(
  dir: string,
  read: (file: string) => T | undefined,
  recursive = false,
): Map<string, T> {
  const items = listFiles(dir, MARKDOWN, recursive)
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
    rules: loadMarkdown(join(rootDir, 'rules'), (file) => readRule(file, rootDir), true), // récursif : ids slashés → sous-dossiers (fiche 0037)
    agents: loadMarkdown(join(rootDir, 'agents'), readAgent),
    skills: loadSkills(join(rootDir, 'skills')),
    bundles: loadYaml<Bundle>(join(rootDir, 'bundles')),
    profiles: loadYaml<Profile>(join(rootDir, 'profiles')),
  };
}
