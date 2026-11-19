/**
 * Board unifié cop1 — config projet (fiche 20261012231419250).
 *
 * L'onglet « Configuration » d'un projet, en lecture : les défauts de lancement,
 * la qualité, l'intégration. Plus le MODÈLE PAR RÔLE : un tier abstrait par rôle,
 * et le modèle RÉSOLU en bout de ligne (il suit l'IDE actif). Un lien renvoie à la
 * config de l'outil. On n'édite PAS le mapping ici (il vit côté outil).
 *
 * Pour un projet surveillé, la config vient de la méthode (`ezk config show --json`,
 * ADR-086). Tant qu'elle n'est pas arrivée, la page dit pourquoi : elle ne conclut
 * jamais que le fichier manque.
 */
import {
  ROLE_ORDER,
  TIERS,
  resolveRole,
  type AgentModel,
  type ProjectConfig,
  type Role,
  type Tier,
  type ToolConfig,
} from './configModel.js';
import type { BoardProject, PlanState } from './types.js';

interface ConfigViewProps {
  project: BoardProject;
  tool: ToolConfig;
  /** Tier effectif par rôle (remonté dans la coque pour survivre à la navigation). */
  roles: Partial<Record<Role, Tier>>;
  onSetRole: (role: Role, tier: Tier) => void;
  onGotoTool: () => void;
}

function TierSeg({ value, onChange }: { value: Tier; onChange: (t: Tier) => void }): JSX.Element {
  return (
    <span className="seg" role="group" aria-label="Tier du rôle">
      {TIERS.map((t) => (
        <button key={t} type="button" className={value === t ? 'on' : undefined} aria-pressed={value === t} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </span>
  );
}

/** D'où vient la valeur d'un agent, en mots (contrat `ezk config show --json`). */
const SOURCE_LABEL: Record<string, string> = {
  defaut: 'défaut de la méthode',
  'tier-projet': 'tier du projet',
  agent: 'réglé pour cet agent',
};

/** Les modèles que la méthode lance, agent par agent. En lecture : un tier se change par `ezk`. */
function MethodModels({ agents }: { agents: AgentModel[] }): JSX.Element {
  return (
    <section className="card">
      <h3>
        Modèle par agent{' '}
        <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
          résolu par la méthode
        </span>
      </h3>
      {agents.map((a) =>
        'error' in a ? (
          <div className="cfgrow" key={a.agent}>
            <span className="cfgk mono">{a.agent}</span>
            <span className="faint">config invalide : {a.error}</span>
          </div>
        ) : (
          <div className="cfgrow" key={a.agent}>
            <span className="cfgk mono">{a.agent}</span>
            <span className="rtier">{a.tier}</span>
            <span className="rarr">→</span>
            <span className="rmodel">{a.model}</span>
            <span className="reff">{a.effort}</span>
            <span className="faint">{SOURCE_LABEL[a.source] ?? a.source}</span>
          </div>
        ),
      )}
      <div className="faint" style={{ fontSize: 12, padding: '8px 16px 4px' }}>
        Ce sont les modèles que la méthode lance. Pour changer le tier d'un agent :{' '}
        <code>ezk config roles set &lt;agent&gt; &lt;tier&gt;</code>
      </div>
    </section>
  );
}

/**
 * Le message quand la config n'est pas là : chargement, indisponible (avec la raison). Sans aucun
 * état, le serveur ne connaît pas encore la config : il tourne sur un code plus ancien que la page.
 */
function configMessage(state: PlanState | undefined): string {
  if (state?.state === 'loading') return 'config en cours de chargement';
  if (state?.state === 'unavailable') return `config indisponible : ${state.reason}`;
  return 'le serveur de mission control n’envoie pas la config : il tourne sur un code plus ancien que la page. Relance-le (pnpm cop1:dev).';
}

/** D'où vient la config : le fichier lu, les défauts de la méthode, ou une config d'exemple. */
function fileLabel(file: ProjectConfig['file']): string {
  if (file === null) return 'pas de .vectorz/config.yml · réglages par défaut de la méthode';
  return `${file ?? '.vectorz/config.yml'} · voyage avec le repo`;
}

export function ConfigView({ project, tool, roles, onSetRole, onGotoTool }: ConfigViewProps): JSX.Element {
  const c = project.config;

  if (!c) {
    return (
      <>
        <div className="vh">
          <h2>Configuration — {project.name}</h2>
          <span className="sub">aucune config</span>
        </div>
        <section className="card">
          <div className="row">
            <span className="ttl">{configMessage(project.configState)}</span>
          </div>
        </section>
      </>
    );
  }

  const hasLaunch = c.groomPolicy !== undefined || c.sprintSize !== undefined || c.retro !== undefined;

  return (
    <>
      <div className="vh">
        <h2>Configuration — {project.name}</h2>
        <span className="sub">{fileLabel(c.file)}</span>
      </div>

      <div className="cfg">
        {hasLaunch && (
          <section className="card">
            <h3>Lancement par défaut</h3>
            <dl className="kv">
              <dt>Grooming</dt>
              <dd>{c.groomPolicy ?? '—'}</dd>
              <dt>Taille de sprint</dt>
              <dd>{c.sprintSize ?? '—'}</dd>
              <dt>Rétro</dt>
              <dd>{c.retro ?? '—'}</dd>
            </dl>
          </section>
        )}
        <section className="card">
          <h3>Qualité</h3>
          <dl className="kv">
            <dt>Release-gate</dt>
            <dd>
              <span className={`togglepill ${c.releaseGate ? 'on-y' : 'on-n'}`}>{c.releaseGate ? 'on' : 'off'}</span>
            </dd>
            <dt>DoD</dt>
            <dd>bundle « dod »</dd>
          </dl>
        </section>
        <section className="card">
          <h3>Modules</h3>
          <dl className="kv">
            <dt>GitHub</dt>
            <dd>{c.github}</dd>
            {c.integration !== undefined && (
              <>
                <dt>Sans PR</dt>
                <dd>{c.integration}</dd>
              </>
            )}
            <dt>Racine</dt>
            <dd>{c.root}</dd>
          </dl>
        </section>
      </div>

      {c.agents ? (
        <MethodModels agents={c.agents} />
      ) : (
      <section className="card">
        <h3>
          Modèle par rôle{' '}
          <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
            tier → modèle résolu par {tool.ide} ·{' '}
            <button type="button" className="doclink linkbtn" onClick={onGotoTool}>
              régler l'outil →
            </button>
          </span>
        </h3>
        {ROLE_ORDER.map((role) => {
          const resolved = resolveRole(roles, role, tool);
          return (
            <div className="cfgrow" key={role}>
              <span className="cfgk mono">{role}</span>
              <TierSeg value={resolved.tier} onChange={(t) => onSetRole(role, t)} />
              <span className="rarr">→</span>
              <span className="rmodel">{resolved.model}</span>
              <span className="reff">{resolved.effort}</span>
            </div>
          );
        })}
        <div className="faint" style={{ fontSize: 12, padding: '8px 16px 4px' }}>
          Défaut (<b>{tool.defaultTier}</b>), effort et mapping tier→modèle se règlent dans la{' '}
          <button type="button" className="doclink linkbtn" onClick={onGotoTool}>
            config de l'outil
          </button>
          .
        </div>
      </section>
      )}
    </>
  );
}
