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
 * La barre de navigation flottante : « ← Cartes » + un déroulant de toutes les cartes (la
 * courante repérée). Position fixe + z-index élevé ⇒ flotte par-dessus sans perturber la
 * mise en page de la carte. Classe préfixée `ezknav` pour ne pas heurter le CSS des cartes.
 */
export function renderNavBar(items: DiagramEntry[], currentSlug: string): string {
  const options = items
    .map((d) => {
      const sel = d.slug === currentSlug ? ' selected' : '';
      return `<option value="/diagrams/${escapeHtml(d.slug)}/${escapeHtml(d.entry)}"${sel}>${escapeHtml(d.title)}</option>`;
    })
    .join('');
  return `<style>
  .ezknav{position:fixed;top:12px;right:12px;z-index:2147483647;display:flex;gap:8px;align-items:center;
    background:rgba(23,26,33,.92);border:1px solid #2a2f3a;border-radius:8px;padding:6px 10px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.82rem;
    box-shadow:0 4px 16px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}
  .ezknav a{color:#e7e9ee;text-decoration:none;padding:2px 8px;border:1px solid #2a2f3a;border-radius:6px;white-space:nowrap;}
  .ezknav a:hover{border-color:#4a5262;}
  .ezknav select{background:#0f1115;color:#e7e9ee;border:1px solid #2a2f3a;border-radius:6px;padding:3px 6px;max-width:44vw;font:inherit;cursor:pointer;}
</style>
<nav class="ezknav" aria-label="Navigation des cartes">
  <a href="/">← Cartes</a>
  <select onchange="if(this.value)location.href=this.value" aria-label="Aller à une autre carte">${options}</select>
</nav>`;
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
