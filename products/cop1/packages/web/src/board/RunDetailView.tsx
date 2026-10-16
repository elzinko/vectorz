/**
 * Board unifié cop1 — détail d'un run (fiche 20261012231419211).
 *
 * On descend run → moments → fiches. Chaque moment montre ses fiches et leur
 * transition de statut ; cliquer une fiche réelle ouvre sa modale.
 */
import type { BoardProject, BoardRun, FicheTransition, Moment } from './types.js';
import { STEP_LABEL, momentLabel, verdictClass } from './activity.js';

interface RunDetailViewProps {
  project: BoardProject;
  run: BoardRun;
  onBack: () => void;
  onOpenFiche: (fid: string) => void;
}

function FicheRow({
  project,
  ft,
  onOpenFiche,
}: {
  project: BoardProject;
  ft: FicheTransition;
  onOpenFiche: (fid: string) => void;
}): JSX.Element {
  const detail = ft.fid ? project.fiches?.[ft.fid] : undefined;
  const title = detail?.title ?? ft.t ?? '—';
  const ver = detail?.ver ?? ft.ver ?? '';
  // Cliquable seulement si la fiche existe vraiment : pas de clic mort qui
  // promet une modale absente (fid non résolu dans project.fiches).
  const clickable = Boolean(detail);

  return (
    <div
      className="mfiche"
      {...(clickable
        ? {
            role: 'button',
            tabIndex: 0,
            onClick: () => onOpenFiche(ft.fid as string),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenFiche(ft.fid as string);
              }
            },
          }
        : {})}
    >
      <span className="mft">{title}</span>
      <span className="pill ver">{ver}</span>
      <span className="mtrans">
        {ft.from} → {ft.to}
      </span>
    </div>
  );
}

function MomentBlock({
  project,
  m,
  onOpenFiche,
}: {
  project: BoardProject;
  m: Moment;
  onOpenFiche: (fid: string) => void;
}): JSX.Element {
  const chip = m.step === 'sprint' ? `S${m.n ?? ''}` : STEP_LABEL[m.step] ?? m.step;
  return (
    <div className="moment">
      <div className="mh">
        <span className="schip">{chip}</span>
        <span className="ml">{momentLabel(m)}</span>
        {m.tok && <span className="mt">{m.tok}</span>}
      </div>
      {m.fiches.length === 0 ? (
        <div className="mfiche">
          <span className="muted">— étape de contrôle, pas de fiche</span>
        </div>
      ) : (
        m.fiches.map((ft, i) => (
          <FicheRow key={`${ft.fid ?? ft.t ?? 'fiche'}-${i}`} project={project} ft={ft} onOpenFiche={onOpenFiche} />
        ))
      )}
    </div>
  );
}

export function RunDetailView({ project, run, onBack, onOpenFiche }: RunDetailViewProps): JSX.Element {
  const moments = run.moments ?? [];
  const nSprint = moments.filter((m) => m.step === 'sprint').length;

  return (
    <>
      <button type="button" className="back" onClick={onBack}>
        ‹ retour
      </button>
      <div className="detail">
        <div className="dhead">
          <span className="kindtag">run · {run.kind ?? '—'}</span>
          {run.live && <span className="live" aria-hidden="true" />}
          <span className={`verdict ${verdictClass(run)}`}>{run.verdict ?? '—'}</span>
          <span className="pill ver">{run.ver}</span>
          <span className="faint">{run.date ?? ''}</span>
        </div>
        <h2 style={{ fontSize: 23 }}>{run.name}</h2>
        {run.sessions && run.sessions.length > 0 && (
          <div className="funextra" style={{ borderTop: 0, paddingTop: 0 }}>
            <span>
              sessions : <b>{run.sessions.join(' · ')}</b>
            </span>
          </div>
        )}
        <div className="enclair">
          <b>Ce run.</b> {run.note ?? ''}
        </div>

        <section className="metrics4">
          <div className="metric">
            <div className="mv">{moments.length}</div>
            <div className="mk">étapes</div>
          </div>
          <div className="metric">
            <div className="mv">{run.tok ?? '—'}</div>
            <div className="mk">tokens</div>
          </div>
          <div className="metric">
            <div className="mv">{run.dur ?? '—'}</div>
            <div className="mk">durée</div>
          </div>
          <div className="metric">
            <div className="mv">{nSprint || '—'}</div>
            <div className="mk">sprints</div>
          </div>
        </section>

        <section className="card">
          <h3>
            Étapes du run{' '}
            <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
              chaque étape traite des fiches · clique une fiche
            </span>
          </h3>
          {moments.length === 0 ? (
            <div className="moment">
              <span className="muted">aucune étape</span>
            </div>
          ) : (
            moments.map((m, i) => (
              <MomentBlock key={`${m.step}-${m.n ?? i}`} project={project} m={m} onOpenFiche={onOpenFiche} />
            ))
          )}
        </section>
      </div>
    </>
  );
}
