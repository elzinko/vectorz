#!/usr/bin/env node
/**
 * Point d'entrée du serveur MCP émetteur de supervisabilité (stdio). Chemin
 * nominal pour Claude Desktop (D12, §7) — instancie le serveur et le connecte
 * au transport stdio, rien de plus.
 *
 * La racine effective est calculée ICI (composition root, ADR 0019 décision 2)
 * via `resolveSupervisionRoot`, puis annoncée sur STDERR (jamais stdout, réservé
 * au protocole MCP) avant de construire le serveur — l'annonce est une
 * condition de la normalisation, pas un bonus (ADR décision 8).
 *
 * Fiche 0082 — Registre de supervision :
 * - Si `supervision.registry.yaml` est trouvé à la racine résolue ET que la racine
 *   n'est pas dans le registre → fail-fast (le réglage Desktop ancre un projet non déclaré).
 * - Si le registre est trouvé et la racine est dans le registre → la méthode attendue
 *   est transmise au runtime pour annotation d'écart au `run_start`.
 * - Si aucun registre → comportement v1 inchangé.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSupervisionMcpServer } from '../src/supervision/mcp-server.js';
import { formatRootAnnouncement, resolveSupervisionRoot } from '../src/supervision/project-root.js';
import { findProjectByRoot, loadRegistry } from '../src/supervision/registry.js';

let resolvedRoot: ReturnType<typeof resolveSupervisionRoot>;
try {
  resolvedRoot = resolveSupervisionRoot(process.env, process.cwd());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

console.error(formatRootAnnouncement(resolvedRoot));

// Fiche 0082 — vérification registre (lu une seule fois à l'init, jamais paramètre d'outil)
let expectedMethod: string | undefined;
try {
  const registry = loadRegistry(resolvedRoot.root);
  if (registry !== null) {
    const entry = findProjectByRoot(registry, resolvedRoot.root, resolvedRoot.root);
    if (entry === undefined) {
      console.error(
        `[supervision] ERREUR : la racine ancrée "${resolvedRoot.root}" n'est pas dans le registre supervision.registry.yaml — ajoutez-la ou vérifiez SUPERVISION_PROJECT_ROOT.`,
      );
      process.exit(1);
    }
    expectedMethod = entry.method;
    console.error(`[supervision] registre : projet "${entry.id}", méthode attendue "${entry.method}"`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[supervision] ERREUR registre : ${message}`);
  process.exit(1);
}

const server = createSupervisionMcpServer(resolvedRoot.root, expectedMethod);
await server.connect(new StdioServerTransport());
