/**
 * Bord I/O du carnet de tests (fiche 20261102182259416) : config, arbre, journal, preuves, git.
 *
 * Le journal et les preuves vivent dans `<git-common-dir>/ezk/carto/<app>/`, à côté de la note de
 * passation et des sprints : partagés par tous les worktrees du dépôt, hors de l'arbre de travail
 * (la garde find-only du scout reste verte), jamais committés.
 *
 *   <git-common-dir>/ezk/carto/<app>/
 *     journal.jsonl          une ligne par résultat, on ne fait qu'ajouter
 *     proofs/<sha256><ext>   la copie de chaque preuve, rangée par empreinte de contenu
 *
 * Le calcul (parse, validation, état) est dans le cœur pur `src/core/carto.ts`.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import {
  type CartoEntry,
  type CartoTree,
  SHA_PATTERN,
  parseCartoTree,
  parseJournal,
  resolveCartoConfig,
  serializeEntry,
} from '../core/carto.js';
import { loadProjectConfig } from '../loaders/project-config.js';

/** Une erreur à dire à l'utilisateur telle quelle (config, arbre, preuve, dépôt). */
export class CartoError extends Error {}

const JOURNAL = 'journal.jsonl';
const PROOFS = 'proofs';

export interface LoadedTree {
  app: string;
  /** Le fichier d'arbre, relatif à la racine du projet. */
  file: string;
  tree: CartoTree;
  validityDays: number;
}

/** L'arbre d'une app, d'après la clé `carto:` de `.vectorz/config.yml`. Une seule app : `app` facultatif. */
export function loadTree(projectRoot: string, app?: string): LoadedTree {
  const raw = (loadProjectConfig(projectRoot) as { carto?: unknown } | undefined)?.carto;
  const config = resolveCartoConfig(raw);
  if (config.errors.length > 0) throw new CartoError(config.errors.join('\n'));
  const apps = Object.keys(config.trees);
  if (apps.length === 0) {
    throw new CartoError(
      'aucun arbre déclaré : ajoute « carto: trees: <app>: <fichier d’arbre> » dans .vectorz/config.yml',
    );
  }
  const chosen = app ?? (apps.length === 1 ? apps[0] : undefined);
  if (chosen === undefined) throw new CartoError(`plusieurs apps déclarées (${apps.join(', ')}) : précise laquelle`);
  const rel = config.trees[chosen];
  if (rel === undefined) throw new CartoError(`app « ${chosen} » absente de carto.trees (déclarées : ${apps.join(', ')})`);
  const file = resolve(projectRoot, rel);
  if (!existsSync(file)) throw new CartoError(`fichier d'arbre introuvable : ${rel}`);
  const parsed = parseCartoTree(readFileSync(file, 'utf8'));
  if ('errors' in parsed) {
    throw new CartoError(
      [`arbre refusé : ${rel}`, ...parsed.errors.map((e) => `  ${rel}:${e.line} — ${e.message}`)].join('\n'),
    );
  }
  if (parsed.tree.app !== chosen) {
    throw new CartoError(`${rel} déclare « app: ${parsed.tree.app} », mais la config le range sous « ${chosen} »`);
  }
  return { app: chosen, file: rel, tree: parsed.tree, validityDays: config.validityDays };
}

function git(projectRoot: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Le dossier du carnet d'une app, dans le dossier git commun du dépôt. */
export function storeDir(projectRoot: string, app: string): string {
  const common = git(projectRoot, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  if (!common) throw new CartoError(`${projectRoot} n'est pas un dépôt git : le carnet vit dans son dossier git commun`);
  return join(common, 'ezk', 'carto', app);
}

export function readEntries(dir: string): { entries: CartoEntry[]; skipped: number } {
  const file = join(dir, JOURNAL);
  return existsSync(file) ? parseJournal(readFileSync(file, 'utf8')) : { entries: [], skipped: 0 };
}

/** Ajoute une ligne au journal. On n'y réécrit jamais une ligne : deux sessions peuvent écrire ensemble. */
export function appendEntry(dir: string, entry: CartoEntry): void {
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, JOURNAL), serializeEntry(entry));
}

/** Copie la preuve dans le magasin, nommée par l'empreinte de son contenu. Rend le nom de la copie. */
export function storeProof(dir: string, proofPath: string): string {
  if (!existsSync(proofPath) || !statSync(proofPath).isFile()) throw new CartoError(`preuve introuvable : ${proofPath}`);
  const bytes = readFileSync(proofPath);
  const ext = extname(proofPath).toLowerCase();
  const name = `${createHash('sha256').update(bytes).digest('hex')}${/^\.[a-z0-9]{1,8}$/.test(ext) ? ext : ''}`;
  const proofs = join(dir, PROOFS);
  mkdirSync(proofs, { recursive: true });
  const dest = join(proofs, name);
  if (!existsSync(dest)) copyFileSync(proofPath, dest);
  return name;
}

/** Le SHA testé : celui donné, s'il en a la forme, sinon HEAD du projet. */
export function testedSha(projectRoot: string, given?: string): string {
  if (given !== undefined) {
    if (!SHA_PATTERN.test(given)) throw new CartoError(`--sha : un SHA git est attendu, reçu « ${given} »`);
    return given;
  }
  const head = git(projectRoot, ['rev-parse', 'HEAD']);
  if (!head) throw new CartoError(`impossible de lire HEAD dans ${projectRoot} : passe --sha`);
  return head;
}

/** Combien de commits séparent un SHA de HEAD ; `null` si git ne connaît pas ce SHA. Mis en cache. */
export function commitsSinceIn(projectRoot: string): (sha: string) => number | null {
  const cache = new Map<string, number | null>();
  return (sha) => {
    if (!cache.has(sha)) {
      const out = SHA_PATTERN.test(sha) ? git(projectRoot, ['rev-list', '--count', `${sha}..HEAD`]) : null;
      cache.set(sha, out !== null && /^\d+$/.test(out) ? Number(out) : null);
    }
    return cache.get(sha) ?? null;
  };
}

/** La racine git du dossier donné, ou le dossier lui-même hors dépôt. */
export function gitTopLevel(dir: string): string {
  return git(dir, ['rev-parse', '--show-toplevel']) ?? dir;
}
