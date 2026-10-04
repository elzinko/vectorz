/**
 * Le cockpit (ADR-0062) — la colle I/O : lire le registre et constater chaque projet sur le disque.
 * Le jugement (états, choix, refus) est dans `src/core/cockpit.ts`.
 *
 * Le registre est relu à chaque appel : un projet inscrit apparaît sans relancer le serveur.
 * Il n'est JAMAIS écrit ici (seul `ezk supervision registry-add` l'écrit).
 */
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { type CockpitProject, layoutVersionOf, projectState } from '../core/cockpit.js';
import { loadRegistry } from '../supervision/registry.js';

/** La version de format des fiches que la méthode attend aujourd'hui (Skema d'ezk-backlog). */
export function currentLayoutVersion(megaCity: string): number {
  const file = join(megaCity, 'skills', 'ezk-backlog', 'migrations', 'VERSION');
  const n = Number(readFileSync(file, 'utf8').trim());
  if (!Number.isInteger(n) || n < 1) throw new Error(`version de format illisible : ${file}`);
  return n;
}

function readOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export interface CockpitRegistry {
  projects: CockpitProject[];
  /** Ce qui empêche de lire le registre (fichier cassé) ; null quand tout va bien. */
  problem: string | null;
}

/**
 * Les projets du registre, avec leur état. Un registre absent donne une liste vide ; un registre
 * cassé aussi, avec la raison : la page reste debout et dit pourquoi elle n'a pas de projets.
 */
export function loadCockpitProjects(registryDir: string | null, currentLayout: number): CockpitRegistry {
  if (registryDir === null) return { projects: [], problem: null };
  let registry: ReturnType<typeof loadRegistry>;
  try {
    registry = loadRegistry(registryDir);
  } catch (err) {
    return { projects: [], problem: `${join(registryDir, 'supervision.registry.yaml')} — ${(err as Error).message}` };
  }
  if (registry === null) return { projects: [], problem: null };
  const projects = registry.projects.map((p) => {
    const declared = isAbsolute(p.path) ? p.path : resolve(registryDir, p.path);
    const exists = isDirectory(declared);
    // La racine réelle (liens symboliques résolus) : elle se compare à celle du lancement.
    const root = exists ? realpathSync(declared) : declared;
    const readme = exists ? readOrNull(join(root, 'features', 'README.md')) : null;
    const state = projectState({ exists, method: p.method, layoutVersion: layoutVersionOf(readme) }, currentLayout);
    return { id: p.id, root, method: p.method, state };
  });
  return { projects, problem: null };
}

/** Le dossier du registre que lit le cockpit : `EZK_COCKPIT_REGISTRY` (un essai), sinon celui trouvé. */
export function cockpitRegistryDir(found: string | null, env: NodeJS.ProcessEnv = process.env): string | null {
  const forced = env.EZK_COCKPIT_REGISTRY;
  if (forced && forced !== '') return existsSync(forced) ? resolve(forced) : null;
  return found;
}
