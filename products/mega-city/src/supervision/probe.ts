/**
 * Cœur pur du banc de preuve `supervision:probe` (fiche 0094). Vérifie que le
 * `.mcp.json` généré est réellement exécutable et expose les bons outils —
 * ce que les tests existants (qui invoquent le serveur eux-mêmes) ne prouvent
 * pas. Sans I/O ici : lecture fichier, spawn et handshake vivent dans la
 * coquille `bin/supervision-probe.ts`.
 */

/** Les 6 outils du kit émetteur — ni plus, ni moins (fiche 0050 §7 + 0103 heartbeat). */
export const EXPECTED_SUPERVISION_TOOLS = [
  'run_start',
  'gate_reached',
  'gate_resumed',
  'escalate',
  'heartbeat',
  'run_finished',
] as const;

export interface SupervisionServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export type ExtractResult =
  | { ok: true; config: SupervisionServerConfig }
  | {
      ok: false;
      reason: 'malformed-mcp-json' | 'missing-supervision-entry' | 'invalid-supervision-entry';
    };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extrait l'entrée `mcpServers.supervision` d'un `.mcp.json` déjà parsé.
 * Ne valide pas au-delà de la forme minimale utile au spawn (command +
 * args tableau de chaînes) : le handshake MCP se chargera de dire si ça démarre.
 * Distingue un fichier MALFORMÉ (rien d'exploitable) d'une entrée ABSENTE
 * (fichier valide, projet simplement pas branché) — le conseil rendu à
 * l'utilisateur n'est pas le même.
 */
export function extractSupervisionServerConfig(mcpJson: unknown): ExtractResult {
  if (!isPlainObject(mcpJson)) return { ok: false, reason: 'malformed-mcp-json' };

  const servers = mcpJson.mcpServers;
  if (servers !== undefined && !isPlainObject(servers)) {
    return { ok: false, reason: 'malformed-mcp-json' };
  }
  if (!isPlainObject(servers) || !isPlainObject(servers.supervision)) {
    return { ok: false, reason: 'missing-supervision-entry' };
  }

  const entry = servers.supervision;
  if (
    typeof entry.command !== 'string' ||
    !Array.isArray(entry.args) ||
    !entry.args.every((arg): arg is string => typeof arg === 'string')
  ) {
    return { ok: false, reason: 'invalid-supervision-entry' };
  }

  return {
    ok: true,
    config: {
      command: entry.command,
      args: entry.args,
      env: isPlainObject(entry.env) ? (entry.env as Record<string, string>) : {},
    },
  };
}

export type Verdict =
  | { ok: true; tools: readonly string[] }
  | { ok: false; missing: string[]; unexpected: string[]; duplicates: string[] };

/**
 * Rend le verdict à partir de la liste des outils observés en réponse à
 * `tools/list` — comparaison EXACTE à l'ensemble attendu (fiche 0094 pt.4).
 * « Exactement 5 » se contrôle aussi en CARDINALITÉ : un même nom exposé deux
 * fois ne donne ni manquant ni intrus, mais ce n'est pas la liste attendue.
 */
export function verdictFromObservedTools(observedTools: string[]): Verdict {
  const expected = new Set<string>(EXPECTED_SUPERVISION_TOOLS);
  const observed = new Set(observedTools);

  const missing = EXPECTED_SUPERVISION_TOOLS.filter((tool) => !observed.has(tool));
  const unexpected = [...new Set(observedTools.filter((tool) => !expected.has(tool)))];
  const seen = new Set<string>();
  const duplicates = [
    ...new Set(observedTools.filter((tool) => (seen.has(tool) ? true : (seen.add(tool), false)))),
  ];

  if (missing.length === 0 && unexpected.length === 0 && duplicates.length === 0) {
    return { ok: true, tools: EXPECTED_SUPERVISION_TOOLS };
  }
  return { ok: false, missing, unexpected, duplicates };
}

export type RootVerdict =
  | { ok: true }
  | { ok: false; reason: 'missing' }
  | { ok: false; reason: 'mismatch'; declared: string; probed: string };

/**
 * Vérifie que la racine DÉCLARÉE dans le `.mcp.json` est bien celle du projet
 * sondé. Sans ce contrôle, « branché » ne voudrait dire que « ça démarre » :
 * un `.mcp.json` déposé dans le projet A mais pointant sur B sortirait vert
 * pendant que tous les runs de A journaliseraient dans `B/.supervision/`
 * (le piège `INIT_CWD` relevé par Codex sur la PR #51 produit exactement ça).
 *
 * Les deux chemins sont attendus DÉJÀ résolus (realpath) par l'appelant — la
 * comparaison est pure, la résolution est de l'I/O.
 *
 * Sévérité assumée (revue 2026-07-26, W4) : on compare la racine DÉCLARÉE, pas
 * la racine EFFECTIVE après normalisation ADR-019. Un `.mcp.json` édité à la
 * main dans un worktree pour viser directement l'arbre principal sortirait donc
 * rouge, alors qu'il se comporterait à l'identique. C'est voulu : le générateur
 * ne produit jamais cette forme, et un écart déclaré/sondé est bien plus souvent
 * un accident (piège `INIT_CWD`) qu'une intention.
 */
export function verdictFromDeclaredRoot(
  declaredRealPath: string | undefined,
  probedRealPath: string,
): RootVerdict {
  if (declaredRealPath === undefined || declaredRealPath === '') return { ok: false, reason: 'missing' };
  if (declaredRealPath !== probedRealPath) {
    return { ok: false, reason: 'mismatch', declared: declaredRealPath, probed: probedRealPath };
  }
  return { ok: true };
}
