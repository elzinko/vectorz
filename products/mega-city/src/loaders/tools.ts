/**
 * Loader des OUTILS de la méthode — frontière entrante (I/O), comme catalog.ts.
 * Fiche 20260917123943914, ADR-0058.
 *
 * Il LISTE les fichiers outils (`bin/*` et `skills/<skill>/scripts/*`), lit ce que le manifeste de
 * la commande `ezk` en dit, puis laisse le cœur pur (`core/tools.ts`) calculer qui cite quoi.
 * Rien ici ne juge : le cœur calcule, le validateur du graphe rapporte.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseManifest } from '../core/ezk-cli.js';
import { type RoutedTools, type Tool, deriveTools, isToolFile } from '../core/tools.js';
import type { Skill } from '../domain/model.js';

const MANIFEST_FILE = 'ezk-manifest.yml';
const SKILL_FILE = 'SKILL.md';

/**
 * Les fichiers outils sous `rootDir` (la racine du produit, `products/mega-city`) : leurs ids,
 * c'est-à-dire leurs chemins depuis cette racine, triés. Les dossiers et les liens symboliques sont
 * ignorés (même défense que les assets des skills). Un dossier sous `skills/` sans `SKILL.md`
 * n'est pas un skill : ses scripts ne comptent pas.
 */
export function listToolFiles(rootDir: string): string[] {
  const ids: string[] = [];
  const scan = (relDir: string, executableCounts: boolean): void => {
    const dir = join(rootDir, relDir);
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const executable =
        executableCounts && (statSync(join(dir, entry.name)).mode & 0o111) !== 0;
      if (isToolFile(entry.name, executable)) ids.push(`${relDir}/${entry.name}`);
    }
  };

  scan('bin', false);
  const skillsRoot = join(rootDir, 'skills');
  if (existsSync(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(skillsRoot, entry.name, SKILL_FILE))) {
        scan(`skills/${entry.name}/scripts`, true);
      }
    }
  }
  return ids.sort();
}

function addCommand(routed: RoutedTools, script: string, label: string): void {
  routed.commands.set(script, [...(routed.commands.get(script) ?? []), label].sort());
}

/** Les commandes installées par `package.json` (`bin`) : le lanceur `ezk` est l'une d'elles. */
function readPackageBin(rootDir: string, routed: RoutedTools): void {
  const path = join(rootDir, 'package.json');
  if (!existsSync(path)) return;
  let bin: unknown;
  try {
    bin = (JSON.parse(readFileSync(path, 'utf8')) as { bin?: unknown }).bin;
  } catch {
    return; // un package.json illisible n'est pas l'affaire de ce loader (npm s'en plaindra)
  }
  if (typeof bin !== 'object' || bin === null) return;
  for (const [name, script] of Object.entries(bin)) {
    if (typeof script === 'string') addCommand(routed, script.replace(/^\.\//, ''), name);
  }
}

/**
 * Ce que le manifeste dit des scripts : les commandes `ezk …` qui les lancent (anciens noms
 * exclus), et ceux déclarés « internal » avec leur raison. S'y ajoutent les commandes installées
 * par `package.json` (`bin`). Pas de manifeste, ou un manifeste que le routeur refuserait : rien
 * n'est routé. Le manifeste a son propre contrôle (`ezk-manifest.test.ts`) ; il ne doit pas faire
 * tomber le chargement du catalogue.
 */
export function readRouting(rootDir: string): RoutedTools {
  const routed: RoutedTools = { commands: new Map(), internal: new Map() };
  readPackageBin(rootDir, routed);
  const path = join(rootDir, MANIFEST_FILE);
  if (!existsSync(path)) return routed;
  let manifest: ReturnType<typeof parseManifest>;
  try {
    manifest = parseManifest(readFileSync(path, 'utf8'));
  } catch {
    return routed;
  }
  for (const entry of manifest.commands) {
    if (entry.deprecated) continue;
    const script = entry.run.split(/\s+/)[0];
    if (!script) continue;
    addCommand(routed, script, `ezk ${entry.domain}${entry.verb ? ` ${entry.verb}` : ''}`);
  }
  for (const { script, reason } of manifest.internal) routed.internal.set(script, reason);
  return routed;
}

/**
 * Les outils de la méthode, avec les skills qui les citent. `skills` est le catalogue déjà lu :
 * le texte de chaque skill (SKILL.md et ses fichiers markdown) est en mémoire, on ne relit rien.
 * Le nom du dossier d'un skill est son id (convention de `skills/`, tenue par un test).
 */
export function loadTools(rootDir: string, skills: ReadonlyMap<string, Skill>): Tool[] {
  const docs = [...skills.values()].map((skill) => ({
    skill: skill.id,
    texts: [
      skill.content,
      ...(skill.assets ?? []).filter((a) => a.path.endsWith('.md')).map((a) => a.content),
    ],
  }));
  return deriveTools(listToolFiles(rootDir), docs, readRouting(rootDir));
}
