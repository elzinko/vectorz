#!/usr/bin/env node
/**
 * Point d'entrée du serveur MCP émetteur de supervisabilité (stdio). Chemin
 * nominal pour Claude Desktop (D12, §7) — instancie le serveur et le connecte
 * au transport stdio, rien de plus.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSupervisionMcpServer, resolveProjectRootFromEnv } from '../src/supervision/mcp-server.js';

let projectRoot: string;
try {
  projectRoot = resolveProjectRootFromEnv();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

const server = createSupervisionMcpServer(projectRoot);
await server.connect(new StdioServerTransport());
