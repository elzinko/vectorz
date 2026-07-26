import { describe, expect, it } from 'vitest';
import {
  buildSupervisionServer,
  ensureSupervisionIgnored,
  type LinkPaths,
  mergeMcpConfig,
  resolveProjectPath,
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

  // Le commentaire précède l'entrée /.mcp.json : un `.gitignore` doit rester lisible
  // par l'humain qui l'ouvre six mois plus tard sans connaître l'ADR.
  const MCP_LINES = '# Branchement de supervision : artefact local, régénéré par supervision:link (ADR-034)\n/.mcp.json\n';

  it('ignore le journal ET le fichier de branchement, une seule fois chacun', () => {
    expect(ensureSupervisionIgnored('')).toBe(`.supervision/\n${MCP_LINES}`);
    expect(ensureSupervisionIgnored('node_modules\n')).toBe(`node_modules\n.supervision/\n${MCP_LINES}`);
  });

  it('est idempotent : rejouer supervision:link ne duplique aucune règle', () => {
    const once = ensureSupervisionIgnored('node_modules\n');
    expect(ensureSupervisionIgnored(once)).toBe(once);
  });

  it('respecte les formes déjà présentes (avec ou sans slash, ancrée ou non)', () => {
    expect(ensureSupervisionIgnored('.supervision/\n/.mcp.json\n')).toBe('.supervision/\n/.mcp.json\n');
    // `.mcp.json` non ancré est plus large que notre règle : on ne le double pas.
    expect(ensureSupervisionIgnored('a\n.supervision\n.mcp.json\n')).toBe('a\n.supervision\n.mcp.json\n');
  });

  it('inserts a missing trailing newline before appending', () => {
    expect(ensureSupervisionIgnored('node_modules')).toBe(`node_modules\n.supervision/\n${MCP_LINES}`);
  });

  // Finding Codex P1 (PR #54) : la règle ADR-034 doit suivre CHAQUE projet branché,
  // pas seulement vectorz — un `.mcp.json` généré pour un cobaye est tout aussi
  // machine-spécifique, et rien n'empêchait de le commiter.
  it('ignore le .mcp.json même quand le projet ignorait déjà .supervision/', () => {
    expect(ensureSupervisionIgnored('.supervision/\n')).toBe(`.supervision/\n${MCP_LINES}`);
  });

  // revue Codex PR #51 — le piège `pnpm --dir` sur les chemins relatifs
  describe('resolveProjectPath', () => {
    it('returns an absolute path unchanged', () => {
      expect(resolveProjectPath('/abs/projet', '/caller', '/pkg')).toBe('/abs/projet');
    });

    it('resolves a relative path against INIT_CWD (caller dir), not the script cwd', () => {
      expect(resolveProjectPath('.', '/caller', '/pkg')).toBe('/caller');
      expect(resolveProjectPath('../autre', '/caller/sub', '/pkg')).toBe('/caller/autre');
    });

    it('falls back to cwd when INIT_CWD is absent or empty', () => {
      expect(resolveProjectPath('projet', undefined, '/cwd')).toBe('/cwd/projet');
      expect(resolveProjectPath('projet', '', '/cwd')).toBe('/cwd/projet');
    });
  });
});
