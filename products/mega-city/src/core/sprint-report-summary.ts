/**
 * sprint-report-summary — les derniers sprints d'un projet, lus dans leurs comptes rendus, pour que
 * mission control montre « le dernier sprint et ses indicateurs » (fiche 20261104090517904, ADR-086).
 *
 * Un compte rendu (`docs/sprints/AAAA-MM-JJ-sprint-<slug>.md`, écrit par `sprint.sh close`) porte un
 * bloc « Détail » chiffré et un « Lot scellé ». On en tire la fin, la durée, les jetons, les fiches
 * livrées et les blocages. Une valeur absente ou non mesurée reste `null`, jamais un faux zéro : une
 * durée de 0 ms, des jetons comptés au grain de la session (le total du run, pas du sprint) ou un
 * total nul ne disent rien du sprint.
 *
 * PUR : aucune I/O. Le bord (`io/board-show.ts`) lit les fichiers et passe noms et textes.
 */

const REPORT_NAME = /^(\d{4}-\d{2}-\d{2})-sprint-(.+)\.md$/;

/** Une fiche livrée par le sprint, telle que son lot scellé la nomme. */
export interface SprintFicheLivree {
  id: string;
  title: string;
}

/** Un sprint résumé. `null` = non mesuré par le compte rendu. */
export interface SprintSummary {
  slug: string;
  /** Le compte rendu, relatif à la racine du projet. */
  fichier: string;
  /** Le jour du compte rendu (`AAAA-MM-JJ`), tiré de son nom. */
  jour: string;
  /** La fin de la fenêtre du sprint (ISO 8601), ou `null`. */
  fin: string | null;
  dureeMs: number | null;
  tokens: number | null;
  livrees: SprintFicheLivree[];
  blocages: number | null;
}

/** La valeur d'une ligne `- **<champ>** …` du bloc « Détail », ou `undefined`. */
function detailLine(text: string, field: string): string | undefined {
  const line = text.split('\n').find((l) => l.startsWith(`- **${field}**`));
  return line?.slice(`- **${field}**`.length);
}

const positive = (n: number): number | null => (Number.isFinite(n) && n > 0 ? n : null);

function finOf(text: string): string | null {
  const m = detailLine(text, 'Fenêtre')?.match(/→\s*(\S+)/);
  return m && !Number.isNaN(Date.parse(m[1])) ? m[1] : null;
}

function dureeOf(text: string): number | null {
  const m = detailLine(text, 'Durée')?.match(/(\d+)\s*ms/);
  return m ? positive(Number(m[1])) : null;
}

/** Les jetons du sprint : seulement au grain `sprint` (le grain `session` compte tout le run). */
function tokensOf(text: string): number | null {
  const line = detailLine(text, 'Tokens');
  if (!line || !line.includes('(grain `sprint`)')) return null;
  const m = line.match(/total (\d+)/);
  return m ? positive(Number(m[1])) : null;
}

function blocagesOf(text: string): number | null {
  const m = detailLine(text, 'Blocages')?.match(/^\s*\((\d+)\)/);
  return m ? Number(m[1]) : null;
}

/** Les fiches livrées du « Lot scellé » : `` - `<id>` — <titre> (PR …) — **livrée** ``. */
function livreesOf(text: string): SprintFicheLivree[] {
  const out: SprintFicheLivree[] = [];
  for (const line of text.split('\n')) {
    // Le titre est facultatif dans le rendu (`render.ts`) : une livrée sans titre compte quand même.
    const m = line.match(/^- `([^`]+)`(?: — (.+?))? — \*\*livrée\*\*\s*$/);
    if (m) out.push({ id: m[1], title: (m[2] ?? '').replace(/\s*\(PR [^)]*\)+\s*$/, '').trim() });
  }
  return out;
}

/** Le résumé d'un compte rendu, ou `null` si le nom n'est pas celui d'un compte rendu de sprint. */
export function parseSprintReport(dir: string, name: string, text: string): SprintSummary | null {
  const m = name.match(REPORT_NAME);
  if (!m) return null;
  return {
    slug: m[2],
    fichier: `${dir}/${name}`,
    jour: m[1],
    fin: finOf(text),
    dureeMs: dureeOf(text),
    tokens: tokensOf(text),
    livrees: livreesOf(text),
    blocages: blocagesOf(text),
  };
}

/** Les `limit` derniers sprints, le plus récent d'abord : par fin, à défaut par jour, puis par nom. */
export function latestSprints(
  dir: string,
  reports: readonly { name: string; text: string }[],
  limit = 5,
): SprintSummary[] {
  const key = (s: SprintSummary): string => s.fin ?? `${s.jour}T00:00:00.000Z`;
  return reports
    .map((r) => parseSprintReport(dir, r.name, r.text))
    .filter((s): s is SprintSummary => s !== null)
    .sort((a, b) => (key(a) === key(b) ? b.fichier.localeCompare(a.fichier) : key(b).localeCompare(key(a))))
    .slice(0, limit);
}
