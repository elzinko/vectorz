/**
 * retro-capture — l'EXTRACTEUR du compte rendu de rétro (fiche 0080).
 *
 * Une rétro laisse une capture dans `docs/captures/AAAA-MM-JJ-retro-<slug>.md`. Son en-tête YAML
 * liste les décisions : c'est ce que lit ce module, sans jamais deviner dans la prose. Le récit
 * (le corps) reste pour l'humain. Pattern gabarit + extracteur + rendu : le gabarit est
 * `skills/ezk-retro/references/capture-template.md`.
 *
 * PUR : aucune I/O. Le bord est `bin/retro-captures.ts`.
 *
 * Le format d'une action : `proposition`, `kind`, `target` (règles), `by` (qui a proposé), `status`
 * (✅ ❌ ⏳), `decision`, `date`. La case du PO n'est jamais pré-remplie : un ✅ ou un ❌ porte une
 * décision ET une date, un ⏳ n'en porte aucune.
 */
import { parse as parseYaml } from 'yaml';

export const RETRO_KINDS = ['regle', 'feature', 'action', 'spike', 'recette'] as const;
export type RetroKind = (typeof RETRO_KINDS)[number];

export const RETRO_STATUSES = ['✅', '❌', '⏳'] as const;
export type RetroStatus = (typeof RETRO_STATUSES)[number];

export interface RetroAction {
  proposition: string;
  kind: RetroKind;
  /** `global`, `agent:<nom>` ou `skill:<nom>` : obligatoire pour une règle. */
  target?: string;
  by: string[];
  status: RetroStatus;
  decision: string;
  date?: string;
}

export interface RetroCapture {
  file: string;
  date: string;
  theme: string;
  scope: string;
  participants: string[];
  actions: RetroAction[];
}

/** Un défaut du format : le fichier, le champ fautif, ce qui est attendu. */
export interface RetroProblem {
  file: string;
  where: string;
  message: string;
}

export interface RetroParse {
  capture?: RetroCapture;
  problems: RetroProblem[];
}

const TARGET = /^(global|agent:[a-z0-9][a-z0-9-]*|skill:[a-z0-9][a-z0-9-]*)$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CAPTURE_NAME = /^\d{4}-\d{2}-\d{2}-retro-.+\.md$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Une capture de rétro se reconnaît à son nom : `AAAA-MM-JJ-retro-<slug>.md`. */
export const isRetroCaptureName = (name: string): boolean => CAPTURE_NAME.test(name);

function isRealDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Le sélecteur de variante U+FE0F suit parfois l'emoji : on le retire avant de comparer. */
const normalizeStatus = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/️/g, '').trim() : '';

function readStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((v) => text(v));
  return items.every((v) => v !== '') ? items : undefined;
}

function parseAction(
  raw: unknown,
  index: number,
  report: (where: string, message: string) => void,
): RetroAction | undefined {
  const label = isRecord(raw) && text(raw.proposition) ? ` (« ${text(raw.proposition)} »)` : '';
  const at = (field: string): string => `actions[${index}]${label}.${field}`;
  if (!isRecord(raw)) {
    report(`actions[${index}]`, 'une action est un bloc YAML avec proposition, kind, status…');
    return undefined;
  }
  let ok = true;
  const fail = (field: string, message: string): void => {
    ok = false;
    report(at(field), message);
  };

  const proposition = text(raw.proposition);
  if (!proposition) fail('proposition', 'texte non vide attendu (la proposition, en mots simples)');

  const kind = text(raw.kind);
  if (!(RETRO_KINDS as readonly string[]).includes(kind)) {
    fail('kind', `${RETRO_KINDS.slice(0, -1).join(', ')} ou ${RETRO_KINDS[RETRO_KINDS.length - 1]} attendu, reçu « ${kind} »`);
  }

  const target = text(raw.target);
  if (kind === 'regle' && !target) {
    fail('target', 'une règle porte une cible : global, agent:<nom> ou skill:<nom>');
  } else if (target && !TARGET.test(target)) {
    fail('target', `global, agent:<nom> ou skill:<nom> attendu, reçu « ${target} »`);
  }

  let by: string[] = [];
  if (raw.by !== undefined) {
    const list = readStringList(raw.by);
    if (list === undefined) fail('by', 'liste de textes attendue (qui a proposé : architecture, qa…)');
    else by = list;
  }

  const status = normalizeStatus(raw.status);
  if (!(RETRO_STATUSES as readonly string[]).includes(status)) {
    fail('status', `✅, ❌ ou ⏳ attendu, reçu « ${status} »`);
  }

  const decision = text(raw.decision);
  const date = text(raw.date);
  if (status === '✅' || status === '❌') {
    if (!decision) fail('decision', `un ${status} dit ce que le PO a décidé : texte non vide attendu`);
    if (!date) fail('date', `un ${status} porte la date de la décision (AAAA-MM-JJ)`);
    else if (!isRealDay(date)) fail('date', `AAAA-MM-JJ attendu, reçu « ${date} »`);
  } else if (status === '⏳') {
    // La case du PO reste vide tant qu'il n'a pas tranché : ni décision, ni date.
    if (decision) fail('decision', 'un ⏳ ne porte pas de décision : la case du PO reste vide tant qu’il n’a pas tranché');
    if (date) fail('date', 'un ⏳ ne porte pas de date : la case du PO reste vide tant qu’il n’a pas tranché');
  }

  if (!ok) return undefined;
  return {
    proposition,
    kind: kind as RetroKind,
    ...(target ? { target } : {}),
    by,
    status: status as RetroStatus,
    decision,
    ...(date ? { date } : {}),
  };
}

/** Lit l'en-tête d'une capture. Rend la capture si elle est valide, et tous les défauts trouvés. */
export function parseRetroCapture(file: string, markdown: string): RetroParse {
  const problems: RetroProblem[] = [];
  const report = (where: string, message: string): void => {
    problems.push({ file, where, message });
  };

  const match = FRONT_MATTER.exec(markdown);
  if (!match) {
    report('en-tête', 'aucun en-tête YAML (---) en tête du fichier : voir references/capture-template.md');
    return { problems };
  }
  let head: unknown;
  try {
    head = parseYaml(match[1] ?? '');
  } catch (err) {
    const first = (err instanceof Error ? err.message : String(err)).split('\n')[0] ?? '';
    report('en-tête', `YAML illisible : ${first}`);
    return { problems };
  }
  if (!isRecord(head)) {
    report('en-tête', 'un bloc YAML clé: valeur est attendu');
    return { problems };
  }

  if (text(head.type) !== 'retro') report('type', `attendu « retro », reçu « ${text(head.type)} »`);
  const date = text(head.date);
  if (!isRealDay(date)) report('date', `AAAA-MM-JJ attendu, reçu « ${date} »`);
  const theme = text(head.theme);
  if (!theme) report('theme', 'texte non vide attendu (le sujet de la rétro)');
  const scope = text(head.scope);
  if (!scope) report('scope', 'texte non vide attendu (ce qui a été passé en revue)');

  let participants: string[] = [];
  if (head.participants !== undefined) {
    const list = readStringList(head.participants);
    if (list === undefined) report('participants', 'liste de textes attendue');
    else participants = list;
  }

  const actions: RetroAction[] = [];
  if (!Array.isArray(head.actions) || head.actions.length === 0) {
    report('actions', 'au moins une action attendue : une rétro sans décision ne laisse rien à retrouver');
  } else {
    head.actions.forEach((raw, index) => {
      const action = parseAction(raw, index, report);
      if (action) actions.push(action);
    });
  }

  if (problems.length > 0) return { problems };
  return { capture: { file, date, theme, scope, participants, actions }, problems };
}

/** Le rendu texte de la liste des décisions : une ligne par action, la plus récente rétro d'abord. */
export function renderCaptures(captures: RetroCapture[]): string {
  const sorted = [...captures].sort((a, b) => b.date.localeCompare(a.date) || a.file.localeCompare(b.file));
  const blocks = sorted.map((c) => {
    const lines = c.actions.map((a) => {
      const target = a.target ? ` [${a.target}]` : '';
      const decision = a.decision ? a.decision : 'en attente';
      const date = a.date ? ` (${a.date})` : '';
      return `  ${a.status} ${a.kind}${target} ${a.proposition} — ${decision}${date}`;
    });
    const n = c.actions.length;
    return [`${c.date} — ${c.theme} (${n} décision${n > 1 ? 's' : ''})`, ...lines].join('\n');
  });
  return blocks.join('\n\n');
}
