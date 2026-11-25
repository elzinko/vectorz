/**
 * Board unifié cop1 — vue d'ensemble (tranche 20261012231419185).
 *
 * Trois blocs, pour un projet : les métriques « depuis le début », l'entonnoir du
 * pipeline actif, et le tableau « Versions dans le process » (une ligne par
 * version ; la version en run est surlignée et porte « Voir le run », une version
 * cadrée non livrée porte « ▸ Lancer », qui montre la commande à lancer).
 */
import type { BoardProject, SprintSummary, Version } from './types.js';
import { allVersions, cadre, groomed, isPastVer, runByVer, svCmp } from './helpers.js';
import { isLaunchable } from './pipeline.js';
import { CommandHint } from './PlanBits.js';

interface OverviewViewProps {
  project: BoardProject;
  /** Voir le run vivant d'une version. */
  onViewRun: (runId: string) => void;
}

/** La commande qui lance la réalisation des fiches prêtes. */
export const LAUNCH_COMMAND = '/ezk-product-build run';

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

function VersionsInProcess({ project, onViewRun }: OverviewViewProps): JSX.Element {
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
    // Le web ne lance rien : il montre la commande, comme les autres gestes.
    if (isLaunchable(project, v)) return <CommandHint label="▸ Lancer" command={LAUNCH_COMMAND} />;
    return null;
  }

  return (
    <section className="card">
      <h3>
        Versions dans le process{' '}
        <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
          où en est chaque version · ligne verte = en run
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
              {v.toClose ? (
                <span style={{ color: 'var(--warn)' }}>à clore</span>
              ) : isPastVer(project, v.ver) ? (
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

/** Une durée lisible ; `null` = non mesurée, dit en mots (fiche 20261104090517904). */
export function fmtDuree(ms: number | null): string {
  if (ms === null) return 'non mesurée';
  const min = Math.max(1, Math.round(ms / 60_000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

/** Des jetons lisibles ; `null` = non mesurés, dit en mots. */
export function fmtTokens(n: number | null): string {
  if (n === null) return 'non mesurés';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}

/** Le but du sprint, lu dans le slug de son compte rendu (le slug dérive du but saisi à l'ouverture). */
const butDuSprint = (s: SprintSummary): string => s.slug.replace(/-/g, ' ');

/** La carte « Dernier sprint » : le plus récent en grand, les précédents en une ligne chacun. */
function LastSprint({ sprints }: { sprints: SprintSummary[] | undefined }): JSX.Element {
  const [last, ...previous] = sprints ?? [];
  return (
    <section className="card clip" aria-label="Dernier sprint">
      <h3>Dernier sprint</h3>
      {last === undefined ? (
        <p className="mnote">aucun sprint publié par la méthode</p>
      ) : (
        <>
          <div className="ls-head">
            <span className="faint">But du sprint</span>
            <b className="ls-obj">{butDuSprint(last)}</b>
            <span className="sub">{last.jour}</span>
          </div>
          <div className="mgrid">
            {(
              [
                [fmtDuree(last.dureeMs), 'durée'],
                [String(last.livrees.length), 'fiches livrées'],
                [fmtTokens(last.tokens), 'jetons'],
                [last.blocages === null ? 'non dit' : String(last.blocages), 'blocages'],
              ] as const
            ).map(([value, label]) => (
              <div className="mcell" key={label}>
                <div className="mv">{value}</div>
                <div className="mk">{label}</div>
              </div>
            ))}
          </div>
          {last.livrees.length > 0 && (
            <ul className="ls-fiches" aria-label="Fiches livrées par le dernier sprint">
              {last.livrees.map((f) => (
                <li key={f.id}>{f.title}</li>
              ))}
            </ul>
          )}
          {previous.length > 0 && (
            <div className="ls-prev" aria-label="Sprints précédents">
              {previous.map((s) => (
                <div className="ls-row" key={s.fichier}>
                  <span className="faint">{s.jour}</span>
                  <span className="ls-name">{butDuSprint(s)}</span>
                  <span>{s.livrees.length} livrée(s)</span>
                  <span>{fmtDuree(s.dureeMs)}</span>
                  <span>{fmtTokens(s.tokens)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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

  // Sans plan (chargement, indisponible), le compte livré n'est pas connu : « — », jamais un faux 0.
  const planKnown = !project.plan || project.plan.state === 'ok';
  const cells: Array<[string | number, string]> = [
    [planKnown ? m.done : '—', 'fiches livrées'],
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
        {/* Pourquoi une tuile n'a pas de chiffre : dit en mots, jamais un tiret muet (fiche 20261102104443762). */}
        {m.notes?.map((note) => (
          <p className="mnote" key={note}>
            {note}
          </p>
        ))}
      </section>

      {planKnown && <LastSprint sprints={project.lastSprints} />}

      <section className="funnel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <b>Entonnoir — le pipeline actif</b>
          <span className="sub">
            ratio prêtes / idées :{' '}
            <b style={{ color: 'var(--fg)', fontFamily: 'var(--font-data)' }}>{ratio.toFixed(2)}</b>
          </span>
        </div>
        {/* Un segment vide n'écrit pas son zéro : il dépasserait, coupé, au bout de la barre
            (fiche 20261103191932077). La légende, elle, garde tous les comptes. */}
        <div className="funbar">
          <i className="fun-idea" style={{ width: pct(f.idea, tot) }}>
            {f.idea || ''}
          </i>
          <i className="fun-ready" style={{ width: pct(f.ready, tot) }}>
            {f.ready || ''}
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
