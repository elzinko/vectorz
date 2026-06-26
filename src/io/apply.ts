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
import { mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
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
