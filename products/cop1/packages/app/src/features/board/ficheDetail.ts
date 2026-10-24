/**
 * ficheDetail — lecteur du DÉTAIL d'une fiche (sœur « plan réel » du board), chez cop1, SANS importer
 * mega-city (ADR-021). Il alimente `BoardProject.fiches` : ce que la MODALE montre quand on clique une
 * fiche (en-clair, contexte, critères, comment vérifier).
 *
 * Portée : les fiches ACTIVES (`features/*.md`, pas `features/done/`) — celles que les vues plan du board
 * rendent cliquables. Les fiches livrées comptent dans les totaux mais n'ouvrent pas de modale ici.
 *
 * Cœur PUR (`parseFicheDetail`) = extraction testable depuis le texte brut ; bord I/O (`readFicheDetails`)
 * = lecture du disque.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ficheIdFromFilename } from './backlogReader.js';

/** Les quatre états du board (identiques au type `FicheStatus` du web). */
export type FicheDetailStatus = 'idea' | 'ready' | 'wip' | 'done';

/** Le détail d'une fiche tel que la modale du board le montre (forme `FicheDetail` du web, ADR-074). */
export interface FicheDetailData {
  id: string;
  title: string;
  prio: string;
  status: FicheDetailStatus;
  ver: string;
  enclair: string;
  ctx: string;
  crit: string[];
  verif: string;
  pr?: string;
}

const str = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

/** Statut de fiche → état du board. Terminaux (superseded/merged/split) → `done` (hors flux actif). */
function boardStatus(raw: string, done: boolean): FicheDetailStatus {
  if (done || raw === 'shipped') return 'done';
  if (raw === 'in-progress') return 'wip';
  if (raw === 'ready') return 'ready';
  // Défaut `idea` (pas `done`) : une fiche ACTIVE sans statut reconnu ne doit pas s'afficher « livrée ».
  return 'idea';
}

/** Sépare le front-matter YAML du corps. `{fm:{}, body:text}` si pas de front-matter. */
function split(text: string): { fm: Record<string, unknown>; body: string } {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  let fm: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(m[1] ?? '');
    if (parsed && typeof parsed === 'object') fm = parsed as Record<string, unknown>;
  } catch {
    fm = {};
  }
  return { fm, body: m[2] ?? '' };
}

/**
 * Le texte d'une section `## <titre>` jusqu'à la prochaine section `## ` (ou la fin). Vide si absente.
 * Les lignes DANS un bloc de code (``` … ```) ne comptent ni comme début ni comme fin de section :
 * un `## installe` dans un exemple shell ne doit pas tronquer la section (constat de revue S3).
 */
function section(body: string, titleRegex: RegExp): string {
  const lines = body.split('\n');
  const isFence = (l: string): boolean => /^```/.test(l.trim());
  const isHeading = (l: string): boolean => /^##\s/.test(l);
  let inFence = false;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] ?? '';
    if (isFence(l)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && isHeading(l) && titleRegex.test(l)) {
      start = i;
      break;
    }
  }
  if (start === -1) return '';
  const out: string[] = [];
  inFence = false;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i] ?? '';
    if (isFence(l)) inFence = !inFence;
    else if (!inFence && isHeading(l)) break;
    out.push(l);
  }
  return out.join('\n').trim();
}

/** Le paragraphe « En clair » : soit `**En clair.**` en ligne, soit une section `## En clair`. */
function enclair(body: string): string {
  const inline = body.match(/\*\*En clair\.?\*\*\s*([\s\S]*?)(?=\n\n|\n##|$)/);
  if (inline?.[1]) return inline[1].trim();
  return section(body, /En clair/i);
}

/**
 * CŒUR PUR — extrait le détail d'une fiche depuis son texte brut. `null` si aucun id.
 * `idOverride` (venu du NOM DE FICHIER) est prioritaire : il porte l'id exact et survit à un YAML invalide
 * (constats de revue S1/S2). Les fins de ligne CRLF sont normalisées en LF (S5).
 */
export function parseFicheDetail(text: string, done = false, idOverride?: string): FicheDetailData | null {
  const { fm, body } = split(text.replace(/\r\n/g, '\n'));
  const id = idOverride || str(fm.id);
  if (!id) return null;
  const crit = section(body, /Critères/i)
    .split('\n')
    .map((l) => l.match(/^\s*-\s*\[[ xX]\]\s*(.+)$/)?.[1]?.trim())
    .filter((c): c is string => Boolean(c));
  const pr = str(fm.pr);
  return {
    id,
    title: str(fm.title),
    prio: str(fm.priority),
    status: boardStatus(str(fm.status), done),
    ver: str(fm.version),
    enclair: enclair(body),
    ctx: section(body, /Contexte/i),
    crit,
    verif: section(body, /Comment vérifier/i),
    ...(pr ? { pr } : {}),
  };
}

/** BORD I/O — lit le détail des fiches ACTIVES (`features/*.md`, hors `done/`) sous `root`, par id. */
export function readFicheDetails(root: string): Record<string, FicheDetailData> {
  const out: Record<string, FicheDetailData> = {};
  const dir = join(root, 'features');
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => /^\d.*\.md$/.test(n));
  } catch {
    return out; // pas de dossier features/ → aucun détail (dégrade proprement)
  }
  for (const name of names) {
    try {
      const d = parseFicheDetail(readFileSync(join(dir, name), 'utf8'), false, ficheIdFromFilename(name));
      if (d) out[d.id] = d;
    } catch {
      // fiche illisible → ignorée, pas de crash
    }
  }
  return out;
}
