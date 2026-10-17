/**
 * Board unifié cop1 (ADR-074) — la coque.
 *
 * L'en-tête (marque, sélecteur de projet, recherche, bouton ⚙), la navigation de
 * gauche (Projet / Méthode) et la zone principale qui route vers une vue. La vue
 * d'ensemble est livrée ici (tranche 20261012231419185) ; les autres vues
 * arrivent à leurs tranches et affichent pour l'instant un repère.
 */
import { useEffect, useState } from 'react';
import { AddProjectModal } from './AddProjectModal.js';
import { CadrageView } from './CadrageView.js';
import { ConfigView } from './ConfigView.js';
import { defaultToolConfig, type Role, type Tier } from './configModel.js';
import { BOARD_DATA, DEFAULT_PROJECT } from './data.js';
import { ToolConfigView } from './ToolConfigView.js';
import type { BoardProject } from './types.js';
import { DevView } from './DevView.js';
import { FicheModal } from './FicheModal.js';
import { FichesView } from './FichesView.js';
import { FleetView } from './FleetView.js';
import { OverviewView } from './OverviewView.js';
import { RunDetailView } from './RunDetailView.js';
import { TimelineView } from './TimelineView.js';

const BRAND_VERSION = 'v0.17.0';

type ViewId =
  | 'fleet'
  | 'overview'
  | 'cadrage'
  | 'dev'
  | 'fiches'
  | 'timeline'
  | 'config'
  | 'process'
  | 'tool';

interface NavItem {
  id: ViewId;
  icon: string;
  label: string;
}

const PROJECT_NAV: NavItem[] = [
  { id: 'overview', icon: '◧', label: "Vue d'ensemble" },
  { id: 'cadrage', icon: '✎', label: 'Cadrage' },
  { id: 'dev', icon: '▸', label: 'Développement' },
  { id: 'fiches', icon: '▦', label: 'Fiches' },
  { id: 'timeline', icon: '◷', label: 'Chronologie' },
  { id: 'config', icon: '⚙', label: 'Configuration' },
];

const GLOBAL_NAV: NavItem[] = [{ id: 'fleet', icon: '◳', label: 'Tous les projets' }];

const METHOD_NAV: NavItem[] = [{ id: 'process', icon: '❖', label: 'Process' }];

/** Les vues dont la tranche n'est pas encore construite : un repère, pas du vide. */
const PENDING: Partial<Record<ViewId, { title: string; fiche: string }>> = {
  process: { title: 'Process', fiche: '20260830110131228' },
};

function PendingView({ title, fiche }: { title: string; fiche: string }): JSX.Element {
  return (
    <>
      <div className="vh">
        <h2>{title}</h2>
        <span className="sub">tranche à venir</span>
      </div>
      <section className="card">
        <h3>À venir</h3>
        <div className="row">
          <span className="ttl">Cette vue arrive à sa tranche du board unifié.</span>
          <span className="meta">fiche {fiche}</span>
        </div>
      </section>
    </>
  );
}

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'mon-projet';
}

/** Un nom qui ne collisionne avec aucun projet existant (suffixe -2, -3…). */
function uniqueName(base: string, taken: Record<string, unknown>): string {
  if (!(base in taken)) return base;
  let i = 2;
  while (`${base}-${i}` in taken) i++;
  return `${base}-${i}`;
}

/** Un projet neuf, avec la config par défaut de la méthode (assistant d'ajout). */
function makeNewProject(root: string): BoardProject {
  return {
    name: basename(root),
    desc: 'projet ajouté',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '0', temps: '—', perFiche: '—', sprints: 0, runs: 0, retros: 0 },
    versions: { current: null, upcoming: [], past: [] },
    runs: {},
    config: {
      groomPolicy: 'auto',
      sprintSize: 'auto',
      retro: 'à la fin',
      releaseGate: true,
      github: 'à définir',
      root,
      roles: {},
    },
  };
}

export function Board(): JSX.Element {
  const [projectName, setProjectName] = useState<string>(DEFAULT_PROJECT);
  // Accueil « Tous les projets » (cas 8 piste 1) en tête de nav Global ; le board par
  // projet, lui, ne change pas — on ouvre comme avant sur sa vue d'ensemble.
  const [view, setView] = useState<ViewId>('overview');
  // Drill-down dans la vue courante (détail d'un run) — null = la vue elle-même.
  const [runDetailId, setRunDetailId] = useState<string | null>(null);
  // Fiche ouverte en modale par-dessus — null = aucune.
  const [ficheModalId, setFicheModalId] = useState<string | null>(null);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Lot présélectionné quand on lance une version depuis la vue d'ensemble.
  const [devLot, setDevLot] = useState<string | null>(null);
  // Config de l'outil (portée poste) : partagée par la config projet (modèle
  // résolu) et la page ⚙ config outil (édition du mapping).
  const [toolConfig, setToolConfig] = useState(defaultToolConfig());
  // Tier par rôle édité dans la config projet, par projet : remonté ici pour
  // survivre à la navigation (on ne le perd pas en allant régler l'outil).
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Partial<Record<Role, Tier>>>>({});
  // Projets ajoutés par l'assistant (simulés), fusionnés avec les projets amorcés.
  const [addedProjects, setAddedProjects] = useState<Record<string, BoardProject>>({});
  const [addProjOpen, setAddProjOpen] = useState(false);

  // Fermeture clavier de la modale (Échap) tant qu'elle est ouverte.
  useEffect(() => {
    if (!projModalOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setProjModalOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [projModalOpen]);

  const allProjects: Record<string, BoardProject> = { ...BOARD_DATA, ...addedProjects };
  const project = allProjects[projectName] ?? allProjects[DEFAULT_PROJECT];
  const currentVer = project.versions.current?.ver ?? '—';

  /** Crée un projet depuis l'assistant, l'ajoute au sélecteur, le choisit, et
   *  retient l'IDE choisi. Retourne le nom affiché. */
  function createProject(root: string, ide: string): string {
    // Nom unique : ne jamais écraser un projet existant (amorcé ou ajouté).
    const name = uniqueName(basename(root), allProjects);
    const next = { ...makeNewProject(root), name };
    setAddedProjects((prev) => ({ ...prev, [name]: next }));
    setToolConfig((prev) => ({ ...prev, ide }));
    setProjectName(name);
    setView('overview');
    return name;
  }

  /** Navigue vers une vue en quittant tout détail et toute modale ouverts. */
  function go(v: ViewId): void {
    setRunDetailId(null);
    setFicheModalId(null);
    setView(v);
  }

  function chooseProject(name: string): void {
    setProjectName(name);
    setRunDetailId(null);
    setFicheModalId(null);
    setView('overview');
    setProjModalOpen(false);
  }

  const runDetail = runDetailId ? project.runs[runDetailId] : undefined;
  const ficheModal = ficheModalId ? project.fiches?.[ficheModalId] : undefined;

  return (
    <div className="bd">
      <div className="top">
        <span className="brand">
          <span className="dot" aria-hidden="true" />
          board <span className="bv">{BRAND_VERSION}</span>
        </span>
        <button
          type="button"
          className="projbtn"
          onClick={() => setProjModalOpen(true)}
          aria-haspopup="dialog"
        >
          {project.live && <span className="live" aria-hidden="true" />}
          {project.name} <span className="cv">{currentVer}</span> <span className="ch" aria-hidden="true">▾</span>
        </button>
        <label className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            placeholder="Rechercher une fiche…"
            aria-label="Rechercher une fiche"
            value={query}
            onChange={(e) => {
              const q = e.target.value;
              setQuery(q);
              // La recherche porte sur les fiches : on bascule sur leur vue pour voir
              // le résultat (sinon l'utilisateur taperait dans le vide).
              if (q.trim() && view !== 'fiches') go('fiches');
            }}
          />
        </label>
        <button
          type="button"
          className="toolbtn"
          title="Configuration de l'outil (global)"
          aria-label="Configuration de l'outil"
          onClick={() => go('tool')}
        >
          ⚙
        </button>
      </div>

      <div className="shell">
        <nav className="nav" aria-label="Navigation du board">
          <div className="grp">Global</div>
          {GLOBAL_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'on' : undefined}
              aria-current={view === item.id ? 'page' : undefined}
              title={item.label}
              onClick={() => go(item.id)}
            >
              <span className="ic" aria-hidden="true">{item.icon}</span>
              <span className="lbl">{item.label}</span>
            </button>
          ))}
          <div className="grp">Projet</div>
          {PROJECT_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'on' : undefined}
              aria-current={view === item.id ? 'page' : undefined}
              title={item.label}
              onClick={() => go(item.id)}
            >
              <span className="ic" aria-hidden="true">{item.icon}</span>
              <span className="lbl">{item.label}</span>
            </button>
          ))}
          <div className="grp">Méthode</div>
          {METHOD_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'on' : undefined}
              aria-current={view === item.id ? 'page' : undefined}
              title={item.label}
              onClick={() => go(item.id)}
            >
              <span className="ic" aria-hidden="true">{item.icon}</span>
              <span className="lbl">{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="main">
          {runDetail ? (
            <RunDetailView
              project={project}
              run={runDetail}
              onBack={() => setRunDetailId(null)}
              onOpenFiche={setFicheModalId}
            />
          ) : view === 'fleet' ? (
            <FleetView projects={allProjects} onOpenProject={chooseProject} />
          ) : view === 'overview' ? (
            <OverviewView
              project={project}
              onLaunch={(ver) => {
                setDevLot(ver);
                go('dev');
              }}
              onViewRun={(runId) => setRunDetailId(runId)}
            />
          ) : view === 'cadrage' ? (
            <CadrageView project={project} onOpenRun={(id) => setRunDetailId(id)} />
          ) : view === 'dev' ? (
            <DevView project={project} onOpenRun={(id) => setRunDetailId(id)} initialLot={devLot} />
          ) : view === 'fiches' ? (
            <FichesView project={project} onOpenFiche={setFicheModalId} query={query} />
          ) : view === 'timeline' ? (
            <TimelineView project={project} onOpenRun={(id) => setRunDetailId(id)} />
          ) : view === 'config' ? (
            <ConfigView
              project={project}
              tool={toolConfig}
              roles={roleOverrides[projectName] ?? project.config?.roles ?? {}}
              onSetRole={(role, tier) =>
                setRoleOverrides((prev) => ({
                  ...prev,
                  [projectName]: { ...(prev[projectName] ?? project.config?.roles ?? {}), [role]: tier },
                }))
              }
              onGotoTool={() => go('tool')}
            />
          ) : view === 'tool' ? (
            <ToolConfigView tool={toolConfig} onChange={setToolConfig} />
          ) : (
            <PendingView title={PENDING[view]!.title} fiche={PENDING[view]!.fiche} />
          )}
        </main>
      </div>

      {projModalOpen && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Choisir un projet"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProjModalOpen(false);
          }}
        >
          <div className="sheet2">
            <div className="mh">
              <h3>Choisir un projet</h3>
              <button type="button" className="x" onClick={() => setProjModalOpen(false)}>
                Fermer ✕
              </button>
            </div>
            <div className="pmlist">
              {Object.values(allProjects).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`pmcard${p.name === projectName ? ' on' : ''}`}
                  onClick={() => chooseProject(p.name)}
                >
                  <span className="nm">
                    {p.live && <span className="live" aria-hidden="true" />}
                    {p.name}
                  </span>
                  <span className="pv">{p.versions.current?.ver ?? '—'}</span>
                  <span className="prow">
                    <span>
                      {p.funnel.ready} prêtes · {p.funnel.wip} en cours
                    </span>
                    <span>{p.funnel.idea} idées</span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="pmcard pmadd"
                onClick={() => {
                  setProjModalOpen(false);
                  setAddProjOpen(true);
                }}
              >
                + Ajouter un projet…
              </button>
            </div>
          </div>
        </div>
      )}

      {ficheModal && (
        <FicheModal
          fiche={ficheModal}
          onClose={() => setFicheModalId(null)}
          onOpenPage={(fid) => {
            // « Voir la page » : la vue Fiches, la fiche ouverte (on ne jette pas l'id).
            setRunDetailId(null);
            setView('fiches');
            setFicheModalId(fid);
          }}
        />
      )}

      {addProjOpen && (
        <AddProjectModal
          ides={Object.keys(toolConfig.map)}
          currentIde={toolConfig.ide}
          onCreate={createProject}
          onClose={() => setAddProjOpen(false)}
        />
      )}
    </div>
  );
}

export default Board;
