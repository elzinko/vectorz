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
import { mkdirSync, writeFileSync, chmodSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { WritePlan } from '../domain/plan.js';

const EXECUTABLE = 0o755;

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

function writeFile(projectDir: string, path: string, content: string, mode?: number): void {
  const absolute = resolveInsideProject(projectDir, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  if (mode !== undefined) chmodSync(absolute, mode);
}

function ensureGitRepo(projectDir: string): void {
  if (existsSync(join(projectDir, '.git'))) return;
  execFileSync('git', ['init', '--quiet'], { cwd: projectDir });
}

function poseHook(projectDir: string, stage: string, script: string): void {
  const hookPath = resolveInsideProject(projectDir, join('.git', 'hooks', stage));
  mkdirSync(dirname(hookPath), { recursive: true });
  writeFileSync(hookPath, script);
  chmodSync(hookPath, EXECUTABLE);
}

/** Applique le plan sur `projectDir`. Idempotent (réécrit le même contenu). */
export function applyPlan(plan: WritePlan, projectDir: string): void {
  for (const file of plan.files) {
    writeFile(projectDir, file.path, file.content, file.mode);
  }
  if (plan.hooks.length > 0) {
    ensureGitRepo(projectDir);
    for (const hook of plan.hooks) {
      poseHook(projectDir, hook.stage, hook.script);
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
 * Coquille I/O GLOBALE (fiche 0017) : applique un plan dans une racine `~/.claude`
 * factice ou réelle, de façon NON-DESTRUCTIVE. Ne remplace QUE ses propres entrées
 * (un skill-dir ne contenant que SKILL.md) et refuse d'écraser un fichier/dossier
 * utilisateur étranger préexistant. Idempotent. Pas de hooks côté global.
 */
export function applyGlobalPlan(plan: WritePlan, root: string): void {
  for (const file of plan.files) {
    if (file.path.endsWith(`/${SKILL_FILE}`)) {
      assertManagedSkillDir(root, file.path);
    }
  }
  for (const file of plan.files) {
    writeFile(root, file.path, file.content, file.mode);
  }
}
