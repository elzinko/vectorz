#!/usr/bin/env node
/**
 * supervision-probe — banc de preuve rapide qu'un projet est réellement
 * branché sur l'émetteur de supervision (fiche 0094).
 *
 *   pnpm --dir products/mega-city supervision:probe [chemin-du-projet]
 *
 * Comble un trou : les tests existants prouvent que le serveur marche quand
 * le harnais de test l'invoque lui-même. Rien ne prouvait que le `.mcp.json`
 * GÉNÉRÉ est exécutable tel quel (chemin pnpm absolu, `--dir` présent, entrée
 * tsx correcte) — précisément ce qui casse en conditions réelles.
 *
 * Trois contrôles, dans cet ordre : l'entrée `supervision` est exploitable ·
 * la racine DÉCLARÉE est bien celle du projet sondé (sinon « branché » ne
 * voudrait dire que « ça démarre », pendant que le journal partirait ailleurs) ·
 * la commande démarre et expose EXACTEMENT les outils du kit (probe.ts).
 *
 * FRONTIÈRE DE CONFIANCE (revue 2026-07-26, finding bloquant B1). Ce probe
 * **exécute une commande lue dans un fichier**. Deux conséquences assumées :
 *   1. On ne sonde QUE des projets dont on assume le `.mcp.json` — un fichier
 *      hostile déposé dans un dossier tiers obtiendrait une exécution de code.
 *      La commande est donc IMPRIMÉE pour être AUDITABLE — rien ne met en pause,
 *      elle se lit pendant qu'elle part : c'est une trace, pas une porte.
 *   2. L'environnement transmis est celui du SDK MCP (`getDefaultEnvironment()`
 *      — allowlist HOME/PATH/SHELL/TERM/USER/LOGNAME) + le bloc `env` du
 *      `.mcp.json`, JAMAIS tout `process.env`. Ce n'est pas qu'une garde
 *      anti-exfiltration : sonder avec un environnement PLUS riche que celui du
 *      vrai client ferait rater la seule panne pour laquelle ce banc existe —
 *      le `pnpm` nu qui résout dans un shell interactif et échoue au PATH
 *      minimal d'une app GUI (cf. le repli de `supervision-link.ts`).
 *
 * Read-only : n'appelle aucun outil, donc n'écrit rien sous `.supervision/`.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolveProjectPath } from '../src/supervision/link-config.js';
import {
  extractSupervisionServerConfig,
  verdictFromDeclaredRoot,
  verdictFromObservedTools,
} from '../src/supervision/probe.js';

/**
 * Échec du probe. LANCE au lieu de sortir : un `process.exit()` ici sauterait
 * le `finally` qui ferme le transport, et donc le filet gradué du SDK
 * (stdin.end → SIGTERM → SIGKILL) — précisément sur les chemins où le serveur
 * sondé a DÉJÀ prouvé qu'il se comportait mal (revue 2026-07-26, C1).
 */
class ProbeError extends Error {}
function fail(message: string): never {
  throw new ProbeError(message);
}

function relinkHint(projectRoot: string): string {
  return `  lance : pnpm --dir products/mega-city supervision:link ${projectRoot}`;
}

async function main(): Promise<void> {
  const arg = process.argv[2] ?? '.';
  const projectRoot = resolveProjectPath(arg, process.env.INIT_CWD, process.cwd());

  const mcpPath = join(projectRoot, '.mcp.json');
  if (!existsSync(mcpPath)) {
    fail(`.mcp.json introuvable : ${mcpPath}\n${relinkHint(projectRoot)}`);
  }

  let mcpJson: unknown;
  try {
    mcpJson = JSON.parse(readFileSync(mcpPath, 'utf8'));
  } catch {
    fail(`.mcp.json illisible (JSON invalide) : ${mcpPath}`);
  }

  const extracted = extractSupervisionServerConfig(mcpJson);
  if (!extracted.ok) {
    const messages: Record<typeof extracted.reason, string> = {
      'malformed-mcp-json': `.mcp.json malformé (mcpServers absent ou pas un objet) : ${mcpPath}`,
      'missing-supervision-entry': `pas d'entrée "supervision" dans mcpServers : ${mcpPath}\n${relinkHint(projectRoot)}`,
      'invalid-supervision-entry': `entrée "supervision" incomplète (command/args manquants ou mal typés) dans ${mcpPath}\n${relinkHint(projectRoot)}`,
    };
    fail(messages[extracted.reason]);
  }

  const { config } = extracted;

  // La racine déclarée doit être celle du projet sondé — sinon les runs de ce
  // projet journaliseraient ailleurs, en silence, avec un probe vert.
  const declared = config.env.SUPERVISION_PROJECT_ROOT;
  let declaredRealPath: string | undefined;
  if (declared !== undefined && declared !== '') {
    try {
      declaredRealPath = realpathSync(declared);
    } catch {
      fail(
        `SUPERVISION_PROJECT_ROOT pointe une racine qui n'existe pas : ${declared}\n` +
          `  (le serveur échouerait au démarrage — assertValidExplicitRoot)\n${relinkHint(projectRoot)}`,
      );
    }
  }
  const rootVerdict = verdictFromDeclaredRoot(declaredRealPath, realpathSync(projectRoot));
  if (!rootVerdict.ok) {
    fail(
      rootVerdict.reason === 'missing'
        ? `l'entrée "supervision" ne fixe pas SUPERVISION_PROJECT_ROOT : ${mcpPath}\n` +
            `  la racine du journal serait choisie au hasard du cwd — invariant anti-falsification (fiche 0050).\n${relinkHint(projectRoot)}`
        : `racine déclarée ≠ projet sondé — les runs de ce projet journaliseraient ailleurs :\n` +
            `  déclarée : ${rootVerdict.declared}\n  sondé    : ${rootVerdict.probed}\n${relinkHint(projectRoot)}`,
    );
  }

  // La commande est imprimée AVANT d'être lancée (frontière de confiance, B1).
  console.log(`· projet   : ${projectRoot}`);
  console.log(`· commande : ${config.command} ${config.args.join(' ')}`);

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: { ...getDefaultEnvironment(), ...config.env },
  });
  const client = new Client({ name: 'supervision-probe', version: '0.0.1' });

  try {
    try {
      await client.connect(transport);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(`la commande n'a pas démarré : ${config.command} ${config.args.join(' ')}\n  ${message}`);
    }

    const { tools } = await client.listTools();
    const verdict = verdictFromObservedTools(tools.map((tool) => tool.name));

    if (!verdict.ok) {
      const diff = [
        verdict.missing.length > 0 ? `  manquants : ${verdict.missing.join(', ')}` : null,
        verdict.unexpected.length > 0 ? `  en trop   : ${verdict.unexpected.join(', ')}` : null,
        verdict.duplicates.length > 0 ? `  en double : ${verdict.duplicates.join(', ')}` : null,
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
      fail(`liste d'outils inattendue exposée par ${projectRoot} :\n${diff}`);
    }

    // « racine DÉCLARÉE », pas « journal » : en worktree, le journal effectif est
    // l'arbre principal après normalisation ADR-019 — le serveur l'annonce lui-même
    // sur stderr, plus haut. Étiqueter cette valeur « journal » serait faux dans le
    // cas d'usage phare de l'ADR-034 (revue 2026-07-26, W1).
    console.log(`✓ branché — racine déclarée → ${declaredRealPath}`);
    console.log(`  journal effectif : voir « [supervision] journal → … » ci-dessus`);
    console.log(`  ${verdict.tools.length} outils exposés : ${verdict.tools.join(', ')}`);
  } finally {
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ ${message}`);
  process.exitCode = 1;
});
