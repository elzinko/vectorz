/**
 * Mise en page pure de l'écran Process (fiche 20261117223348250, maquette B).
 *
 * En clair : les skills du flux se posent en ligne, de gauche à droite, chacun avec ses étapes en
 * rang. Les liens entre skills et les boucles entre étapes deviennent des arcs. Les outils (l'archive)
 * vont dans une boîte à part, sous le flux. Aucun React ici, et aucune boucle écrite en dur : tout
 * vient du contrat `process show`.
 *
 *   [ Backlog ] ──lien──▶ [ Sprint ] ──lien──▶ [ Rétro ]
 *        ▲  ╰── boucle au-dessus : retour dans un skill, ou d'un skill à un autre
 *        ╰──── lien vers l'arrière : arc sous les phases
 *   Boîte à outils · hors du flux : [ Archive ]
 */
import type { ProcessShow, ProcessSkill } from './processShow.js';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Le genre d'un arc, déduit de sa géométrie, jamais de son nom :
 * - `flow` : un lien vers le skill suivant ;
 * - `improve` : un lien vers un skill précédent (la rétro nourrit le backlog) ;
 * - `fail` : une boucle qui revient en arrière dans son skill, sans repartir du début ;
 * - `story` : une boucle qui repart de la première étape de son skill ;
 * - `auto` : une boucle d'un skill à un autre.
 */
export type ArcKind = 'flow' | 'improve' | 'fail' | 'story' | 'auto';

export interface Arc {
  kind: ArcKind;
  /** Un arc qui naît et meurt dans une phase (échec, story suivante) se dessine au-dessus d'elle. */
  inner: boolean;
  /** Le tracé SVG, en coordonnées du monde. */
  d: string;
  /** Le libellé publié par la méthode, découpé en lignes courtes. */
  label: string[];
  lx: number;
  ly: number;
}

export interface ProcessLayout {
  world: { w: number; h: number };
  /** Un rectangle par skill, rangé par id. */
  phases: Record<string, Rect>;
  /** Un rectangle par étape, rangé par `<skill>:<étape>`. */
  steps: Record<string, Rect>;
  arcs: Arc[];
  /** Les skills du flux, dans l'ordre ; puis les outils. */
  flow: string[];
  tools: string[];
  /** Où poser le titre de la boîte à outils ; `null` sans outil. */
  toolsLabel: { x: number; y: number } | null;
}

export const STEP_W = 130;
export const STEP_H = 190;
const STEP_GAP = 18;
const PAD = 30;
const HEAD = 200;
const FOOT = 100;
const PHASE_GAP = 300;
const MARGIN = 60;
/** De la place au-dessus des phases pour les boucles d'un skill à l'autre. */
const TOP = 240;
const TOOL_HEAD = 150;
const TOOL_FOOT = 30;

export const stepKey = (skill: string, etape: string): string => `${skill}:${etape}`;

/** Coupe un libellé en lignes d'environ `width` caractères, au mot. */
export function wrapLabel(text: string, width = 28): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function placeRow(skill: ProcessSkill, x: number, y: number, head: number, foot: number, out: ProcessLayout): Rect {
  const n = skill.etapes.length;
  const box = { x, y, w: n * STEP_W + Math.max(0, n - 1) * STEP_GAP + 2 * PAD, h: head + STEP_H + foot };
  skill.etapes.forEach((e, i) => {
    out.steps[stepKey(skill.id, e.id)] = { x: x + PAD + i * (STEP_W + STEP_GAP), y: y + head, w: STEP_W, h: STEP_H };
  });
  out.phases[skill.id] = box;
  return box;
}

const midX = (r: Rect): number => r.x + r.w / 2;

export function layoutProcess(contract: ProcessShow): ProcessLayout {
  const out: ProcessLayout = { world: { w: 0, h: 0 }, phases: {}, steps: {}, arcs: [], flow: [], tools: [], toolsLabel: null };
  const flowSkills = contract.skills.filter((s) => !s.outil);
  const toolSkills = contract.skills.filter((s) => s.outil);
  out.flow = flowSkills.map((s) => s.id);
  out.tools = toolSkills.map((s) => s.id);

  let x = MARGIN;
  for (const s of flowSkills) x += placeRow(s, x, TOP, HEAD, FOOT, out).w + PHASE_GAP;
  const flowRight = flowSkills.length > 0 ? x - PHASE_GAP : MARGIN;
  const bottom = TOP + HEAD + STEP_H + FOOT;
  const order = new Map(out.flow.map((id, i) => [id, i]));

  // Les liens : vers l'avant, une flèche entre deux phases ; vers l'arrière, un arc sous les phases.
  let improveDepth = 0;
  for (const l of contract.liens) {
    const a = out.phases[l.de];
    const b = out.phases[l.vers];
    if (!a || !b) continue;
    // Entre deux phases, l'écart est étroit : des lignes courtes, pour ne pas passer sous les boîtes.
    const label = wrapLabel(l.libelle, 16);
    if ((order.get(l.vers) ?? 0) > (order.get(l.de) ?? 0)) {
      const cy = TOP + a.h / 2;
      out.arcs.push({ kind: 'flow', inner: false, d: `M${a.x + a.w + 8},${cy} L${b.x - 10},${cy}`, label, lx: (a.x + a.w + b.x) / 2, ly: cy - 18 - 22 * (label.length - 1) });
    } else {
      const depth = 210 + 60 * improveDepth++;
      const from = midX(a);
      const to = midX(b);
      out.arcs.push({
        kind: 'improve',
        inner: false,
        d: `M${from},${bottom + 6} C${from},${bottom + depth} ${to},${bottom + depth} ${to},${bottom + 12}`,
        label: wrapLabel(l.libelle, 60),
        lx: (from + to) / 2,
        // Le creux d'une courbe de Bézier descend aux trois quarts de ses points de contrôle : le
        // libellé se pose juste dessous, jamais sur le trait.
        ly: bottom + depth * 0.75 + 40,
      });
    }
  }

  // Les boucles : les plus courtes au plus près des étapes, pour que les arcs ne se croisent pas.
  const skillOf = (key: string): string => key.split(':')[0];
  const firstStep = new Map(contract.skills.map((s) => [s.id, s.etapes[0] ? stepKey(s.id, s.etapes[0].id) : '']));
  const span = (de: string, vers: string): number => Math.abs((out.steps[de]?.x ?? 0) - (out.steps[vers]?.x ?? 0));
  const boucles = [...contract.boucles].filter((b) => out.steps[b.de] && out.steps[b.vers]).sort((p, q) => span(p.de, p.vers) - span(q.de, q.vers));
  let above = 0;
  let below = 0;
  let across = 0;
  for (const b of boucles) {
    const from = out.steps[b.de];
    const to = out.steps[b.vers];
    const label = wrapLabel(b.libelle, 30);
    if (skillOf(b.de) !== skillOf(b.vers)) {
      // D'un skill à l'autre : un grand arc au-dessus des phases.
      const peak = TOP - 175 - 50 * across++;
      const sx = midX(from);
      const tx = midX(to);
      // Le sommet de la courbe est aux trois quarts de ses points de contrôle : le libellé le surplombe.
      const apex = TOP - 6 + 0.75 * (peak - (TOP - 6));
      out.arcs.push({ kind: 'auto', inner: false, d: `M${sx},${TOP - 6} C${sx},${peak} ${tx},${peak} ${tx},${TOP - 10}`, label, lx: (sx + tx) / 2, ly: apex - 14 - 26 * (label.length - 1) });
    } else if (firstStep.get(skillOf(b.vers)) === b.vers) {
      // Retour à la première étape : la story suivante, sous les étapes.
      const base = from.y + from.h;
      const low = base + 90 + 30 * below++;
      const sx = midX(from);
      const tx = midX(to);
      out.arcs.push({ kind: 'story', inner: true, d: `M${sx},${base + 4} C${sx},${low} ${tx},${low} ${tx},${base + 8}`, label, lx: (sx + tx) / 2, ly: low - 4 });
    } else {
      // Retour en arrière dans le skill : un échec, juste au-dessus des étapes.
      const top = from.y;
      const high = top - 40 - 34 * above;
      const apex = top - 4 + 0.75 * (high - (top - 4));
      const sx = midX(from);
      const tx = midX(to) + (above % 2 === 0 ? -22 : 22);
      above++;
      out.arcs.push({ kind: 'fail', inner: true, d: `M${sx},${top - 4} C${sx},${high} ${tx},${high} ${tx},${top - 6}`, label: [label.join(' ')], lx: sx, ly: apex - 6 }); // libellé au-dessus de l'étape de départ : les arcs imbriqués finissent tous au même endroit
    }
  }

  // Les outils : une boîte sous le flux, hors de toute flèche.
  let worldH = bottom + 210 + 60 * Math.max(0, improveDepth - 1) + 60;
  if (toolSkills.length > 0) {
    const ty = worldH + 70;
    out.toolsLabel = { x: MARGIN, y: ty - 44 };
    let tx = MARGIN;
    let toolBottom = ty;
    for (const s of toolSkills) {
      const box = placeRow(s, tx, ty, TOOL_HEAD, TOOL_FOOT, out);
      tx += box.w + 40;
      toolBottom = Math.max(toolBottom, box.y + box.h);
    }
    worldH = toolBottom + MARGIN;
  }
  out.world = { w: Math.max(flowRight + MARGIN, MARGIN * 2), h: worldH };
  return out;
}

/** La caméra : le déplacement et l'échelle qui cadrent `target` dans la zone visible. */
export function fitCamera(
  target: Rect,
  view: { w: number; h: number },
  options: { margin: number; top: number; maxScale: number },
): { tx: number; ty: number; s: number } {
  const { margin, top, maxScale } = options;
  const s = Math.max(0.01, Math.min((view.w - 2 * margin) / target.w, (view.h - top - margin) / target.h, maxScale));
  return {
    tx: (view.w - target.w * s) / 2 - target.x * s,
    ty: top + (view.h - top - margin - target.h * s) / 2 - target.y * s,
    s,
  };
}
