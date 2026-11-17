/**
 * Projection pure du contrat `process show` en nœuds et arêtes de la carte zoomable
 * (fiche 20261110185357446). Aucun React ici : le rendu consomme ce résultat.
 *
 * Les positions et tailles ne dépendent PAS du niveau : changer de niveau n'ajoute ou ne retire que du
 * contenu, jamais ne déplace la caméra (règle ux/no-layout-shift).
 */
import { levelForZoom as sharedLevelForZoom, type ZoomLevel } from './semanticZoom.js';
import type { ProcessEtape, ProcessShow, ProcessSkill } from './processShow.js';

export type ProcessLevel = ZoomLevel;

export interface FlowNode {
  id: string;
  type: 'skill' | 'etape';
  position: { x: number; y: number };
  width: number;
  height: number;
  parentId?: string;
  extent?: 'parent';
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

/**
 * Seuils de zoom : sous le premier, niveau 1 ; au-dessus du second, niveau 3. Calés sur la carte
 * réelle : cadrée en entier, elle s'affiche vers 0,25. Les étapes arrivent dès qu'on a doublé ce
 * zoom, leur détail quand une étape remplit à peu près l'écran.
 */
export const ZOOM_THRESHOLDS = [0.4, 0.85] as const;
const STEP_W = 260;
const STEP_H = 190;
const GAP = 20;
const SKILL_HEADER = 100;
const SKILL_COLS = 2;
const SKILL_GAP = 80;

const skillId = (id: string): string => `skill:${id}`;
const etapeId = (skill: string, etape: string): string => `etape:${skill}:${etape}`;

/** Le niveau de détail pour un zoom, avec les seuils de cette carte (mécanisme partagé : `semanticZoom.ts`). */
export const levelForZoom = (zoom: number, previous?: ProcessLevel): ProcessLevel =>
  sharedLevelForZoom(zoom, ZOOM_THRESHOLDS, previous);

function skillSize(skill: ProcessSkill): { width: number; height: number } {
  const rows = Math.max(1, Math.ceil(skill.etapes.length / 2));
  return {
    width: 2 * STEP_W + 3 * GAP,
    height: SKILL_HEADER + rows * (STEP_H + GAP) + GAP,
  };
}

function etapeData(e: ProcessEtape, level: ProcessLevel): Record<string, unknown> {
  const base = { level, titre: e.titre, num: e.num, enClair: e.enClair };
  if (level < 3) return base;
  return {
    ...base,
    acteurs: e.joueePar,
    agents: e.agents,
    commandes: e.commandes,
    reglages: e.reglages.map((r) => `${r.cle} = ${r.valeur}`),
    regles: e.regles,
    ...(e.regles.length === 0 ? { reglesVide: 'aucune règle publiée' } : {}),
  };
}

/** Place les skills en grille, chaque rangée à la hauteur de sa boîte la plus haute. */
function skillOrigins(skills: ProcessSkill[]): { x: number; y: number }[] {
  const origins: { x: number; y: number }[] = [];
  let y = 0;
  for (let start = 0; start < skills.length; start += SKILL_COLS) {
    const row = skills.slice(start, start + SKILL_COLS);
    let x = 0;
    for (const skill of row) {
      origins.push({ x, y });
      x += skillSize(skill).width + SKILL_GAP;
    }
    y += Math.max(...row.map((s) => skillSize(s).height)) + SKILL_GAP;
  }
  return origins;
}

export function projectProcessToFlow(contract: ProcessShow, level: ProcessLevel): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const origins = skillOrigins(contract.skills);
  const skillNodes: FlowNode[] = contract.skills.map((s, i) => ({
    id: skillId(s.id),
    type: 'skill',
    position: origins[i]!,
    ...skillSize(s),
    data: { level, nom: s.nom, enClair: s.enClair },
  }));
  const etapeNodes: FlowNode[] =
    level < 2
      ? []
      : contract.skills.flatMap((s) =>
          s.etapes.map((e, i) => ({
            id: etapeId(s.id, e.id),
            type: 'etape' as const,
            parentId: skillId(s.id),
            extent: 'parent' as const,
            position: {
              x: GAP + (i % 2) * (STEP_W + GAP),
              y: SKILL_HEADER + Math.floor(i / 2) * (STEP_H + GAP),
            },
            width: STEP_W,
            height: STEP_H,
            data: etapeData(e, level),
          })),
        );
  const edges: FlowEdge[] = contract.liens.map((l) => ({
    id: `lien:${l.de}:${l.vers}`,
    source: skillId(l.de),
    target: skillId(l.vers),
    label: l.libelle,
  }));
  return { nodes: [...skillNodes, ...etapeNodes], edges };
}
