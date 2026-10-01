/**
 * Loader des OUTILS de la méthode — frontière entrante (I/O), comme catalog.ts.
 * Fiche 20260917123943914, ADR-0058.
 *
 * Il LISTE les fichiers outils (`bin/*` et `skills/<skill>/scripts/*`), lit ce que le manifeste de
 * la commande `ezk` en dit, puis laisse le cœur pur (`core/tools.ts`) calculer qui cite quoi.
 * Rien ici ne juge : le cœur calcule, le validateur du graphe rapporte.
 */
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseManifest } from '../core/ezk-cli.js';
import { type RoutedTools, type Tool, deriveTools, isToolFile } from '../core/tools.js';
import type { Skill } from '../domain/model.js';

const MANIFEST_FILE = 'ezk-manifest.yml';
const SKILL_FILE = 'SKILL.md';

/** Les deux premiers octets du fichier sont `#!` : c'est un script, même sans extension ni droit d'exécution. */
function startsWithShebang(file: string): boolean {
  try {
    const fd = openSync(file, 'r');
    try {
      const head = Buffer.alloc(2);
      return readSync(fd, head, 0, 2, 0) === 2 && head.toString('latin1') === '#!';
    } finally {
      closeSync(fd);
    }
  } catch {
    return false;
  }
}

/**
 * Les fichiers outils sous `rootDir` (la racine du produit, `products/mega-city`) : leurs ids,
 * c'est-à-dire leurs chemins depuis cette racine, triés. Les dossiers et les liens symboliques sont
 * ignorés (même défense que les assets des skills). Un dossier sous `skills/` sans `SKILL.md`
 * n'est pas un skill : ses scripts ne comptent pas. Dans `scripts/`, un fichier sans extension est
 * un outil s'il est exécutable OU s'il commence par `#!` : le hook `commit-msg` est un script,
 * même si git le garde en mode 644.
 */
export function listToolFiles(rootDir: string): string[] {
  const ids: string[] = [];
  const scan = (relDir: string, extensionlessCounts: boolean): void => {
    const dir = join(rootDir, relDir);
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const full = join(dir, entry.name);
      const scriptLike =
        extensionlessCounts && ((statSync(full).mode & 0o111) !== 0 || startsWithShebang(full));
      if (isToolFile(entry.name, scriptLike)) ids.push(`${relDir}/${entry.name}`);
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
