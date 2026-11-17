/**
 * Le zoom sémantique partagé par les cartes (Process, Carte de la méthode) : le niveau se déduit du
 * zoom et de SES seuils, avec 10 % d'hystérésis ; le zoom du cadrage complet se mesure sur les boîtes.
 */
import { describe, expect, it } from 'vitest';
import { fitZoom, levelForZoom } from './semanticZoom.js';

const THRESHOLDS = [0.3, 0.8] as const;

describe('levelForZoom — seuils en paramètre', () => {
  it('sans niveau précédent : le niveau brut', () => {
    expect(levelForZoom(0.2, THRESHOLDS)).toBe(1);
    expect(levelForZoom(0.5, THRESHOLDS)).toBe(2);
    expect(levelForZoom(1.5, THRESHOLDS)).toBe(3);
  });

  it('à ±5 % d’un seuil, le niveau ne change pas', () => {
    expect(levelForZoom(0.3 * 0.95, THRESHOLDS, 2)).toBe(2);
    expect(levelForZoom(0.3 * 1.05, THRESHOLDS, 1)).toBe(1);
    expect(levelForZoom(0.8 * 1.05, THRESHOLDS, 2)).toBe(2);
    expect(levelForZoom(0.8 * 0.95, THRESHOLDS, 3)).toBe(3);
  });

  it('à ±15 % d’un seuil, le niveau change', () => {
    expect(levelForZoom(0.3 * 0.85, THRESHOLDS, 2)).toBe(1);
    expect(levelForZoom(0.3 * 1.15, THRESHOLDS, 1)).toBe(2);
    expect(levelForZoom(0.8 * 1.15, THRESHOLDS, 2)).toBe(3);
    expect(levelForZoom(0.8 * 0.85, THRESHOLDS, 3)).toBe(2);
  });
});

describe('fitZoom — le zoom du cadrage complet', () => {
  it('prend la plus contraignante des deux dimensions', () => {
    const boxes = [
      { position: { x: 0, y: 0 }, width: 1000, height: 100 },
      { position: { x: 1000, y: 0 }, width: 1000, height: 500 },
    ];
    expect(fitZoom(boxes, { width: 1000, height: 500 })).toBeCloseTo(0.5);
    expect(fitZoom(boxes, { width: 4000, height: 250 })).toBeCloseTo(0.5);
  });
});
