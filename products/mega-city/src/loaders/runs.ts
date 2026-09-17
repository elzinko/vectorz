/**
 * Loader des RÉCITS DE RUN (`docs/sessions/*.md`) — frontière entrante, PURE côté données
 * (ADR-0003) : lit le disque, n'écrit rien. Un récit = une session close (« run »), nocturne
 * (product-build autonome) ou diurne (session ordinaire), figé par `/ezk-archive` à la clôture.
 *
 * Extraction TOLÉRANTE (les récits sont en prose libre, pas un gabarit — cf. docs/sessions/README) :
 * la date vient du NOM de fichier, le titre du 1er `# H1`, les fiches de la ligne `fiches:` en tête,
 * les PR des liens `.../pull/<n>` ou `PR #<n>` du corps. Un récit sans ces éléments s'affiche quand
 * même en mode dégradé (date + nom + lien) — fiche 20260826072532452, « mode dégradé ».
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface RunReport {
  /** Chemin relatif à la racine du repo (ex. `docs/sessions/2026-08-26-....md`) — lien cliquable. */
  file: string;
  /** Date de la session, `AAAA-MM-JJ`, lue du nom de fichier. */
  date: string;
  /** Suffixe du nom de fichier (le sujet), ex. `product-build-4-sprints`. */
  slug: string;
  /** Titre lisible : le 1er `# H1` du récit, ou le slug à défaut. */
  title: string;
  /** Ids des fiches travaillées, lus de la ligne `fiches:` en tête (`[]` si absente). */
  fiches: string[];
  /** Numéros de PR cités dans le récit (dédupliqués, triés), ex. `["171","173"]`. */
  prs: string[];
}

/** Nom de récit valide : `AAAA-MM-JJ-<slug>.md`. Exclut `README.md` et tout hors-format. */
const REPORT_FILE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

/** 1er `# H1` du corps (hors ligne `fiches:` et hors `##`). '' si aucun. */
function readTitle(text: string): string {
  const m = text.match(/^#[ \t]+(.+?)[ \t]*$/m);
  return m ? m[1].trim() : '';
}

/** Ligne `fiches: a, b` (tout en tête du fichier) → ids ; [] si absente. */
function readFiches(text: string): string[] {
  const m = text.match(/^fiches:[ \t]*(.+)$/m);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Numéros de PR : liens `.../pull/<n>` ET mentions `PR #<n>`, dédupliqués + triés numériquement. */
function readPrs(text: string): string[] {
  const nums = new Set<string>();
  for (const m of text.matchAll(/\/pull\/(\d+)/g)) nums.add(m[1]);
  for (const m of text.matchAll(/PR[ \t]*#(\d+)/gi)) nums.add(m[1]);
  return [...nums].sort((a, b) => Number(a) - Number(b));
}

/** Charge tous les récits de `docs/sessions/`, triés du plus RÉCENT au plus ancien. Déterministe. */
export function loadRuns(rootDir: string): RunReport[] {
  const dir = join(rootDir, 'docs', 'sessions');
  if (!existsSync(dir)) return [];
  const runs: RunReport[] = [];
  for (const filename of readdirSync(dir).sort()) {
    const m = filename.match(REPORT_FILE);
    if (!m) continue;
    const text = readFileSync(join(dir, filename), 'utf8');
    runs.push({
      file: `docs/sessions/${filename}`,
      date: m[1],
      slug: m[2],
      title: readTitle(text) || m[2],
      fiches: readFiches(text),
      prs: readPrs(text),
    });
  }
  // Plus récent d'abord ; à date égale, ordre de nom stable (décroissant) pour un tri déterministe.
  return runs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? 1 : -1));
}
