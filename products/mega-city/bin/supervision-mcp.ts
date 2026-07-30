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
 * - Le registre central vit au siège (racine vectorz). On le découvre via
 *   `SUPERVISION_REGISTRY_DIR`, walk-up depuis la racine ancrée / cwd, puis
 *   depuis l'emplacement packagé du binaire (dogfood monorepo).
 * - Si trouvé et racine ancrée ∉ registre → fail-fast.
 * - Si trouvé et racine ∈ registre → méthode attendue transmise au runtime.
 * - Si aucun registre → comportement v1 inchangé.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSupervisionMcpServer } from '../src/supervision/mcp-server.js';
import { formatRootAnnouncement, resolveSupervisionRoot } from '../src/supervision/project-root.js';
import { findProjectByRoot, locateRegistry } from '../src/supervision/registry.js';

let resolvedRoot: ReturnType<typeof resolveSupervisionRoot>;
try {
  resolvedRoot = resolveSupervisionRoot(process.env, process.cwd());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

console.error(formatRootAnnouncement(resolvedRoot));

// Fiche 0082 — découverte du registre siège (pas seulement sous la racine ancrée).
// Ordre : SUPERVISION_REGISTRY_DIR (projets externes) → walk-up depuis l'ancre.
// Jamais depuis process.cwd() : le launcher (tsx depuis mega-city) vit dans le
// monorepo et « découvrirait » le registre dogfood contre une ancre /tmp isolée.
const registrySearchRoots = [
  ...(process.env.SUPERVISION_REGISTRY_DIR ? [process.env.SUPERVISION_REGISTRY_DIR] : []),
  resolvedRoot.root,
];

let expectedMethod: string | undefined;
try {
  const located = locateRegistry(registrySearchRoots);
  if (located !== null) {
    const entry = findProjectByRoot(located.registry, located.dir, resolvedRoot.root);
    if (entry === undefined) {
      console.error(
        `[supervision] ERREUR : la racine ancrée "${resolvedRoot.root}" n'est pas dans le registre ${located.dir}/supervision.registry.yaml — ajoutez-la ou vérifiez SUPERVISION_PROJECT_ROOT / SUPERVISION_REGISTRY_DIR.`,
      );
      process.exit(1);
    }
    expectedMethod = entry.method;
    console.error(
      `[supervision] registre (${located.dir}) : projet "${entry.id}", méthode attendue "${entry.method}"`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[supervision] ERREUR registre : ${message}`);
  process.exit(1);
}

const server = createSupervisionMcpServer(resolvedRoot.root, expectedMethod);
await server.connect(new StdioServerTransport());
