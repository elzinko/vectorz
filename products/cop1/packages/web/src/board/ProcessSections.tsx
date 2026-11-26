/**
 * Les blocs de l'écran Process qui viennent du contrat `ezk process show --json` (fiche
 * 20261126170000108) : les étapes de chaque compétence, qui appelle qui, livrer une version, l'équipe.
 * Ce que la méthode ne publie pas s'écrit « non publié » ; sans contrat, chaque bloc dit pourquoi.
 */
import { type ReactNode, useState } from 'react';
import { InfoButton } from './Chrome.js';
import { PROCESS_READING, type ProcessEtape, type ProcessShow, type ProcessSkill } from './processShow.js';
import { agentMatrix, callLinks, commandTable, tierLabel } from './processCrossings.js';
import type { BoardProject } from './types.js';
import { useDaemonContract } from './useDaemonContract.js';

const slash = (skill: ProcessSkill): string => `/${skill.id}`;
const NOT_PUBLISHED = 'non publié';

/** D'où vient la valeur d'un agent, en mots (contrat `ezk config show --json`). */
const SOURCE_LABEL: Record<string, string> = {
  defaut: 'défaut de la méthode',
  'tier-projet': 'tier du projet',
  agent: 'réglé pour cet agent',
};

type AgentConfig = NonNullable<NonNullable<BoardProject['config']>['agents']>[number];

function Tag({ kind, children, title }: { kind: 'sk' | 'ag' | 'rg'; children: ReactNode; title?: string }): JSX.Element {
  return (
    <span className={kind === 'ag' ? 'tag ok' : 'tag idea'} title={title}>
      {children}
    </span>
  );
}

function Unavailable({ what, reason }: { what: string; reason: string }): JSX.Element {
  return (
    <p className="pnote pc-pad">
      {what} indisponibles : {reason}
    </p>
  );
}

/** Une table à première colonne en en-tête de ligne. */
function Table({ label, head, children }: { label: string; head: string[]; children: ReactNode }): JSX.Element {
  return (
    <div className="pc-tbl">
      <div className="pc-sub">{label}</div>
      <table className="tbl" aria-label={label}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function levelOf(agents: AgentConfig[] | undefined, agent: string): string | null {
  const found = agents?.find((a) => a.agent === agent);
  return found && 'tier' in found ? tierLabel(found.tier) : null;
}

/** Le détail d'une étape : tout ce que le contrat en publie, le reste est dit « non publié » ou « non tracé ». */
function StepDetail({
  skill,
  etape,
  agents,
  onClose,
}: {
  skill: ProcessSkill;
  etape: ProcessEtape;
  agents: AgentConfig[] | undefined;
  onClose: () => void;
}): JSX.Element {
  return (
    <aside className="pc-detail" aria-label={`Détail de l'étape ${etape.titre}`}>
      <h4>
        <Tag kind="sk">{slash(skill)}</Tag> Étape {etape.num} — {etape.titre}
        <button type="button" className="pc-x" aria-label="Fermer le détail" onClick={onClose}>
          ×
        </button>
      </h4>
      <dl className="kv">
        <dt>En clair</dt>
        <dd>{etape.enClair}</dd>
        <dt>Jouée par</dt>
        <dd>
          <Tag kind="sk">{slash(skill)}</Tag>
          {etape.joueePar.includes('humain') && <> le PO (humain)</>}
        </dd>
        <dt>Convoque</dt>
        <dd>
          {etape.agents.length === 0
            ? 'aucun agent'
            : etape.agents.map((a) => (
                <span key={a}>
                  <Tag kind="sk">{a}</Tag> <span className="faint">{levelOf(agents, a) ?? `niveau ${NOT_PUBLISHED}`}</span>{' '}
                </span>
              ))}
        </dd>
        <dt>Lance</dt>
        <dd>{etape.commandes.length === 0 ? 'aucune commande' : etape.commandes.map((c) => <code className="cmd" key={c}>{c}</code>)}</dd>
        <dt>Moment émis</dt>
        <dd>{NOT_PUBLISHED}</dd>
        <dt>Effet sur la fiche</dt>
        <dd>{NOT_PUBLISHED}</dd>
        <dt>Règles appliquées</dt>
        <dd>{etape.regles.length === 0 ? 'aucune règle rattachée' : etape.regles.map((r) => <Tag kind="rg" key={r}>{r}</Tag>)}</dd>
        <dt>Dernier passage observé</dt>
        <dd>
          <span className="warnc">non tracé</span> <span className="faint">— le journal n'écrit pas encore l'appel d'agent</span>
        </dd>
      </dl>
    </aside>
  );
}

function StepsCard({ contract, agents }: { contract: ProcessShow; agents: AgentConfig[] | undefined }): JSX.Element {
  const [open, setOpen] = useState<{ skill: ProcessSkill; etape: ProcessEtape } | null>(null);
  return (
    <>
      <div>
        {contract.skills.map((skill) => (
          <div className="pc-lane" key={skill.id}>
            <div className="pc-who">
              <Tag kind="sk">{slash(skill)}</Tag>
              <span className="faint">{skill.outil ? 'outil, hors du flux' : skill.nom}</span>
            </div>
            <div className="pc-flow" role="group" aria-label={`Étapes de ${slash(skill)}`}>
              {skill.etapes.map((etape) => (
                <button
                  type="button"
                  key={etape.id}
                  className={open?.etape === etape ? 'pc-step cur' : 'pc-step'}
                  onClick={() => setOpen({ skill, etape })}
                >
                  {etape.titre}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {open && <StepDetail skill={open.skill} etape={open.etape} agents={agents} onClose={() => setOpen(null)} />}
    </>
  );
}

const rowHead = (children: ReactNode): JSX.Element => <th scope="row">{children}</th>;

function CallsCard({ contract, known }: { contract: ProcessShow; known: string[] }): JSX.Element {
  return (
    <>
      <Table label="Une compétence en appelle d’autres" head={['Compétence', 'Appelle']}>
        {callLinks(contract).map(({ skill, targets }) => (
          <tr key={skill.id}>
            {rowHead(<Tag kind="sk">{slash(skill)}</Tag>)}
            <td>
              {targets.length === 0 ? (
                <span className="faint">aucune</span>
              ) : (
                targets.map((t) => (
                  <Tag kind="sk" key={t.skill.id} title={t.libelle}>
                    {slash(t.skill)}
                  </Tag>
                ))
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Table
        label="Un agent joue dans plusieurs étapes"
        head={['Agent', ...contract.skills.map(slash), 'Étapes']}
      >
        {agentMatrix(contract, known).map((row) => (
          <tr key={row.agent}>
            {rowHead(<Tag kind="ag">{row.agent}</Tag>)}
            {contract.skills.map((skill) => {
              const etapes = row.bySkill[skill.id] ?? [];
              return (
                <td key={skill.id} className={etapes.length === 0 ? 'faint' : undefined}>
                  {etapes.length === 0 ? '—' : etapes.map((e) => <div key={e.id}>{`${e.num} · ${e.titre}`}</div>)}
                </td>
              );
            })}
            <td>{row.total}</td>
          </tr>
        ))}
      </Table>
      <Table label="Une commande sert à plusieurs compétences" head={['Compétence', 'Commandes qu’elle lance']}>
        {commandTable(contract).map(({ skill, commands }) => (
          <tr key={skill.id}>
            {rowHead(<Tag kind="sk">{slash(skill)}</Tag>)}
            <td>
              {commands.length === 0 ? (
                <span className="faint">aucune</span>
              ) : (
                commands.map((c) => (
                  <span key={c.command}>
                    <code className="cmd">{c.command}</code>
                    {c.alsoIn.length > 0 && <span className="faint">{`aussi ${c.alsoIn.map(slash).join(', ')}`}</span>}{' '}
                  </span>
                ))
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

/** Les cinq gestes de « Versionner » (texte de la méthode) ; la commande de test est propre au projet. */
function ReleaseCard({ project, onOpenConfig }: { project: BoardProject; onOpenConfig: () => void }): JSX.Element {
  const gate = project.config?.releaseGate;
  return (
    <section className="card" id="versionner">
      <h3>
        Livrer une version — ce que déroule « Versionner »
        <button type="button" className="linkbtn" onClick={onOpenConfig}>
          Réglé dans Configuration →
        </button>
        <InfoButton text="Un seul geste enchaîne ces contrôles puis pose l'étiquette locale ; le push reste une confirmation du PO. Les contrôles se règlent dans Configuration." />
      </h3>
      <dl className="kv">
        <dt>1 · Cohérence du lot</dt>
        <dd>la version ne contient que des fiches livrées, chacune avec son numéro</dd>
        <dt>2 · Chasse aux bugs</dt>
        <dd>feu vert d'une revue adverse de la version</dd>
        <dt>3 · Tests</dt>
        <dd>
          la commande de test de ce projet : <span className="warnc">{NOT_PUBLISHED}</span>
        </dd>
        <dt>4 · Étiquette</dt>
        <dd>posée en local si tout est GO ; les fiches reçoivent leur numéro</dd>
        <dt>5 · Publier</dt>
        <dd>le push de l'étiquette, confirmé par le PO, jamais automatique</dd>
      </dl>
      <p className="faint pc-pad">
        Contrôles de release sur ce projet : {gate === undefined ? NOT_PUBLISHED : gate ? 'activés' : 'désactivés'}
      </p>
    </section>
  );
}

function TeamCard({ project, contract }: { project: BoardProject; contract: ProcessShow | null }): JSX.Element {
  const agents = project.config?.agents;
  const plays = (agent: string): string => {
    if (!contract) return NOT_PUBLISHED;
    const titles = contract.skills.flatMap((s) => s.etapes.filter((e) => e.agents.includes(agent)).map((e) => e.titre));
    return titles.length === 0 ? 'aucune étape' : titles.join(', ');
  };
  return (
    <section className="card" id="equipe">
      <h3>
        Équipe — quel niveau joue chaque agent{' '}
        <InfoButton text="Le niveau (performant, standard, économe) se règle par agent ; ce qu'il vaut sur ce poste (modèle, effort) se règle dans Configuration › Niveaux. Source : ezk config show --json." />
      </h3>
      {agents === undefined ? (
        <p className="pc-pad">
          <b>{NOT_PUBLISHED}</b> <span className="faint">· la config de ce projet n'est pas lue (ezk config show --json)</span>
        </p>
      ) : (
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col">Joue dans</th>
                <th scope="col">Niveau</th>
                <th scope="col">Modèle lancé</th>
                <th scope="col">Réglé par</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) =>
                'error' in a ? (
                  <tr key={a.agent}>
                    {rowHead(<Tag kind="ag">{a.agent}</Tag>)}
                    <td>{plays(a.agent)}</td>
                    <td colSpan={3} className="faint">
                      config invalide : {a.error}
                    </td>
                  </tr>
                ) : (
                  <tr key={a.agent}>
                    {rowHead(<Tag kind="ag">{a.agent}</Tag>)}
                    <td>{plays(a.agent)}</td>
                    <td>{tierLabel(a.tier)}</td>
                    <td className="faint">{`${a.model}, effort ${a.effort}`}</td>
                    <td>{SOURCE_LABEL[a.source] ?? a.source}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ProcessSections({ project, onOpenConfig }: { project: BoardProject; onOpenConfig: () => void }): JSX.Element {
  const state = useDaemonContract<ProcessShow>(project.name, PROCESS_READING);
  const contract = state.kind === 'ok' ? state.contract : null;
  const reason = state.kind === 'unavailable' ? state.reason : 'process en cours de lecture';
  const agents = project.config?.agents;
  const known = agents?.map((a) => a.agent) ?? [];
  return (
    <>
      <section className="card">
        <h3>
          Étapes de chaque compétence <InfoButton text="Une rangée par compétence ; un clic sur une étape ouvre son détail. Source : ezk process show --json." />
        </h3>
        {contract ? <StepsCard contract={contract} agents={agents} /> : <Unavailable what="étapes" reason={reason} />}
      </section>
      <section className="card">
        <h3>
          Qui appelle qui — les liens de la méthode{' '}
          <InfoButton text="Quelle compétence en appelle une autre, quel agent joue dans quelles étapes, quelle commande sert à plusieurs compétences. Source : ezk process show --json." />
        </h3>
        {contract ? <CallsCard contract={contract} known={known} /> : <Unavailable what="liens" reason={reason} />}
      </section>
      <ReleaseCard project={project} onOpenConfig={onOpenConfig} />
      <TeamCard project={project} contract={contract} />
    </>
  );
}
