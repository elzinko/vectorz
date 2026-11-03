// @vitest-environment node
/**
 * Le carnet de tests de mission control (fiche 20261102182259592) déclare un écran par vue. Ce test
 * fait tomber la suite si une vue du code manque à l'arbre déclaré, ou si l'arbre garde une vue
 * retirée du code.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VIEW_IDS } from './viewIds.js';

const TREE = fileURLToPath(new URL('../../../../../../.vectorz/carto/mission-control.yml', import.meta.url));

/** Les écrans d'un arbre de carnet : les `- id:` du premier niveau de `screens:`, pas leurs actions. */
function screensOf(yaml: string): string[] {
  return [...yaml.matchAll(/^ {2}- id: ([a-z0-9-]+)\s*$/gm)].map((m) => m[1] as string);
}

/** Les vues du code absentes de l'arbre, puis les écrans de l'arbre absents du code. */
function drift(views: readonly string[], screens: readonly string[]): { missing: string[]; stale: string[] } {
  return {
    missing: views.filter((v) => !screens.includes(v)),
    stale: screens.filter((s) => !views.includes(s)),
  };
}

describe('le carnet de mission control suit ses vues', () => {
  it('chaque vue du code a son écran dans l’arbre déclaré, et rien de plus', () => {
    const screens = screensOf(readFileSync(TREE, 'utf8'));
    expect(screens.length).toBe(VIEW_IDS.length);
    expect(drift(VIEW_IDS, screens)).toEqual({ missing: [], stale: [] });
  });

  it('une vue retirée de l’arbre est signalée, nommée', () => {
    const screens = screensOf(readFileSync(TREE, 'utf8')).filter((s) => s !== 'law');
    expect(drift(VIEW_IDS, screens).missing).toEqual(['law']);
  });

  it('les actions d’un écran ne comptent pas comme des écrans', () => {
    expect(screensOf('screens:\n  - id: fiches\n    actions:\n      - id: ouvrir-fiche\n')).toEqual(['fiches']);
  });
});
