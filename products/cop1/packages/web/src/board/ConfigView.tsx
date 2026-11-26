/**
 * Board unifié cop1 — config projet (fiches 20261012231419250 et 20261126170000110).
 *
 * La page « Configuration » d'un projet, en lecture, rangée en quatre blocs : Projet, Process (dans
 * l'ordre du flux), Niveaux (performant / standard / économe → modèle → effort) et Plugins. Un seul
 * « i » par ligne de réglage, à droite. Aucune commande n'est écrite en texte ; aucun geste n'est
 * dessiné tant que le démon n'en offre pas (pas de crayon, d'« Ajouter » ni d'« Installer »).
 *
 * Pour un projet surveillé, la config vient de la méthode (`ezk config show --json`, ADR-086).
 * Tant qu'elle n'est pas arrivée, la page dit pourquoi : elle ne conclut jamais que le fichier
 * manque. Ce que la méthode ne publie pas s'écrit « non publié », jamais un chiffre inventé.
 * Le mapping tier → modèle de l'outil ne sert que pour un projet d'exemple (assistant d'ajout).
 */
import type { ReactNode } from 'react';
import {
  ROLE_ORDER,
  TIERS,
  effortLabel,
  projectFolder,
  resolveRole,
  resolveTier,
  tierLabel,
  type AgentModel,
  type GroomingTechniques,
  type ProjectConfig,
  type Role,
  type Tier,
  type ToolConfig,
} from './configModel.js';
import type { BoardProject, PlanState } from './types.js';
import { InfoButton, PageHead } from './Chrome.js';

interface ConfigViewProps {
  project: BoardProject;
  tool: ToolConfig;
  /** Tier effectif par rôle (remonté dans la coque pour survivre à la navigation). */
  roles: Partial<Record<Role, Tier>>;
  onSetRole: (role: Role, tier: Tier) => void;
  onGotoTool: () => void;
}

const NOT_PUBLISHED = 'non publié';

function TierSeg({ value, onChange }: { value: Tier; onChange: (t: Tier) => void }): JSX.Element {
  return (
    <span className="seg" role="group" aria-label="Niveau du rôle">
      {TIERS.map((t) => (
        <button key={t} type="button" className={value === t ? 'on' : undefined} aria-pressed={value === t} onClick={() => onChange(t)}>
          {tierLabel(t)}
        </button>
      ))}
    </span>
  );
}

/** D'où vient la valeur d'un agent, en mots (contrat `ezk config show --json`). */
const SOURCE_LABEL: Record<string, string> = {
  defaut: 'défaut de la méthode',
  'tier-projet': 'niveau du projet',
  agent: 'réglé pour cet agent',
};

/**
 * Le message quand la config n'est pas là : chargement, indisponible (avec la raison). Sans aucun
 * état, le serveur ne connaît pas encore la config : il tourne sur un code plus ancien que la page.
 */
function configMessage(state: PlanState | undefined): string {
  if (state?.state === 'loading') return 'config en cours de chargement';
  if (state?.state === 'unavailable') return `config indisponible : ${state.reason}`;
  return 'le serveur de mission control n’envoie pas la config : il tourne sur un code plus ancien que la page. Relance-le (pnpm cop1:dev).';
}

/** Le grooming pré-réglé par la config, en mots. */
function groomingText(g: GroomingTechniques | undefined): string {
  if (!g) return NOT_PUBLISHED;
  switch (g.mode) {
    case 'menu':
      return 'menu à chaque grooming';
    case 'all':
      return 'toutes les techniques';
    case 'none':
      return 'aucune technique';
    case 'selection':
      return g.ids.join(' · ');
    case 'error':
      return `config invalide : ${g.error}`;
  }
}

/** « oui » / « non » en pastille ; une valeur que la méthode ne publie pas reste « non publié ». */
function YesNo({ value }: { value: boolean | undefined }): JSX.Element {
  if (value === undefined) return <span className="note">{NOT_PUBLISHED}</span>;
  return <span className={`tag ${value ? 'ok' : 'warn'}`}>{value ? 'oui' : 'non'}</span>;
}

/** Une ligne de réglage : le nom, la valeur, et un seul « i » à droite. */
function SettingRow({ lab, info, children }: { lab: string; info: string; children: ReactNode }): JSX.Element {
  return (
    <div className="srow">
      <span className="lab">{lab}</span>
      <span className="val">{children}</span>
      <span className="act">
        <InfoButton text={info} />
      </span>
    </div>
  );
}

function ProjectBlock({ config, name }: { config: ProjectConfig; name: string }): JSX.Element {
  return (
    <section className="card">
      <h3>
        Projet <InfoButton text="Les réglages du projet viennent de .vectorz/config.yml, qui voyage avec le dépôt. Source : ezk config show --json." />
      </h3>
      <SettingRow lab="Réglages" info={`Le fichier que la méthode a lu pour ${name}.`}>
        {config.file ? <span className="cmd">{config.file}</span> : <span className="note">aucun fichier · défauts de la méthode</span>}
      </SettingRow>
      <SettingRow lab="Dossier lu" info="Le dossier du projet, pas celui d'un worktree : un worktree est ramené à l'arbre principal.">
        <span className="cmd">{projectFolder(config.root)}</span>
      </SettingRow>
    </section>
  );
}

function ProcessBlock({ config }: { config: ProjectConfig }): JSX.Element {
  return (
    <section className="card">
      <h3>
        Process <InfoButton text="Les étapes de la méthode que ce projet peut régler, dans l'ordre du process. Source : ezk config show --json." />
      </h3>
      <div className="psub">Préparer les fiches</div>
      <SettingRow lab="Grooming" info="Les techniques que l'agent applique quand il groome une fiche, telles que la config les pré-règle.">
        {groomingText(config.groomingTechniques)}
      </SettingRow>
      <SettingRow lab="DoR" info="Ce que « prête » veut dire pour une fiche : un socle de la méthode, sans champ ajouté par le projet.">
        <span className="tag ok">oui</span>
        <span className="note"> · socle de la méthode</span>
      </SettingRow>
      <div className="psub">Construire un sprint</div>
      <SettingRow lab="DoD" info="Ce que « fini » veut dire pour une fiche. Le nombre de règles n'est pas publié par la méthode.">
        <span className="tag ok">oui</span>
        <span className="note"> · règles : {NOT_PUBLISHED}</span>
      </SettingRow>
      <SettingRow lab="Revue adverse" info="Un second agent cherche à casser le travail avant la livraison. « non » = mode POC, posé par un humain.">
        <YesNo value={config.adverseReview === undefined ? undefined : config.adverseReview === 'run'} />
      </SettingRow>
      <div className="psub">Livrer une version</div>
      <SettingRow lab="Gate de release" info="La porte qui bloque l'étiquette d'une version tant qu'un contrôle échoue.">
        <YesNo value={config.releaseGate} />
      </SettingRow>
      <SettingRow lab="Cohérence du lot" info="Le contrôle de cohérence des fiches d'une version. La méthode ne publie pas son réglage.">
        <span className="note">{NOT_PUBLISHED}</span>
      </SettingRow>
      <SettingRow lab="Chasse aux bugs" info="La chasse aux bugs avant l'étiquette. La méthode ne publie pas son réglage.">
        <span className="note">{NOT_PUBLISHED}</span>
      </SettingRow>
      <SettingRow lab="Tests" info="La commande de tests jouée par la gate de release. La méthode ne la publie pas encore.">
        <span className="note">{NOT_PUBLISHED}</span>
      </SettingRow>
      <SettingRow lab="Autres contrôles" info="Les contrôles que le projet ajoute à la gate. La méthode ne les publie pas encore.">
        <span className="note">{NOT_PUBLISHED}</span>
      </SettingRow>
    </section>
  );
}

/** Un niveau : ce qu'il vaut ici (modèle, effort) et ce qui le porte, pour l'infobulle. */
interface LevelRow {
  tier: Tier;
  models: string;
  efforts: string;
  who: string;
}

type ResolvedAgent = Extract<AgentModel, { tier: string }>;

/** Les niveaux tels que la méthode résout chaque agent : un niveau sans agent n'a rien de publié. */
function levelsFromAgents(agents: AgentModel[]): LevelRow[] {
  return TIERS.map((tier) => {
    const here = agents.filter((a): a is ResolvedAgent => 'tier' in a && a.tier === tier);
    if (here.length === 0) {
      return { tier, models: NOT_PUBLISHED, efforts: NOT_PUBLISHED, who: 'aucun agent à ce niveau' };
    }
    const distinct = (pick: (a: ResolvedAgent) => string): string => [...new Set(here.map(pick))].join(', ');
    return {
      tier,
      models: distinct((a) => a.model),
      efforts: distinct((a) => effortLabel(a.effort)),
      who: here.map((a) => `${a.agent} (${SOURCE_LABEL[a.source] ?? a.source})`).join(', '),
    };
  });
}

/** Projet d'exemple : le mapping de l'outil dit ce que vaut chaque niveau. */
function levelsFromTool(tool: ToolConfig): LevelRow[] {
  return TIERS.map((tier) => {
    const r = resolveTier(tool, tier);
    return { tier, models: r.model, efforts: effortLabel(r.effort), who: `Résolu par ${tool.ide}.` };
  });
}

function LevelsBlock({ rows, errors, onGotoTool }: { rows: LevelRow[]; errors: string[]; onGotoTool?: () => void }): JSX.Element {
  return (
    <section className="card">
      <h3>
        Niveaux — ce que vaut chaque niveau ici
        {onGotoTool && (
          <button type="button" className="doclink linkbtn cfg-tool" onClick={onGotoTool}>
            régler l'outil →
          </button>
        )}
        <InfoButton text="Un niveau choisit le modèle et l'effort d'un agent. Source : ezk config show --json." />
      </h3>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Niveau</th>
              <th>Modèle</th>
              <th>Effort</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tier}>
                <th scope="row">{tierLabel(r.tier)}</th>
                <td>{r.models === NOT_PUBLISHED ? <span className="note">{r.models}</span> : <span className="cmd">{r.models}</span>}</td>
                <td>{r.efforts}</td>
                <td className="cfg-i">
                  <InfoButton text={r.who} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.map((e) => (
        <div className="note pc-note" key={e}>
          {e}
        </div>
      ))}
    </section>
  );
}

/** Le plugin GitHub, en mots : activé (tout branché), coupé (100 % local) ou partiel. */
function githubState(github: string): { tag: string; cls: string; detail?: string } {
  if (github.startsWith('coupé')) return { tag: 'coupé', cls: 'idea' };
  if (github.startsWith('branché')) return { tag: 'activé', cls: 'ok' };
  return { tag: 'partiel', cls: 'warn', detail: github };
}

function PluginsBlock({ github }: { github: string }): JSX.Element {
  const g = githubState(github);
  return (
    <section className="card">
      <h3>
        Plugins <InfoButton text="Les plugins que ce projet branche. Source : ezk config show --json." />
      </h3>
      <SettingRow lab="GitHub" info="Pull requests, CI et revue Codex. « coupé » = 100 % local.">
        <span className={`tag ${g.cls}`}>{g.tag}</span>
        {g.detail && <span className="note"> {g.detail}</span>}
      </SettingRow>
    </section>
  );
}

/** Projet d'exemple : le niveau de chaque rôle, modifiable, avec le modèle que l'outil en tire. */
function RolesCard({ roles, tool, onSetRole }: Pick<ConfigViewProps, 'roles' | 'tool' | 'onSetRole'>): JSX.Element {
  return (
    <section className="card">
      <h3>
        Niveau par rôle <InfoButton text={`Niveau → modèle résolu par ${tool.ide}.`} />
      </h3>
      {ROLE_ORDER.map((role) => {
        const resolved = resolveRole(roles, role, tool);
        return (
          <div className="cfgrow" key={role}>
            <span className="cfgk mono">{role}</span>
            <TierSeg value={resolved.tier} onChange={(t) => onSetRole(role, t)} />
            <span className="rarr">→</span>
            <span className="rmodel">{resolved.model}</span>
            <span className="reff">{effortLabel(resolved.effort)}</span>
          </div>
        );
      })}
    </section>
  );
}

export function ConfigView({ project, tool, roles, onSetRole, onGotoTool }: ConfigViewProps): JSX.Element {
  const c = project.config;

  if (!c) {
    return (
      <>
        <PageHead title="Configuration" info="Les réglages du projet, tels que la méthode les publie." />
        <section className="card">
          <div className="row">
            <span className="ttl">{configMessage(project.configState)}</span>
          </div>
        </section>
      </>
    );
  }

  const levels = c.agents ? levelsFromAgents(c.agents) : levelsFromTool(tool);
  const agentErrors = (c.agents ?? []).flatMap((a) => ('error' in a ? [`${a.agent} · config invalide : ${a.error}`] : []));

  return (
    <>
      <PageHead
        title="Configuration"
        info="Les réglages viennent de .vectorz/config.yml, qui voyage avec le dépôt. Cette page les montre en lecture."
      />
      <div className="cfgcol">
        <ProjectBlock config={c} name={project.name} />
        <ProcessBlock config={c} />
        <LevelsBlock rows={levels} errors={agentErrors} onGotoTool={c.agents ? undefined : onGotoTool} />
        {!c.agents && <RolesCard roles={roles} tool={tool} onSetRole={onSetRole} />}
        <PluginsBlock github={c.github} />
      </div>
    </>
  );
}
