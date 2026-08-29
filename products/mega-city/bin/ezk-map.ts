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
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DiagramEntry,
  injectNavIntoHtml,
  readMetaCategorie,
  readMetaTitle,
  renderMenuHtml,
  renderNavBar,
  renderSvgWrapper,
} from '../src/core/ezk-map-menu.js';

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
function listDiagrams(): DiagramEntry[] {
  if (!existsSync(DIAGRAMS)) return [];
  return readdirSync(DIAGRAMS)
    .filter((d) => statSync(join(DIAGRAMS, d)).isDirectory())
    .map((slug) => {
      const dir = join(DIAGRAMS, slug);
      const files = readdirSync(dir);
      // une page interactive prime sur l'image : c'est la vue la plus riche
      const entry =
        files.find((f) => f.endsWith('.html')) ?? files.find((f) => f.endsWith('.svg')) ?? '';
      // titre lisible pour le menu : balayage du meta.yaml (title: ou titre:), repli slug
      const metaPath = join(dir, 'meta.yaml');
      const meta = existsSync(metaPath) ? readFileSync(metaPath, 'utf8') : '';
      const title = readMetaTitle(meta) ?? slug;
      const categorie = readMetaCategorie(meta) ?? 'autres';
      return { slug, entry, title, categorie };
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
  console.log(
    '\n* = carte mise en avant (tête du menu).' +
      '\nMenu des cartes : pnpm ezk:map   ·   Carte directe : pnpm ezk:map <slug>',
  );
  process.exit(0);
}

// Sans slug → on ouvre la PAGE D'ACCUEIL (le menu des cartes). Avec un slug → cette carte
// directement (comportement inchangé). Fiche 20260825152954193.
const explicitSlug = args[0];
const found = explicitSlug ? diagrams.find((d) => d.slug === explicitSlug) : undefined;
if (explicitSlug && !found) {
  fail(
    `Carte « ${explicitSlug} » introuvable.\n` +
      `Disponibles : ${diagrams.map((d) => d.slug).join(', ') || '(aucune)'}\n` +
      `Astuce : pnpm ezk:map --list`,
  );
}

const START_PORT = Number(process.env.EZK_MAP_PORT ?? 4173);

const server = createServer((req, res) => {
  // Garde-fou : une requête malformée (URL invalide comme `//`, %-encoding cassé comme
  // `%ZZ`) jette de façon SYNCHRONE dans ce callback — sans ce try, l'exception n'est
  // capturée par personne et le process MEURT. La feature promet « naviguer sans relancer
  // le serveur » : il ne doit mourir sur AUCUNE requête (revue adverse, P1).
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');

    // Page d'accueil : le menu des cartes (fiche 20260825152954193). Rendu à la volée depuis
    // `diagrams/` — un lien par carte, méthode en tête, sans relancer le serveur.
    if (url.pathname === '/' || url.pathname === '') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(renderMenuHtml(diagrams));
      return;
    }

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

    // Navigation DANS une carte (fiche 20260825232147620) : pour une carte `.html`/`.svg`
    // sous `diagrams/`, on injecte une barre (retour menu + saut vers une autre carte) À LA
    // VOLÉE — le fichier sur disque n'est jamais modifié. `?raw` court-circuite (sert le
    // fichier tel quel) : c'est ce que l'enveloppe SVG charge dans son `<img>`.
    const relParts = rel.split(/[/\\]/);
    const ext = extname(target).toLowerCase();
    if (
      !url.searchParams.has('raw') &&
      relParts[0] === 'diagrams' &&
      (ext === '.html' || ext === '.svg')
    ) {
      const slug = relParts[1] ?? '';
      const nav = renderNavBar(diagrams, slug);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      if (ext === '.html') {
        res.end(injectNavIntoHtml(readFileSync(target, 'utf8'), nav));
      } else {
        const title = diagrams.find((d) => d.slug === slug)?.title ?? slug;
        res.end(renderSvgWrapper(`${url.pathname}?raw`, nav, title));
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store', // on itère sur la carte : jamais de version périmée
    });
    createReadStream(target).pipe(res);
  } catch {
    // URL invalide / %-encoding cassé → 400, jamais un crash.
    res.writeHead(400).end('400');
  }
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
    // Sans slug explicite : on ouvre le menu (`/`). Avec : la carte directement.
    const target = found
      ? `http://127.0.0.1:${port}/diagrams/${found.slug}/${found.entry}`
      : `http://127.0.0.1:${port}/`;
    const label = found ? found.slug : 'menu des cartes';
    console.log(`\n  📍 ${label}\n     ${target}\n`);
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
