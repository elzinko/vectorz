/**
 * Board unifié cop1 (ADR-074) — la coque.
 *
 * L'en-tête (marque, sélecteur de projet, recherche, bouton ⚙), la navigation de
 * gauche (Global / Projet) et la zone principale qui route vers une vue. La vue
 * d'ensemble est livrée ici (tranche 20261012231419185) ; chaque autre vue vit
 * dans son fichier, la dernière à arriver étant « Process » (fiche 20261102123552183).
 */
import { useEffect, useRef, useState } from 'react';
import { AddProjectModal } from './AddProjectModal.js';
import { Crumb, Footer, latestTaggedVersion, type CrumbItem } from './Chrome.js';
import { ConfigView } from './ConfigView.js';
import { defaultToolConfig, type Role, type Tier } from './configModel.js';
import { ToolConfigView } from './ToolConfigView.js';
import type { BoardData, BoardProject, FicheDetail, PlanState } from './types.js';
import { FicheModal, type Pouce } from './FicheModal.js';
import { FichesView } from './FichesView.js';
import { FleetView } from './FleetView.js';
import { OverviewView } from './OverviewView.js';
import { ObjectifsView } from './ObjectifsView.js';
import { VersionsView } from './VersionsView.js';
import { LawView } from './LawView.js';
import { RecipesView } from './RecipesView.js';
import { MapsView } from './MapsView.js';
import { GraphMap } from './GraphMap.js';
import { ProcessView } from './ProcessView.js';
import { RunDetailView } from './RunDetailView.js';
import { SessionsView } from './SessionsView.js';
import { SprintsView, sprintLabel } from './SprintsView.js';
import type { ViewId } from './viewIds.js';

/** Le projet affiché par défaut à l'ouverture du board. */
const DEFAULT_PROJECT = 'vectorz';
/** Délai avant de redemander le board quand une lecture se charge ou se relit côté serveur. */
const LOADING_RETRY_MS = 2000;
/** Rythme auquel une page ouverte redemande le board : la méthode a pu changer entre-temps. Chaque
 *  demande est servie depuis la copie du serveur, qui ne relit `ezk` qu'au plus toutes les 30 s. */
const REFRESH_MS = 15_000;

interface NavItem {
  id: ViewId;
  icon: string;
  label: string;
}

/** Le menu suit la portée (fiche 20261114131616818), puis l'ordre de la maquette (fiche 20261124111116126). */
const PROJECT_NAV: NavItem[] = [
  { id: 'overview', icon: '◧', label: "Vue d'ensemble" },
  { id: 'objectifs', icon: '◎', label: 'Objectifs' },
  { id: 'fiches', icon: '▦', label: 'Fiches' },
  { id: 'sprints', icon: '↻', label: 'Sprints' },
  { id: 'sessions', icon: '☰', label: 'Sessions' },
  { id: 'versions', icon: '⑂', label: 'Versions' },
  { id: 'process', icon: '❖', label: 'Process' },
  { id: 'law', icon: '§', label: 'Loi' },
  { id: 'config', icon: '⚙', label: 'Configuration' },
  { id: 'recipes', icon: '✦', label: 'Recettes' },
  // Seul écart à la maquette (fiche 20261124111116126) : aucune autre page ne montre les documents de la méthode.
  { id: 'maps', icon: '▤', label: 'Cartes' },
];

const GLOBAL_NAV: NavItem[] = [
  { id: 'fleet', icon: '◳', label: 'Projets' },
  { id: 'graph', icon: '◎', label: 'Carte de la méthode' },
];

/** L'Annuaire de la méthode n'existe pas encore : son entrée est grisée et dit ce qui manque. */
const ANNUAIRE_INFO =
  "À venir. La méthode publie déjà ses commandes (ezk help --json) ; il lui reste à publier son graphe en contrat compilé.";

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

/** Où en est la source des données du board. */
type BoardSource =
  | { kind: 'loading' }
  | { kind: 'unreachable' }
  | { kind: 'empty' }
  | { kind: 'live'; data: BoardData };

const SOURCE_MESSAGE: Record<Exclude<BoardSource['kind'], 'live'>, string> = {
  loading: 'chargement du board…',
  unreachable: 'serveur de mission control injoignable',
  empty: 'aucun projet surveillé',
};

/** Écran sans données : un message clair, jamais des chiffres d'exemple. */
function SourceMessage({ kind }: { kind: Exclude<BoardSource['kind'], 'live'> }): JSX.Element {
  return (
    <div className="bd">
      <div className="top">
        <span className="brand">
          <span className="dot" aria-hidden="true" />
          Mission control
          <span className="src-sample" role="status">
            {SOURCE_MESSAGE[kind]}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Un chiffre plus frais arrive-t-il bientôt pour cette lecture ? */
function awaitsFresher(state: PlanState | undefined): boolean {
  return state?.state === 'loading' || state?.refreshing === true;
}

/**
 * Pose le pouce de revue par le daemon, qui lance `ezk review verdict` (fiche 20261102151630248).
 * Rend le message d'erreur, ou `null` si c'est posé ; dans ce cas, `onDone` fait redemander le board.
 */
async function postVerdict(
  projet: string,
  id: string,
  pouce: Pouce,
  onDone: () => void,
): Promise<string | null> {
  try {
    const res = await fetch('/api/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projet, id, pouce }),
    });
    if (res.ok) {
      onDone();
      return null;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return body.error ?? `pouce refusé (HTTP ${res.status})`;
  } catch {
    return 'serveur de mission control injoignable';
  }
}

/** Le message à montrer quand le plan d'un projet n'est pas arrivé ; `null` s'il l'est. */
function planMessage(plan: PlanState | undefined): string | null {
  if (!plan || plan.state === 'ok') return null;
  return plan.state === 'loading' ? 'plan en cours de chargement' : `plan indisponible : ${plan.reason}`;
}

export function Board(): JSX.Element {
  const [projectName, setProjectName] = useState<string>(DEFAULT_PROJECT);
  // Accueil « Tous les projets » (cas 8 piste 1) en tête de nav Global ; le board par
  // projet, lui, ne change pas — on ouvre comme avant sur sa vue d'ensemble.
  const [view, setView] = useState<ViewId>('overview');
  // Drill-down dans la vue courante (détail d'un run) — null = la vue elle-même.
  const [runDetailId, setRunDetailId] = useState<string | null>(null);
  // Le sprint à ouvrir quand une autre page mène à la page Sprints (page d'une session).
  const [sprintFocus, setSprintFocus] = useState<string | null>(null);
  const [versionFocus, setVersionFocus] = useState<string | null>(null);
  // La session close ouverte, retrouvée au retour du détail d'un lancement.
  const [sessionFocus, setSessionFocus] = useState<number | null>(null);
  // Fiche ouverte en modale par-dessus — null = aucune.
  const [ficheModalId, setFicheModalId] = useState<string | null>(null);
  // Dernier détail vu de la fiche ouverte : livrée entre deux relectures, elle quitte le plan,
  // mais sa fenêtre reste ouverte au lieu de se fermer en silence.
  const lastFicheSeen = useRef<FicheDetail | undefined>(undefined);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Config de l'outil (portée poste) : partagée par la config projet (modèle
  // résolu) et la page ⚙ config outil (édition du mapping).
  const [toolConfig, setToolConfig] = useState(defaultToolConfig());
  // Tier par rôle édité dans la config projet, par projet : remonté ici pour
  // survivre à la navigation (on ne le perd pas en allant régler l'outil).
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Partial<Record<Role, Tier>>>>({});
  // Projets ajoutés par l'assistant (simulés), fusionnés avec les projets amorcés.
  const [addedProjects, setAddedProjects] = useState<Record<string, BoardProject>>({});
  const [addProjOpen, setAddProjOpen] = useState(false);
  // Source des données du board : l'endpoint local `/api/board` (le plan y vient de la méthode,
  // ADR-086). Jamais d'échantillon figé : tant que la source n'a pas répondu, ou si elle est
  // injoignable, la page le dit au lieu d'inventer des chiffres.
  const [source, setSource] = useState<BoardSource>({ kind: 'loading' });
  // Après un geste qui écrit (le pouce de revue), on redemande le board tout de suite.
  const [reloadTick, setReloadTick] = useState(0);

  // Montage : fetch de la source live. Toute erreur (pas de daemon, HTTP, réseau, JSON cassé,
  // `fetch` absent) donne « injoignable ». Le serveur demande son plan à `ezk` en arrière-plan :
  // tant qu'une lecture se charge ou se relit, la page redemande toutes les LOADING_RETRY_MS ;
  // sinon toutes les REFRESH_MS, pour suivre la méthode sans qu'on recharge.
  useEffect(() => {
    if (typeof fetch !== 'function') {
      setSource({ kind: 'unreachable' });
      return;
    }
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const load = (): void => {
      fetch('/api/board')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: BoardData) => {
          if (!alive) return;
          const valid = data && typeof data === 'object' && Object.keys(data).length > 0;
          setSource(valid ? { kind: 'live', data } : { kind: 'empty' });
          const pending =
            valid &&
            Object.values(data).some((p) => awaitsFresher(p.plan) || awaitsFresher(p.configState));
          retry = setTimeout(load, pending ? LOADING_RETRY_MS : REFRESH_MS);
        })
        .catch(() => {
          if (!alive) return;
          setSource({ kind: 'unreachable' });
          retry = setTimeout(load, REFRESH_MS);
        });
    };
    load();
    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
    };
  }, [reloadTick]);

  // Fermeture clavier de la modale (Échap) tant qu'elle est ouverte.
  useEffect(() => {
    if (!projModalOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setProjModalOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [projModalOpen]);

  if (source.kind !== 'live') return <SourceMessage kind={source.kind} />;
  const base: BoardData = source.data;
  const allProjects: Record<string, BoardProject> = { ...base, ...addedProjects };
  const project = allProjects[projectName] ?? allProjects[DEFAULT_PROJECT] ?? Object.values(allProjects)[0];
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
    setSprintFocus(null);
    setVersionFocus(null);
    setSessionFocus(null);
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
  const liveFiche = ficheModalId ? project.fiches?.[ficheModalId] : undefined;
  if (liveFiche) lastFicheSeen.current = liveFiche;
  const ficheModal =
    liveFiche ?? (ficheModalId && lastFicheSeen.current?.id === ficheModalId ? lastFicheSeen.current : undefined);

  const pageLabel = PROJECT_NAV.find((n) => n.id === view)?.label;
  const crumbTrail: CrumbItem[] | null = pageLabel ? projectTrail() : null;

  function projectTrail(): CrumbItem[] {
    const home: CrumbItem = { label: 'Projets', onClick: () => go('fleet') };
    const proj = (last: boolean): CrumbItem => ({ label: project.name, onClick: last ? undefined : () => go('overview') });
    const page = (onClick?: () => void): CrumbItem => ({ label: pageLabel as string, onClick });
    if (runDetail) return [home, proj(false), page(() => setRunDetailId(null)), { label: runDetail.name }];
    if (view === 'overview') return [home, proj(true)];
    if (view === 'sprints' && sprintFocus) return [home, proj(false), page(() => go('sprints')), { label: sprintLabel(project, sprintFocus) }];
    if (view === 'versions' && versionFocus) return [home, proj(false), page(() => go('versions')), { label: versionFocus }];
    const sessionTitle = view === 'sessions' && sessionFocus !== null ? project.pilotage?.sessions[sessionFocus]?.title : undefined;
    if (sessionTitle) return [home, proj(false), page(() => setSessionFocus(null)), { label: sessionTitle }];
    return [home, proj(false), page()];
  }

  const navButton = (item: NavItem): JSX.Element => (
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
  );

  return (
    <div className="bd">
      <div className="top">
        <span className="brand">
          <span className="dot" aria-hidden="true" />
          Mission control
          {planMessage(project.plan) && (
            <span className="src-sample" role="status">
              {planMessage(project.plan)}
            </span>
          )}
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
        <span className="bv" title="Dernière version étiquetée du projet">
          {latestTaggedVersion(project)}
        </span>
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
          {GLOBAL_NAV.map(navButton)}
          <button type="button" disabled title={ANNUAIRE_INFO} aria-label={`Annuaire de la méthode — ${ANNUAIRE_INFO}`}>
            <span className="ic" aria-hidden="true">☰</span>
            <span className="lbl">Annuaire de la méthode</span>
            <span className="faint" aria-hidden="true">ⓘ</span>
          </button>
          <div className="grp">Projet · {project.name}</div>
          {PROJECT_NAV.map(navButton)}
          <div className="grp">Archives</div>
          <a href="/v1/index.html" title="Pages archivées de la v1 (benchmark, diagrammes qualité, cartes)">
            <span className="ic" aria-hidden="true">🗄</span>
            <span className="lbl">v1 / archives</span>
          </a>
        </nav>

        <main className="main">
          {crumbTrail && <Crumb trail={crumbTrail} />}
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
            <OverviewView project={project} onOpenObjectifs={() => go('objectifs')} />
          ) : view === 'objectifs' ? (
            <ObjectifsView project={project} onOpenFiche={setFicheModalId} />
          ) : view === 'versions' ? (
            <VersionsView key={versionFocus ?? 'liste'} project={project} onOpenFiche={setFicheModalId} initialOpen={versionFocus} onFocusChange={setVersionFocus} />
          ) : view === 'sprints' ? (
            <SprintsView key={sprintFocus ?? 'liste'} project={project} onOpenFiche={setFicheModalId} initialOpen={sprintFocus} onFocusChange={setSprintFocus} onOpenSession={() => go('sessions')} />
          ) : view === 'sessions' ? (
            <SessionsView
              key={sessionFocus ?? 'liste'}
              project={project}
              initialOpen={sessionFocus}
              onOpenChange={setSessionFocus}
              onOpenFiche={setFicheModalId}
              onOpenSprint={(slug) => {
                setSprintFocus(slug);
                setView('sprints');
              }}
              onViewRun={(runId) => setRunDetailId(runId)}
            />
          ) : view === 'fiches' ? (
            <FichesView project={project} onOpenFiche={setFicheModalId} query={query} />
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
          ) : view === 'graph' ? (
            <GraphMap project={project} />
          ) : view === 'law' ? (
            <LawView project={project} />
          ) : view === 'recipes' ? (
            <RecipesView project={project} />
          ) : view === 'maps' ? (
            <MapsView project={project} />
          ) : view === 'tool' ? (
            <ToolConfigView tool={toolConfig} onChange={setToolConfig} />
          ) : (
            <ProcessView project={project} onOpenFiche={setFicheModalId} />
          )}
          <Footer />
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
                  {/* Sans plan, pas de compteurs : des zéros passeraient pour de vrais chiffres. */}
                  {planMessage(p.plan) ? (
                    <span className="prow">{planMessage(p.plan)}</span>
                  ) : (
                    <span className="prow">
                      <span>
                        {p.funnel.ready} prêtes · {p.funnel.wip} en cours
                      </span>
                      <span>{p.funnel.idea} idées</span>
                    </span>
                  )}
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
          onVerdict={(fid, pouce) => postVerdict(project.name, fid, pouce, () => setReloadTick((n) => n + 1))}
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
