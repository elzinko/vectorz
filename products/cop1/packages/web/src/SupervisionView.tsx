import { memo, type ReactNode, useEffect, useState } from 'react';

type RunState = 'launched' | 'running' | 'at_gate' | 'finished' | 'finished_at_gate' | 'aborted';
type ResumeOrigin = 'command' | 'self_reported';

interface MethodRef {
  name: string;
  version?: string;
}

interface GateProjection {
  gateEventId: string;
  gateId?: string;
  outcome?: string;
  reportRef?: string;
  resumedAt?: string;
  resumeOrigin?: ResumeOrigin;
}

interface Violation {
  code: string;
  message: string;
  seq?: number;
  line?: number;
}

type Notice = Violation;

/**
 * fiche 0031 (ADR-028) — read-model d'un run affiché en mode moniteur, recopié
 * du contrat serveur `RunSnapshot`. Aucun champ "phase" (verrou DP2). `method`
 * et `seat` (fiche 0061) sont optionnels : un journal qui ne les déclare pas
 * les laisse `undefined`, affichés comme absents, jamais inventés.
 */
interface RunSnapshot {
  runId: string;
  state: RunState;
  lastEventTs?: string;
  lastEventSeq?: number;
  lastAbsorbedAt?: string;
  gates: GateProjection[];
  violations: Violation[];
  notices: Notice[];
  tokens: { provenance: 'measured' | 'absent' };
  method?: MethodRef;
  seat?: string;
  /**
   * ADR-035 — provenance d'abandon depuis `run.finished` (`seat` | `method`).
   * Affiché sur la carte finished (AC1 E2E).
   */
  abandonedBy?: 'seat' | 'method';
  projectRoot: string;
  runDir: string;
  liveness: 'alive' | 'presumed_dead';
  emissionClass: 'B';
  /** ADR-035 D3 — capacité d'abandon configurée côté siège. */
  abandonCapable?: boolean;
}

interface SseFrame {
  eventType: string;
  payload: unknown;
}

const RESUME_ORIGIN_LABEL: Record<ResumeOrigin, string> = {
  command: 'reprise autorisée par commande',
  self_reported: 'reprise déclarée en session',
};

/** Libellé français + tonalité (→ classe CSS de couleur) pour chaque état. */
interface StateLook {
  label: string;
  tone: 'wait' | 'run' | 'idle' | 'done' | 'stop';
}
const STATE_LOOK: Record<RunState, StateLook> = {
  at_gate: { label: 'En attente de ta décision', tone: 'wait' },
  running: { label: 'En cours', tone: 'run' },
  launched: { label: 'Démarré', tone: 'idle' },
  finished: { label: 'Terminé', tone: 'done' },
  finished_at_gate: { label: 'Terminé (jalon resté ouvert)', tone: 'done' },
  aborted: { label: 'Interrompu', tone: 'stop' },
};

/** Ordre d'affichage : ce qui réclame une décision humaine remonte en tête. */
const STATE_RANK: Record<RunState, number> = {
  at_gate: 0,
  running: 1,
  launched: 2,
  finished_at_gate: 3,
  finished: 4,
  aborted: 5,
};

/** POC : plafond d'affichage pour les listes (gates/violations) du journal. */
const MAX_LIST_ITEMS = 100;

/** fiche 0022/0031 — "il y a Xs" (même patron que le heartbeat existant). */
function formatAge(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

/** Nom court du projet supervisé (dernier segment du chemin). */
function projectName(root: string): string {
  const parts = root.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? root;
}

/**
 * Nom de fichier du rapport de gate (revue Codex PR #50) — on montre OÙ vit le
 * rapport sans le bruit du chemin complet : le basename est lisible, et le chemin
 * entier reste reconstructible (runDir + basename) et disponible au survol.
 */
function reportName(reportRef: string): string {
  const parts = reportRef.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? reportRef;
}

function isRunSnapshot(value: unknown): value is RunSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { runId?: unknown }).runId === 'string' &&
    typeof (value as { runDir?: unknown }).runDir === 'string'
  );
}

/**
 * finding 1 (revue FRONT 0031) : garde d'anti-régression contre la course
 * hydratation REST vs SSE. N'écrase un snapshot que si le candidat a un
 * `lastEventSeq` au moins aussi récent (absent = "le plus vieux possible").
 */
function isFresherOrEqual(candidate: RunSnapshot, existing: RunSnapshot | undefined): boolean {
  if (!existing) return true;
  const candidateSeq = candidate.lastEventSeq ?? Number.NEGATIVE_INFINITY;
  const existingSeq = existing.lastEventSeq ?? Number.NEGATIVE_INFINITY;
  return candidateSeq >= existingSeq;
}

/** finding 2 (revue FRONT 0031) : keye par `runDir` (chemin serveur unique). */
function upsertSnapshot(
  runs: Map<string, RunSnapshot>,
  snapshot: RunSnapshot,
): Map<string, RunSnapshot> {
  const existing = runs.get(snapshot.runDir);
  if (!isFresherOrEqual(snapshot, existing)) return runs;
  const next = new Map(runs);
  next.set(snapshot.runDir, snapshot);
  return next;
}

/** Rang de tri : les runs présumés morts ou en attente passent devant. */
function sortRank(run: RunSnapshot): number {
  if (run.liveness === 'presumed_dead') return -1;
  return STATE_RANK[run.state];
}

interface SupervisionViewProps {
  /** fiche 0062 — filtre optionnel sur un projectRoot. */
  filterProjectRoot?: string | null;
  onClearFilter?: () => void;
}

/**
 * Mode moniteur (fiche 0031, ADR-028) : panneau STRICTEMENT read-only affichant
 * les runs surveillés depuis `.supervision/runs/`. Hydrate via
 * `GET /api/supervision/runs` puis applique les deltas `supervision.run.updated`
 * du SSE `/events`. Aucune requête d'écriture n'est jamais émise (verrou DP2).
 */
export function SupervisionView({
  filterProjectRoot = null,
  onClearFilter,
}: SupervisionViewProps) {
  const [runs, setRuns] = useState<Map<string, RunSnapshot>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/supervision/runs')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        setRuns((prev) => {
          let next = prev;
          for (const snapshot of data) {
            if (isRunSnapshot(snapshot)) next = upsertSnapshot(next, snapshot);
          }
          return next;
        });
      })
      .catch(() => {
        // POC : silencieux — un run non hydraté reste absent, jamais affiché faux.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource('/events');
    source.onmessage = (event: MessageEvent) => {
      let frame: SseFrame;
      try {
        frame = JSON.parse(event.data as string) as SseFrame;
      } catch {
        return;
      }
      if (frame.eventType !== 'supervision.run.updated') return;
      if (!isRunSnapshot(frame.payload)) return;
      const snapshot = frame.payload;
      setRuns((prev) => upsertSnapshot(prev, snapshot));
    };
    return () => {
      source.close();
    };
  }, []);

  const all = Array.from(runs.values()).sort((a, b) => {
    const byRank = sortRank(a) - sortRank(b);
    if (byRank !== 0) return byRank;
    return (b.lastAbsorbedAt ?? '').localeCompare(a.lastAbsorbedAt ?? '');
  });

  const list = filterProjectRoot
    ? all.filter((r) => r.projectRoot === filterProjectRoot)
    : all;

  const waiting = list.filter((r) => r.state === 'at_gate').length;
  const filterLabel = filterProjectRoot ? projectName(filterProjectRoot) : null;

  return (
    <div className="mon">
      <div className="mon__head">
        <div>
          <h2 className="mon__title">
            {filterLabel ? `Runs · ${filterLabel}` : 'Runs supervisés'}
          </h2>
          <p className="mon__sub">
            Lecture seule · classe B — jalons méthode (start / heartbeat / gates / fin), pas
            chaque action Claude Code. « Silence prolongé » = aucun événement depuis trop
            longtemps pendant un run encore ouvert.
          </p>
          {filterLabel && (
            <p className="mon__filter">
              Filtre projet : <code>{filterProjectRoot}</code>{' '}
              {onClearFilter && (
                <button type="button" className="mon__filter-clear" onClick={onClearFilter}>
                  Voir tous les runs
                </button>
              )}
            </p>
          )}
        </div>
        {list.length > 0 && (
          <div className="mon__count">
            <span className="mon__count-n">{list.length}</span>
            <span className="mon__count-l">
              {list.length > 1 ? 'runs' : 'run'}
              {waiting > 0 ? ` · ${waiting} en attente` : ''}
            </span>
          </div>
        )}
      </div>

      {list.length === 0 && (
        <div className="mon__empty">
          <div className="mon__empty-dot" aria-hidden="true" />
          <p className="mon__empty-title">
            {filterLabel ? 'Aucun run pour ce projet' : 'Aucun run surveillé'}
          </p>
          <p className="mon__empty-hint">
            {filterLabel
              ? 'Ce projet est déclaré mais n’a pas encore d’activité observée.'
              : 'Lance une méthode instrumentée dans un projet surveillé : sa première carte apparaîtra ici, en direct.'}
          </p>
        </div>
      )}

      {list.map((run) => (
        <RunCard key={run.runDir} run={run} />
      ))}
    </div>
  );
}

/**
 * ADR-035 D4+D6 — déclenche le POST abandon et gère les états locaux.
 * Pas de mise à jour optimiste : l'état "abandon demandé" est affiché
 * jusqu'à ce que le SSE supervision.run.updated referme la boucle.
 */
type AbandonState = 'idle' | 'pending' | 'requested' | 'error';

async function postAbandon(runDir: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/supervision/runs/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runDir }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      return { ok: false, message: data.error ?? `Erreur ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

/**
 * finding 3 (revue FRONT 0031) : mémoïsée pour que le tick "il y a Xs" (isolé
 * dans `RunAge`) ne re-rende pas la carte entière chaque seconde.
 */
const RunCard = memo(function RunCard({ run }: { run: RunSnapshot }) {
  const [abandonState, setAbandonState] = useState<AbandonState>('idle');
  const [abandonError, setAbandonError] = useState<string | null>(null);

  const look = STATE_LOOK[run.state];
  const dead = run.liveness === 'presumed_dead';
  const tone = dead ? 'stop' : look.tone;
  const openGate = run.state === 'at_gate' ? run.gates.find((g) => !g.resumedAt) : undefined;
  const pastGates = openGate ? run.gates.filter((g) => g !== openGate) : run.gates;

  const canAbandon = dead && run.state === 'running' && run.abandonCapable === true;
  const dormantAbandon = dead && run.state === 'running' && run.abandonCapable !== true;

  async function handleAbandon() {
    if (!canAbandon || abandonState === 'pending' || abandonState === 'requested') return;
    setAbandonState('pending');
    setAbandonError(null);
    const result = await postAbandon(run.runDir);
    if (result.ok) {
      setAbandonState('requested');
    } else {
      setAbandonState('error');
      setAbandonError(result.message ?? 'Abandon refusé');
    }
  }

  return (
    <div className={`run-card run-card--${tone}`}>
      <div className="run-card__head">
        <div className="run-card__id">
          <span className="run-card__method">
            {run.method ? run.method.name : 'méthode non déclarée'}
          </span>
          {run.method?.version && <span className="run-card__ver">v{run.method.version}</span>}
        </div>
        <span className={`badge badge--${tone}`}>{dead ? 'Silence prolongé' : look.label}</span>
      </div>

      <div className="run-card__meta">
        <span>
          <i className="run-card__k">projet</i> {projectName(run.projectRoot)}
        </span>
        {run.seat && (
          <span>
            <i className="run-card__k">siège</i> {run.seat}
          </span>
        )}
        {(run.state === 'finished' || run.state === 'finished_at_gate') && run.abandonedBy && (
          <span data-testid="abandoned-by">
            <i className="run-card__k">abandon</i>{' '}
            {run.abandonedBy === 'seat' ? 'par le siège' : 'par la méthode'}
          </span>
        )}
        <RunAge lastAbsorbedAt={run.lastAbsorbedAt} lastEventTs={run.lastEventTs} />
        <span>
          <i className="run-card__k">tokens</i>{' '}
          {run.tokens.provenance === 'measured' ? 'mesurés' : 'non mesurés'}
        </span>
        <span className="run-card__runid" title={run.runId}>
          <i className="run-card__k">run</i> <code>{run.runId}</code>
        </span>
      </div>

      {dead && (
        <p className="run-card__alert" role="alert">
          Aucun signe de vie depuis un moment alors que le run était en cours.
        </p>
      )}

      {canAbandon && (
        <div className="run-card__abandon">
          {abandonState === 'requested' ? (
            <p className="run-card__abandon-pending" role="status">
              ⏳ Abandon demandé — en attente de la confirmation disque…
            </p>
          ) : (
            <>
              <button
                type="button"
                className="run-card__abandon-btn"
                disabled={abandonState === 'pending'}
                onClick={() => void handleAbandon()}
              >
                {abandonState === 'pending' ? 'En cours…' : 'Abandonner ce run'}
              </button>
              {abandonState === 'error' && abandonError && (
                <p className="run-card__abandon-err" role="alert">
                  {abandonError}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {dormantAbandon && (
        <div className="run-card__abandon">
          <button type="button" className="run-card__abandon-btn" disabled>
            Abandonner ce run
          </button>
          <p className="run-card__abandon-hint" role="note">
            Capacité d&apos;abandon dormante — configurez{' '}
            <code>supervision.abandon_command</code> dans la config du siège (ex.{' '}
            <code>["pnpm", "--dir", "products/mega-city", "supervision:abandon"]</code>).
          </p>
        </div>
      )}

      {openGate && (
        <div className="run-card__wait">
          <span className="run-card__wait-tag">⏸ En attente</span>
          <span className="run-card__wait-gate">{openGate.gateId ?? 'jalon'}</span>
          <span className="run-card__wait-msg">
            La méthode s'est arrêtée à ce jalon et attend ta décision.
          </span>
          {openGate.reportRef && (
            <span className="run-card__report" title={openGate.reportRef}>
              rapport : <code>{reportName(openGate.reportRef)}</code>
            </span>
          )}
        </div>
      )}

      {pastGates.length > 0 && (
        <div className="run-card__gates">
          <span className="run-card__k">jalons passés</span>
          <CappedList
            items={pastGates}
            renderItem={(gate) => (
              <li key={gate.gateEventId}>
                <span className="run-card__gate-name">{gate.gateId ?? 'jalon'}</span>
                {gate.outcome && <span className="run-card__gate-out"> · {gate.outcome}</span>}
                {gate.resumeOrigin && (
                  <span className="run-card__gate-sub">
                    {' '}
                    · {RESUME_ORIGIN_LABEL[gate.resumeOrigin]}
                  </span>
                )}
                {gate.reportRef && (
                  <span className="run-card__gate-sub" title={gate.reportRef}>
                    {' '}
                    · rapport <code>{reportName(gate.reportRef)}</code>
                  </span>
                )}
              </li>
            )}
          />
        </div>
      )}

      {run.violations.length > 0 && (
        <div className="run-card__problems" role="alert">
          <span className="run-card__k run-card__k--danger">anomalies</span>
          <CappedList
            items={run.violations}
            renderItem={(v, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: violations have no stable id
              <li key={`${v.code}-${i}`}>{v.message}</li>
            )}
          />
        </div>
      )}
    </div>
  );
});

/**
 * finding 4 (revue FRONT 0031) : âge depuis `lastAbsorbedAt` (horloge serveur
 * fiable) sinon `lastEventTs`. Isolé pour ne pas re-rendre `RunCard` (finding 3).
 */
function RunAge({
  lastAbsorbedAt,
  lastEventTs,
}: {
  lastAbsorbedAt?: string;
  lastEventTs?: string;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  const referenceTs = lastAbsorbedAt ?? lastEventTs;
  const ageMs = referenceTs ? Date.now() - new Date(referenceTs).getTime() : null;
  if (ageMs === null) return null;
  return (
    <span>
      <i className="run-card__k">vu</i> il y a {formatAge(ageMs)}
    </span>
  );
}

/** finding 3 (revue FRONT 0031) : plafonne l'affichage à `MAX_LIST_ITEMS`. */
function CappedList<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const overflow = items.length - MAX_LIST_ITEMS;
  const shown = overflow > 0 ? items.slice(-MAX_LIST_ITEMS) : items;
  const shownStartIndex = overflow > 0 ? overflow : 0;
  return (
    <ul>
      {shown.map((item, i) => renderItem(item, shownStartIndex + i))}
      {overflow > 0 && <li>… et {overflow} de plus</li>}
    </ul>
  );
}
