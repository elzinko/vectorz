#!/usr/bin/env tsx
/**
 * ezk-map — ouvre une carte de `diagrams/` dans le navigateur.
 *
 *   pnpm ezk:map                      # la carte de la méthode (défaut)
 *   pnpm ezk:map <slug>               # une autre carte de diagrams/
 *   pnpm ezk:map --list               # ce qui est disponible
 *
 * POURQUOI un serveur plutôt qu'un double-clic sur le fichier : ouvert en `file://`,
 * un navigateur applique des règles d'origine strictes — les polices distantes et une
 * partie du JS peuvent être bloquées, et la carte s'affiche dégradée sans prévenir.
 * Servi en `http://127.0.0.1`, on voit exactement ce que voit un lecteur.
 *
 * ZÉRO dépendance (`node:http` + `node:fs`), écoute UNIQUEMENT sur la boucle locale :
 * rien n'est exposé au réseau. Le script RANGE, il ne juge pas (ADR-0001 §2).
 */
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MEGA_CITY = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(MEGA_CITY, '..', '..'); // racine vectorz
const DIAGRAMS = join(REPO_ROOT, 'diagrams');
const DEFAULT_SLUG = 'methode-mega-city';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.md': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** Cartes disponibles : un dossier de `diagrams/` porteur d'un `.html` ou d'un `.svg`. */
function listDiagrams(): { slug: string; entry: string }[] {
  if (!existsSync(DIAGRAMS)) return [];
  return readdirSync(DIAGRAMS)
    .filter((d) => statSync(join(DIAGRAMS, d)).isDirectory())
    .map((slug) => {
      const files = readdirSync(join(DIAGRAMS, slug));
      // une page interactive prime sur l'image : c'est la vue la plus riche
      const entry =
        files.find((f) => f.endsWith('.html')) ?? files.find((f) => f.endsWith('.svg')) ?? '';
      return { slug, entry };
    })
    .filter((d) => d.entry !== '')
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function fail(msg: string, code = 1): never {
  console.error(msg);
  process.exit(code);
}

const args = process.argv.slice(2).filter((a) => a !== '--');
const diagrams = listDiagrams();

if (args.includes('--list') || args.includes('-l')) {
  if (diagrams.length === 0) fail('Aucune carte dans diagrams/.');
  console.log('Cartes disponibles :');
  for (const { slug, entry } of diagrams) {
    console.log(`  ${slug === DEFAULT_SLUG ? '*' : ' '} ${slug.padEnd(34)} ${entry}`);
  }
  console.log('\n* = celle ouverte par défaut.  Usage : pnpm ezk:map <slug>');
  process.exit(0);
}

const slug = args[0] ?? DEFAULT_SLUG;
const found = diagrams.find((d) => d.slug === slug);
if (!found) {
  fail(
    `Carte « ${slug} » introuvable.\n` +
      `Disponibles : ${diagrams.map((d) => d.slug).join(', ') || '(aucune)'}\n` +
      `Astuce : pnpm ezk:map --list`,
  );
}

const START_PORT = Number(process.env.EZK_MAP_PORT ?? 4173);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  const target = resolve(REPO_ROOT, rel);

  // Garde-fou de traversée : on ne sort JAMAIS de la racine du dépôt.
  if (target !== REPO_ROOT && !target.startsWith(REPO_ROOT + sep)) {
    res.writeHead(403).end('403');
    return;
  }
  if (!existsSync(target) || statSync(target).isDirectory()) {
    res.writeHead(404).end('404');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store', // on itère sur la carte : jamais de version périmée
  });
  createReadStream(target).pipe(res);
});

function listen(port: number, attemptsLeft: number): void {
  server.once('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    fail(`Impossible d'ouvrir un port (dernier essai ${port}) : ${err.message}`);
  });
  server.listen(port, '127.0.0.1', () => {
    const target = `http://127.0.0.1:${port}/diagrams/${slug}/${found?.entry}`;
    console.log(`\n  📍 ${slug}\n     ${target}\n`);
    console.log('     Ctrl-C pour arrêter.\n');
    // Ouverture best-effort : si la plateforme ne suit pas, l'URL ci-dessus suffit.
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
