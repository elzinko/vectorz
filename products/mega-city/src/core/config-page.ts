/**
 * La page « config » du cockpit (ADR-0062, fiche 20261004192802964) — le rendu PUR.
 * Trois sections, en lecture seule ; chacune montre le texte de la commande de terminal qui la
 * lit, ou « illisible » et le chemin du fichier. Aucune I/O ici (ADR-0003).
 */
import type { ProjectState } from './cockpit.js';

export interface ConfigSection {
  title: string;
  /** La commande de terminal qui montre la même chose. */
  command: string;
  /** Le fichier du projet que la section lit. */
  file: string;
  /** false : le fichier est illisible, `text` dit pourquoi. */
  ok: boolean;
  text: string;
}

/**
 * Peut-on montrer la config de ce projet ? Oui tant qu'il est sur le disque et de la méthode : un
 * format de fiches absent ou ancien n'empêche pas de lire `.vectorz/`. Non pour un projet
 * introuvable ou d'une autre méthode : on n'invente pas sa config.
 */
export function configReadable(state: ProjectState): boolean {
  return state.kind !== 'introuvable' && state.kind !== 'methode-non-prise-en-charge';
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sectionHtml(section: ConfigSection): string {
  const head = `<h2>${escapeHtml(section.title)}</h2>
    <p class="meta">Même lecture que <code>${escapeHtml(section.command)}</code> · <code>${escapeHtml(section.file)}</code></p>`;
  if (section.ok) {
    return `  <section class="section">
    ${head}
    <pre>${escapeHtml(section.text)}</pre>
  </section>`;
  }
  return `  <section class="section illisible">
    ${head}
    <p class="alerte"><strong>illisible</strong> : <code>${escapeHtml(section.file)}</code></p>
    <pre>${escapeHtml(section.text)}</pre>
  </section>`;
}

/**
 * La page entière. `sections` vide avec un `refusal` : le projet ne se lit pas (introuvable, autre
 * méthode, identifiant inconnu) — la page le dit et ne montre aucune config.
 */
export function renderConfigPage(projectName: string, sections: readonly ConfigSection[], refusal: string | null): string {
  const corps = refusal
    ? `  <p class="alerte">${escapeHtml(refusal)} — aucune config affichée.</p>`
    : sections.map(sectionHtml).join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Config — ${escapeHtml(projectName)}</title>
<style>
  :root{--bg:#f5f6f8;--fg:#1b1f27;--muted:#5d6675;--card:#fff;--line:#dde1e7;--warn:#f2c94c;}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1115;--fg:#e7e9ee;--muted:#9aa2b1;--card:#171a21;--line:#2a2f3a;}}
  :root[data-theme="dark"]{--bg:#0f1115;--fg:#e7e9ee;--muted:#9aa2b1;--card:#171a21;--line:#2a2f3a;}
  body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
  main{max-width:960px;margin:0 auto;padding:24px 16px 96px;}
  h1{margin:8px 0 4px;font-size:1.6rem;}
  .en-clair{color:var(--muted);max-width:70ch;}
  .section{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:16px 0;}
  .section h2{margin:0 0 4px;font-size:1.1rem;}
  .meta{margin:0 0 8px;color:var(--muted);font-size:.85rem;}
  pre{margin:0;overflow-x:auto;font-size:.85rem;line-height:1.45;white-space:pre-wrap;}
  .alerte{padding:6px 10px;color:#1a1300;background:var(--warn);border-radius:8px;}
</style>
</head>
<body>
<main>
  <h1>Config — ${escapeHtml(projectName)}</h1>
  <p class="en-clair">En clair : la config du projet, en lecture seule. Chaque section montre ce
  qu'affiche sa commande de terminal. Un fichier illisible ne touche que sa section.</p>
${corps}
</main>
</body>
</html>
`;
}
