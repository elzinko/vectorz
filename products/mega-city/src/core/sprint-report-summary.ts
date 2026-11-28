/**
 * sprint-report-summary — les sprints d'un projet, lus dans leurs comptes rendus, pour que mission
 * control montre « le dernier sprint et ses indicateurs » (fiche 20261104090517904, ADR-086) puis tous
 * les sprints, chacun avec son numéro, son but et sa branche (fiche 20261114131612204).
 *
 * Un compte rendu (`docs/sprints/AAAA-MM-JJ-sprint-<slug>.md`, écrit par `sprint.sh close`) porte un
 * bloc « En-tête » (numéro continu, but complet, branche), un « Lot scellé » et un bloc « Détail »
 * chiffré. On en tire le début, la fin, la durée, les jetons, les fiches livrées et les blocages. Une
 * valeur absente ou non mesurée reste `null`, jamais un faux zéro ni une valeur devinée : une durée de
 * 0 ms, des jetons comptés au grain de la session (le total du run, pas du sprint) ou un total nul ne
 * disent rien du sprint.
 *
 * `close` range aussi le JSON du rapport (`sprint-report@0.1`) à côté du markdown. Une SEULE source :
 * le JSON quand il existe et qu'il est lisible, sinon la relecture du markdown, qui ne sert plus qu'aux
 * anciens comptes rendus.
 *
 * PUR : aucune I/O. Le bord (`io/board-show.ts`) lit les fichiers et passe noms et textes.
 */
import { z } from 'zod';
import { UNDATED_NOTE } from '../sprint-metrics/domain/types.js';

const REPORT_NAME = /^(\d{4}-\d{2}-\d{2})-sprint-(.+)\.md$/;

/** Une fiche livrée par le sprint, telle que son lot scellé la nomme. */
export interface SprintFicheLivree {
  id: string;
  title: string;
}

/** Un sprint résumé. `null` = non mesuré, ou non dit, par le compte rendu. */
export interface SprintSummary {
  slug: string;
  /** Le numéro continu écrit au `close` ; `null` pour un compte rendu d'avant. */
  numero: number | null;
  /** Le but complet du sprint ; `null` si le compte rendu ne le dit pas. */
  but: string | null;
  /** Le début de la fenêtre du sprint (ISO 8601), ou `null`. */
  debut: string | null;
  /** La branche sur laquelle le sprint a été clos ; `null` si le compte rendu ne la dit pas. */
  branche: string | null;
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

/** Le résultat d'une story du lot, tel que les contrats le publient. */
export type LotResultat = 'livree' | 'reportee' | 'ouverte';

/** Une ligne du lot scellé : la fiche, son titre, son résultat. */
export interface SprintLotEntry {
  id: string;
  title: string;
  resultat: LotResultat;
}

/** La valeur d'une ligne `- **<champ>** …` du compte rendu, ou `undefined`. */
function detailLine(text: string, field: string): string | undefined {
  const line = text.split('\n').find((l) => l.startsWith(`- **${field}**`));
  return line?.slice(`- **${field}**`.length);
}

const positive = (n: number): number | null => (Number.isFinite(n) && n > 0 ? n : null);

/** La valeur d'une ligne d'en-tête `- **<champ>** : <valeur>`, ou `null` si absente ou vide. */
function headerField(text: string, field: string): string | null {
  const value = detailLine(text, field)?.replace(/^\s*:\s*/, '').trim();
  return value === undefined || value === '' ? null : value;
}

function numeroOf(text: string): number | null {
  const value = headerField(text, 'Numéro');
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}

function windowOf(text: string): { debut: string | null; fin: string | null } {
  const m = detailLine(text, 'Fenêtre')?.match(/^\s*:?\s*(\S+)\s*→\s*(\S+)/);
  const valid = (iso: string | undefined): string | null => (iso !== undefined && !Number.isNaN(Date.parse(iso)) ? iso : null);
  return { debut: valid(m?.[1]), fin: valid(m?.[2]) };
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

const LOT_LABEL: Record<string, LotResultat> = { livrée: 'livree', reportée: 'reportee', 'restée ouverte': 'ouverte' };

const cleanTitle = (title: string): string => title.replace(/\s*\(PR [^)]*\)+\s*$/, '').trim();

/** Le « Lot scellé » : `` - `<id>` — <titre> (PR …) — **livrée** `` (ou reportée, ou restée ouverte). */
function lotOf(text: string): SprintLotEntry[] {
  const out: SprintLotEntry[] = [];
  for (const line of text.split('\n')) {
    // Le titre est facultatif dans le rendu (`render.ts`) : une ligne sans titre compte quand même.
    const m = line.match(/^- `([^`]+)`(?: — (.+?))? — \*\*(livrée|reportée|restée ouverte)\*\*\s*$/);
    if (m) out.push({ id: m[1], title: cleanTitle(m[2] ?? ''), resultat: LOT_LABEL[m[3]] });
  }
  return out;
}

const livreesOf = (lot: readonly SprintLotEntry[]): SprintFicheLivree[] =>
  lot.filter((e) => e.resultat === 'livree').map((e) => ({ id: e.id, title: e.title }));

/** Le corps d'une section `## <titre>` du markdown, ou `null` si elle manque ou est vide. */
function sectionOf(text: string, title: string): string | null {
  const lines = text.split('\n');
  const from = lines.findIndex((l) => l.trim() === `## ${title}`);
  if (from === -1) return null;
  const rest = lines.slice(from + 1);
  const next = rest.findIndex((l) => l.startsWith('## '));
  const body = (next === -1 ? rest : rest.slice(0, next)).join('\n').trim();
  return body === '' ? null : body;
}

/** Ce que le JSON du rapport doit porter pour servir de source : le reste est ignoré. */
const ReportJsonSchema = z.object({
  schema: z.literal('sprint-report@0.1'),
  sprint: z.object({ numero: z.number().int().optional(), but: z.string().optional(), branche: z.string().optional() }),
  window: z.object({ startTs: z.string(), endTs: z.string() }),
  duration: z.object({ ms: z.number() }),
  tokens: z.object({ grain: z.string(), totalTokens: z.number(), note: z.string().optional() }),
  kpi: z.object({ blockages: z.object({ count: z.number() }) }),
  lot: z.object({
    entries: z.array(z.object({ id: z.string(), result: z.enum(['shipped', 'reported', 'open']), title: z.string().optional() })),
  }),
});

const JSON_RESULT: Record<'shipped' | 'reported' | 'open', LotResultat> = {
  shipped: 'livree',
  reported: 'reportee',
  open: 'ouverte',
};

/** Les faits d'un compte rendu : lus dans son JSON, ou dans son markdown, jamais mêlés. */
interface ReportFacts {
  numero: number | null;
  but: string | null;
  branche: string | null;
  debut: string | null;
  fin: string | null;
  dureeMs: number | null;
  tokens: number | null;
  blocages: number | null;
  lot: SprintLotEntry[];
  source: 'json' | 'markdown';
}

function factsOfJson(jsonText: string | undefined): ReportFacts | null {
  if (jsonText === undefined) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return null;
  }
  const parsed = ReportJsonSchema.safeParse(raw);
  if (!parsed.success) return null;
  const r = parsed.data;
  // Un rapport non daté n'a rien mesuré : fenêtre, durée, jetons et blocages sont `null`, pas des zéros.
  const dated = r.tokens.note !== UNDATED_NOTE;
  return {
    numero: r.sprint.numero ?? null,
    but: r.sprint.but ?? null,
    branche: r.sprint.branche ?? null,
    debut: dated ? r.window.startTs : null,
    fin: dated ? r.window.endTs : null,
    dureeMs: dated ? positive(r.duration.ms) : null,
    tokens: dated && r.tokens.grain === 'sprint' ? positive(r.tokens.totalTokens) : null,
    blocages: dated ? r.kpi.blockages.count : null,
    lot: r.lot.entries.map((e) => ({ id: e.id, title: e.title ?? '', resultat: JSON_RESULT[e.result] })),
    source: 'json',
  };
}

function factsOfMarkdown(text: string): ReportFacts {
  return {
    numero: numeroOf(text),
    but: headerField(text, 'But'),
    branche: headerField(text, 'Branche'),
    ...windowOf(text),
    dureeMs: dureeOf(text),
    tokens: tokensOf(text),
    blocages: blocagesOf(text),
    lot: lotOf(text),
    source: 'markdown',
  };
}

const factsOf = (text: string, jsonText: string | undefined): ReportFacts => factsOfJson(jsonText) ?? factsOfMarkdown(text);

function summaryOf(dir: string, name: string, slug: string, jour: string, f: ReportFacts): SprintSummary {
  return {
    slug,
    numero: f.numero,
    but: f.but,
    debut: f.debut,
    branche: f.branche,
    fichier: `${dir}/${name}`,
    jour,
    fin: f.fin,
    dureeMs: f.dureeMs,
    tokens: f.tokens,
    livrees: livreesOf(f.lot),
    blocages: f.blocages,
  };
}

/** Le résumé d'un compte rendu, ou `null` si le nom n'est pas celui d'un compte rendu de sprint. */
export function parseSprintReport(dir: string, name: string, text: string, jsonText?: string): SprintSummary | null {
  const m = name.match(REPORT_NAME);
  if (!m) return null;
  return summaryOf(dir, name, m[2], m[1], factsOf(text, jsonText));
}

/** Un compte rendu lu en entier, section par section (`ezk sprint show --json`). */
export interface SprintDetail extends SprintSummary {
  /** D'où viennent les faits : le JSON rangé à côté du compte rendu, ou la relecture du markdown. */
  source: 'json' | 'markdown';
  enClair: string | null;
  lot: SprintLotEntry[];
  abandon: string | null;
}

/** Le compte rendu en champs : faits du JSON (sinon du markdown), prose du markdown. `null` si ce n'est pas un compte rendu. */
export function parseSprintDetail(dir: string, name: string, text: string, jsonText?: string): SprintDetail | null {
  const m = name.match(REPORT_NAME);
  if (!m) return null;
  const facts = factsOf(text, jsonText);
  return {
    ...summaryOf(dir, name, m[2], m[1], facts),
    source: facts.source,
    enClair: sectionOf(text, 'En clair'),
    lot: facts.lot,
    abandon: sectionOf(text, 'Abandon'),
  };
}

/** Un compte rendu et son JSON rangé à côté, quand il existe. */
export interface SprintReportFile {
  name: string;
  text: string;
  json?: string;
}

/** Un sprint de la liste publiée : son numéro est toujours là (écrit au `close`, sinon son rang). */
export type SprintListed = SprintSummary & { numero: number };

/**
 * Tous les sprints, le plus récent d'abord : par fin, à défaut par jour, puis par nom. Le numéro est
 * celui écrit au `close` ; pour un compte rendu d'avant, c'est son rang dans l'historique, c'est-à-dire
 * le compte continu depuis le début du projet.
 */
export function allSprints(dir: string, reports: readonly SprintReportFile[]): SprintListed[] {
  const key = (s: SprintSummary): string => s.fin ?? `${s.jour}T00:00:00.000Z`;
  const sorted = reports
    .map((r) => parseSprintReport(dir, r.name, r.text, r.json))
    .filter((s): s is SprintSummary => s !== null)
    .sort((a, b) => (key(a) === key(b) ? b.fichier.localeCompare(a.fichier) : key(b).localeCompare(key(a))));
  return sorted.map((s, i) => ({ ...s, numero: s.numero ?? sorted.length - i }));
}

/** Combien de sprints `derniersSprints[]` publie : les plus récents, le sens du champ depuis la fiche 20261104090517904. */
export const DERNIERS_SPRINTS = 5;

/**
 * Le sprint qui a livré chaque fiche : le slug du compte rendu le plus récent dont le lot scellé la
 * cite comme livrée (fiche 20261114131612572). Une fiche qu'aucun lot ne cite n'a pas d'entrée.
 */
export function sprintOfFiches(dir: string, reports: readonly SprintReportFile[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const sprint of allSprints(dir, reports)) {
    for (const fiche of sprint.livrees) if (!out.has(fiche.id)) out.set(fiche.id, sprint.slug);
  }
  return out;
}
