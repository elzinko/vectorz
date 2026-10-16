/**
 * Board unifié cop1 — config projet (fiche 20261012231419250).
 *
 * L'onglet « Configuration » d'un projet, en lecture : les défauts de lancement,
 * la qualité, l'intégration. Plus le MODÈLE PAR RÔLE : un tier abstrait par rôle,
 * et le modèle RÉSOLU en bout de ligne (il suit l'IDE actif). Un lien renvoie à la
 * config de l'outil. On n'édite PAS le mapping ici (il vit côté outil).
 */
import { ROLE_ORDER, TIERS, resolveRole, type Role, type Tier, type ToolConfig } from './configModel.js';
import type { BoardProject } from './types.js';

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
            <span className="ttl">Ce projet n'a pas encore de .vectorz/config.yml.</span>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="vh">
        <h2>Configuration — {project.name}</h2>
        <span className="sub">.vectorz/config.yml · voyage avec le repo</span>
      </div>

      <div className="cfg">
        <section className="card">
          <h3>Lancement par défaut</h3>
          <dl className="kv">
            <dt>Grooming</dt>
            <dd>{c.groomPolicy}</dd>
            <dt>Taille de sprint</dt>
            <dd>{c.sprintSize}</dd>
            <dt>Rétro</dt>
            <dd>{c.retro}</dd>
          </dl>
        </section>
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
          <h3>Intégration</h3>
          <dl className="kv">
            <dt>GitHub</dt>
            <dd>{c.github}</dd>
            <dt>Racine</dt>
            <dd>{c.root}</dd>
          </dl>
        </section>
      </div>

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
    </>
  );
}
