import { describe, expect, it } from 'vitest';
import {
  buildSupervisionServer,
  ensureSupervisionIgnored,
  type LinkPaths,
  mergeMcpConfig,
} from '../link-config.js';

const PATHS: LinkPaths = {
  pnpm: '/abs/bin/pnpm',
  megaCityDir: '/repo/products/mega-city',
  serverEntry: '/repo/products/mega-city/bin/supervision-mcp.ts',
  projectRoot: '/projet',
};

describe('link-config (fiche 0094)', () => {
  it('builds the proven manual invocation', () => {
    expect(buildSupervisionServer(PATHS)).toEqual({
      command: '/abs/bin/pnpm',
      args: [
        '--dir',
        '/repo/products/mega-city',
        'exec',
        'tsx',
        '/repo/products/mega-city/bin/supervision-mcp.ts',
      ],
      env: { SUPERVISION_PROJECT_ROOT: '/projet' },
    });
  });

  it('adds a supervision server to an empty config', () => {
    const merged = mergeMcpConfig({}, PATHS);
    const servers = merged.mcpServers as Record<string, unknown>;
    expect(servers.supervision).toBeDefined();
  });

  it('preserves other MCP servers and other top-level keys (non-destructive)', () => {
    const existing = {
      $schema: 'x',
      mcpServers: { other: { command: 'keep-me' } },
    };
    const merged = mergeMcpConfig(existing, PATHS);
    const servers = merged.mcpServers as Record<string, unknown>;
    expect(servers.other).toEqual({ command: 'keep-me' });
    expect(servers.supervision).toBeDefined();
    expect(merged.$schema).toBe('x');
  });

  it('overwrites a stale supervision entry (re-link updates paths)', () => {
    const stale = { mcpServers: { supervision: { command: 'OLD', args: [], env: {} } } };
    const merged = mergeMcpConfig(stale, PATHS);
    const servers = merged.mcpServers as Record<string, unknown>;
    expect((servers.supervision as { command: string }).command).toBe('/abs/bin/pnpm');
  });

  it('is idempotent (re-running yields a structurally identical object)', () => {
    const once = mergeMcpConfig({}, PATHS);
    const twice = mergeMcpConfig(once, PATHS);
    expect(twice).toEqual(once);
  });

  it('tolerates a malformed existing config (null, array, non-object)', () => {
    expect(mergeMcpConfig(null, PATHS).mcpServers).toBeDefined();
    expect(mergeMcpConfig([1, 2], PATHS).mcpServers).toBeDefined();
    expect(mergeMcpConfig('nope', PATHS).mcpServers).toBeDefined();
  });

  it('appends .supervision/ once, and is a no-op when already present', () => {
    expect(ensureSupervisionIgnored('')).toBe('.supervision/\n');
    expect(ensureSupervisionIgnored('node_modules\n')).toBe('node_modules\n.supervision/\n');
    expect(ensureSupervisionIgnored('.supervision/\n')).toBe('.supervision/\n');
    expect(ensureSupervisionIgnored('a\n.supervision')).toBe('a\n.supervision');
  });

  it('inserts a missing trailing newline before appending', () => {
    expect(ensureSupervisionIgnored('node_modules')).toBe('node_modules\n.supervision/\n');
  });
});
