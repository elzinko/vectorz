/**
 * Loader des règles PROJET-LOCAL — frontière entrante (fiche 20260910152227744, ADR-0050).
 *
 * Lit le contrat d'un projet sous `<projet>/.vectorz/` : le manifeste `rules.yml` et les règles locales
 * `rules/**\/*.md` (même front-matter que les règles globales : `id`, `level`, `title`). Rien n'est ignoré en
 * silence : une faute (YAML malformé, niveau invalide, id dangereux, règle locale sans manifeste) devient un
 * PROBLÈME qui cite le fichier. Le cœur pur (`core/project-rules.ts`) compose ensuite.
 *
 * Les faits git (racine, SHA du commit) sont relevés ici aussi : le SHA est une valeur vide explicite
 * (`null`) quand le projet n'est pas un dépôt git ou n'a aucun commit — ce n'est pas une erreur.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import {
  type LocalRule,
  type Problem,
  type RulesManifest,
  RULES_MANIFEST_FILE,
  parseRulesManifest,
} from '../core/project-rules.js';
import type { Level } from '../domain/model.js';
import { assertSafeId } from './catalog.js';

const DIR = '.vectorz';
const MANIFEST_NAMES = ['rules.yml', 'rules.yaml'] as const;
const LEVELS: readonly string[] = ['MUST', 'SHOULD', 'MAY'];

export interface LoadedProjectRules {
  /** `undefined` : le projet n'a pas de contrat de règles. */
  manifest: RulesManifest | undefined;
  /** Le fichier lu (ou le chemin canonique s'il n'y en a pas), relatif au projet. */
  manifestFile: string;
  local: LocalRule[];
  problems: Problem[];
}

/** Les `.md` sous `dir`, récursivement, triés (déterminisme). */
function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(path);
  }
  return out;
}

function readLocalRule(projectRoot: string, file: string, problems: Problem[]): LocalRule | undefined {
  const rel = relative(projectRoot, file).split(sep).join('/');
  const bad = (message: string, ruleId?: string): undefined => {
    problems.push({ message, file: rel, ...(ruleId ? { ruleId } : {}) });
    return undefined;
  };
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(readFileSync(file, 'utf8'));
  } catch {
    return bad('front-matter illisible (YAML malformé).');
  }
  const { id, level, title, enforcements } = parsed.data as Record<string, unknown>;
  if (typeof id !== 'string' || id.trim() === '') return bad('le front-matter doit porter un `id`.');
  try {
    assertSafeId(id);
  } catch {
    return bad(`id non sûr : ${JSON.stringify(id)}.`, id);
  }
  if (typeof level !== 'string' || !LEVELS.includes(level)) {
    return bad('`level` doit valoir MUST, SHOULD ou MAY.', id);
  }
  if (enforcements !== undefined) {
    return bad(
      "`enforcements` n'a aucun effet dans une règle locale : déclare le binding (gate, review) dans .vectorz/rules.yml, le contrat du projet.",
      id,
    );
  }
  return {
    id,
    level: level as Level,
    ...(typeof title === 'string' && title.trim() !== '' ? { title: title.trim() } : {}),
    content: parsed.content.trim(),
    file: rel,
  };
}

/** Lit le contrat de règles du projet. Ne jette jamais pour une faute du contrat : elle devient un problème. */
export function loadProjectRules(projectRoot: string): LoadedProjectRules {
  const problems: Problem[] = [];

  const manifestName = MANIFEST_NAMES.find((name) => existsSync(join(projectRoot, DIR, name)));
  const manifestFile = manifestName ? `${DIR}/${manifestName}` : RULES_MANIFEST_FILE;
  let manifest: RulesManifest | undefined;
  if (manifestName) {
    let raw: unknown;
    let readable = true;
    try {
      raw = parseYaml(readFileSync(join(projectRoot, DIR, manifestName), 'utf8'));
    } catch (cause) {
      readable = false;
      problems.push({
        message: `YAML malformé : ${cause instanceof Error ? cause.message.split('\n')[0] : String(cause)}`,
        file: manifestFile,
      });
    }
    if (readable) {
      const parsed = parseRulesManifest(raw, manifestFile);
      manifest = parsed.manifest;
      problems.push(...parsed.problems);
    }
  }

  const local: LocalRule[] = [];
  for (const file of markdownFiles(join(projectRoot, DIR, 'rules'))) {
    const rule = readLocalRule(projectRoot, file, problems);
    if (rule) local.push(rule);
  }
  // Des règles écrites mais jamais chargées seraient une règle morte, sans un mot : on le dit.
  if (!manifestName && local.length > 0) {
    problems.push({
      message: `${local.length} règle(s) locale(s) existent mais ${RULES_MANIFEST_FILE} est absent : rien ne les chargerait. Crée le manifeste (même vide).`,
      file: RULES_MANIFEST_FILE,
    });
  }
  return { manifest, manifestFile, local, problems };
}

export interface GitFacts {
  /** La racine git qui contient le dossier, ou `null` hors dépôt git. */
  toplevel: string | null;
  /** Le commit courant, ou `null` (pas un dépôt git, ou aucun commit). */
  sha: string | null;
}

function git(dir: string, args: string[]): string | null {
  try {
    const out = execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return out === '' ? null : out;
  } catch {
    return null;
  }
}

/** Les faits git d'un dossier. Ne jette jamais : l'absence de git n'est pas une erreur. */
export function gitFacts(dir: string): GitFacts {
  const toplevel = git(dir, ['rev-parse', '--show-toplevel']);
  return { toplevel, sha: toplevel ? git(dir, ['rev-parse', 'HEAD']) : null };
}
