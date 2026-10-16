/**
 * Board unifié cop1 — vue d'ensemble (tranche 20261012231419185).
 *
 * Trois blocs, pour un projet : les métriques « depuis le début », l'entonnoir du
 * pipeline actif, et le tableau « Versions dans le process » (une ligne par
 * version ; la version en run est surlignée et porte « Voir le run », une version
 * cadrée non livrée porte « ▸ Lancer »).
 */
import type { BoardProject, Version } from './types.js';
import { allVersions, cadre, groomed, isPastVer, runByVer, svCmp } from './helpers.js';
import { isLaunchable } from './pipeline.js';

interface OverviewViewProps {
  project: BoardProject;
  /** Lancer la réalisation d'une version cadrée. */
  onLaunch: (ver: string) => void;
  /** Voir le run vivant d'une version. */
  onViewRun: (runId: string) => void;
}

function pct(frac: number, total: number): string {
  return `${((frac / (total || 1)) * 100).toFixed(0)}%`;
}

/** Une barre de progression « frac / total » avec sa classe de remplissage. */
function MiniBar({ fill, frac, total }: { fill: string; frac: number; total: number }): JSX.Element {
  return (
    <span className="ptc">
      <span className="minibar">
        <i className={fill} style={{ width: pct(frac, total) }} />
      </span>{' '}
      {frac}/{total}
    </span>
  );
}

function VersionsInProcess({ project, onLaunch, onViewRun }: OverviewViewProps): JSX.Element {
  const all = allVersions(project).slice().sort((a, b) => svCmp(b.ver, a.ver));
  const liveByVer = runByVer(project);

  function action(v: Version): JSX.Element | null {
    const lr = liveByVer[v.ver];
    if (lr) {
      return (
        <button type="button" className="btn sm" onClick={() => onViewRun(lr.id)}>
          Voir le run
        </button>
      );
    }
    // Même règle de « lançable » que le pipeline de dev (pas de définition recopiée) :
    // cadré, pas commencé, sans run vivant. Le run vivant est déjà écarté ci-dessus.
    if (isLaunchable(project, v)) {
      return (
        <button type="button" className="btn sm" onClick={() => onLaunch(v.ver)}>
          ▸ Lancer
        </button>
      );
    }
    return null;
  }

  return (
    <section className="card">
      <h3>
        Versions dans le process{' '}
        <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
          où en est chaque version · ligne verte = en run · clique pour le détail
        </span>
      </h3>
      <div className="ptrow hd">
        <span>Version</span>
        <span>Cadrage</span>
        <span>Développement</span>
        <span>Versionné</span>
        <span />
      </div>
      {all.map((v) => {
        const lr = liveByVer[v.ver];
        return (
          <div key={v.ver} className={`ptrow${lr ? ' run' : ''}`}>
            <span className="ptn">
              <span className="pill ver">{v.ver}</span>
              <span className="nm">{v.name}</span>
              {lr && <span className="runbadge">● en run</span>}
            </span>
            <MiniBar fill="fill-groom" frac={groomed(v)} total={v.total} />
            {cadre(v) || v.done > 0 ? (
              // Dès qu'il y a du dev (livré) OU que le lot est cadré, on montre la
              // progression : une version en run n'affiche jamais « pas cadré » en
              // cachant son avancement réel (une seule vérité par ligne).
              <MiniBar fill="fill-dev" frac={v.done} total={v.total} />
            ) : (
              <span className="ptc">
                <span className="faint">— pas cadré</span>
              </span>
            )}
            <span className="ptc">
              {isPastVer(project, v.ver) ? (
                <span style={{ color: 'var(--go)' }}>✓ taguée</span>
              ) : (
                <span className="faint">—</span>
              )}
            </span>
            <span className="ptact">{action(v)}</span>
          </div>
        );
      })}
    </section>
  );
}

export function OverviewView(props: OverviewViewProps): JSX.Element {
  const { project } = props;
  const f = project.funnel;
  const m = project.metrics;
  const tot = f.idea + f.ready + f.wip || 1;
  const ratio = f.idea ? f.ready / f.idea : 0;
  // Toutes les versions connues (à venir + en cours + taguées) : le libellé « versions »
  // ne doit pas exclure les versions planifiées, sinon le chiffre ment.
  const versionCount = allVersions(project).length;

  const cells: Array<[string | number, string]> = [
    [m.done, 'fiches livrées'],
    [m.tokens, 'tokens consommés'],
    [m.temps, 'temps cumulé'],
    [m.perFiche, 'tokens / fiche (moy.)'],
    [m.sprints, 'sprints'],
    [m.runs, 'lancements'],
    [m.retros, 'rétrospectives'],
    [versionCount, 'versions'],
  ];

  return (
    <>
      <div className="vh">
        <h2>Vue d'ensemble — {project.name}</h2>
        <span className="sub">{project.desc}</span>
      </div>

      <section className="card clip">
        <h3>Depuis le début</h3>
        <div className="mgrid">
          {cells.map(([value, label]) => (
            <div className="mcell" key={label}>
              <div className="mv">{value}</div>
              <div className="mk">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="funnel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <b>Entonnoir — le pipeline actif</b>
          <span className="sub">
            ratio prêtes / idées :{' '}
            <b style={{ color: 'var(--fg)', fontFamily: 'var(--font-data)' }}>{ratio.toFixed(2)}</b>
          </span>
        </div>
        <div className="funbar">
          <i className="fun-idea" style={{ width: pct(f.idea, tot) }}>
            {f.idea}
          </i>
          <i className="fun-ready" style={{ width: pct(f.ready, tot) }}>
            {f.ready}
          </i>
          <i className="fun-wip" style={{ width: pct(f.wip, tot) }}>
            {f.wip || ''}
          </i>
        </div>
        <div className="funlegend">
          <span>
            <span className="sw" style={{ background: 'var(--idea)' }} />
            idées <b>{f.idea}</b>
          </span>
          <span>
            <span className="sw" style={{ background: 'var(--groom)' }} />
            prêtes <b>{f.ready}</b>
          </span>
          <span>
            <span className="sw" style={{ background: 'var(--warn)' }} />
            en cours <b>{f.wip}</b>
          </span>
        </div>
        <div className="funextra">
          <span>
            sans version : <b>{f.unversioned}</b>
          </span>
          <span>
            parkées : <b>{f.parked}</b>
          </span>
        </div>
      </section>

      <VersionsInProcess {...props} />
    </>
  );
}
