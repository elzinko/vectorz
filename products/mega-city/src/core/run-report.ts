/**
 * run-report — le RUN-REPORT de fin de run (fiche 20260906122942607).
 *
 * En clair : après un run auto, l'état de chaque fiche est dispersé dans le fil. Ce module rend le
 * bilan : une ligne par fiche, six champs chacune. Il refuse une ligne incomplète, compare ce que
 * l'orchestrateur DÉCLARE à ce que dit GitHub, et ajoute la position de HEAD contre origin/main et
 * les jetons contre le plafond. Le script extrait les faits, le LLM ne recopie pas les chiffres.
 *
 * PUR : aucune I/O. Les faits git et GitHub viennent de `src/io/run-facts.ts`, le bord est `bin/run-report.ts`.
 */

export const RUN_STATES = ['mergée', 'PR-ouverte', 'bloquée', 'sautée'] as const;
export type RunState = (typeof RUN_STATES)[number];

/** Une fiche traitée par le run : l'id et les six champs du bilan. */
export interface FicheLine {
  id: string;
  state: RunState;
  /** `#<numéro>`, ou `null` (écrit `-`). */
  pr: string | null;
  gate: string;
  review: string;
  validation: string;
  reason: string;
}

const FIELDS = ['id', 'état', 'PR', 'gate', 'revue', 'validation', 'raison'] as const;
const PR_FORM = /^#\d+$/;

/**
 * Lit `id|état|PR|gate|revue|validation|raison`. `-` dit « sans objet » : un champ vide est refusé, pour
 * qu'un trou ne passe jamais pour un « rien à signaler ».
 */
export function parseFicheArg(arg: string): { line?: FicheLine; error?: string } {
  const parts = arg.split('|').map((p) => p.trim());
  if (parts.length !== FIELDS.length) {
    return { error: `7 champs attendus (${FIELDS.join('|')}), reçu ${parts.length} dans « ${arg} »` };
  }
  const [id = '', state = '', pr = '', gate = '', review = '', validation = '', reason = ''] = parts;
  const empty = FIELDS.find((_, i) => parts[i] === '');
  if (empty) return { error: `champ « ${empty} » vide dans « ${arg} » : écris - pour « sans objet »` };
  if (!(RUN_STATES as readonly string[]).includes(state)) {
    return { error: `état « ${state} » inconnu : mergée, PR-ouverte, bloquée ou sautée (fiche ${id})` };
  }
  const prNeeded = state === 'mergée' || state === 'PR-ouverte';
  if ((prNeeded && !PR_FORM.test(pr)) || (pr !== '-' && !PR_FORM.test(pr))) {
    return { error: `PR attendue pour la fiche ${id}${prNeeded ? '' : ' (ou -)'}, forme #<numéro>, reçu « ${pr} »` };
  }
  if (state !== 'mergée' && reason === '-') {
    return { error: `raison obligatoire hors mergée (fiche ${id}) : dis pourquoi elle n'est pas mergée` };
  }
  return { line: { id, state: state as RunState, pr: pr === '-' ? null : pr, gate, review, validation, reason } };
}

/** Ce que dit GitHub d'une PR, réduit à ce que le bilan compare. */
export interface PrFacts {
  state: 'MERGED' | 'OPEN' | 'CLOSED';
  checks: 'success' | 'failure' | 'pending' | 'none';
  /** Revues et commentaires qui portent un verdict (positif ou négatif). */
  reviewTraces: number;
  /** Le DERNIER verdict de la PR : `negative` = modifications demandées ou NO-GO, `none` = aucune trace. */
  latestReview: 'positive' | 'negative' | 'none';
}

const BAD_CONCLUSIONS = ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'ERROR'];
const PENDING_STATES = ['PENDING', 'EXPECTED', 'IN_PROGRESS', 'QUEUED', 'WAITING', 'REQUESTED'];
// Des mots entiers : « preview » (aperçu de déploiement) ne doit pas passer pour une revue.
const REVIEW_WORDS = /\brevue\b|\breview\b|verdict|\bGO\b|NO-GO/i;

/**
 * Réduit la sortie de `gh pr view --json state,statusCheckRollup,reviews,comments` à ce que le bilan
 * compare. Une réponse illisible rend `null` : la PR est alors « non vérifiée », jamais « en écart ».
 */
export function parsePrFacts(json: unknown): PrFacts | null {
  if (typeof json !== 'object' || json === null) return null;
  const o = json as Record<string, unknown>;
  const state = o.state;
  if (state !== 'OPEN' && state !== 'MERGED' && state !== 'CLOSED') return null;
  const rollup = Array.isArray(o.statusCheckRollup) ? (o.statusCheckRollup as Array<Record<string, unknown>>) : [];
  let checks: PrFacts['checks'] = rollup.length === 0 ? 'none' : 'success';
  for (const c of rollup) {
    const verdict = String(c.conclusion ?? c.state ?? '').toUpperCase();
    const status = String(c.status ?? '').toUpperCase();
    if (BAD_CONCLUSIONS.includes(verdict)) {
      checks = 'failure';
      break;
    }
    if (PENDING_STATES.includes(verdict) || (status !== '' && status !== 'COMPLETED')) checks = 'pending';
  }
  // Chaque revue ou commentaire qui porte un verdict, daté : on garde le dernier. Une revue
  // CHANGES_REQUESTED ou un commentaire NO-GO est un verdict négatif, jamais une trace de GO.
  const verdicts: Array<{ at: string; negative: boolean }> = [];
  for (const r of Array.isArray(o.reviews) ? (o.reviews as Array<Record<string, unknown>>) : []) {
    const st = String(r.state ?? '').toUpperCase();
    const at = String(r.submittedAt ?? '');
    if (st === 'CHANGES_REQUESTED') verdicts.push({ at, negative: true });
    else if (st === 'APPROVED' || st === 'COMMENTED') verdicts.push({ at, negative: false });
  }
  for (const c of Array.isArray(o.comments) ? (o.comments as Array<Record<string, unknown>>) : []) {
    const body = String(c.body ?? '');
    const at = String(c.createdAt ?? '');
    if (/NO-GO/i.test(body)) verdicts.push({ at, negative: true });
    else if (REVIEW_WORDS.test(body)) verdicts.push({ at, negative: false });
  }
  verdicts.sort((a, b) => a.at.localeCompare(b.at));
  const last = verdicts[verdicts.length - 1];
  const latestReview: PrFacts['latestReview'] = last === undefined ? 'none' : last.negative ? 'negative' : 'positive';
  return { state, checks, reviewTraces: verdicts.length, latestReview };
}

export interface Discrepancy {
  id: string;
  message: string;
  /** `mismatch` : le déclaré contredit GitHub (code retour 1). `unverified` : GitHub n'a pas répondu. */
  severity: 'mismatch' | 'unverified';
}

/** Compare le déclaré à ce que dit GitHub. Une PR illisible n'est pas un écart : elle est dite non vérifiée. */
export function crossCheck(lines: FicheLine[], prs: Map<string, PrFacts | null>): Discrepancy[] {
  const out: Discrepancy[] = [];
  for (const line of lines) {
    if (!line.pr) continue;
    const facts = prs.get(line.pr) ?? null;
    if (!facts) {
      out.push({ id: line.id, message: `PR ${line.pr} illisible sur GitHub : non vérifiée`, severity: 'unverified' });
      continue;
    }
    const mismatch = (message: string): number => out.push({ id: line.id, message, severity: 'mismatch' });
    if (line.state === 'mergée' && facts.state !== 'MERGED') mismatch(`déclarée mergée, GitHub dit ${facts.state}`);
    if (line.state === 'PR-ouverte' && facts.state !== 'OPEN') mismatch(`déclarée ouverte, GitHub dit ${facts.state}`);
    // Bloquée ou sautée avec une PR que GitHub dit déjà mergée : le bilan de fin de run serait faux.
    if ((line.state === 'bloquée' || line.state === 'sautée') && facts.state === 'MERGED') {
      mismatch(`déclarée ${line.state}, GitHub dit MERGED`);
    }
    if (/^verte$/i.test(line.gate) && facts.checks === 'failure') mismatch('gate verte déclarée, CI rouge sur GitHub');
    if (/^GO$/i.test(line.review)) {
      if (facts.latestReview === 'none') {
        mismatch('revue GO déclarée, aucune trace de revue sur la PR (le garde-fou refuserait le merge)');
      } else if (facts.latestReview === 'negative') {
        mismatch('revue GO déclarée, mais le dernier verdict de la PR est négatif (modifications demandées ou NO-GO)');
      }
    }
  }
  return out;
}

export interface HeadFacts {
  head: string;
  branch: string | null;
  /** `null` : pas de base distante joignable. */
  originMain: string | null;
  behind: number;
  ahead: number;
  /** La base comparée, telle que `--base` l'a désignée (défaut `origin/main`). */
  baseRef?: string;
}

export interface Tokens {
  used?: number;
  cap?: number;
  /** Le réglage `--tokens` (lean, cap, full), pour dire « pas de plafond chiffré ». */
  setting?: string;
}

export interface RunReportInput {
  lines: FicheLine[];
  discrepancies: Discrepancy[];
  head: HeadFacts;
  tokens: Tokens;
  github: 'checked' | 'skipped' | 'unreachable';
}

const spaced = (n: number): string => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const many = (n: number, one: string, more: string): string => `${n} ${n > 1 ? more : one}`;

function headLine(h: HeadFacts): string {
  const on = h.branch ? ` (${h.branch})` : '';
  const at = `HEAD ${h.head}${on}`;
  const base = h.baseRef ?? 'origin/main';
  if (h.originMain === null) return `${at} : ${base} injoignable, position non vérifiée.`;
  if (h.behind === 0 && h.ahead === 0) return `HEAD ${h.head} = ${base} ${h.originMain} : identique${on}.`;
  if (h.behind > 0 && h.ahead > 0) {
    return `${at} a divergé de ${base} ${h.originMain} : en retard de ${h.behind}, en avance de ${h.ahead}.`;
  }
  if (h.behind > 0) return `${at} est en retard de ${h.behind} sur ${base} ${h.originMain}.`;
  return `${at} est en avance de ${h.ahead} sur ${base} ${h.originMain}, pas encore poussé ou mergé.`;
}

function tokensLine(t: Tokens): string {
  if (t.used === undefined) return 'Jetons : non mesurés (passe --tokens-used à run:report).';
  if (t.cap !== undefined && t.cap > 0) {
    return `Jetons : ${spaced(t.used)} sur un plafond de ${spaced(t.cap)} (${Math.round((t.used / t.cap) * 100)} %).`;
  }
  const setting = t.setting ? `réglage ${t.setting}` : 'aucun plafond annoncé';
  return `Jetons : ${spaced(t.used)} consommés (pas de plafond chiffré, ${setting}).`;
}

/** Ce que cela veut dire pour le PO : la dernière ligne du rapport. */
function nextLine(input: RunReportInput): string {
  const open = input.lines.filter((l) => l.state === 'PR-ouverte');
  const blocked = input.lines.filter((l) => l.state === 'bloquée');
  const skipped = input.lines.filter((l) => l.state === 'sautée');
  const mismatches = input.discrepancies.filter((d) => d.severity === 'mismatch');
  const todo: string[] = [];
  if (open.length > 0) todo.push(`${open.length} PR à merger ou à relire (${open.map((l) => l.pr).join(', ')})`);
  if (blocked.length > 0) {
    todo.push(`${many(blocked.length, 'fiche bloquée', 'fiches bloquées')} à trancher (${blocked.map((l) => l.id).join(', ')})`);
  }
  if (skipped.length > 0) {
    todo.push(`${many(skipped.length, 'fiche sautée', 'fiches sautées')} à replanifier (${skipped.map((l) => l.id).join(', ')})`);
  }
  if (mismatches.length > 0) todo.push(`${many(mismatches.length, 'écart', 'écarts')} avec GitHub à vérifier avant de te fier à ce rapport`);
  return `Ce que ça veut dire pour toi : ${todo.length > 0 ? `${todo.join(' ; ')}.` : 'rien à faire, tout est mergé.'}`;
}

/** Le rapport, en texte : « En clair » d'abord, une ligne par fiche, puis HEAD, jetons, écarts. */
export function renderRunReport(input: RunReportInput): string {
  const count = (state: RunState): number => input.lines.filter((l) => l.state === state).length;
  const total = input.lines.length;
  const tally = [
    many(count('mergée'), 'mergée', 'mergées'),
    many(count('PR-ouverte'), 'PR ouverte', 'PR ouvertes'),
    many(count('bloquée'), 'bloquée', 'bloquées'),
    many(count('sautée'), 'sautée', 'sautées'),
  ].join(', ');
  const mismatches = input.discrepancies.filter((d) => d.severity === 'mismatch').length;
  const gap = mismatches > 0 ? ` ${many(mismatches, 'écart', 'écarts')} avec GitHub.` : '';

  const rows = input.lines.map((l) => {
    const pr = l.pr ? ` (${l.pr})` : '';
    const why = l.reason !== '-' ? ` · raison : ${l.reason}` : '';
    return `• ${l.id} — ${l.state}${pr} · gate ${l.gate} · revue ${l.review} · validation ${l.validation}${why}`;
  });

  const github =
    input.github === 'checked'
      ? 'GitHub : consulté.'
      : input.github === 'skipped'
        ? 'GitHub : non consulté, le déclaré est pris tel quel.'
        : 'GitHub : injoignable, le déclaré est pris tel quel.';

  const out = [
    'RUN-REPORT',
    `En clair : ${many(total, 'fiche traitée', 'fiches traitées')} : ${tally}.${gap}`,
    '',
    ...rows,
    '',
    headLine(input.head),
    tokensLine(input.tokens),
    github,
  ];
  if (input.discrepancies.length > 0) {
    out.push('', 'Écarts avec GitHub :');
    for (const d of input.discrepancies) out.push(`• ${d.id} — ${d.message}`);
  }
  out.push('', nextLine(input));
  return out.join('\n');
}
