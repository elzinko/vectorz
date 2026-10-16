/**
 * Board unifié cop1 — vue Développement (fiche 20261012231419198).
 *
 * Trois colonnes rangent les versions par étape de dev (à développer / en cours /
 * développé). Un lot cadré, figé et sans run en cours porte un bouton « Lancer »
 * qui ouvre le configurateur (grooming / taille de sprint / rétro). Le lancement
 * est simulé (le déclenchement réel n'est pas du ressort de cette tranche).
 * En dessous : les runs de développement.
 */
import { useState } from 'react';
import { ActivityTable } from './ActivityTable.js';
import { devColumns, isLaunchable } from './pipeline.js';
import type { BoardProject, Version } from './types.js';

function pct(frac: number, total: number): string {
  return `${((frac / (total || 1)) * 100).toFixed(0)}%`;
}

function DevGauge({ v }: { v: Version }): JSX.Element {
  return (
    <div className="gmini">
      <span className="gl">dev</span>
      <span className="minibar2">
        <i className="fill-dev" style={{ width: pct(v.done, v.total) }} />
      </span>
      <span className="gv">
        {v.done}/{v.total}
      </span>
    </div>
  );
}

function DevColumn({
  title,
  versions,
  project,
  onLaunch,
}: {
  title: string;
  versions: Version[];
  project: BoardProject;
  onLaunch: (ver: string) => void;
}): JSX.Element {
  return (
    <div className="lotcol">
      <h4>
        {title} <span className="cnt">{versions.length}</span>
      </h4>
      {versions.length === 0 ? (
        <div className="lotmini">
          <span className="muted">—</span>
        </div>
      ) : (
        versions.map((v) => (
          <div className="lotmini" key={v.ver}>
            <div className="lmn">
              <span className="pill ver">{v.ver}</span>
              <span className="lmt">{v.name}</span>
            </div>
            <div className="lmg">
              {isLaunchable(project, v) ? (
                <button type="button" className="btn sm" onClick={() => onLaunch(v.ver)}>
                  ▸ Lancer
                </button>
              ) : (
                <DevGauge v={v} />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const GROOM_OPTS = ['auto', 'exiger mon grooming', 'mixte'];
const SPRINT_OPTS = ['auto', '2', '3', '5'];
const RETRO_OPTS = ['aucune', 'après chaque sprint', 'à la fin'];

function Knob({
  title,
  opts,
  value,
  onChange,
}: {
  title: string;
  opts: string[];
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <div className="knob">
      <div className="kt">{title}</div>
      <div className="opts" role="group" aria-label={title}>
        {opts.map((o) => (
          <button
            key={o}
            type="button"
            className={`opt${value === o ? ' on' : ''}`}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function LaunchConfigurator({ lot, onCancel }: { lot: string; onCancel: () => void }): JSX.Element {
  const [groom, setGroom] = useState('auto');
  const [sprint, setSprint] = useState('auto');
  const [retro, setRetro] = useState('à la fin');
  const [launched, setLaunched] = useState(false);

  return (
    <section className="launch">
      <div className="vh" style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 16 }}>Lancer la réalisation — {lot}</h2>
      </div>
      <Knob title="Grooming (pendant le dev)" opts={GROOM_OPTS} value={groom} onChange={setGroom} />
      <Knob title="Taille de sprint" opts={SPRINT_OPTS} value={sprint} onChange={setSprint} />
      <Knob title="Rétrospective" opts={RETRO_OPTS} value={retro} onChange={setRetro} />
      <div className="summary">
        <div>
          Tu vas lancer : <b>{lot}</b> · {groom} · {sprint} · {retro}
        </div>
        <div className="act">
          <button type="button" className="btn" onClick={() => setLaunched(true)}>
            ▸ Lancer le run
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
        {launched && (
          <div className="done-msg">
            ✓ Lancement simulé de <b>{lot}</b>, sprint par sprint. (maquette)
          </div>
        )}
      </div>
    </section>
  );
}

interface DevViewProps {
  project: BoardProject;
  onOpenRun: (runId: string) => void;
  /** Lot présélectionné à l'ouverture (ex. « Lancer » depuis la vue d'ensemble). */
  initialLot?: string | null;
}

export function DevView({ project, onOpenRun, initialLot }: DevViewProps): JSX.Element {
  const [lot, setLot] = useState<string | null>(initialLot ?? null);
  const cols = devColumns(project);
  // Le lot reste valide tant qu'il est encore lançable dans ce projet.
  const validLot =
    lot && cols.avenir.some((v) => v.ver === lot && isLaunchable(project, v)) ? lot : null;

  return (
    <>
      <div className="vh">
        <h2>Développement — {project.name}</h2>
        <span className="sub">l'état de dev des lots · lancer un lot figé · suivre les sprints</span>
      </div>
      <section className="lotcols">
        <DevColumn title="À venir — à développer" versions={cols.avenir} project={project} onLaunch={setLot} />
        <DevColumn title="En cours" versions={cols.encours} project={project} onLaunch={setLot} />
        <DevColumn title="Développé" versions={cols.faits} project={project} onLaunch={setLot} />
      </section>
      {validLot && <LaunchConfigurator key={validLot} lot={validLot} onCancel={() => setLot(null)} />}
      <ActivityTable project={project} lens="dev" onOpenRun={onOpenRun} />
    </>
  );
}
