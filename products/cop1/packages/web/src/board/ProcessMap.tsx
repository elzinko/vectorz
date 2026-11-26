/**
 * L'écran Process, de gauche à droite (fiche 20261117223348250, maquette B + panneau).
 *
 * Le contrat vient du daemon (`GET /api/process/<projet>`, relais de `ezk process show --json`).
 * Trois niveaux, une caméra animée : la vue d'ensemble, une phase, une étape. Un clic sur une phase
 * zoome dessus ; un clic sur une étape ouvre son détail dans le panneau de droite. Échap remonte d'un
 * niveau ; les flèches passent à l'étape voisine. La mise en page est pure (`processLayout.ts`).
 * Sans contrat, la carte dit pourquoi : jamais de données inventées.
 */
import { type KeyboardEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { type Arc, type ArcKind, fitCamera, layoutProcess, type ProcessLayout, type Rect, stepKey } from './processLayout.js';
import { InfoButton } from './Chrome.js';
import { PROCESS_READING, type ProcessEtape, type ProcessShow, type ProcessSkill } from './processShow.js';
import type { BoardProject } from './types.js';
import { useDaemonContract } from './useDaemonContract.js';

/** La couleur d'une phase suit son rang dans le flux ; un outil a la sienne. */
const HUES = ['backlog', 'sprint', 'retro'];
const hueOf = (layout: ProcessLayout, skillId: string): string => {
  if (layout.tools.includes(skillId)) return 'tool';
  return HUES[layout.flow.indexOf(skillId) % HUES.length] ?? 'backlog';
};

const ARC_KINDS: ArcKind[] = ['flow', 'improve', 'story', 'fail', 'auto'];
const PANEL_W = 340;
const NARROW = 700;

function ArcPath({ arc }: { arc: Arc }): JSX.Element {
  return (
    <>
      <path className={`pr-edge ${arc.kind}`} d={arc.d} markerEnd={`url(#pr-mk-${arc.kind})`} />
      <text className={`pr-elabel ${arc.kind}`} x={arc.lx} y={arc.ly} textAnchor="middle">
        {arc.label.map((line, i) => (
          <tspan key={line} x={arc.lx} dy={i === 0 ? 0 : '1.15em'}>
            {line}
          </tspan>
        ))}
      </text>
    </>
  );
}

function Items({ title, items, empty }: { title: string; items: string[]; empty: string }): JSX.Element {
  return (
    <div>
      <p className="pr-k">{title}</p>
      <ul>
        {items.length === 0 ? <li className="none">{empty}</li> : items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}

function StepPanel({ skill, etape }: { skill: ProcessSkill; etape: ProcessEtape }): JSX.Element {
  const agents = [...etape.agents, ...(etape.joueePar.includes('humain') ? ['le PO (humain)'] : [])];
  return (
    <>
      <div>
        <p className="pr-k">
          {skill.nom} · étape {etape.num}
        </p>
        <h3>{etape.titre}</h3>
      </div>
      <p>{etape.enClair}</p>
      <Items title="Commandes" items={etape.commandes} empty="aucune commande" />
      <Items title="Agents" items={agents} empty="aucun agent" />
      <Items title="Règles" items={etape.regles} empty="aucune règle rattachée" />
      <Items title="Réglages du projet" items={etape.reglages.map((r) => `${r.cle} = ${r.valeur}`)} empty="aucun réglage" />
    </>
  );
}

function PhasePanel({ skill, onStep }: { skill: ProcessSkill; onStep: (key: string) => void }): JSX.Element {
  return (
    <>
      <div>
        <p className="pr-k">{skill.outil ? 'Outil' : 'Phase'}</p>
        <h3>{skill.nom}</h3>
      </div>
      <p>{skill.enClair}</p>
      <div>
        <p className="pr-k">Étapes, dans l'ordre</p>
        <ol>
          {skill.etapes.map((e) => (
            <li key={e.id}>
              <button type="button" className="pr-lnk" onClick={() => onStep(stepKey(skill.id, e.id))}>
                {e.titre}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

/** La taille de la scène, mesurée ; un défaut quand le navigateur ne mesure rien (tests). */
function useStageSize(ref: RefObject<HTMLDivElement>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 1000, h: 600 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = (): void => {
      if (el.clientWidth > 0 && el.clientHeight > 0) setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function Stage({ contract }: { contract: ProcessShow }): JSX.Element {
  const layout = useMemo(() => layoutProcess(contract), [contract]);
  const skills = useMemo(() => new Map(contract.skills.map((s) => [s.id, s])), [contract]);
  const [focus, setFocus] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef);

  const phaseId = focus ? focus.split(':')[0] : null;
  const level = focus === null ? 0 : focus.includes(':') ? 2 : 1;
  const skill = phaseId ? skills.get(phaseId) : undefined;
  const etapeIndex = skill && level === 2 ? skill.etapes.findIndex((e) => stepKey(skill.id, e.id) === focus) : -1;
  const etape = skill && etapeIndex >= 0 ? skill.etapes[etapeIndex] : undefined;

  // La caméra cadre la phase (niveaux 1 et 2) : l'étape choisie se lit dans le panneau.
  const narrow = size.w <= NARROW;
  const panelOn = level > 0;
  const view = { w: panelOn && !narrow ? size.w - PANEL_W : size.w, h: panelOn && narrow ? size.h * 0.48 : size.h };
  const target: Rect = phaseId && layout.phases[phaseId] ? layout.phases[phaseId] : { x: 0, y: 0, w: layout.world.w, h: layout.world.h };
  const cam = fitCamera(target, view, { margin: level === 0 ? 24 : 40, top: 48, maxScale: 2.2 });

  const up = (): void => setFocus(level === 2 ? phaseId : null);
  const neighbours = (delta: number): string | null => {
    if (level === 2 && skill) {
      const next = skill.etapes[etapeIndex + delta];
      return next ? stepKey(skill.id, next.id) : null;
    }
    if (level === 1 && phaseId) {
      const k = layout.flow.indexOf(phaseId);
      return k >= 0 ? (layout.flow[k + delta] ?? null) : null;
    }
    return null;
  };
  const move = (delta: number): void => {
    const next = neighbours(delta);
    if (next) setFocus(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && level > 0) {
      event.preventDefault();
      up();
    } else if (event.key === 'ArrowRight' && level > 0) move(1);
    else if (event.key === 'ArrowLeft' && level > 0) move(-1);
  };
  const scope = level === 2 ? 'étape' : 'phase';

  return (
    <div ref={stageRef} className={`pr-stage lvl-${level}${panelOn ? ' has-panel' : ''}`} onKeyDown={onKeyDown}>
      <nav className="pr-crumbs" aria-label="Fil d'Ariane du process">
        <button type="button" className="pr-crumb" aria-current={level === 0 ? 'true' : undefined} onClick={() => setFocus(null)}>
          Process
        </button>
        {skill && (
          <>
            <span className="pr-crumb-sep">›</span>
            <button type="button" className="pr-crumb" aria-current={level === 1 ? 'true' : undefined} onClick={() => setFocus(skill.id)}>
              {skill.nom}
            </button>
          </>
        )}
        {etape && (
          <>
            <span className="pr-crumb-sep">›</span>
            <span className="pr-crumb" aria-current="true">
              {etape.titre}
            </span>
          </>
        )}
        {level > 0 && (
          <span className="pr-navbtns">
            <button type="button" disabled={neighbours(-1) === null} onClick={() => move(-1)}>
              ← {scope} précédente
            </button>
            <button type="button" disabled={neighbours(1) === null} onClick={() => move(1)}>
              {scope} suivante →
            </button>
          </span>
        )}
      </nav>
      <div
        className="pr-world"
        style={{ width: layout.world.w, height: layout.world.h, transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}
      >
        <svg width={layout.world.w} height={layout.world.h} aria-hidden="true">
          <defs>
            {ARC_KINDS.map((k) => (
              <marker key={k} id={`pr-mk-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth={k === 'improve' ? 3.2 : 4.5} markerHeight={k === 'improve' ? 3.2 : 4.5} orient="auto">
                <path className={`pr-mk ${k}`} d="M0,0 L10,5 L0,10 z" />
              </marker>
            ))}
          </defs>
          {layout.arcs
            .filter((arc) => !arc.inner)
            .map((arc) => (
              <ArcPath key={`${arc.kind}-${arc.d}`} arc={arc} />
            ))}
        </svg>
        {layout.toolsLabel && (
          <div className="pr-tools-label" style={{ left: layout.toolsLabel.x, top: layout.toolsLabel.y }}>
            Boîte à outils · hors du flux
          </div>
        )}
        {contract.skills.map((s) => {
          const box = layout.phases[s.id];
          if (!box) return null;
          return (
            <button
              type="button"
              key={s.id}
              className={`pr-phase hue-${hueOf(layout, s.id)}`}
              style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              aria-label={`Zoomer sur ${s.nom}`}
              onClick={() => (phaseId === s.id && level === 1 ? setFocus(null) : setFocus(s.id))}
            >
              <span className="pr-p-head">
                {s.outil && <span className="pr-p-tag">outil</span>}
                <span className="pr-p-title">{s.nom}</span>
                <span className="pr-p-sub">{s.enClair}</span>
              </span>
            </button>
          );
        })}
        {contract.skills.flatMap((s) =>
          s.etapes.map((e) => {
            const key = stepKey(s.id, e.id);
            const box = layout.steps[key];
            if (!box) return null;
            return (
              <button
                type="button"
                key={key}
                className={`pr-step hue-${hueOf(layout, s.id)}${focus === key ? ' is-focus' : ''}`}
                style={{ left: box.x, top: box.y, width: box.w, minHeight: box.h }}
                aria-label={`${s.nom}, étape ${e.num} : ${e.titre}`}
                onClick={() => setFocus(level === 0 ? s.id : key)}
              >
                <span className="pr-s-big">{e.num}</span>
                <span className="pr-s-num">{String(e.num).padStart(2, '0')}</span>
                <span className="pr-s-title">{e.titre}</span>
                <span className="pr-s-body">{e.enClair}</span>
              </button>
            );
          }),
        )}
        {/* Les boucles internes à une phase, au-dessus de son fond, pour rester visibles au zoom. */}
        <svg className="pr-front" width={layout.world.w} height={layout.world.h} aria-hidden="true">
          {layout.arcs
            .filter((arc) => arc.inner)
            .map((arc) => (
              <ArcPath key={`${arc.kind}-${arc.d}`} arc={arc} />
            ))}
        </svg>
      </div>
      {skill && (
        <aside className={`pr-panel hue-${hueOf(layout, skill.id)}`} aria-label={etape ? "Détail de l'étape" : 'Détail de la phase'}>
          {etape ? <StepPanel skill={skill} etape={etape} /> : <PhasePanel skill={skill} onStep={setFocus} />}
        </aside>
      )}
    </div>
  );
}

export function ProcessMap({ project }: { project: BoardProject }): JSX.Element {
  const state = useDaemonContract<ProcessShow>(project.name, PROCESS_READING);
  return (
    <section className="card pr" aria-label="Carte du process de la méthode">
      <div className="vh">
        <h3>Process de la méthode — {project.name}</h3>
        <InfoButton text="De gauche à droite, avec ses boucles. Clique une phase pour zoomer, une étape pour son détail." />
      </div>
      {state.kind === 'ok' ? (
        <div className="pr-stage-box">
          <Stage contract={state.contract} />
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
