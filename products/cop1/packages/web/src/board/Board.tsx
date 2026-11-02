/**
 * Board unifié cop1 (ADR-074) — la coque.
 *
 * L'en-tête (marque, sélecteur de projet, recherche, bouton ⚙), la navigation de
 * gauche (Projet / Méthode) et la zone principale qui route vers une vue. La vue
 * d'ensemble est livrée ici (tranche 20261012231419185) ; chaque autre vue vit
 * dans son fichier, la dernière à arriver étant « Process » (fiche 20261102123552183).
 */
import { useEffect, useRef, useState } from 'react';
import { AddProjectModal } from './AddProjectModal.js';
import { CadrageView } from './CadrageView.js';
import { ConfigView } from './ConfigView.js';
import { defaultToolConfig, type Role, type Tier } from './configModel.js';
import { ToolConfigView } from './ToolConfigView.js';
import type { BoardData, BoardProject, FicheDetail, PlanState } from './types.js';
import { DevView } from './DevView.js';
import { FicheModal, type Pouce } from './FicheModal.js';
import { FichesView } from './FichesView.js';
import { FleetView } from './FleetView.js';
import { OverviewView } from './OverviewView.js';
import { PilotageView } from './PilotageView.js';
import { ProcessView } from './ProcessView.js';
import { RunDetailView } from './RunDetailView.js';
import { TimelineView } from './TimelineView.js';

const BRAND_VERSION = 'v0.17.0';

/** Le projet affiché par défaut à l'ouverture du board. */
const DEFAULT_PROJECT = 'vectorz';
/** Délai avant de redemander le board quand une lecture se charge ou se relit côté serveur. */
const LOADING_RETRY_MS = 2000;
/** Rythme auquel une page ouverte redemande le board : la méthode a pu changer entre-temps. Chaque
 *  demande est servie depuis la copie du serveur, qui ne relit `ezk` qu'au plus toutes les 30 s. */
const REFRESH_MS = 15_000;

type ViewId =
  | 'fleet'
  | 'overview'
  | 'pilotage'
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
  { id: 'pilotage', icon: '◔', label: 'Pilotage' },
  { id: 'cadrage', icon: '✎', label: 'Cadrage' },
  { id: 'dev', icon: '▸', label: 'Développement' },
  { id: 'fiches', icon: '▦', label: 'Fiches' },
  { id: 'timeline', icon: '◷', label: 'Chronologie' },
  { id: 'config', icon: '⚙', label: 'Configuration' },
];

const GLOBAL_NAV: NavItem[] = [{ id: 'fleet', icon: '◳', label: 'Tous les projets' }];

const METHOD_NAV: NavItem[] = [{ id: 'process', icon: '❖', label: 'Process' }];

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
          board <span className="bv">{BRAND_VERSION}</span>
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
  // Fiche ouverte en modale par-dessus — null = aucune.
  const [ficheModalId, setFicheModalId] = useState<string | null>(null);
  // Dernier détail vu de la fiche ouverte : livrée entre deux relectures, elle quitte le plan,
  // mais sa fenêtre reste ouverte au lieu de se fermer en silence.
  const lastFicheSeen = useRef<FicheDetail | undefined>(undefined);
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

  return (
    <div className="bd">
      <div className="top">
        <span className="brand">
          <span className="dot" aria-hidden="true" />
          board <span className="bv">{BRAND_VERSION}</span>
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
          <div className="grp">Archives</div>
          <a href="/v1/index.html" title="Pages de l'ancien dashboard (benchmark, diagrammes qualité, cartes)">
            <span className="ic" aria-hidden="true">🗄</span>
            <span className="lbl">v1 / archives</span>
          </a>
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
          ) : view === 'pilotage' ? (
            <PilotageView project={project} />
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
            <ProcessView project={project} onOpenFiche={setFicheModalId} />
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
