import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * map-data — la carte interactive est FIDÈLE PAR CONSTRUCTION (épic « carte fidèle », PR #162).
 *
 * Même filet d'invariant que composes-graph.test.ts : le bloc de données régénéré en
 * mémoire depuis le catalogue réel doit être EXACTEMENT le bloc présent dans le HTML de
 * la carte. Catalogue modifié sans relancer `pnpm map:data` ⇒ ce test rougit — la carte
 * ne peut pas dériver des fichiers en silence.
 */
import { describe, expect, it } from 'vitest';
import {
  BANDES,
  MAP_DATA_BEGIN,
  MAP_DATA_END,
  buildMapData,
  buildMapDataBlock,
  upsertMapDataBlock,
} from '../core/map-data.js';
import { loadCatalog } from '../loaders/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const mapPath = join(
  megaCity,
  '..',
  '..',
  'diagrams',
  'methode-mega-city',
  'carte-interactive.html',
);

function extractBlock(text: string): string {
  const beginIdx = text.indexOf(MAP_DATA_BEGIN);
  const endIdx = text.indexOf(MAP_DATA_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('bloc ezk-map-data absent de la carte — lancer `pnpm map:data`');
  }
  return text.slice(beginIdx, endIdx + MAP_DATA_END.length);
}

describe('carte-interactive.html — données à jour (fidélité par construction)', () => {
  it('le bloc régénéré en mémoire est identique au bloc présent sur disque', () => {
    const catalog = loadCatalog(megaCity);
    const expected = buildMapDataBlock(catalog);
    const actual = extractBlock(readFileSync(mapPath, 'utf8'));
    expect(actual).toBe(expected);
  });

  it('chaque skill du catalogue a une bande (les 4 officielles, ou hors-bande visible)', () => {
    const data = buildMapData(loadCatalog(megaCity));
    const shelved = Object.values(data.bandes).flat().sort();
    expect(shelved).toEqual(Object.keys(data.skills).sort());
    // Les bandes officielles (ADR-0020 §1) ne citent que des skills existants.
    for (const ids of Object.values(BANDES)) {
      for (const id of ids) expect(data.skills[id], `bande ADR-0020 cite ${id}`).toBeDefined();
    }
  });

  it('upsertMapDataBlock refuse un HTML sans marqueurs (erreur franche, pas d’append)', () => {
    expect(() => upsertMapDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });
});
