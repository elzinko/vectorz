/**
 * Loader de la gate de release (bord I/O, ADR-0003) — lit les passes déclarées d'un projet,
 * lit le réglage `release.gate`, et lit/écrit le verdict d'une version.
 *
 * - Passes : `.vectorz/release-passes.yml` (liste `{ id, title, command }`). Absent → les
 *   `DEFAULT_PASSES` du cœur. YAML malformé → erreur claire (jamais de coupure silencieuse).
 * - Verdict : `.vectorz/release/<version>.json` — écrit par `ezk release`, lu par
 *   `backlog version close --tag` pour refuser le tag sur NO-GO (ou verdict absent), et par
 *   `board show` pour publier le dernier (fiche 20261114131612759).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Document, isMap, isSeq, parse as parseYaml, parseDocument } from 'yaml';
import { type DesignSystemConfig, type DesignSystemVerdict, resolveDesignSystem } from '../core/design-system-review.js';
import {
  type EffectivePass,
  type PassVerdict,
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

/** Le fichier de passes projet : le `.yml`/`.yaml` existant, ou le défaut `.vectorz/release-passes.yml`. */
function projectPassesFilePath(projectRoot: string): string {
  for (const name of PASSES_NAMES) {
    const f = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (existsSync(f)) return f;
  }
  return join(projectRoot, PROJECT_CONFIG_DIR, PASSES_NAMES[0]);
}

/**
 * Ajoute une passe projet dans `.vectorz/release-passes.yml` (le crée au besoin), sans détruire les
 * voisins ni les commentaires (édition de document `yaml`). Accepte un fichier en liste nue ou en
 * `{ passes: [...] }` ; sans fichier, en crée un sur la forme `{ passes: [...] }`.
 */
export function addProjectPass(projectRoot: string, pass: ReleasePass): string {
  const file = projectPassesFilePath(projectRoot);
  const entry = { id: pass.id, title: pass.title, command: pass.command };
  let doc: Document;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, 'utf8'));
    if (doc.errors.length > 0) throw new Error(`Passes de release illisibles (YAML malformé) : ${file}`);
    if (isSeq(doc.contents)) {
      doc.contents.add(entry);
    } else {
      const passes = doc.get('passes');
      if (isSeq(passes)) passes.add(entry);
      else doc.set('passes', [entry]);
    }
  } else {
    doc = new Document({ passes: [entry] });
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, doc.toString(), 'utf8');
  return file;
}

/** Retire une passe projet par id ; renvoie `true` si une passe a été retirée. */
export function removeProjectPass(projectRoot: string, id: string): boolean {
  const file = projectPassesFilePath(projectRoot);
  if (!existsSync(file)) return false;
  const doc = parseDocument(readFileSync(file, 'utf8'));
  if (doc.errors.length > 0) throw new Error(`Passes de release illisibles (YAML malformé) : ${file}`);
  const seq = isSeq(doc.contents) ? doc.contents : doc.get('passes');
  if (!isSeq(seq)) return false;
  const idx = seq.items.findIndex((it) => isMap(it) && it.get('id') === id);
  if (idx < 0) return false;
  seq.delete(idx);
  writeFileSync(file, doc.toString(), 'utf8');
  return true;
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

/** Le fichier d'un verdict de VERSION (`v0.11.0.json`) : ni un verdict de passe, ni le design-system. */
const VERSION_VERDICT_FILE = /^(v\d+\.\d+\.\d+)\.json$/;

/** La date d'un verdict en millisecondes ; un `at` absent ou illisible compte comme le plus ancien. */
function verdictTime(verdict: ReleaseVerdict): number {
  const time = Date.parse(verdict.at);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/**
 * Le verdict de version le plus récemment établi (champ `at`), ou `undefined` si aucun.
 * Un fichier de verdict illisible est écarté : il ne peut pas être le dernier verdict établi, et un
 * seul fichier à moitié écrit ne doit pas faire tomber le board qui lit ce verdict.
 */
export function latestReleaseVerdict(projectRoot: string): ReleaseVerdict | undefined {
  const dir = releaseDir(projectRoot);
  if (!existsSync(dir)) return undefined;
  let latest: ReleaseVerdict | undefined;
  for (const name of readdirSync(dir).sort()) {
    const version = VERSION_VERDICT_FILE.exec(name)?.[1];
    if (version === undefined) continue;
    let verdict: ReleaseVerdict | undefined;
    try {
      verdict = readReleaseVerdict(projectRoot, version);
    } catch {
      continue;
    }
    if (verdict !== undefined && (latest === undefined || verdictTime(verdict) > verdictTime(latest))) latest = verdict;
  }
  return latest;
}

/** Chemin du verdict d'une passe à jugement d'une version (`.vectorz/release/<v>.<passe>.json`). */
export function passVerdictPath(projectRoot: string, version: string, passe: string): string {
  return join(releaseDir(projectRoot), `${version}.${passe}.json`);
}

/** Écrit le verdict d'une passe (crée le dossier au besoin). */
export function writePassVerdict(projectRoot: string, verdict: PassVerdict): string {
  const file = passVerdictPath(projectRoot, verdict.version, verdict.passe);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');
  return file;
}

/** Lit le verdict d'une passe, ou `undefined` s'il n'a jamais été posé. */
export function readPassVerdict(projectRoot: string, version: string, passe: string): PassVerdict | undefined {
  const file = passVerdictPath(projectRoot, version, passe);
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as PassVerdict;
  } catch (cause) {
    throw new Error(`Verdict de passe illisible : ${file}`, { cause });
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
