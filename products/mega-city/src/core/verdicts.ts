/**
 * verdicts — le pouce 👍/👎 posé sur une fiche depuis le tableau de bord. PUR (ADR-0003).
 *
 * Fiche 20260826072532622, ADR-0057. C'est la PREMIÈRE écriture du tableau de bord : il ne faisait
 * que lire. Pour que cette écriture reste sûre et sans conflit entre sessions parallèles :
 *
 *   - un fichier PAR fiche (`features/reviews/verdicts/<id>.json`) — deux sessions qui jugent deux
 *     fiches créent deux fichiers, jamais deux lignes voisines d'un même fichier (qui, elles, se
 *     marchent dessus au merge : le test `verdicts-merge` le démontre) ;
 *   - un seul dossier est écrit, jamais le front-matter d'une fiche, jamais un commit ;
 *   - la route d'écriture est gardée : méthode, Host, Origin, type, taille, id, verdict. Chaque
 *     refus rend un code HTTP et n'écrit RIEN.
 *
 * Aucun I/O ici : lire et écrire le dossier = `io/verdicts.ts`, parler HTTP = `io/verdict-endpoint.ts`.
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

/** Au-delà, la requête est refusée avant d'être lue en entier : un verdict tient en 60 octets. */
export const MAX_BODY_BYTES = 1024;

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

/** Ce que le garde-fou lit d'une requête HTTP. Les noms d'en-têtes sont en minuscules (comme Node). */
export interface RequestEnvelope {
  method: string;
  headers: Record<string, string | undefined>;
  body: string;
}

/** Ce que la page demande : un pouce, ou `none` pour retirer le verdict. */
export interface VerdictRequest {
  id: string;
  verdict: Verdict | 'none';
}

export type RequestCheck =
  | { ok: true; request: VerdictRequest }
  | { ok: false; status: number; error: string };

/** Le serveur n'écoute que sur la boucle locale ; un Host d'un autre nom trahit une requête détournée. */
const LOOPBACK_HOST = /^(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$/;

const refuse = (status: number, error: string): RequestCheck => ({ ok: false, status, error });

/**
 * Le garde-fou de `POST /api/verdict`, dans l'ordre : méthode, Host (anti « DNS rebinding »),
 * Origin (anti requête d'un autre site), type JSON (un navigateur n'envoie ce type depuis un autre
 * site qu'après une requête préalable, que ce serveur ne sert jamais), taille, forme, id, verdict.
 * `isKnownFiche` dit si l'id est celui d'une fiche existante : on n'écrit jamais pour un id inconnu.
 * C'est une fonction, pas une liste : les refus bon marché passent d'abord, la lecture du dépôt
 * n'a lieu que pour une requête déjà bien formée.
 */
export function checkVerdictRequest(
  req: RequestEnvelope,
  isKnownFiche: (id: string) => boolean,
): RequestCheck {
  if (req.method !== 'POST') return refuse(405, 'méthode non permise : POST seulement');

  const host = req.headers.host;
  if (host === undefined || !LOOPBACK_HOST.test(host)) {
    return refuse(403, 'hôte refusé : le tableau de bord ne répond que sur la boucle locale');
  }
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== `http://${host}`) {
    return refuse(403, 'origine refusée : la requête ne vient pas de la page du tableau de bord');
  }

  const type = (req.headers['content-type'] ?? '').split(';')[0]?.trim().toLowerCase();
  if (type !== 'application/json') return refuse(415, 'corps refusé : application/json attendu');
  if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
    return refuse(413, `corps trop gros : ${MAX_BODY_BYTES} octets au plus`);
  }

  let data: unknown;
  try {
    data = JSON.parse(req.body);
  } catch {
    return refuse(400, 'corps illisible : JSON attendu');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return refuse(400, 'corps invalide : un objet { id, verdict } est attendu');
  }
  const { id, verdict } = data as Record<string, unknown>;
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

// --- Bloc de données du board (fichier voisin `board.data.js`, non committé — ADR-0055) ---

export const VERDICTS_DATA_BEGIN = '/*ezk-verdicts-data:begin*/';
export const VERDICTS_DATA_END = '/*ezk-verdicts-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), à la suite des autres blocs de `board.data.js`. */
export function buildVerdictsBlock(data: VerdictsData): string {
  // `<` échappé : un nom de fichier contenant `</script>` ne peut pas fermer la balise du bloc.
  const json = JSON.stringify(data, null, 1).replace(/</g, '\\u003c');
  return `${VERDICTS_DATA_BEGIN}\nwindow.EZK_VERDICTS = ${json};\n${VERDICTS_DATA_END}`;
}
