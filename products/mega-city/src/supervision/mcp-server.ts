/**
 * `mcp-server.ts` — couche mince MCP stdio du kit émetteur de supervisabilité v0.1
 * (fiche 0050, §7 + fiche 0103 heartbeat). Exactement 6 outils, pas un de plus.
 * Toute la logique (machine à états, enveloppe, seq, upgrade_ok, confinement) vit
 * dans `runtime.ts` ; ce fichier ne fait que déclarer les schémas d'entrée et
 * traduire runtime ↔ MCP.
 *
 * `project_root` est lu UNE FOIS à l'init depuis `SUPERVISION_PROJECT_ROOT`
 * (fallback `process.cwd()`) — jamais un paramètre d'outil (D12 : la méthode ne
 * doit pas pouvoir se désigner un autre projet à la volée).
 *
 * Test : la QA valide ce fichier via un vrai process stdio ; les 19 scénarios du
 * Gherkin sont couverts en amont, directement sur `SupervisionRuntime`.
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SupervisionRuntime } from './runtime.js';

/**
 * Re-export : la résolution de `project_root` depuis l'environnement a été
 * déplacée dans `project-root.ts` (ADR 0019, décision 1 — `project-root.ts`
 * porte désormais toute la logique git ; ce fichier reste git-agnostique).
 * Conservé ici pour qu'aucun importeur existant ne casse.
 */
export { resolveProjectRootFromEnv } from './project-root.js';

/** Traduit une erreur `SupervisionRuntime` (règle métier violée) en résultat d'outil MCP en erreur. */
function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

function toolOk(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}

/**
 * Construit le serveur MCP émetteur, câblé sur un `SupervisionRuntime` pour `projectRoot`.
 * @param projectRoot Racine effective du projet supervisé.
 * @param expectedMethod Méthode attendue selon le registre (fiche 0082) — optionnelle.
 */
export function createSupervisionMcpServer(projectRoot: string, expectedMethod?: string): McpServer {
  const runtime = new SupervisionRuntime(projectRoot, expectedMethod);

  const server = new McpServer({
    name: 'cop1-supervision-emitter',
    version: '0.1.0',
  });

  server.registerTool(
    'run_start',
    {
      description: "Ouvre un nouveau run de supervision (premier événement obligatoire du journal).",
      inputSchema: {
        method_name: z.string(),
        method_version: z.string(),
        seat: z.string().optional(),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.runStart(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'gate_reached',
    {
      description: 'Déclare un jalon atteint. La méthode STOP et attend gate_resumed.',
      inputSchema: {
        gate_id: z.string(),
        outcome: z.enum(['ok', 'attention', 'failed']),
        report_markdown: z.string().optional(),
        upgrade_ok_veto: z.boolean().optional(),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.gateReached(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'gate_resumed',
    {
      description: 'Accuse la reprise après un gate_reached — référence son gate_event_id.',
      inputSchema: {
        gate_event_id: z.string(),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.gateResumed(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'escalate',
    {
      description: 'Signale un blocage/besoin d’autorité (jamais un frein, D10).',
      inputSchema: {
        type: z.enum(['blocked', 'authority']),
        detail: z.string(),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.escalate(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'heartbeat',
    {
      description:
        'Signe de vie pendant un run ouvert (entre deux jalons) — réarme le timer « Silence prolongé » du Moniteur. note optionnelle.',
      inputSchema: {
        note: z.string().optional(),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.heartbeat(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'run_finished',
    {
      description: 'Clôture le run courant.',
      inputSchema: {
        status: z.enum(['success', 'failure', 'abandoned']),
      },
    },
    (args) => {
      try {
        return toolOk(runtime.runFinished(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  return server;
}
