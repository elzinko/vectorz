/**
 * chantierAdapter — la part « live » du board (ADR-074 / ADR-079), depuis le read-model de
 * supervision. Fiche 20261024130842250 (sœur « runs réels »), construite sur la décision G5 de
 * [ADR-084] : les skills posent enfin la clé de chantier, donc `projectChantiers` peut réunir des
 * journaux par chantier.
 *
 * PÉRIMÈTRE HONNÊTE (tranché avec le PO, 2026-10-26). Le journal de supervision donne SIX types
 * d'évènements (`run.started`, `gate.reached`/`gate.resumed`, `heartbeat`, `escalation`,
 * `run.finished`) plus le cycle de vie du chantier. Il NE donne PAS : les transitions de fiche
 * (moment `fiche.transition` différé — ADR-084 G4), les jetons (toujours `absent`, garde D9), les
 * verdicts riches, les numéros de sprint. Cet adaptateur produit donc une vue FIDÈLE mais MINCE :
 *   - `chantiers` : le vrai regroupement (clé de chantier → sessions → fil fusionné) ;
 *   - fils (`merged`, `session.events`) : les jalons mappables (lancement, gate), **du plus récent
 *     au plus ancien** (comme la maquette) ; les `heartbeat` sont de la présence (ils nourrissent
 *     l'âge/le vivant), pas des jalons ; `run.finished` éteint le vivant ;
 *   - `runs` : un par chantier (granularité v1), sans `moments`/`tok`/`verdict` inventés.
 * La sortie est BORNÉE aux `MAX_CHANTIERS` chantiers les plus récents (comme `RunHistoryService`).
 * Les champs riches de la maquette (moments, jetons, verdicts) restent ABSENTS tant que le journal
 * ne les émet pas — jamais un faux chiffre (le comportement honnête que la fiche réclame).
 *
 * PUR : `now` est injecté, aucun I/O. Le bord (lecture des journaux via `projectChantiers`, câblage
 * dans le provider) vit ailleurs. Les types de sortie MIROITENT le sous-ensemble des types du board
 * web qu'on peut remplir (même convention que `BoardPlanProject`, ADR-021 : on ne dépend pas du
 * paquet web).
 */
import type { ChantierEvent, ChantierLifecycle, ChantierProjection, RunState } from '@cop1/journal-validator';

/** État d'affichage d'une session/chantier (miroir de `SessionState` du board web). */
export type LiveState = 'live' | 'gate' | 'done' | 'dead';

/** Au plus N chantiers, les plus récents : borne la sortie (comme `RunHistoryService`, 20). */
export const MAX_CHANTIERS = 20;

/** Un évènement de chronologie mappable (miroir du sous-ensemble de `TimelineEvent`). */
export interface LiveEvent {
  when: string;
  kind: 'lancement' | 'gate';
  title: string;
  live?: boolean;
  /** Libellé lisible de la session émettrice (branche si connue, sinon son id). */
  session?: string;
}

/** Une session vue dans un chantier (miroir de `ChantierSession`). */
export interface LiveSession {
  id: string;
  label: string;
  state: LiveState;
  pilot?: boolean;
  /** Fil propre de la session (niveau 3), du plus récent au plus ancien. */
  events: LiveEvent[];
}

/** Un chantier (miroir de `BoardChantier`). */
export interface LiveChantier {
  key: string;
  name: string;
  /** Version portée par la clé de chantier (toujours dérivable de la clé). */
  ver: string;
  state: LiveState;
  age: string;
  sessions: LiveSession[];
  /** Fil fusionné (niveau 2), du plus récent au plus ancien. */
  merged: LiveEvent[];
}

/** Un run observé, granularité v1 = un par chantier (miroir du sous-ensemble de `BoardRun`). */
export interface LiveRun {
  id: string;
  name: string;
  ver: string;
  live: boolean;
  when?: string;
  sessions?: string[];
}

/** La part live d'un `BoardProject` : ce que l'adaptateur remplit. */
export interface LiveBoard {
  runs: Record<string, LiveRun>;
  chantiers: LiveChantier[];
}

/** Cycle de vie d'un chantier → état d'affichage. */
export function lifecycleToState(lifecycle: ChantierLifecycle): LiveState {
  switch (lifecycle) {
    case 'running':
      return 'live';
    case 'at_gate':
      return 'gate';
    case 'orphan':
      return 'dead';
    case 'finished':
      return 'done';
  }
}

/** État de run (read-model) → état d'affichage d'une session. */
export function runStateToState(state: RunState): LiveState {
  switch (state) {
    case 'launched':
    case 'running':
      return 'live';
    case 'at_gate':
      return 'gate';
    case 'finished':
    case 'finished_at_gate':
      return 'done';
    case 'aborted':
      return 'dead';
  }
}

/** Version portée par la clé de chantier (`milestone:version` → `version`, sinon la clé telle quelle). */
export function versionOfKey(key: string): string {
  const i = key.lastIndexOf(':');
  return i >= 0 ? key.slice(i + 1) : key;
}

/** `ts` → millisecondes, ou `-Infinity` si illisible/absent (tri : les illisibles finissent au plus vieux). */
function tsMs(ts: string | undefined): number {
  const t = ts !== undefined ? Date.parse(ts) : Number.NaN;
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/** Temps compact FR, tolérant : un `ts` illisible dégrade en `'—'`, jamais une exception. */
export function compactWhen(ts: string | undefined, now: number): string {
  const t = tsMs(ts);
  if (t === Number.NEGATIVE_INFINITY) return '—';
  const sec = Math.max(0, Math.round((now - t) / 1000));
  if (sec < 60) return 'maintenant';
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j === 1 ? 'hier' : `il y a ${j} j`;
}

/**
 * Un évènement de journal → un jalon de chronologie, ou `null` quand il n'en est pas un.
 * Seuls `run.started` (lancement) et `gate.reached`/`gate.resumed` (gate) sont des jalons ;
 * `heartbeat` (présence), `escalation`, `run.finished` et les `session.*` n'en produisent pas.
 * `labelFor` traduit l'id de session en libellé lisible (branche) pour le badge.
 */
export function eventToLive(
  event: ChantierEvent,
  now: number,
  labelFor: (sessionId: string) => string = (id) => id,
): LiveEvent | null {
  const when = compactWhen(event.ts, now);
  const session = event.sessionId !== undefined ? labelFor(event.sessionId) : undefined;
  switch (event.type) {
    case 'run.started':
      return { when, kind: 'lancement', title: 'Run démarré', live: true, session };
    case 'gate.reached': {
      const gateId = typeof event.payload?.gate_id === 'string' ? event.payload.gate_id : undefined;
      return { when, kind: 'gate', title: gateId ? `Jalon ${gateId}` : 'Jalon atteint', session };
    }
    case 'gate.resumed':
      return { when, kind: 'gate', title: 'Reprise après le jalon', session };
    default:
      return null;
  }
}

/** Horodatage du dernier évènement d'un chantier (pour l'âge). */
function lastTs(events: readonly ChantierEvent[]): string | undefined {
  return events.length > 0 ? events[events.length - 1]?.ts : undefined;
}

/** Les jalons mappables d'une liste d'évènements, du plus récent au plus ancien. */
function liveEvents(
  events: readonly ChantierEvent[],
  now: number,
  labelFor: (sessionId: string) => string,
): LiveEvent[] {
  return events
    .map((e) => eventToLive(e, now, labelFor))
    .filter((e): e is LiveEvent => e !== null)
    .reverse(); // `projectChantiers` rend un fil ascendant ; la maquette veut le plus récent d'abord.
}

/** Un chantier du read-model → un chantier d'affichage. */
export function chantierToLive(proj: ChantierProjection, now: number): LiveChantier {
  const branchById = new Map(proj.sessions.map((s) => [s.sessionId, s.branch ?? s.sessionId]));
  const labelFor = (id: string): string => branchById.get(id) ?? id;
  const sessions: LiveSession[] = proj.sessions.map((s) => ({
    id: s.sessionId,
    label: s.branch ?? s.sessionId,
    state: runStateToState(s.state),
    ...(s.pilotedBy !== undefined ? { pilot: true } : {}),
    events: liveEvents(
      proj.events.filter((e) => e.sessionId === s.sessionId),
      now,
      labelFor,
    ),
  }));
  return {
    key: proj.key,
    name: proj.key,
    ver: versionOfKey(proj.key),
    state: lifecycleToState(proj.lifecycle),
    age: compactWhen(lastTs(proj.events), now),
    sessions,
    merged: liveEvents(proj.events, now, labelFor),
  };
}

/**
 * Le read-model (`projectChantiers`) → la part live du board, bornée aux `MAX_CHANTIERS` chantiers
 * les plus récents. Entrée vide (aucun journal keyé, cas du backlog d'avant G5) → sortie vide
 * HONNÊTE : aucun faux run. Pur.
 */
export function adaptChantiers(projections: readonly ChantierProjection[], now: number): LiveBoard {
  const chantiers = [...projections]
    .sort((a, b) => tsMs(lastTs(b.events)) - tsMs(lastTs(a.events)))
    .slice(0, MAX_CHANTIERS)
    .map((p) => chantierToLive(p, now));
  const runs: Record<string, LiveRun> = {};
  for (const c of chantiers) {
    runs[c.key] = {
      id: c.key,
      name: c.name,
      ver: c.ver,
      live: c.state === 'live' || c.state === 'gate',
      when: c.age,
      sessions: c.sessions.map((s) => s.id),
    };
  }
  return { runs, chantiers };
}
