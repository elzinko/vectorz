/**
 * Board unifié cop1 — vue Cadrage (fiche 20261012231419198).
 *
 * Trois colonnes rangent les versions par étape de grooming (à cadrer / en cours
 * / cadré). Chaque version montre sa jauge de cadrage ; la jauge de dev n'apparaît
 * que pour un lot déjà en cours de développement. En dessous : les runs de cadrage.
 */
import { ActivityTable } from './ActivityTable.js';
import { groomed } from './helpers.js';
import { cadrageColumns } from './pipeline.js';
import type { BoardProject, Version } from './types.js';

function pct(frac: number, total: number): string {
  return `${((frac / (total || 1)) * 100).toFixed(0)}%`;
}

function VersionGauges({ v }: { v: Version }): JSX.Element {
  const inDev = v.done > 0 && v.done < v.total;
  return (
    <div className="lmg">
      <div className="gmini">
        <span className="minibar2">
          <i className="fill-groom" style={{ width: pct(groomed(v), v.total) }} />
        </span>
        <span className="gv">
          {groomed(v)}/{v.total}
        </span>
      </div>
      {inDev && (
        <div className="gmini">
          <span className="gl">dev</span>
          <span className="minibar2">
            <i className="fill-dev" style={{ width: pct(v.done, v.total) }} />
          </span>
          <span className="gv">
            {v.done}/{v.total}
          </span>
        </div>
      )}
    </div>
  );
}

function Column({ title, versions }: { title: string; versions: Version[] }): JSX.Element {
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
            <VersionGauges v={v} />
          </div>
        ))
      )}
    </div>
  );
}

interface CadrageViewProps {
  project: BoardProject;
  onOpenRun: (runId: string) => void;
}

export function CadrageView({ project, onOpenRun }: CadrageViewProps): JSX.Element {
  const cols = cadrageColumns(project);
  return (
    <>
      <div className="vh">
        <h2>Cadrage — {project.name}</h2>
        <span className="sub">préparer les lots · deux jauges distinctes : cadrage, puis dev</span>
      </div>
      <section className="lotcols">
        <Column title="À venir — à cadrer" versions={cols.acadrer} />
        <Column title="En cours" versions={cols.encadr} />
        <Column title="Cadré" versions={cols.cadres} />
      </section>
      <ActivityTable project={project} lens="cadrage" onOpenRun={onOpenRun} />
    </>
  );
}
