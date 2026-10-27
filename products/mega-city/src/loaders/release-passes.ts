/**
 * Loader de la gate de release (bord I/O, ADR-0003) — lit les passes déclarées d'un projet,
 * lit le réglage `release.gate`, et lit/écrit le verdict d'une version.
 *
 * - Passes : `.vectorz/release-passes.yml` (liste `{ id, title, command }`). Absent → les
 *   `DEFAULT_PASSES` du cœur. YAML malformé → erreur claire (jamais de coupure silencieuse).
 * - Verdict : `.vectorz/release/<version>.json` — écrit par `ezk release`, lu par
 *   `backlog version close --tag` pour refuser le tag sur NO-GO (ou verdict absent).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { type DesignSystemConfig, type DesignSystemVerdict, resolveDesignSystem } from '../core/design-system-review.js';
import { DEFAULT_PASSES, type ReleaseConfig, type ReleasePass, type ReleaseVerdict, resolveRelease } from '../core/release-gate.js';
import { PROJECT_CONFIG_DIR } from './project-config.js';
import { loadProjectConfig } from './project-config.js';

const PASSES_NAMES = ['release-passes.yml', 'release-passes.yaml'] as const;

/** Dossier où vivent le verdict et le fichier de feu vert de la chasse aux bugs. */
export function releaseDir(projectRoot: string): string {
  return join(projectRoot, PROJECT_CONFIG_DIR, 'release');
}

/** Le réglage `release` effectif du projet (défaut : gate active). */
export function releaseConfig(projectRoot: string): ReleaseConfig {
  const config = loadProjectConfig(projectRoot);
  return resolveRelease((config as { release?: unknown } | undefined)?.release);
}

/**
 * Les passes déclarées du projet, ou les passes par défaut du socle si aucun fichier.
 * Valide la forme de chaque passe : un fichier présent mais mal formé est une ERREUR
 * (on ne retombe pas en silence sur le défaut — la faute serait invisible).
 */
export function loadReleasePasses(projectRoot: string): readonly ReleasePass[] {
  for (const name of PASSES_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (!existsSync(file)) continue;
    let parsed: unknown;
    try {
      parsed = parseYaml(readFileSync(file, 'utf8'));
    } catch (cause) {
      throw new Error(`Passes de release illisibles (YAML malformé) : ${file}`, { cause });
    }
    const list = (parsed as { passes?: unknown } | undefined)?.passes ?? parsed;
    if (!Array.isArray(list)) {
      throw new Error(`Passes de release invalides (attendu une liste 'passes:') : ${file}`);
    }
    return list.map((raw, i) => {
      const p = raw as Record<string, unknown>;
      if (typeof p.id !== 'string' || typeof p.title !== 'string' || typeof p.command !== 'string') {
        throw new Error(`Passe de release #${i + 1} invalide (id/title/command requis) : ${file}`);
      }
      return { id: p.id, title: p.title, command: p.command };
    });
  }
  return DEFAULT_PASSES;
}

/** Chemin du verdict d'une version. */
export function verdictPath(projectRoot: string, version: string): string {
  return join(releaseDir(projectRoot), `${version}.json`);
}

/** Écrit le verdict d'une version (crée le dossier au besoin). */
export function writeReleaseVerdict(projectRoot: string, verdict: ReleaseVerdict): string {
  const file = verdictPath(projectRoot, verdict.version);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');
  return file;
}

/** Lit le verdict d'une version, ou `undefined` s'il n'a jamais été établi. */
export function readReleaseVerdict(projectRoot: string, version: string): ReleaseVerdict | undefined {
  const file = verdictPath(projectRoot, version);
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as ReleaseVerdict;
  } catch (cause) {
    throw new Error(`Verdict de release illisible : ${file}`, { cause });
  }
}

// --- Revue design-system (passe composable, fiche 20261011153019643) ---

/** Le réglage design-system effectif du projet (chemin du référentiel). */
export function designSystemConfig(projectRoot: string): DesignSystemConfig {
  const config = loadProjectConfig(projectRoot);
  return resolveDesignSystem((config as { release?: unknown } | undefined)?.release);
}

/** Chemin du verdict design-system d'une version (à côté du verdict de release). */
export function designSystemVerdictPath(projectRoot: string, version: string): string {
  return join(releaseDir(projectRoot), `${version}.design-system.json`);
}

/** Écrit le verdict design-system d'une version (crée le dossier au besoin). */
export function writeDesignSystemVerdict(projectRoot: string, verdict: DesignSystemVerdict): string {
  const file = designSystemVerdictPath(projectRoot, verdict.version);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');
  return file;
}

/** Lit le verdict design-system d'une version, ou `undefined` s'il n'a jamais été enregistré. */
export function readDesignSystemVerdict(projectRoot: string, version: string): DesignSystemVerdict | undefined {
  const file = designSystemVerdictPath(projectRoot, version);
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as DesignSystemVerdict;
  } catch (cause) {
    throw new Error(`Verdict design-system illisible : ${file}`, { cause });
  }
}
