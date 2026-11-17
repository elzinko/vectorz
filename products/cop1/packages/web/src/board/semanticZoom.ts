/**
 * Le zoom sémantique, commun aux cartes de mission control : le niveau de détail (1, 2 ou 3) se déduit
 * du zoom, sans bouton. Chaque carte donne SES seuils, calés sur la taille réelle de sa carte.
 */
export type ZoomLevel = 1 | 2 | 3;

/** Sous le premier seuil, niveau 1 ; au-dessus du second, niveau 3. */
export type ZoomThresholds = readonly [number, number];

/** Marge de chaque côté d'un seuil avant de changer de niveau. */
const HYSTERESIS = 0.1;

function plainLevel(zoom: number, thresholds: ZoomThresholds): ZoomLevel {
  if (zoom < thresholds[0]) return 1;
  return zoom < thresholds[1] ? 2 : 3;
}

/**
 * Le niveau de détail pour un zoom. Avec un niveau précédent, on ne le quitte qu'une fois le seuil
 * franchi de 10 % : à ±5 % d'un seuil, la carte ne clignote pas d'un niveau à l'autre.
 */
export function levelForZoom(zoom: number, thresholds: ZoomThresholds, previous?: ZoomLevel): ZoomLevel {
  if (previous === undefined) return plainLevel(zoom, thresholds);
  let level = previous;
  while (level < 3 && zoom > thresholds[level - 1]! * (1 + HYSTERESIS)) level = (level + 1) as ZoomLevel;
  while (level > 1 && zoom < thresholds[level - 2]! * (1 - HYSTERESIS)) level = (level - 1) as ZoomLevel;
  return level;
}

interface Box {
  position: { x: number; y: number };
  width: number;
  height: number;
}

/** Le zoom d'un cadrage complet de ces boîtes dans une fenêtre : celui où la carte entière s'affiche. */
export function fitZoom(boxes: readonly Box[], viewport: { width: number; height: number }): number {
  const left = Math.min(...boxes.map((b) => b.position.x));
  const top = Math.min(...boxes.map((b) => b.position.y));
  const right = Math.max(...boxes.map((b) => b.position.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.position.y + b.height));
  return Math.min(viewport.width / (right - left), viewport.height / (bottom - top));
}
