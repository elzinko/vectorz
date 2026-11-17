/**
 * Carte zoomable du process de la méthode (fiche 20261110185357446).
 *
 * Le contrat vient du daemon (`GET /api/process/<projet>`, relais de `ezk process show --json`). Le zoom
 * choisit le niveau de détail (skills, puis étapes, puis acteurs / commandes / réglages) ; la projection
 * est pure (`processProjection.ts`). Sans contrat, la carte dit pourquoi : jamais de données inventées.
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
import { useEffect, useMemo, useState } from 'react';
import { levelForZoom, projectProcessToFlow, type ProcessLevel } from './processProjection.js';
import type { ProcessShow } from './processShow.js';
import type { BoardProject } from './types.js';

type MapState = { kind: 'loading' } | { kind: 'ok'; contract: ProcessShow } | { kind: 'unavailable'; reason: string };

/** Délai avant de redemander le process quand le daemon le lit encore. */
const LOADING_RETRY_MS = 2000;

function useProcessContract(projectName: string): MapState {
  const [state, setState] = useState<MapState>({ kind: 'loading' });
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (): void => {
      fetch(`/api/process/${encodeURIComponent(projectName)}`)
        .then(async (res) => {
          const body = (await res.json()) as { state?: string; process?: ProcessShow; reason?: string; error?: string };
          if (!alive) return;
          if (body.state === 'ok') {
            setState(
              isProcessShow(body.process)
                ? { kind: 'ok', contract: body.process }
                : { kind: 'unavailable', reason: 'contrat du process incomplet (skills ou liens absents)' },
            );
          } else if (body.state === 'loading') {
            setState({ kind: 'loading' });
            timer = setTimeout(load, LOADING_RETRY_MS);
          } else setState({ kind: 'unavailable', reason: body.reason ?? body.error ?? `réponse ${res.status}` });
        })
        .catch(() => {
          if (alive) setState({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
        });
    };
    setState({ kind: 'loading' });
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [projectName]);
  return state;
}

/** Un contrat utilisable : ses listes de skills et de liens existent. Sinon la carte dit pourquoi, au lieu de planter. */
function isProcessShow(value: unknown): value is ProcessShow {
  const c = value as Partial<ProcessShow> | null | undefined;
  return Array.isArray(c?.skills) && Array.isArray(c?.liens);
}

const list = (items: unknown): string[] => (Array.isArray(items) ? (items as string[]) : []);

function Detail({ label, items }: { label: string; items: string[] }): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <div className="pm-detail">
      <b>{label}</b> {items.join(', ')}
    </div>
  );
}

function SkillNode({ data }: NodeProps): JSX.Element {
  return (
    <div className="pm-skill">
      <Handle type="target" position={Position.Left} />
      <div className="pm-skill-nom">{data.nom as string}</div>
      <div className="pm-skill-clair">{data.enClair as string}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function EtapeNode({ data }: NodeProps): JSX.Element {
  const detailed = data.level === 3;
  return (
    <div className="pm-etape">
      <div className="pm-etape-titre">
        {data.num as number}. {data.titre as string}
      </div>
      <div className="pm-etape-clair">{data.enClair as string}</div>
      {detailed && (
        <>
          <Detail label="Joué par" items={list(data.acteurs)} />
          <Detail label="Agents" items={list(data.agents)} />
          <Detail label="Commandes" items={list(data.commandes)} />
          <Detail label="Réglages" items={list(data.reglages)} />
          {typeof data.reglesVide === 'string' ? (
            <div className="pm-detail pm-vide">{data.reglesVide}</div>
          ) : (
            <Detail label="Règles" items={list(data.regles)} />
          )}
        </>
      )}
    </div>
  );
}

const nodeTypes = { skill: SkillNode, etape: EtapeNode };

function Flow({ contract }: { contract: ProcessShow }): JSX.Element {
  const [level, setLevel] = useState<ProcessLevel>(1);
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => projectProcessToFlow(contract, level), [contract, level]);
  return (
    <ReactFlow
      className={`pm-level-${level}`}
      nodes={nodes as Node[]}
      edges={edges as Edge[]}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2.5}
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      onMove={(_, viewport) => setLevel((previous) => levelForZoom(viewport.zoom, previous))}
      onNodeDoubleClick={(_, node) => {
        // Plafond 1,5 : la boîte cadrée reste lisible avec ses voisines, au lieu de remplir l'écran.
        void fitView({ nodes: [{ id: node.id }], duration: 400, maxZoom: 1.5 });
      }}
    >
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function ProcessMap({ project }: { project: BoardProject }): JSX.Element {
  const state = useProcessContract(project.name);
  return (
    <section className="card pm" aria-label="Carte du process de la méthode">
      <div className="vh">
        <h3>Process de la méthode — {project.name}</h3>
        <span className="sub">zoome pour voir les étapes, puis leur détail ; double-clic sur une boîte pour la cadrer</span>
      </div>
      {state.kind === 'ok' ? (
        <div className="pm-canvas">
          <ReactFlowProvider>
            <Flow contract={state.contract} />
          </ReactFlowProvider>
        </div>
      ) : (
        <div className="row">
          <span className="ttl" role="status">
            {state.kind === 'loading' ? 'process en cours de lecture' : `process indisponible : ${state.reason}`}
          </span>
        </div>
      )}
    </section>
  );
}
