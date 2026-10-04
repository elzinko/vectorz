#!/usr/bin/env tsx
/**
 * ezk-map — le tableau de bord de la méthode : sert `diagrams/` (cartes, board, plan) au navigateur.
 *
 *   pnpm ezk dashboard                # la carte de la méthode (défaut)
 *   pnpm ezk dashboard <slug>         # une autre carte de diagrams/
 *   pnpm ezk dashboard --list         # ce qui est disponible
 *   pnpm ezk --root <projet> dashboard   # les fiches d'un AUTRE projet (ou EZK_ROOT=<projet>)
 *
 * LE COCKPIT (ADR-0062, fiche 20261004192802897) : une barre « Projet » liste les projets du registre
 * de la supervision (`supervision.registry.yaml`, relu à chaque requête, jamais écrit ici). Choisir
 * un projet pose un cookie ; chaque requête le porte, et les données comme le pouce viennent alors de
 * ce projet, sans relancer le serveur. Sans choix, rien ne change. Un identifiant inconnu est refusé
 * sans rien lire ; un projet qu'on ne sait pas lire (introuvable, autre méthode, format absent ou
 * ancien) le dit au lieu d'afficher des fiches fausses. `EZK_COCKPIT_REGISTRY=<dossier>` fait lire un
 * autre registre que celui de la méthode : pour un essai.
 *
 * DEUX racines (fiche 20260826173221323) : les PAGES viennent toujours de la méthode (`diagrams/`) ;
 * les DONNÉES (fiches, PLAN.md, récits, pouces) viennent du projet désigné, par défaut la méthode.
 * Sans `--root` ni `EZK_ROOT`, rien ne change.
 *
 * « dashboard » est le nom de commande depuis la fiche 20260903134906920 ; `ezk map` et
 * `pnpm ezk:map` marchent encore (ils préviennent). Le fichier garde son nom pour l'instant.
 *
 * POURQUOI un serveur plutôt qu'un double-clic sur le fichier : ouvert en `file://`,
 * un navigateur applique des règles d'origine strictes — les polices distantes et une
 * partie du JS peuvent être bloquées, et la carte s'affiche dégradée sans prévenir.
 * Servi en `http://127.0.0.1`, on voit exactement ce que voit un lecteur.
 *
 * ZÉRO dépendance (`node:http` + `node:fs`), écoute UNIQUEMENT sur la boucle locale :
 * rien n'est exposé au réseau. Le script RANGE, il ne juge pas (ADR-0001 §2).
 *
 * UNE SEULE écriture (ADR-0057, fiche 20260826072532622) : `POST /api/verdict` pose le pouce
 * 👍/👎 d'une fiche, dans `features/reviews/verdicts/<id>.json` et nulle part ailleurs. Route
 * gardée (Host, Origin, type, taille, id), jamais de commit. Tout le reste du serveur lit.
 */
import { createReadStream, existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, extname, join, normalize, resolve, sep } from 'node:path';
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
import { configReadable, renderConfigPage } from '../src/core/config-page.js';
import {
  CONFIG_ROUTE,
  PROJECT_ROUTE,
  type ProjectChoice,
  dataTarget,
  nameProjectInPage,
  projectCookieHeader,
  projectCookieName,
  safeReturnPath,
  shownProjectName,
  stateLabel,
  readCookie,
  renderProjectBar,
  resolveChoice,
} from '../src/core/cockpit.js';
import { cockpitRegistryDir, currentLayoutVersion, loadCockpitProjects } from '../src/io/cockpit.js';
import { configSections } from '../src/io/config-page.js';
import { dataViewForPath } from '../src/io/derived-views.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { VERDICT_ROUTE, serveVerdict } from '../src/io/verdict-endpoint.js';
import { findRegistryDir } from '../src/supervision/registry.js';

const MEGA_CITY = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(MEGA_CITY, '..', '..'); // racine vectorz = la MÉTHODE : ses pages
const DIAGRAMS = join(REPO_ROOT, 'diagrams');
// Le PROJET dont on lit les fiches : --root > EZK_ROOT > la méthode (comportement d'avant).
// Le tableau de bord annonce lui-même le projet, dans son bloc de démarrage : pas de bandeau en plus.
const {
  root: PROJECT_ROOT,
  source: ROOT_SOURCE,
  rest: cliArgs,
} = projectRootOrExit(REPO_ROOT, undefined, { announce: false });
const DEFAULT_SLUG = 'methode-mega-city';

// Le cockpit : le registre de la méthode (ou celui d'un essai), la version de format attendue, et
// le libellé du choix par défaut (le projet du lancement).
const REGISTRY_DIR = cockpitRegistryDir(findRegistryDir([REPO_ROOT]));
const CURRENT_LAYOUT = currentLayoutVersion(MEGA_CITY);
// La racine du lancement telle que le registre la résout (macOS : /tmp → /private/tmp).
const LAUNCH_ROOT = (() => {
  try {
    return realpathSync(PROJECT_ROOT);
  } catch {
    return PROJECT_ROOT;
  }
})();
// Sans projet désigné, c'est la méthode elle-même : les coques gardent leur nom, comme avant.
const LAUNCH_FALLBACK = ROOT_SOURCE === 'default' ? 'la méthode' : basename(PROJECT_ROOT);

/**
 * Le choix porté par la requête, la barre qui le montre, et le nom à écrire dans les coques de page
 * (null : on les laisse telles quelles). Relu à chaque appel. Le cookie est propre au port du serveur.
 */
function cockpitFor(
  cookieHeader: string | undefined,
  cookieName: string,
  currentPath = '/',
): { choice: ProjectChoice; bar: string; shownName: string | null; launchName: string } {
  const { projects, problem } = loadCockpitProjects(REGISTRY_DIR, CURRENT_LAYOUT);
  const choice = resolveChoice(projects, readCookie(cookieHeader, cookieName));
  const launchName = shownProjectName({ kind: 'defaut' }, projects, LAUNCH_ROOT, LAUNCH_FALLBACK);
  const bar = renderProjectBar(projects, choice, `projet de lancement (${launchName})`, problem, currentPath);
  const rename = choice.kind === 'projet' || ROOT_SOURCE !== 'default';
  return {
    choice,
    bar,
    shownName: rename ? shownProjectName(choice, projects, LAUNCH_ROOT, LAUNCH_FALLBACK) : null,
    launchName,
  };
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.md': 'text/plain; charset=utf-8',
  // Les « Source » de la carte ouvrent les fichiers du catalogue : un bundle ou un profil est un
  // YAML, qu'un navigateur TÉLÉCHARGERAIT faute de type — on l'affiche en clair.
  '.yml': 'text/plain; charset=utf-8',
  '.yaml': 'text/plain; charset=utf-8',
  // Même chose pour les OUTILS de la carte (ADR-0058) : leur « Source » est un script, qu'un
  // navigateur téléchargerait (ou, pour `.mjs`, exécuterait) au lieu de l'afficher.
  '.sh': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.mjs': 'text/plain; charset=utf-8',
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

const args = cliArgs.filter((a) => a !== '--');
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
    const cookieName = projectCookieName(req.socket.localPort ?? 0);

    // Page d'accueil : le menu des cartes (fiche 20260825152954193). Rendu à la volée depuis
    // `diagrams/` — un lien par carte, méthode en tête, sans relancer le serveur.
    if (url.pathname === '/' || url.pathname === '') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(injectNavIntoHtml(renderMenuHtml(diagrams), cockpitFor(req.headers.cookie, cookieName).bar));
      return;
    }

    // Le choix du projet (ADR-0062) : un identifiant du registre, jamais un chemin. Vide = retour au
    // projet du lancement. Inconnu = refus, sans cookie et sans rien lire.
    if (url.pathname === PROJECT_ROUTE) {
      if (req.method !== 'GET') {
        res.writeHead(405, { Allow: 'GET' }).end('405');
        return;
      }
      const id = url.searchParams.get('id') ?? '';
      if (id !== '') {
        const { choice } = cockpitFor(`${cookieName}=${encodeURIComponent(id)}`, cookieName);
        if (choice.kind !== 'projet') {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('projet inconnu du registre\n');
          return;
        }
      }
      res
        .writeHead(303, {
          Location: safeReturnPath(url.searchParams.get('retour')),
          'Set-Cookie': projectCookieHeader(cookieName, id === '' ? null : id),
        })
        .end();
      return;
    }

    // La page « config » du projet choisi (fiche 20261004192802964) : trois sections en lecture seule,
    // lues par les mêmes fonctions que le terminal. Un projet introuvable, d'une autre méthode ou
    // inconnu n'a pas de config inventée.
    if (url.pathname === CONFIG_ROUTE) {
      const cockpit = cockpitFor(req.headers.cookie, cookieName, url.pathname);
      const { choice } = cockpit;
      let root: string | null = PROJECT_ROOT;
      let refusal: string | null = null;
      if (choice.kind === 'inconnu') {
        root = null;
        refusal = `projet inconnu du registre : ${choice.id}`;
      } else if (choice.kind === 'projet') {
        root = configReadable(choice.project.state) ? choice.project.root : null;
        if (root === null) refusal = `${choice.project.id} : ${stateLabel(choice.project.state)}`;
      }
      const name = choice.kind === 'projet' ? choice.project.id : cockpit.launchName;
      const page = renderConfigPage(name, root === null ? [] : configSections(root, MEGA_CITY), refusal);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(injectNavIntoHtml(page, renderNavBar(diagrams, '') + cockpit.bar));
      return;
    }

    // La seule route qui ÉCRIT (ADR-0057) : le pouce 👍/👎 d'une fiche, dans le dossier du PROJET
    // choisi (ses fiches sont là), sinon du projet du lancement. Elle se garde elle-même (méthode,
    // Host, Origin, type, taille, id) et ne jette jamais. Un projet inconnu ou illisible : refus.
    if (url.pathname === VERDICT_ROUTE) {
      const verdictTarget = dataTarget(cockpitFor(req.headers.cookie, cookieName).choice, PROJECT_ROOT);
      if (verdictTarget.kind === 'refus') {
        res
          .writeHead(verdictTarget.status, { 'Content-Type': 'application/json; charset=utf-8' })
          .end(JSON.stringify({ error: verdictTarget.reason }));
        return;
      }
      void serveVerdict(req, res, { repoRoot: verdictTarget.root });
      return;
    }

    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const target = resolve(REPO_ROOT, rel);

    // Garde-fou de traversée : on ne sort JAMAIS de la racine de la méthode, d'où viennent tous les
    // fichiers servis. Les fiches du projet désigné ne sont jamais lues par chemin : seules les
    // vues de données ci-dessous (calculées, sans chemin venu de la requête) et la route du pouce
    // (id validé) y touchent.
    if (target !== REPO_ROOT && !target.startsWith(REPO_ROOT + sep)) {
      res.writeHead(403).end('403');
      return;
    }
    // Vues générées NON committées (ADR-0055) : le fichier de données d'une page (board, pilotage,
    // runs) est CALCULÉ à la requête depuis les sources réelles — jamais périmé, même absent du
    // disque. Elles viennent du PROJET désigné. Une source illisible rend une 500 lisible plutôt
    // qu'un 400 trompeur.
    const dataView = dataViewForPath(rel);
    if (dataView) {
      const viewTarget = dataTarget(cockpitFor(req.headers.cookie, cookieName).choice, PROJECT_ROOT);
      if (viewTarget.kind === 'refus') {
        // Aucune donnée inventée : la page reste vide, la barre du cockpit dit pourquoi.
        res.writeHead(viewTarget.status, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
        res.end(`// cockpit : ${viewTarget.reason.replaceAll('\n', ' ')} — aucune donnée.\n`);
        return;
      }
      try {
        const body = dataView.build(viewTarget.root);
        res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
        res.end(body);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': MIME['.js'] });
        res.end(`// views: construction impossible — ${(err as Error).message}\n`);
      }
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
      const cockpit = cockpitFor(req.headers.cookie, cookieName, url.pathname);
      const nav = renderNavBar(diagrams, slug) + cockpit.bar;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      if (ext === '.html') {
        const html = readFileSync(target, 'utf8');
        res.end(injectNavIntoHtml(cockpit.shownName === null ? html : nameProjectInPage(html, cockpit.shownName), nav));
      } else {
        const title = diagrams.find((d) => d.slug === slug)?.title ?? slug;
        res.end(renderSvgWrapper(`${url.pathname}?raw`, nav, title));
      }
      return;
    }

    // Un fichier sans extension (le hook `commit-msg` d'un skill) est du texte : on l'affiche aussi.
    const fallbackType = extname(target) === '' ? MIME['.md'] : 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] ?? fallbackType,
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
    // Un projet désigné se voit : on ne doit jamais prendre ses fiches pour celles de vectorz.
    if (ROOT_SOURCE !== 'default') console.log(`     Fiches lues dans : ${PROJECT_ROOT}\n`);
    const { projects } = loadCockpitProjects(REGISTRY_DIR, CURRENT_LAYOUT);
    console.log(
      REGISTRY_DIR
        ? `     Cockpit : ${projects.length} projet(s) au registre (${join(REGISTRY_DIR, 'supervision.registry.yaml')})\n`
        : '     Cockpit : aucun registre trouvé, seul le projet du lancement est visible\n',
    );
    console.log('     Ctrl-C pour arrêter.\n');
    // `EZK_MAP_NO_OPEN=1` : un lanceur (scripts/dev-branch.sh) gère lui-même l'ouverture du navigateur.
    if (process.env.EZK_MAP_NO_OPEN) return;
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
