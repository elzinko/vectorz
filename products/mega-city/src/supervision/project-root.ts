/**
 * `project-root.ts` — résolution + normalisation de la racine de supervision
 * (ADR 0019, fiche 0086). Seul module du kit émetteur qui connaît git, et
 * uniquement en pur file-system (AUCUN spawn de processus, `git` peut être
 * absent de l'environnement spawné par Claude Desktop — cf. ADR §Contexte).
 *
 * Pipeline (schéma mermaid ADR §Schéma) : base (explicite fail-fast, sinon
 * `cwd`) → échappatoire `SUPERVISION_PER_WORKTREE` (court-circuite AVANT toute
 * détection) → détection en remontant depuis la base : `.git` FICHIER dont le
 * contenu commence par `gitdir: ` ET `<gitdir>/commondir` existe ⇒ worktree
 * lié ; l'arbre principal est `dirname(realpath(commondir résolu))`, SEULEMENT
 * si son basename est `.git` (sinon dépôt bare ⇒ fail-open). Tout autre cas
 * (`.git` dossier, hors dépôt, submodule sans `commondir`, bare) ⇒ racine
 * fournie inchangée — trois replis fail-open, jamais de crash (ADR décision 5).
 *
 * `resolveProjectRootFromEnv` (déplacé depuis `mcp-server.ts`, ADR décision 1)
 * garde exactement les mêmes messages d'erreur fail-fast — aucun importeur ne
 * doit voir de différence de comportement.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Axe « d'où vient la racine avant normalisation ». Extensible : `launcher`
 * viendra avec la fiche « portée projet » (hors scope ici, ADR §Garde de
 * scope — aucune lecture de `CLAUDE_PROJECT_DIR` dans ce module).
 */
export type RootProvenance = 'explicit' | 'cwd';

/**
 * Deux axes orthogonaux (ADR décision 4) : `provenance` (d'où vient la racine
 * fournie) et la normalisation (indépendante — une racine `explicit` comme une
 * racine `cwd` peuvent toutes deux être normalisées, ou passer par
 * l'échappatoire par-worktree).
 */
export interface ResolvedRoot {
  root: string;
  provenance: RootProvenance;
  /** Présent uniquement si la racine fournie a été normalisée vers l'arbre principal : sa valeur. */
  normalizedFromWorktree?: string;
  /** Présent (et vrai) uniquement si l'échappatoire `SUPERVISION_PER_WORKTREE` a court-circuité la normalisation. */
  perWorktree?: boolean;
}

/**
 * Valide une valeur candidate de racine explicite (fail-fast, N1/D5) : chemin
 * absolu vers un dossier existant, sinon erreur explicite immédiate plutôt
 * qu'un échec confus plus tard (ENOENT au premier `run_start`, etc.).
 */
function assertValidExplicitRoot(value: string): string {
  if (!path.isAbsolute(value)) {
    throw new Error(
      `SUPERVISION_PROJECT_ROOT invalide : "${value}" n'est pas un chemin absolu.`,
    );
  }
  let stat: fs.Stats;
  try {
    stat = fs.statSync(value);
  } catch {
    throw new Error(`SUPERVISION_PROJECT_ROOT invalide : "${value}" n'existe pas.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`SUPERVISION_PROJECT_ROOT invalide : "${value}" n'est pas un dossier.`);
  }
  return value;
}

/**
 * Résout `project_root` depuis l'environnement (jamais un paramètre d'outil).
 * Fail-fast (N1, D5) : si `SUPERVISION_PROJECT_ROOT` est fourni, il DOIT être un
 * chemin absolu vers un dossier existant, sinon erreur explicite immédiate plutôt
 * qu'un échec confus plus tard (ENOENT au premier `run_start`, etc.).
 *
 * Déplacé depuis `mcp-server.ts` (ADR 0019, décision 1) — `mcp-server.ts` le
 * re-exporte à l'identique, aucun importeur ne casse.
 */
export function resolveProjectRootFromEnv(): string {
  const value = process.env.SUPERVISION_PROJECT_ROOT;
  if (value === undefined) return process.cwd();
  return assertValidExplicitRoot(value);
}

/** Résultat interne de la remontée FS : où `.git` a été trouvé, et le sous-chemin base-relatif. */
interface GitEntryLocation {
  dir: string;
  subPath: string;
}

/**
 * Remonte depuis `base` à la recherche d'un ancêtre (base incluse) qui contient
 * une entrée `.git`. Ne dit rien de sa nature (fichier ou dossier) — juste où
 * elle est, et le sous-chemin parcouru (préservé ensuite, ADR décision 7).
 */
function findGitEntryUpwards(base: string): GitEntryLocation | undefined {
  const climbed: string[] = [];
  let dir = base;
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return { dir, subPath: climbed.reverse().join(path.sep) };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined; // racine du filesystem atteinte : hors dépôt git
    climbed.push(path.basename(dir));
    dir = parent;
  }
}

/**
 * Normalise `base` vers l'arbre principal si c'est un worktree lié (détection
 * pur file-system, ADR décision 3). Retourne `undefined` dans tous les cas de
 * repli fail-open (hors git, `.git` dossier, submodule sans `commondir`, dépôt
 * bare) — jamais d'exception : ces cas laissent la racine fournie inchangée.
 */
function normalizeFromWorktree(base: string): string | undefined {
  const located = findGitEntryUpwards(base);
  if (!located) return undefined;

  const gitEntryPath = path.join(located.dir, '.git');
  const gitEntryStat = fs.statSync(gitEntryPath);
  if (!gitEntryStat.isFile()) return undefined; // `.git` dossier : arbre principal (ou hors worktree)

  const gitFileContent = fs.readFileSync(gitEntryPath, 'utf8');
  const gitdirMatch = /^gitdir:\s*(.+)$/m.exec(gitFileContent);
  if (!gitdirMatch) return undefined;
  const gitDirPath = path.resolve(located.dir, gitdirMatch[1].trim());

  const commondirFile = path.join(gitDirPath, 'commondir');
  if (!fs.existsSync(commondirFile)) return undefined; // submodule : gitdir sans commondir

  const commondirContent = fs.readFileSync(commondirFile, 'utf8').trim();
  const commondirPath = path.resolve(gitDirPath, commondirContent);

  let realCommondirPath: string;
  try {
    realCommondirPath = fs.realpathSync(commondirPath);
  } catch {
    return undefined;
  }
  if (path.basename(realCommondirPath) !== '.git') return undefined; // dépôt bare : fail-open

  const mainTreeRoot = path.dirname(realCommondirPath);
  return located.subPath === '' ? mainTreeRoot : path.join(mainTreeRoot, located.subPath);
}

/** `SUPERVISION_PER_WORKTREE` accepte '1' ou 'true' (ADR décision 6) — tout le reste est ignoré. */
function isPerWorktreeEscapeHatchEnabled(env: NodeJS.ProcessEnv): boolean {
  return env.SUPERVISION_PER_WORKTREE === '1' || env.SUPERVISION_PER_WORKTREE === 'true';
}

/**
 * Orchestrateur composition-root (ADR décision 2) : calcule la racine effective
 * de supervision AVANT construction du `SupervisionRuntime`, qui la reçoit déjà
 * normalisée — `runtime.ts` reste git-agnostique.
 */
export function resolveSupervisionRoot(env: NodeJS.ProcessEnv, cwd: string): ResolvedRoot {
  const explicitValue = env.SUPERVISION_PROJECT_ROOT;
  const provenance: RootProvenance = explicitValue !== undefined ? 'explicit' : 'cwd';
  const base = explicitValue !== undefined ? assertValidExplicitRoot(explicitValue) : cwd;

  if (isPerWorktreeEscapeHatchEnabled(env)) {
    return { root: base, provenance, perWorktree: true };
  }

  const normalizedRoot = normalizeFromWorktree(base);
  if (normalizedRoot === undefined) {
    return { root: base, provenance };
  }
  return { root: normalizedRoot, provenance, normalizedFromWorktree: base };
}

/**
 * Formate l'annonce de démarrage (ADR décision 8) — PURE, aucune I/O. Distingue
 * sans ambiguïté les 4 provenances (explicite / dossier courant / normalisée
 * depuis un worktree / échappatoire par-worktree) et donne le chemin effectif
 * du journal. Émise par `bin/supervision-mcp.ts` sur STDERR — jamais stdout,
 * réservé au protocole MCP.
 */
export function formatRootAnnouncement(resolved: ResolvedRoot): string {
  const journalPath = path.join(resolved.root, '.supervision', 'runs');
  const provenanceLabel = resolved.provenance === 'explicit' ? 'explicite' : 'dossier courant';

  let qualifier: string;
  if (resolved.perWorktree) {
    qualifier = 'par-worktree délibéré';
  } else if (resolved.normalizedFromWorktree !== undefined) {
    qualifier = `normalisée depuis ${resolved.normalizedFromWorktree}`;
  } else {
    qualifier = 'telle quelle';
  }

  return `[supervision] journal → ${journalPath} (racine ${provenanceLabel}, ${qualifier})`;
}
