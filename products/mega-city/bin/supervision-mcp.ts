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
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSupervisionMcpServer } from '../src/supervision/mcp-server.js';
import { formatRootAnnouncement, resolveSupervisionRoot } from '../src/supervision/project-root.js';

let resolvedRoot: ReturnType<typeof resolveSupervisionRoot>;
try {
  resolvedRoot = resolveSupervisionRoot(process.env, process.cwd());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

console.error(formatRootAnnouncement(resolvedRoot));

const server = createSupervisionMcpServer(resolvedRoot.root);
await server.connect(new StdioServerTransport());
