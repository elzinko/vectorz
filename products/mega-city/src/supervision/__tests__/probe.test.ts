import { describe, expect, it } from 'vitest';
import {
  EXPECTED_SUPERVISION_TOOLS,
  extractSupervisionServerConfig,
  verdictFromDeclaredRoot,
  verdictFromObservedTools,
} from '../probe.js';

describe('probe (fiche 0094) — coeur pur', () => {
  describe('extractSupervisionServerConfig', () => {
    it('extrait command/args/env depuis un .mcp.json déjà parsé', () => {
      const mcpJson = {
        mcpServers: {
          supervision: {
            command: '/abs/bin/pnpm',
            args: ['--dir', '/repo/products/mega-city', 'exec', 'tsx', '/repo/.../supervision-mcp.ts'],
            env: { SUPERVISION_PROJECT_ROOT: '/projet' },
          },
        },
      };
      const result = extractSupervisionServerConfig(mcpJson);
      expect(result).toEqual({
        ok: true,
        config: {
          command: '/abs/bin/pnpm',
          args: ['--dir', '/repo/products/mega-city', 'exec', 'tsx', '/repo/.../supervision-mcp.ts'],
          env: { SUPERVISION_PROJECT_ROOT: '/projet' },
        },
      });
    });

    it("signale l'absence de l'entrée supervision", () => {
      const result = extractSupervisionServerConfig({ mcpServers: { other: {} } });
      expect(result).toEqual({ ok: false, reason: 'missing-supervision-entry' });
    });

    it("signale l'absence de mcpServers", () => {
      expect(extractSupervisionServerConfig({})).toEqual({ ok: false, reason: 'missing-supervision-entry' });
    });

    it('signale un .mcp.json malformé (null, tableau, non-objet)', () => {
      expect(extractSupervisionServerConfig(null)).toEqual({ ok: false, reason: 'malformed-mcp-json' });
      expect(extractSupervisionServerConfig([1, 2])).toEqual({ ok: false, reason: 'malformed-mcp-json' });
      expect(extractSupervisionServerConfig('nope')).toEqual({ ok: false, reason: 'malformed-mcp-json' });
    });

    it('distingue un mcpServers PRÉSENT mais pas un objet (malformé) de son absence (pas branché)', () => {
      // Le conseil rendu diffère : réparer le fichier vs lancer supervision:link.
      expect(extractSupervisionServerConfig({ mcpServers: [] })).toEqual({
        ok: false,
        reason: 'malformed-mcp-json',
      });
      expect(extractSupervisionServerConfig({ mcpServers: 'x' })).toEqual({
        ok: false,
        reason: 'malformed-mcp-json',
      });
      expect(extractSupervisionServerConfig({ mcpServers: null })).toEqual({
        ok: false,
        reason: 'malformed-mcp-json',
      });
    });

    it('signale une entrée supervision incomplète (command manquante)', () => {
      const result = extractSupervisionServerConfig({
        mcpServers: { supervision: { args: [], env: {} } },
      });
      expect(result).toEqual({ ok: false, reason: 'invalid-supervision-entry' });
    });

    it('signale des args dont un élément n’est pas une chaîne — la vraie cause est la config, pas le spawn', () => {
      const result = extractSupervisionServerConfig({
        mcpServers: { supervision: { command: 'pnpm', args: ['--dir', 42], env: {} } },
      });
      expect(result).toEqual({ ok: false, reason: 'invalid-supervision-entry' });
    });
  });

  describe('verdictFromObservedTools', () => {
    it('verdict vert quand les outils observés sont exactement les 5 attendus (ordre indifférent)', () => {
      const observed = ['run_finished', 'run_start', 'gate_reached', 'escalate', 'gate_resumed'];
      expect(verdictFromObservedTools(observed)).toEqual({ ok: true, tools: EXPECTED_SUPERVISION_TOOLS });
    });

    it('verdict rouge avec la liste des outils manquants', () => {
      const observed = ['run_start', 'gate_reached', 'gate_resumed', 'escalate'];
      expect(verdictFromObservedTools(observed)).toEqual({
        ok: false,
        missing: ['run_finished'],
        unexpected: [],
        duplicates: [],
      });
    });

    it('verdict rouge avec la liste des outils en trop', () => {
      const observed = [...EXPECTED_SUPERVISION_TOOLS, 'emit_event'];
      expect(verdictFromObservedTools(observed)).toEqual({
        ok: false,
        missing: [],
        unexpected: ['emit_event'],
        duplicates: [],
      });
    });

    it('verdict rouge combinant manquants et en trop', () => {
      const observed = ['run_start', 'gate_reached', 'gate_resumed', 'escalate', 'emit_event'];
      expect(verdictFromObservedTools(observed)).toEqual({
        ok: false,
        missing: ['run_finished'],
        unexpected: ['emit_event'],
        duplicates: [],
      });
    });

    it('verdict ROUGE sur un doublon : les 5 noms sont là, mais ce ne sont pas 5 outils', () => {
      const observed = ['run_start', ...EXPECTED_SUPERVISION_TOOLS];
      expect(verdictFromObservedTools(observed)).toEqual({
        ok: false,
        missing: [],
        unexpected: [],
        duplicates: ['run_start'],
      });
    });
  });

  describe('verdictFromDeclaredRoot', () => {
    it('vert quand la racine déclarée est celle du projet sondé', () => {
      expect(verdictFromDeclaredRoot('/private/projet', '/private/projet')).toEqual({ ok: true });
    });

    it('rouge quand aucune racine n’est déclarée — le journal partirait au hasard du cwd', () => {
      expect(verdictFromDeclaredRoot(undefined, '/private/projet')).toEqual({ ok: false, reason: 'missing' });
      expect(verdictFromDeclaredRoot('', '/private/projet')).toEqual({ ok: false, reason: 'missing' });
    });

    it('rouge quand la racine déclarée désigne un AUTRE projet (piège INIT_CWD, PR #51)', () => {
      expect(verdictFromDeclaredRoot('/private/autre', '/private/projet')).toEqual({
        ok: false,
        reason: 'mismatch',
        declared: '/private/autre',
        probed: '/private/projet',
      });
    });
  });
});
