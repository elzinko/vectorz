/**
 * Carte zoomable de la méthode (fiche 20261117114544792) : tout ce qui est relié dans ezk.
 *
 * Le contrat vient du daemon (`GET /api/graph/<projet>`, relais de `ezk graph check --json`). Le zoom
 * choisit le niveau (familles et liens comptés, puis briques, puis détail) ; un clic sur une brique
 * allume ses voisins. La projection est pure (`graphProjection.ts`). Sans contrat, la carte dit
 * pourquoi : aucune brique n'est écrite en dur.
 */
import '@xyflow/react/dist/style.css';
import {
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { GraphCheck } from './graphCheck.js';
import {
  FAMILY_LABELS,
  focusStep,
  graphLevelForZoom,
  projectGraphToFlow,
  searchBricks,
  selectionNeighbors,
  type GraphLevel,
} from './graphProjection.js';
import type { BoardProject } from './types.js';
import { useDaemonContract } from './useDaemonContract.js';

/** Un contrat utilisable : ses briques et ses liens existent. Sinon la carte dit pourquoi, au lieu de planter. */
function isGraphCheck(value: unknown): value is GraphCheck {
  const c = value as Partial<GraphCheck> | null | undefined;
  return Array.isArray(c?.nodes) && Array.isArray(c?.edges);
}

const GRAPH_READING = {
  path: 'graph',
  field: 'graph',
  isUsable: isGraphCheck,
  incompleteReason: 'contrat du graphe incomplet (briques ou liens absents)',
};

interface CountedVerb {
  verb: string;
  count: number;
}

interface BrickLink extends CountedVerb {
  sens: 'sortant' | 'entrant';
}

const countLabel = (n: number): string => `${n} voisin${n > 1 ? 's' : ''}`;

function FamilyNode({ data }: NodeProps): JSX.Element {
  const internal = data.internal as CountedVerb[];
  const neighbors = (data.neighbors as BrickLink[] | undefined) ?? [];
  return (
    <div className={`gm-famille gm-fam-${data.kind as string}${data.dim ? ' gm-dim' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="gm-famille-nom">{data.label as string}</div>
      <div className="gm-famille-compte">{data.count as number}</div>
      {typeof data.selectedName === 'string' && (
        <div className="gm-famille-choix">brique choisie : {data.selectedName}</div>
      )}
      {neighbors.map((n) => (
        <div key={`${n.sens}${n.verb}`} className="gm-famille-voisins">
          {countLabel(n.count)} · {n.sens === 'entrant' ? '← ' : ''}
          {n.verb}
        </div>
      ))}
      {internal.length > 0 && (
        <div className="gm-famille-interne">
          dans la famille : {internal.map((i) => `${i.verb} · ${i.count}`).join(', ')}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function BrickNode({ data }: NodeProps): JSX.Element {
  const state = data.highlight === 'self' ? ' gm-self' : data.highlight === 'neighbor' ? ' gm-neighbor' : data.dim ? ' gm-dim' : '';
  const liens = (data.liens as BrickLink[] | undefined) ?? [];
  return (
    <div className={`gm-brique gm-fam-${data.kind as string}${state}`}>
      <Handle type="target" position={Position.Left} />
      <div className="gm-brique-nom">{data.nom as string}</div>
      {data.level === 3 && (
        <>
          <div className="gm-brique-fichier">{typeof data.fichier === 'string' ? data.fichier : 'aucun fichier'}</div>
          <div className="gm-brique-liens">
            {liens.length === 0
              ? 'aucun lien'
              : liens.map((l) => `${l.sens === 'entrant' ? '← ' : ''}${l.verb} ${l.count}`).join(' · ')}
          </div>
        </>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { famille: FamilyNode, brique: BrickNode };

interface Selection {
  selection: string | undefined;
  setSelection: Dispatch<SetStateAction<string | undefined>>;
}

/** Une demande de cadrage, posée par la recherche : un objet neuf relance le cadrage, même sur la même brique. */
interface Focus {
  id: string;
}

interface FlowProps extends Selection {
  contract: GraphCheck;
  initialLevel: GraphLevel;
  focus: Focus | undefined;
  clearFocus: () => void;
}

function Flow({ contract, initialLevel, selection, setSelection, focus, clearFocus }: FlowProps): JSX.Element {
  const [level, setLevel] = useState<GraphLevel>(initialLevel);
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => projectGraphToFlow(contract, level, selection), [contract, level, selection]);
  // Cadrage en deux temps (fiche 20261117154145517) : la famille d'abord vue de loin, puis la brique dès
  // que le changement de niveau l'a dessinée.
  useEffect(() => {
    if (focus === undefined) return;
    const step = focusStep(nodes, focus.id);
    if (step === undefined) {
      clearFocus();
      return;
    }
    void fitView({ nodes: [{ id: step.id }], duration: 400, maxZoom: 1.5, minZoom: step.minZoom });
    if (step.done) clearFocus();
  }, [focus, nodes, fitView, clearFocus]);
  return (
    <ReactFlow
      className={`gm-level-${level}`}
      nodes={nodes as Node[]}
      edges={edges as Edge[]}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.05}
      maxZoom={2.5}
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      onMove={(_, viewport) => setLevel((previous) => graphLevelForZoom(viewport.zoom, previous))}
      onNodeClick={(_, node) => {
        if (node.type === 'brique') setSelection((previous) => (previous === node.id ? undefined : node.id));
      }}
      onPaneClick={() => {
        setSelection(undefined);
        clearFocus();
      }}
      onNodeDoubleClick={(_, node) => {
        void fitView({ nodes: [{ id: node.id }], duration: 400, maxZoom: 1.5 });
      }}
    >
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/** Le champ de recherche du panneau (fiche 20261117153250174) : choisir une brique par son nom. */
function BrickSearchField({ contract, onChoose }: { contract: GraphCheck; onChoose: (id: string) => void }): JSX.Element {
  const [query, setQuery] = useState('');
  const { matches, total } = useMemo(() => searchBricks(contract, query), [contract, query]);
  const choose = (id: string): void => {
    onChoose(id);
    setQuery('');
  };
  return (
    <form
      className="gm-recherche"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (matches[0] !== undefined) choose(matches[0].id);
      }}
    >
      <input
        type="search"
        aria-label="chercher une brique"
        placeholder="chercher une brique"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim() !== '' && total === 0 && <p>aucune brique ne contient « {query.trim()} »</p>}
      {total > 0 && (
        <>
          {total > matches.length && (
            <p className="gm-recherche-compte">
              {matches.length} sur {total}
            </p>
          )}
          <ul aria-label="briques trouvées">
            {matches.map((m) => (
              <li key={m.id}>
                <button type="button" className={`gm-voisin gm-fam-${m.kind}`} onClick={() => choose(m.id)}>
                  {m.nom}
                  <span className="gm-recherche-famille">{FAMILY_LABELS[m.kind]}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </form>
  );
}

/** Le panneau à côté de la carte : les voisins de la brique choisie, cliquables pour la déplacer. */
function NeighborPanel({
  contract,
  selection,
  setSelection,
  onChoose,
}: { contract: GraphCheck; onChoose: (id: string) => void } & Selection): JSX.Element {
  const groups = useMemo(() => selectionNeighbors(contract, selection), [contract, selection]);
  const name = selection === undefined ? undefined : contract.nodes.find((n) => `${n.kind}:${n.id}` === selection)?.id;
  return (
    <aside className="gm-panneau" aria-label="Voisins de la brique">
      <BrickSearchField contract={contract} onChoose={onChoose} />
      {name === undefined ? (
        <p>clique une brique pour voir ses voisins</p>
      ) : (
        <>
          <h4>{name}</h4>
          {groups.length === 0 && <p>aucun voisin</p>}
          {groups.map((g) => (
            <section key={`${g.sens}${g.verb}`} className="gm-groupe">
              <h5>
                {g.sens === 'entrant' ? '← ' : ''}
                {g.verb} · {g.neighbors.length}
              </h5>
              <ul>
                {g.neighbors.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={`gm-voisin gm-fam-${n.kind}`} title={FAMILY_LABELS[n.kind]} onClick={() => setSelection(n.id)}>
                      {n.nom}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </aside>
  );
}

/**
 * `initialLevel` et `initialSelection` ne servent qu'aux tests : jsdom ne mesure aucun zoom ni clic de
 * carte ; la carte réelle part du niveau 1, sans brique choisie.
 */
export function GraphMap({
  project,
  initialLevel = 1,
  initialSelection,
}: {
  project: BoardProject;
  initialLevel?: GraphLevel;
  initialSelection?: string;
}): JSX.Element {
  const [selection, setSelection] = useState<string | undefined>(initialSelection);
  const [focus, setFocus] = useState<Focus | undefined>();
  const clearFocus = useCallback(() => setFocus(undefined), []);
  const chooseFromSearch = useCallback((id: string) => {
    setSelection(id);
    setFocus({ id });
  }, []);
  const state = useDaemonContract<GraphCheck>(project.name, GRAPH_READING);
  return (
    <section className="card gm" aria-label="Carte de la méthode">
      <div className="vh">
        <h3>Carte de la méthode — {project.name}</h3>
        <span className="sub">zoome pour voir les briques, puis leur détail ; clique une brique pour allumer ses voisins</span>
      </div>
      {state.kind === 'ok' ? (
        <div className="gm-corps">
          <div className="gm-canvas">
            <ReactFlowProvider>
              <Flow
                contract={state.contract}
                initialLevel={initialLevel}
                selection={selection}
                setSelection={setSelection}
                focus={focus}
                clearFocus={clearFocus}
              />
            </ReactFlowProvider>
          </div>
          <NeighborPanel contract={state.contract} selection={selection} setSelection={setSelection} onChoose={chooseFromSearch} />
        </div>
      ) : (
        <div className="row">
          <span className="ttl" role="status">
            {state.kind === 'loading' ? 'carte en cours de lecture' : `carte indisponible : ${state.reason}`}
          </span>
        </div>
      )}
    </section>
  );
}
