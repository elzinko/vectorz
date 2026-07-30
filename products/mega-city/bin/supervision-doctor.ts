#!/usr/bin/env node
/**
 * `supervision-doctor` — script READ-ONLY (fiche 0082).
 *
 * Compare le registre `supervision.registry.yaml` à la configuration d'ancrage
 * (`.mcp.json` de chaque projet, et la config Claude Desktop si disponible).
 * Imprime ce qui manque : les projets du registre sans ancrage configuré.
 *
 * Ne modifie JAMAIS la configuration de l'application — l'humain applique.
 * N'écrit rien sur le disque, aucun `fs.writeFile*` ou `fs.write*`.
 *
 * Usage : pnpm --dir products/mega-city supervision:doctor [chemin-registre]
 *   chemin-registre : répertoire contenant `supervision.registry.yaml`
 *                     (défaut : INIT_CWD, ou cwd courant)
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { findProjectByRoot, loadRegistry, resolveWatchRoots } from '../src/supervision/registry.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface McpServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
}

interface McpConfig {
  mcpServers?: Record<string, McpServerEntry>;
}

/** Lit un fichier JSON de manière tolérante — retourne null si absent ou invalide. */
function readJsonFile(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
  } catch {
    return null;
  }
}

/**
 * Extrait les racines de supervision ancrées depuis une config MCP (`.mcp.json`
 * ou `claude_desktop_config.json`). Recherche tous les serveurs MCP dont l'env
 * contient `SUPERVISION_PROJECT_ROOT`.
 */
function extractAnchoredRoots(config: unknown): string[] {
  if (!config || typeof config !== 'object') return [];
  const { mcpServers } = config as McpConfig;
  if (!mcpServers || typeof mcpServers !== 'object') return [];

  const roots: string[] = [];
  for (const server of Object.values(mcpServers)) {
    if (!server || typeof server !== 'object') continue;
    const root = server.env?.SUPERVISION_PROJECT_ROOT;
    if (typeof root === 'string' && root.length > 0) {
      roots.push(resolve(root));
    }
  }
  return roots;
}

/** Chemin canonique de la config Claude Desktop selon l'OS (darwin). */
function claudeDesktopConfigPath(): string {
  return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const arg = process.argv[2];
const initCwd = process.env.INIT_CWD;
const registryDir = arg
  ? resolve(arg)
  : initCwd && initCwd.length > 0
    ? resolve(initCwd)
    : process.cwd();

console.log(`[supervision-doctor] registre cherché dans : ${registryDir}`);

// 1. Charger le registre
let registry: ReturnType<typeof loadRegistry>;
try {
  registry = loadRegistry(registryDir);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[supervision-doctor] ERREUR : ${msg}`);
  process.exit(1);
}

if (registry === null) {
  console.log('[supervision-doctor] Aucun supervision.registry.yaml trouvé — comportement v1 (aucun registre).');
  process.exit(0);
}

console.log(`[supervision-doctor] ${registry.projects.length} projet(s) dans le registre.\n`);

// 2. Collecter tous les ancrages connus

// 2a. Claude Desktop
const desktopConfigPath = claudeDesktopConfigPath();
const desktopConfig = readJsonFile(desktopConfigPath);
const desktopRoots = extractAnchoredRoots(desktopConfig);

if (existsSync(desktopConfigPath)) {
  console.log(`[supervision-doctor] Config Desktop : ${desktopConfigPath}`);
  if (desktopRoots.length > 0) {
    console.log(`  Racines ancrées : ${desktopRoots.join(', ')}`);
  } else {
    console.log('  Aucune racine de supervision ancrée dans la config Desktop.');
  }
} else {
  console.log('[supervision-doctor] Config Desktop introuvable (normal hors macOS ou sans Claude Desktop).');
}

// 2b. .mcp.json de chaque projet du registre
const projectMcpRoots: string[] = [];
const resolvedRoots = resolveWatchRoots(registry, registryDir);

for (const projectRoot of resolvedRoots) {
  const mcpJsonPath = join(projectRoot, '.mcp.json');
  const mcpConfig = readJsonFile(mcpJsonPath);
  const roots = extractAnchoredRoots(mcpConfig);
  projectMcpRoots.push(...roots);
  if (roots.length > 0) {
    console.log(`  .mcp.json trouvé : ${mcpJsonPath} → racines : ${roots.join(', ')}`);
  }
}

const allAnchoredRoots = new Set([...desktopRoots, ...projectMcpRoots]);

// 3. Comparer registre ↔ ancrages
console.log('\n--- Rapport ---');

let missingCount = 0;
for (let i = 0; i < registry.projects.length; i++) {
  const project = registry.projects[i]!;
  const resolvedPath = resolvedRoots[i]!;
  const isAnchored = allAnchoredRoots.has(resolve(resolvedPath));

  // Also check if this resolved path matches via findProjectByRoot
  const matched = findProjectByRoot(registry, registryDir, resolvedPath) !== undefined;

  if (isAnchored) {
    console.log(`✓ ${project.id} (${project.method}) → ancré (${resolvedPath})`);
  } else {
    console.log(`✗ ${project.id} (${project.method}) → NON ANCRÉ (${resolvedPath})`);
    console.log(`    → Action humaine requise : configurer SUPERVISION_PROJECT_ROOT=${resolvedPath}`);
    console.log(`      dans un serveur MCP émetteur (Desktop ou .mcp.json).`);
    console.log(`      Commande : pnpm --dir products/mega-city supervision:link ${resolvedPath}`);
    if (!matched) {
      console.log('    (note: chemin non résolu dans le registre — vérifiez le champ "path")');
    }
    missingCount++;
  }
}

console.log('');
if (missingCount === 0) {
  console.log(`[supervision-doctor] ✓ Tous les projets du registre sont ancrés.`);
} else {
  console.log(`[supervision-doctor] ✗ ${missingCount} projet(s) sans ancrage.`);
  console.log('[supervision-doctor] Ce script est READ-ONLY — appliquez les corrections manuellement.');
}

// Exit code non-zero si manquants (utile en CI)
process.exit(missingCount > 0 ? 1 : 0);
