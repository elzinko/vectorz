/**
 * ezk-map-menu — la PAGE D'ACCUEIL de `ezk:map` : un menu des cartes (fiche
 * 20260825152954193). PUR (ADR-0003) : ces fonctions ne touchent pas au disque ; le bord
 * I/O est `bin/ezk-map.ts` (il lit les `meta.yaml` et sert la page).
 *
 * But : `pnpm ezk:map` (sans slug) ouvre `/`, une page qui liste toutes les cartes en liens
 * cliquables — naviguer de l'une à l'autre SANS relancer le serveur. « Réunir l'accès, pas
 * fusionner les vues » (décision PO 2026-08-23) : chaque carte reste sa propre page.
 */

export interface DiagramEntry {
  /** Nom du dossier `diagrams/<slug>/`. */
  slug: string;
  /** Fichier d'entrée servi (`board.html`, `methode.svg`…). */
  entry: string;
  /** Titre lisible (du `meta.yaml`), ou le slug en secours. */
  title: string;
}

/** La carte mise en avant en tête du menu (la colonne vertébrale de la méthode). */
export const FEATURED_SLUG = 'methode-mega-city';

/**
 * Lit le titre d'un `meta.yaml` par BALAYAGE DE LIGNE — pas de lib YAML (zéro dépendance).
 * Tolère les DEUX clés qui coexistent dans le dépôt : `title:` (anglais) ET `titre:`
 * (français). Guillemets optionnels retirés. Renvoie null si aucune clé (⇒ repli slug côté
 * appelant).
 */
export function readMetaTitle(metaYaml: string): string | null {
  // Ancré en COLONNE 0 : une clé de premier niveau YAML n'est jamais indentée. Sans cet
  // ancrage, une sous-clé `title:`/`titre:` d'un autre bloc serait captée par erreur (revue
  // adverse, P2). Si les deux clés coexistent, la 1re ligne l'emporte (ordre du fichier).
  const m = metaYaml.match(/^(?:title|titre)[ \t]*:[ \t]*(.+?)[ \t]*$/im);
  if (!m) return null;
  const value = m[1].replace(/^["']|["']$/g, '').trim();
  return value || null;
}

/** Ordonne les cartes : la carte méthode en TÊTE (mise en avant), le reste inchangé. */
export function orderDiagrams(
  items: DiagramEntry[],
  featured: string = FEATURED_SLUG,
): DiagramEntry[] {
  const head = items.filter((d) => d.slug === featured);
  const rest = items.filter((d) => d.slug !== featured);
  return [...head, ...rest];
}

/** Échappe le texte libre destiné à du HTML (titre de meta.yaml = semi-fiable). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rend la page d'accueil (menu). `items` est déjà ORDONNÉ (méthode en tête) : la 1re carte
 * est mise en avant. Mêmes tokens visuels que le board (cohérence « même system design »).
 */
export function renderMenuHtml(items: DiagramEntry[]): string {
  const cartes =
    items.length === 0
      ? '<p class="vide">Aucune carte dans <code>diagrams/</code>.</p>'
      : items
          .map((d) => {
            // « featured » par IDENTITÉ (la carte méthode), pas par position : si la méthode
            // est absente, aucune carte ne porte le badge « méthode » à tort (revue adverse, P2).
            const featured = d.slug === FEATURED_SLUG;
            const href = `/diagrams/${escapeHtml(d.slug)}/${escapeHtml(d.entry)}`;
            const tag = featured ? '<span class="tag">méthode</span>' : '';
            return `  <a class="carte${featured ? ' featured' : ''}" href="${href}">
    <div class="titre">${escapeHtml(d.title)}${tag}</div>
    <div class="slug">${escapeHtml(d.slug)}</div>
  </a>`;
          })
          .join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>ezk:map — les cartes</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root {
    --bg: #0f1115; --panel: #171a21; --border: #2a2f3a;
    --text: #e7e9ee; --muted: #9aa2b1; --accent: #5b9bd5;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg); color: var(--text); padding: 32px;
  }
  h1 { font-size: 1.5rem; margin: 0 0 6px; }
  .en-clair { color: var(--muted); margin: 0 0 24px; max-width: 72ch; line-height: 1.5; }
  .grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  a.carte {
    display: block; background: var(--panel); border: 1px solid var(--border);
    border-left: 4px solid var(--border); border-radius: 8px; padding: 16px 18px;
    text-decoration: none; color: var(--text); transition: border-color 0.1s, transform 0.1s;
  }
  a.carte:hover { border-color: #4a5262; transform: translateY(-1px); }
  a.carte.featured { border-left-color: var(--accent); }
  .carte .titre { font-weight: 600; line-height: 1.3; margin: 0 0 6px; }
  .carte .slug { font-family: ui-monospace, monospace; font-size: 0.75rem; color: var(--muted); }
  .tag {
    display: inline-block; font-size: 0.68rem; color: var(--accent);
    border: 1px solid var(--accent); border-radius: 999px; padding: 1px 8px;
    margin-left: 8px; vertical-align: middle; font-weight: 500;
  }
  .vide { color: var(--muted); }
</style>
</head>
<body>
<h1>ezk:map — les cartes</h1>
<p class="en-clair">
  En clair : toutes les cartes du dépôt, à portée de clic. Cliquer en ouvre une ;
  « Précédent » du navigateur ramène ici — sans relancer le serveur.
</p>
<div class="grille">
${cartes}
</div>
</body>
</html>
`;
}

// --- Navigation DANS une carte (fiche 20260825232147620) : injectée à la volée par le
//     serveur, sans toucher les fichiers sources. Retour au menu + saut vers une autre carte.

/**
 * La barre de navigation : DISCRÈTE et REPLIABLE. Collapsée = un petit bouton `☰` dans le
 * coin (n'empiète pas sur la carte) ; au clic, un panneau s'ouvre avec « ← Retour au menu »
 * + la liste des cartes (la courante repérée). Élément natif `<details>` : ouverture au clic,
 * accessible au clavier, ZÉRO JS. Position fixe + z-index max ; classe préfixée `ezknav` pour
 * ne pas heurter le CSS des cartes.
 */
export function renderNavBar(items: DiagramEntry[], currentSlug: string): string {
  const liens = items
    .map((d) => {
      const cur = d.slug === currentSlug ? ' aria-current="page"' : '';
      return `<a href="/diagrams/${escapeHtml(d.slug)}/${escapeHtml(d.entry)}"${cur}>${escapeHtml(d.title)}</a>`;
    })
    .join('');
  return `<style>
  .ezknav{position:fixed;top:10px;right:10px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.82rem;}
  .ezknav>summary{list-style:none;cursor:pointer;width:34px;height:34px;box-sizing:border-box;
    display:flex;align-items:center;justify-content:center;font-size:1rem;color:#e7e9ee;
    background:rgba(23,26,33,.82);border:1px solid #2a2f3a;border-radius:8px;user-select:none;
    box-shadow:0 2px 10px rgba(0,0,0,.30);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);opacity:.7;transition:opacity .12s;}
  .ezknav>summary::-webkit-details-marker{display:none;}
  .ezknav>summary:hover,.ezknav[open]>summary{opacity:1;border-color:#4a5262;}
  .ezknav-panel{position:absolute;top:40px;right:0;min-width:230px;max-width:min(80vw,360px);
    background:rgba(23,26,33,.98);border:1px solid #2a2f3a;border-radius:8px;padding:6px;
    box-shadow:0 8px 28px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
  .ezknav-panel a{display:block;color:#e7e9ee;text-decoration:none;padding:6px 10px;border-radius:6px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ezknav-panel a:hover{background:#0f1115;}
  .ezknav-retour{color:#9aa2b1;border-bottom:1px solid #2a2f3a;margin-bottom:4px;padding-bottom:8px;}
  .ezknav-liste a[aria-current]{color:#5b9bd5;font-weight:600;}
</style>
<details class="ezknav">
  <summary title="Cartes" aria-label="Ouvrir le menu des cartes">☰</summary>
  <div class="ezknav-panel">
    <a class="ezknav-retour" href="/">← Retour au menu</a>
    <div class="ezknav-liste">${liens}</div>
  </div>
</details>`;
}

/** Injecte `nav` juste avant la dernière `</body>` d'un HTML (append si absente). */
export function injectNavIntoHtml(html: string, nav: string): string {
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) return html + nav;
  return html.slice(0, idx) + nav + html.slice(idx);
}

/**
 * Enveloppe une carte SVG dans une page HTML : la barre `nav` + l'image (via `rawUrl`, qui
 * pointe le SVG brut, servi avec `?raw`). Le SVG lui-même n'est pas modifié.
 */
export function renderSvgWrapper(rawUrl: string, nav: string, title: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body { margin: 0; height: 100%; background: #0f1115; }
  .ezkmap-img { display: block; width: 100%; height: 100vh; object-fit: contain; padding: 16px; box-sizing: border-box; }
</style>
</head>
<body>
${nav}
<img class="ezkmap-img" src="${escapeHtml(rawUrl)}" alt="${escapeHtml(title)}" />
</body>
</html>
`;
}
