#!/usr/bin/env tsx
/**
 * ezk-sessions — cockpit de pilotage des sessions (fiche 20260825141012293, ADR-0042).
 *
 *   pnpm --dir products/mega-city ezk:sessions state
 *
 * Le cœur pur (src/core/sessions-data.ts) croise worktrees × sessions × branches ; ce
 * script est le bord I/O : `git worktree list`, `git branch --merged`, `git status` par
 * worktree, mtime des `.jsonl` de session sous `~/.claude/projects/<slug>`. Le tableau
 * produit ne coûte AUCUN appel IA (ADR-0001) — seul l'encart recommandations est un avis,
 * ici déterministe (pas d'appel LLM dans ce POC).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { buildSessionsData } from '../src/core/sessions-data.js';
import { renderSessionsHtml } from '../src/core/sessions-html.js';
import { collect } from '../src/io/sessions-collect.js';

function renderTable(data: ReturnType<typeof buildSessionsData>): void {
  console.log('En clair : état des worktrees — dossier, branche, session, PR, supprimable.\n');
  const header = ['dossier', 'branche', 'sujet', 'session', 'PR', 'supprimable'];
  console.log(header.join(' · '));
  for (const row of data.rows) {
    const shortPath = row.path.split('/').slice(-2).join('/');
    const supprimable = row.deletable ? `oui (${row.deletableReason})` : `non (${row.deletableReason})`;
    console.log(
      [shortPath, row.branch || '(détaché)', row.subject, row.sessionActivity, row.pr, supprimable].join(
        ' · ',
      ),
    );
  }
}

function renderRecommendations(data: ReturnType<typeof buildSessionsData>): void {
  console.log('\nRecommandations');
  const deletable = data.rows.filter((r) => r.deletable);
  if (deletable.length === 0) {
    console.log('  Rien à nettoyer.');
  } else {
    console.log('  À nettoyer :');
    for (const row of deletable) {
      console.log(`    - ${row.path} (${row.deletableReason})`);
    }
  }

  const collisions = data.rows.filter((r) => r.collisionsWith.length > 0);
  if (collisions.length > 0) {
    console.log('\n  ⚠ Collisions :');
    for (const row of collisions) {
      for (const c of row.collisionsWith) {
        const files = c.files
          .slice()
          .sort((a, b) => Number(b.hot) - Number(a.hot))
          .map((f) => (f.hot ? `${f.file} [chaud]` : f.file))
          .join(', ');
        console.log(`    - ${row.path} ↔ ${c.path} : ${files}`);
      }
    }
  }
}

/**
 * Serveur local (ADR-0043) : recalcule `collect()` + `buildSessionsData` + `renderSessionsHtml`
 * À CHAQUE requête — la page n'est jamais écrite sur disque. Patron recopié de `bin/ezk-map.ts`
 * (repli de port, ouverture navigateur best-effort) : dette assumée pour ne pas toucher un
 * fichier partagé (ADR-0043 D3).
 */
function runMapServer(): void {
  const envPort = Number(process.env.EZK_SESSIONS_PORT);
  // EZK_SESSIONS_PORT non numérique → NaN ferait ouvrir un port aléatoire silencieux (revue P2).
  const START_PORT = Number.isInteger(envPort) && envPort > 0 ? envPort : 4174;

  const server = createServer((_req, res) => {
    try {
      const html = renderSessionsHtml(buildSessionsData(collect()));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (err) {
      res.writeHead(500).end(`500 : ${(err as Error).message}`);
    }
  });

  function listen(port: number, attemptsLeft: number): void {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        listen(port + 1, attemptsLeft - 1);
        return;
      }
      console.error(`Impossible d'ouvrir un port (dernier essai ${port}) : ${err.message}`);
      process.exit(1);
    });
    server.listen(port, '127.0.0.1', () => {
      const target = `http://127.0.0.1:${port}/`;
      console.log(`\n  📍 ezk-sessions map\n     ${target}\n`);
      console.log('     Ctrl-C pour arrêter.\n');
      const opener =
        process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(opener, [target], { stdio: 'ignore', detached: true }).on('error', () => {
        /* pas d'ouvreur : l'URL est déjà affichée */
      });
    });
  }

  listen(START_PORT, 20);
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

function main(): void {
  const cmd = process.argv[2];
  if (cmd === 'map') {
    runMapServer();
    return;
  }
  if (cmd !== 'state') {
    console.error('Usage : ezk-sessions state|map');
    process.exit(1);
  }
  const data = buildSessionsData(collect());
  renderTable(data);
  renderRecommendations(data);
  // POC: titre/archivée via ccd_session_mgmt = suite
}

main();
