/**
 * verdicts — le pouce 👍/👎 posé sur une fiche. PUR (ADR-0003).
 *
 * Fiche 20260826072532622, ADR-0057. Pour que cette écriture reste sûre et sans conflit entre
 * sessions parallèles :
 *
 *   - un fichier PAR fiche (`features/reviews/verdicts/<id>.json`) — deux sessions qui jugent deux
 *     fiches créent deux fichiers, jamais deux lignes voisines d'un même fichier (qui, elles, se
 *     marchent dessus au merge : le test `verdicts-merge` le démontre) ;
 *   - un seul dossier est écrit, jamais le front-matter d'une fiche, jamais un commit ;
 *   - une seule porte d'écriture : `ezk review verdict` (fiche 20261102123552181), que mission control
 *     lance. Chaque refus sort en erreur et n'écrit RIEN.
 *
 * Aucun I/O ici : lire et écrire le dossier = `io/verdicts.ts`.
 */

/** Les deux pouces. « Retirer » n'est pas un verdict : c'est l'absence de fichier (`none` à l'envoi). */
export const VERDICTS = ['up', 'down'] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface VerdictRecord {
  verdict: Verdict;
  /** Jour du verdict, `AAAA-MM-JJ`. */
  date: string;
}

/** Le SEUL dossier que le tableau de bord écrit, relatif à la racine du dépôt. */
export const VERDICTS_DIR = 'features/reviews/verdicts';

/** Un id de fiche : les deux formats coexistent (fiche 0180) — `0094` et `20260826072532622`. */
const FICHE_ID = /^\d{4,20}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Chemin du fichier de verdict d'une fiche. Jette si `id` n'est pas un id de fiche : jamais un chemin saisi. */
export function verdictFile(id: string): string {
  if (!FICHE_ID.test(id)) throw new Error(`id de fiche invalide : ${JSON.stringify(id)}`);
  return `${VERDICTS_DIR}/${id}.json`;
}

/** Le fichier tel qu'il est écrit : JSON stable (champs dans le même ordre), ligne finale. */
export function serializeVerdict(record: VerdictRecord): string {
  return `${JSON.stringify({ verdict: record.verdict, date: record.date }, null, 2)}\n`;
}

export type ParsedVerdict = { ok: true; record: VerdictRecord } | { ok: false; reason: string };

const isDay = (s: string): boolean =>
  DAY.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/**
 * Relit un fichier de verdict. Un fichier illisible (JSON cassé, marqueurs de conflit git,
 * verdict inconnu) rend une RAISON : le board le signale au lieu de l'ignorer en silence.
 */
export function parseVerdict(text: string): ParsedVerdict {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'JSON illisible (un conflit git non résolu ?)' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, reason: 'le fichier doit contenir un objet' };
  }
  const { verdict, date } = data as Record<string, unknown>;
  if (typeof verdict !== 'string' || !(VERDICTS as readonly string[]).includes(verdict)) {
    return { ok: false, reason: `verdict inconnu : ${JSON.stringify(verdict)}` };
  }
  if (typeof date !== 'string' || !isDay(date)) {
    return { ok: false, reason: `date invalide : ${JSON.stringify(date)}` };
  }
  return { ok: true, record: { verdict: verdict as Verdict, date } };
}

/** Un pouce demandé, ou `none` pour retirer le verdict. */
export interface VerdictRequest {
  id: string;
  verdict: Verdict | 'none';
}

export type RequestCheck =
  | { ok: true; request: VerdictRequest }
  | { ok: false; status: number; error: string };

const refuse = (status: number, error: string): RequestCheck => ({ ok: false, status, error });

/**
 * Les contrôles de fond d'un pouce, pour `ezk review verdict` (fiche 20261102123552181) : un id de
 * fiche (jamais un chemin), une fiche qui existe, une valeur permise.
 */
export function checkVerdictValues(
  id: unknown,
  verdict: unknown,
  isKnownFiche: (id: string) => boolean,
): RequestCheck {
  if (typeof id !== 'string' || !FICHE_ID.test(id)) {
    return refuse(400, 'id invalide : un id de fiche (chiffres seulement) est attendu');
  }
  if (!isKnownFiche(id)) return refuse(404, `fiche inconnue : ${id}`);
  if (verdict !== 'none' && !(VERDICTS as readonly unknown[]).includes(verdict)) {
    return refuse(400, 'verdict invalide : up, down ou none');
  }
  return { ok: true, request: { id, verdict: verdict as Verdict | 'none' } };
}

/** Ce que la page lit au chargement : les verdicts posés, et les fichiers qu'on n'a pas pu lire. */
export interface VerdictsData {
  /** `id de fiche` → son verdict. */
  verdicts: Record<string, VerdictRecord>;
  /** Chemins (relatifs à la racine) des fichiers de verdict illisibles : signalés, jamais masqués. */
  illisibles: string[];
}
