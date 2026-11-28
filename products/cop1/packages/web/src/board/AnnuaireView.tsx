/**
 * L'Annuaire de la méthode (fiche 20261128093846629) : le rayon de bibliothèque de la méthode, tout ce
 * qui existe — compétences, agents, règles, profils, commandes, glossaire. La Loi, elle, ne montre que
 * ce qui s'applique au projet. La page LIT ce que la méthode publie (`ezk help --json`, `ezk law show
 * --json`) : rien n'est inventé, une donnée absente dit « non publié ».
 */
import { type ReactNode, useEffect, useState } from 'react';
import { AgentsTab, CommandsTab, GlossaryTab, ProfilesTab, RulesTab, SkillsTab } from './AnnuaireTabs.js';
import { type HelpCommand, type HelpData, NON_PUBLIE, commandName, ecritTexte, warnings } from './annuaireModel.js';
import { PageHead } from './Chrome.js';
import type { LawData } from './lawModel.js';
import type { BoardProject } from './types.js';
import { type ContractState, useDaemonContract } from './useDaemonContract.js';

const TABS = ['skills', 'agents', 'regles', 'profils', 'commandes', 'glossaire'] as const;
type TabId = (typeof TABS)[number];
const TAB_LABEL: Record<TabId, string> = {
  skills: 'Compétences',
  agents: 'Agents',
  regles: 'Règles',
  profils: 'Profils',
  commandes: 'Commandes',
  glossaire: 'Glossaire',
};

const ANNUAIRE_INFO =
  "Les définitions de la méthode mega-city : ce qu'est chaque compétence, agent, règle, profil, commande, terme. Rien ne se règle ici : ce qui s'applique à un projet se lit sur la page Loi du projet.";
const SANTE_INFO = 'Santé de la méthode, pour qui entretient la méthode. Un clic ouvre la liste.';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isHelp = (v: unknown): boolean => isRecord(v) && Array.isArray(v.commandes) && Array.isArray(v.skills) && Array.isArray(v.agents);
const isLaw = (v: unknown): boolean => isRecord(v) && Array.isArray(v.regles) && Array.isArray(v.objets) && isRecord(v.comptes);
const HELP_READING = { path: 'help', field: 'help', isUsable: isHelp, incompleteReason: 'annuaire incomplet' };
const LAW_READING = { path: 'law', field: 'law', isUsable: isLaw, incompleteReason: 'loi incomplète' };

/** Une fenêtre : fermée par Échap, par « Fermer » ou par un clic sur le fond. */
function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet2">
        <div className="mh">
          <h3>{label}</h3>
          <button type="button" className="x" onClick={onClose}>
            Fermer ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CommandDialog({ command, onClose }: { command: HelpCommand; onClose: () => void }): JSX.Element {
  return (
    <Dialog label={`ezk ${commandName(command)}`} onClose={onClose}>
      <div className="lawdetail">
      <dl>
        <dt>Domaine · verbe</dt>
        <dd>{command.verbe ? `${command.domaine} · ${command.verbe}` : command.domaine}</dd>
        <dt>Ce qu'elle fait</dt>
        <dd>{command.enClair}</dd>
        <dt>Script lancé</dt>
        <dd>{command.script}</dd>
        <dt>Écrit le projet</dt>
        <dd>{ecritTexte(command)}</dd>
        {command.deprecie && (
          <>
            <dt>Nouveau nom</dt>
            <dd>{command.deprecie}</dd>
          </>
        )}
        <dt>Citée par</dt>
        <dd>{NON_PUBLIE}</dd>
      </dl>
      </div>
    </Dialog>
  );
}

function HealthDialog({ law, onClose, onOpenRules }: { law: LawData | null; onClose: () => void; onOpenRules: () => void }): JSX.Element {
  const list = warnings(law);
  return (
    <Dialog label="Santé de la méthode" onClose={onClose}>
      <p className="faint">
        {list.length} avertissement{list.length > 1 ? 's' : ''} · pour qui entretient la méthode
      </p>
      <ul>
        {list.map((w) => (
          <li key={w.id}>
            <button type="button" className="doclink linkbtn" onClick={onOpenRules}>
              {w.text}
            </button>
          </li>
        ))}
      </ul>
      <p className="faint">Contrôle du graphe de la méthode (ezk graph check) : {NON_PUBLIE}. Ces lignes se recalculent à chaque lecture, rien n'est écrit à la main.</p>
    </Dialog>
  );
}

const waiting = (state: ContractState<unknown>, what: string): JSX.Element => (
  <section className="card" aria-label={what}>
    <div className="row">
      <span className="ttl" role="status">
        {state.kind === 'unavailable' ? `${what} : ${NON_PUBLIE} (${state.reason})` : `${what} : en cours de lecture`}
      </span>
    </div>
  </section>
);

interface AnnuaireViewProps {
  project: BoardProject;
  onOpenGraph: () => void;
  onOpenLaw: () => void;
}

export function AnnuaireView({ project, onOpenGraph, onOpenLaw }: AnnuaireViewProps): JSX.Element {
  const helpState = useDaemonContract<HelpData>(project.name, HELP_READING);
  const lawState = useDaemonContract<LawData>(project.name, LAW_READING);
  const [tab, setTab] = useState<TabId>('skills');
  const [command, setCommand] = useState<HelpCommand | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);

  const help = helpState.kind === 'ok' ? helpState.contract : null;
  const law = lawState.kind === 'ok' ? lawState.contract : null;
  const counts: Record<TabId, number | null> = {
    skills: help?.skills.length ?? null,
    agents: help?.agents.length ?? null,
    regles: law?.regles.length ?? null,
    profils: law ? law.objets.filter((o) => o.type === 'profile').length : null,
    commandes: help?.commandes.length ?? null,
    glossaire: null,
  };
  const alerts = warnings(law);

  const body = (): JSX.Element => {
    if (tab === 'glossaire') return <GlossaryTab />;
    if (tab === 'regles' || tab === 'profils') {
      if (!law) return waiting(lawState, TAB_LABEL[tab]);
      return tab === 'regles' ? <RulesTab law={law} projectName={project.name} onOpenLaw={onOpenLaw} /> : <ProfilesTab law={law} />;
    }
    if (!help) return waiting(helpState, TAB_LABEL[tab]);
    if (tab === 'skills') return <SkillsTab help={help} law={law} />;
    if (tab === 'agents') return <AgentsTab help={help} law={law} />;
    return <CommandsTab help={help} onOpen={setCommand} />;
  };

  return (
    <>
      <PageHead title="Annuaire de la méthode mega-city" info={ANNUAIRE_INFO}>
        {alerts.length > 0 && (
          <button type="button" className="tag warn" title={SANTE_INFO} onClick={() => setHealthOpen(true)}>
            {alerts.length} avertissement{alerts.length > 1 ? 's' : ''}
          </button>
        )}
        <button type="button" className="btn ghost sm" onClick={onOpenGraph}>
          Carte de la méthode
        </button>
      </PageHead>

      <div className="seg" role="tablist" aria-label="Onglets de l'Annuaire">
        {TABS.map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : undefined} onClick={() => setTab(id)}>
            {counts[id] === null ? TAB_LABEL[id] : `${TAB_LABEL[id]} · ${counts[id]}`}
          </button>
        ))}
      </div>

      {body()}

      {command && <CommandDialog command={command} onClose={() => setCommand(null)} />}
      {healthOpen && (
        <HealthDialog
          law={law}
          onClose={() => setHealthOpen(false)}
          onOpenRules={() => {
            setHealthOpen(false);
            setTab('regles');
          }}
        />
      )}
    </>
  );
}
