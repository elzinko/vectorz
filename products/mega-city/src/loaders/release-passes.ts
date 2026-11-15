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
import {
  type EffectivePass,
  type ReleaseConfig,
  type ReleasePass,
  type ReleaseVerdict,
  effectivePasses,
  resolveRelease,
} from '../core/release-gate.js';
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
 * Les passes DÉCLARÉES du projet et le drapeau `replace`, ou une liste vide sans fichier.
 * Le fichier accepte une liste de passes (`passes:` ou un tableau racine) et, en tête, `replace: true`
 * pour REMPLACER le socle au lieu de le COMPLÉTER. YAML malformé ou passe mal formée → ERREUR claire
 * (jamais de repli silencieux — la faute serait invisible).
 */
export function readProjectPasses(projectRoot: string): { passes: readonly ReleasePass[]; replace: boolean } {
  for (const name of PASSES_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (!existsSync(file)) continue;
    let parsed: unknown;
    try {
      parsed = parseYaml(readFileSync(file, 'utf8'));
    } catch (cause) {
      throw new Error(`Passes de release illisibles (YAML malformé) : ${file}`, { cause });
    }
    const asObj = (parsed ?? {}) as { passes?: unknown; replace?: unknown };
    const list = Array.isArray(parsed) ? parsed : asObj.passes;
    if (!Array.isArray(list)) {
      throw new Error(`Passes de release invalides (attendu une liste 'passes:') : ${file}`);
    }
    if (asObj.replace !== undefined && typeof asObj.replace !== 'boolean') {
      throw new Error(
        `Réglage « replace » invalide dans ${file} : attendu un booléen true/false, reçu ${JSON.stringify(asObj.replace)}.`,
      );
    }
    const passes = list.map((raw, i) => {
      const p = raw as Record<string, unknown>;
      if (typeof p.id !== 'string' || typeof p.title !== 'string' || typeof p.command !== 'string') {
        throw new Error(`Passe de release #${i + 1} invalide (id/title/command requis) : ${file}`);
      }
      return { id: p.id, title: p.title, command: p.command };
    });
    return { passes, replace: asObj.replace === true };
  }
  return { passes: [], replace: false };
}

/**
 * Les passes EFFECTIVES d'un projet, composées (socle complété ou remplacé) et ordonnées, chacune
 * avec sa source et son drapeau « sautée ». La passe `tests` du socle est jouée si `release.tests`
 * est déclaré, sinon sautée. C'est la vue que `ezk release` joue et que `passes list` affiche.
 */
export function loadEffectivePasses(projectRoot: string): readonly EffectivePass[] {
  const { passes, replace } = readProjectPasses(projectRoot);
  return effectivePasses(passes, replace, releaseConfig(projectRoot).tests);
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
