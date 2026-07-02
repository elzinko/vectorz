/**
 * Coquille I/O UNIQUE (ADR-0003) — le SEUL module qui touche le disque et git.
 *
 * Consomme un WritePlan (calculé purement par `bind`) et le matérialise :
 *   - crée les dossiers parents, écrit les fichiers (avec leur `mode` éventuel) ;
 *   - initialise un dépôt git si nécessaire (pour pouvoir poser les hooks) ;
 *   - pose les git hooks dans `.git/hooks/<stage>`, exécutables (chmod +x).
 *
 * Aucune logique métier ici : tout le « quoi écrire » vient du plan.
 */
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  chmodSync,
  existsSync,
  readdirSync,
  statSync,
  lstatSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { FileWrite, HookWrite, WritePlan } from '../domain/plan.js';

const EXECUTABLE = 0o755;

/** Marqueurs du bloc managé (fiche 0010) — stables, réutilisables par tous les caps. */
const BLOCK_START = '<!-- iamthelaw:start -->';
const BLOCK_END = '<!-- iamthelaw:end -->';

/** Options d'application. `force` autorise la réécriture franche d'un existant qui diffère. */
export interface ApplyOptions {
  force?: boolean;
}

/**
 * Défense en profondeur (F1) : tout chemin du plan doit résoudre SOUS `projectDir`.
 * La frontière du loader rejette déjà les ids dangereux ; ici on refuse en dernier
 * recours toute écriture qui s'échapperait du projet hôte.
 */
function resolveInsideProject(projectDir: string, path: string): string {
  const root = resolve(projectDir);
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(root + sep)) {
    throw new Error(`écriture hors du projet refusée : ${JSON.stringify(path)}`);
  }
  return absolute;
}

function writeRaw(absolute: string, content: string, mode?: number): void {
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  if (mode !== undefined) chmodSync(absolute, mode);
}

/**
 * Fusionne un bloc managé dans un contenu existant (fiche 0010). Idempotent :
 *   - pas de marqueurs → AJOUTE le bloc en préservant 100% du contenu existant ;
 *   - marqueurs présents → REMPLACE uniquement le bloc (le reste intact).
 */
function mergeManagedBlock(existing: string, blockBody: string): string {
  const block = `${BLOCK_START}\n${blockBody.trim()}\n${BLOCK_END}\n`;
  const startAt = existing.indexOf(BLOCK_START);
  const endAt = existing.indexOf(BLOCK_END);
  if (startAt !== -1 && endAt !== -1 && endAt > startAt) {
    const before = existing.slice(0, startAt);
    const after = existing.slice(endAt + BLOCK_END.length).replace(/^\n/, '');
    return `${before}${block}${after}`;
  }
  const base = existing.length === 0 || existing.endsWith('\n') ? existing : `${existing}\n`;
  const separator = base.length === 0 ? '' : '\n';
  return `${base}${separator}${block}`;
}

/** Applique un FileWrite selon son intention de fusion. */
function applyFile(projectDir: string, file: FileWrite): void {
  const absolute = resolveInsideProject(projectDir, file.path);
  if (file.intent === 'managed-block') {
    const existing = existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
    writeRaw(absolute, mergeManagedBlock(existing, file.content), file.mode);
    return;
  }
  writeRaw(absolute, file.content, file.mode);
}

function ensureGitRepo(projectDir: string): void {
  if (existsSync(join(projectDir, '.git'))) return;
  execFileSync('git', ['init', '--quiet'], { cwd: projectDir });
}

/**
 * Pose un hook selon son intention (fiche 0010). `skip-if-exists` : un hook
 * perso préexistant qui DIFFÈRE n'est jamais écrasé sans `force` (sinon backup `.bak`
 * puis refus explicite). Identique → idempotent, pas d'erreur.
 */
function poseHook(projectDir: string, hook: HookWrite, force: boolean): void {
  const hookPath = resolveInsideProject(projectDir, join('.git', 'hooks', hook.stage));
  if (hook.intent === 'skip-if-exists' && existsSync(hookPath)) {
    const current = readFileSync(hookPath, 'utf8');
    if (current === hook.script) return; // déjà à jour : idempotent.
    if (!force) {
      throw new Error(
        `refus non-destructif : le hook ${JSON.stringify(hook.stage)} existe et diffère. ` +
          'Relance avec --force pour l’écraser (un backup .bak sera créé).',
      );
    }
    copyFileSync(hookPath, `${hookPath}.bak`);
  }
  writeRaw(hookPath, hook.script, EXECUTABLE);
}

/** Applique le plan sur `projectDir`. Idempotent (réécrit le même contenu). */
export function applyPlan(plan: WritePlan, projectDir: string, options: ApplyOptions = {}): void {
  const force = options.force === true;
  for (const file of plan.files) {
    applyFile(projectDir, file);
  }
  if (plan.hooks.length > 0) {
    ensureGitRepo(projectDir);
    for (const hook of plan.hooks) {
      poseHook(projectDir, hook, force);
    }
  }
}

/** Le nom de fichier canonique d'une skill matérialisée par le cap global. */
const SKILL_FILE = 'SKILL.md';

/**
 * Garde NON-DESTRUCTIVE pour le cap global (invariant ADR-0006/0010, cf. deploy.sh) :
 * dans `~/.claude/skills`, lawgiver ne gère QUE des dossiers de skill dont l'unique
 * contenu est `SKILL.md`. Si le dossier cible préexiste mais contient autre chose
 * (un vrai artefact utilisateur), on REFUSE de l'écraser — jamais de `rm -rf` aveugle.
 * Un dossier neuf, ou un dossier ne contenant que `SKILL.md` (déjà géré), est accepté
 * → l'écriture est alors idempotente.
 */
function assertManagedSkillDir(root: string, skillFilePath: string): void {
  const skillDir = resolveInsideProject(root, dirname(skillFilePath));
  if (!existsSync(skillDir)) return;
  if (!statSync(skillDir).isDirectory()) {
    throw new Error(`refus non-destructif : ${JSON.stringify(skillDir)} n'est pas un dossier.`);
  }
  const foreign = readdirSync(skillDir).filter((name) => name !== SKILL_FILE);
  if (foreign.length > 0) {
    throw new Error(
      `refus non-destructif : ${JSON.stringify(skillDir)} contient des fichiers ` +
        `non gérés (${foreign.join(', ')}). Retire-les à la main ou choisis un autre id.`,
    );
  }
}

/**
 * Mode de matérialisation du cap global (fiche 0018) :
 *   - `copy` (défaut, comportement 0017) : écrit le contenu figé du plan ;
 *   - `link` : symlink le skill-dir cible vers sa source dans le catalogue (`catalogRoot`),
 *     un `git pull` dans mega-city met alors à jour partout (live-update).
 */
export interface GlobalApplyOptions {
  mode?: 'copy' | 'link';
  /** Racine du repo mega-city (source des skills) — REQUISE en mode `link`. */
  catalogRoot?: string;
}

/** Le segment `skills/<id>` d'un chemin de plan `skills/<id>/SKILL.md`. */
function skillDirRelative(skillFilePath: string): string {
  return dirname(skillFilePath); // ex. 'skills/ezk-commits'
}

/**
 * Vérifie qu'une entrée cible est REMPLAÇABLE de façon non-destructive (mirror de
 * `link_or_copy`/deploy.sh) : soit inexistante, soit notre propre symlink, soit un
 * skill-dir déjà géré (contenant SKILL.md). Sinon (vrai fichier/dossier utilisateur
 * étranger) : refus. `assertManagedSkillDir` couvre déjà le cas skill-dir géré ; ici
 * on n'ajoute que la tolérance du symlink (notre propre entrée en mode link).
 */
function assertReplaceableEntry(root: string, skillFilePath: string): void {
  const target = resolveInsideProject(root, skillDirRelative(skillFilePath));
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) return; // notre propre lien.
  assertManagedSkillDir(root, skillFilePath);
}

/** Retire notre propre entrée (symlink ou skill-dir géré) pour la re-matérialiser. */
function removeManagedEntry(target: string): void {
  if (!existsSync(target) && !isSymlink(target)) return;
  rmSync(target, { recursive: true, force: true });
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Matérialise un skill par symlink `<root>/skills/<id>` → `<catalogRoot>/skills/<id>`. */
function linkSkill(root: string, catalogRoot: string, skillFilePath: string): void {
  const relative = skillDirRelative(skillFilePath); // 'skills/<id>'
  const target = resolveInsideProject(root, relative);
  const source = resolve(catalogRoot, relative);
  removeManagedEntry(target);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target);
}

/**
 * Coquille I/O GLOBALE (fiche 0017/0018) : applique un plan dans une racine `~/.claude`
 * factice ou réelle, de façon NON-DESTRUCTIVE dans les DEUX modes. Ne remplace QUE ses
 * propres entrées (notre symlink, ou un skill-dir ne contenant que SKILL.md) et refuse
 * d'écraser un fichier/dossier utilisateur étranger préexistant. Idempotent.
 *   - `copy` (défaut) : écrit le contenu figé du plan.
 *   - `link` : symlink chaque skill-dir vers sa source (`catalogRoot` requis).
 * Pas de hooks côté global.
 */
export function applyGlobalPlan(
  plan: WritePlan,
  root: string,
  options: GlobalApplyOptions = {},
): void {
  const mode = options.mode ?? 'copy';
  for (const file of plan.files) {
    if (file.path.endsWith(`/${SKILL_FILE}`)) {
      assertReplaceableEntry(root, file.path);
    }
  }
  if (mode === 'link') {
    const catalogRoot = options.catalogRoot;
    if (!catalogRoot) {
      throw new Error("mode 'link' : catalogRoot (racine du catalogue) est requis.");
    }
    for (const file of plan.files) {
      if (file.path.endsWith(`/${SKILL_FILE}`)) {
        linkSkill(root, catalogRoot, file.path);
      }
    }
    return;
  }
  for (const file of plan.files) {
    if (file.path.endsWith(`/${SKILL_FILE}`)) {
      // bascule link → copy : retire d'abord notre symlink pour écrire un dir figé
      // (sinon writeRaw écrirait À TRAVERS le lien, dans la source du catalogue).
      const skillDir = resolveInsideProject(root, skillDirRelative(file.path));
      if (isSymlink(skillDir)) rmSync(skillDir, { force: true });
    }
    applyFile(root, file);
  }
}
