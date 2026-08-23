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
import { validateMethod } from '../core/ceremonies.js';
import {
  MAP_DATA_BEGIN,
  MAP_DATA_END,
  buildMapData,
  buildMapDataBlock,
  upsertMapDataBlock,
} from '../core/map-data.js';
import { validateTaxonomie } from '../core/taxonomie.js';
import type { Catalog } from '../loaders/catalog.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

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
    const expected = buildMapDataBlock(
      catalog,
      loadMethodDoc(megaCity),
      loadTaxonomieDoc(megaCity),
    );
    const actual = extractBlock(readFileSync(mapPath, 'utf8'));
    expect(actual).toBe(expected);
  });

  it('ADR-0039 — chaque skill et chaque agent a un étage, et hors-bande est vide', () => {
    const catalog = loadCatalog(megaCity);
    const data = buildMapData(catalog, undefined, loadTaxonomieDoc(megaCity));
    for (const s of Object.values(data.skills)) {
      expect(s.etage, `skill ${s.id} sans étage`).toBeDefined();
    }
    for (const a of Object.values(data.agents)) {
      expect(a.etage, `agent ${a.id} sans étage`).toBeDefined();
    }
    // La complétude est garantie par validateTaxonomie ; ici on fige la conséquence
    // visible : plus aucun skill méthode oublié des bandes.
    expect(data.bandes['hors-bande']).toEqual([]);
    // Les bandes ne contiennent que des skills de l'étage méthode.
    for (const ids of [data.bandes.ceremonies, data.bandes.artefacts]) {
      for (const id of ids) expect(data.skills[id].etage).toBe('methode');
    }
  });

  it('upsertMapDataBlock refuse un HTML sans marqueurs (erreur franche, pas d’append)', () => {
    expect(() => upsertMapDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });
});

/**
 * ceremonies.yml — la carte totale de la méthode NE PEUT PAS mentir (lot 1, garde-fou
 * du panel adverse) : toute référence hors catalogue fait échouer la compilation.
 */
describe('validateMethod — la liste des cérémonies est vérifiée contre le catalogue', () => {
  const tiny = (): Catalog => ({
    rules: new Map(),
    bundles: new Map(),
    profiles: new Map(),
    agents: new Map([['ezk-pm', { id: 'ezk-pm', role: '', competences: [], interactions: [] }]]),
    skills: new Map([
      ['ezk-backlog', { id: 'ezk-backlog', content: '', argumentHint: '[help|groom|ready]' }],
      ['ezk-sprint', { id: 'ezk-sprint', content: '' }], // pas d'argument-hint
    ]),
  });
  const el = (over: object) => ({
    id: 'x',
    type: 'ceremonie' as const,
    nom: 'X',
    etat: 'fidele' as const,
    implemente_par: ['ezk-backlog:groom'],
    ...over,
  });

  it('accepte les quatre formes valides (humain, agent:, skill, skill:sous-commande)', () => {
    const doc = validateMethod(tiny(), {
      elements: [
        el({ implemente_par: ['humain', 'agent:ezk-pm', 'ezk-sprint', 'ezk-backlog:groom'] }),
      ],
    });
    expect(doc.elements[0].implemente_par).toHaveLength(4);
  });

  it('jette sur un skill inconnu', () => {
    expect(() => validateMethod(tiny(), { elements: [el({ implemente_par: ['ghost'] })] })).toThrow(
      /skill inconnu/,
    );
  });

  it('jette sur une sous-commande absente de l’argument-hint', () => {
    expect(() =>
      validateMethod(tiny(), { elements: [el({ implemente_par: ['ezk-backlog:ship'] })] }),
    ).toThrow(/sous-commande absente/);
  });

  it('jette sur une sous-commande d’un skill sans argument-hint', () => {
    expect(() =>
      validateMethod(tiny(), { elements: [el({ implemente_par: ['ezk-sprint:go'] })] }),
    ).toThrow(/n'expose pas/);
  });

  it('jette sur un agent inconnu et sur un état fidèle sans implémenteur', () => {
    expect(() =>
      validateMethod(tiny(), { elements: [el({ implemente_par: ['agent:ghost'] })] }),
    ).toThrow(/agent inconnu/);
    expect(() => validateMethod(tiny(), { elements: [el({ implemente_par: [] })] })).toThrow(
      /sans implémenteur/,
    );
  });

  it('taxonomie.yml — les pièges jettent (complétude, ids inconnus, doublons, bandes)', () => {
    const cat = tiny(); // ezk-backlog, ezk-sprint (skills) + ezk-pm (agent)
    const ok = {
      etages: {
        methode: { skills: ['ezk-backlog', 'ezk-sprint'], agents: ['ezk-pm'] },
      },
      bandes: { ceremonies: ['ezk-sprint'], artefacts: ['ezk-backlog'] },
    };
    expect(validateTaxonomie(cat, ok).skills['ezk-sprint'].etage).toBe('methode');
    // un skill du catalogue sans étage → complétude violée
    expect(() =>
      validateTaxonomie(cat, {
        etages: { methode: { skills: ['ezk-backlog'], agents: ['ezk-pm'] } },
      }),
    ).toThrow(/sans étage/);
    // id inconnu du catalogue
    expect(() =>
      validateTaxonomie(cat, {
        etages: { methode: { skills: ['ghost', 'ezk-backlog', 'ezk-sprint'], agents: ['ezk-pm'] } },
      }),
    ).toThrow(/inconnu/);
    // rangé deux fois
    expect(() =>
      validateTaxonomie(cat, {
        etages: {
          methode: { skills: ['ezk-backlog', 'ezk-sprint'], agents: ['ezk-pm'] },
          librairie: { skills: ['ezk-sprint'] },
        },
      }),
    ).toThrow(/deux fois/);
    // une bande citant un skill hors étage méthode
    expect(() =>
      validateTaxonomie(cat, {
        etages: {
          methode: { skills: ['ezk-backlog'], agents: ['ezk-pm'] },
          librairie: { skills: ['ezk-sprint'] },
        },
        bandes: { ceremonies: ['ezk-sprint'] },
      }),
    ).toThrow(/pas un skill de l'étage méthode/);
  });

  it('le document RÉEL est valide et porte bien les trous annoncés (daily, product-goal)', () => {
    const doc = validateMethod(loadCatalog(megaCity), loadMethodDoc(megaCity));
    const byId = new Map(doc.elements.map((e) => [e.id, e]));
    expect(byId.get('daily')?.etat).toBe('a-implementer');
    expect(byId.get('product-goal')?.etat).toBe('a-implementer');
    expect(byId.get('retro')?.etat).toBe('fidele');
    // les trois familles sont couvertes — la carte est TOTALE
    for (const type of ['ceremonie', 'artefact', 'role']) {
      expect(doc.elements.some((e) => e.type === type)).toBe(true);
    }
  });
});
