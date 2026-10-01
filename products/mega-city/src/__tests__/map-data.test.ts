import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
/**
 * map-data — la carte interactive est FIDÈLE PAR CONSTRUCTION (épic « carte fidèle », PR #162).
 *
 * Depuis l'ADR-0055, les données de la carte ne sont plus committées dans le HTML : la coque charge
 * `carte-interactive.data.js`, que `ezk:map` calcule à chaque requête. Plus de copie, donc plus de
 * dérive possible — et plus de test « le bloc committé égale le bloc régénéré ». Le filet change de
 * nature : on prouve que le constructeur dit vrai sur le dépôt RÉEL (chaque brique du catalogue est
 * sur la carte, aucune n'est inventée) et que le fichier se charge comme la coque l'attend.
 */
import { describe, expect, it } from 'vitest';
import { compileGraph } from '../core/compiled-graph.js';
import { validateMethod } from '../core/ceremonies.js';
import { type MapData, MAP_DATA_BEGIN, MAP_DATA_END, buildMapData } from '../core/map-data.js';
import { validateTaxonomie } from '../core/taxonomie.js';
import { DATA_VIEWS } from '../io/derived-views.js';
import type { Catalog } from '../loaders/catalog.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

const carte = DATA_VIEWS.find((v) => v.id === 'carte');
if (!carte) throw new Error('vue « carte » absente du registre DATA_VIEWS');

/** Exécute le fichier de données dans un faux `window`, comme le navigateur, et rend `window.EZK`. */
function loadWindowEzk(js: string): MapData {
  const sandbox: { window: { EZK?: MapData } } = { window: {} };
  runInNewContext(js, sandbox);
  if (!sandbox.window.EZK) throw new Error('le fichier de données ne pose pas window.EZK');
  return sandbox.window.EZK;
}

describe('carte-interactive.data.js — construit à la demande (fidélité par construction)', () => {
  const js = carte.build(repoRoot); // une seule construction pour tout le bloc de tests
  const data = loadWindowEzk(js);

  it('le fichier se charge comme la coque l’attend : window.EZK posé, bloc géré présent une fois', () => {
    expect(js.split(MAP_DATA_BEGIN)).toHaveLength(2);
    expect(js.split(MAP_DATA_END)).toHaveLength(2);
    expect(js.startsWith('// Généré — NE PAS committer')).toBe(true);
    expect(js).not.toMatch(/<\/script/i); // inlinable dans une page sans en fermer la balise
  });

  it('chaque brique du catalogue réel est sur la carte, et la carte n’en invente aucune', () => {
    const catalog = loadCatalog(megaCity);
    expect(Object.keys(data.skills).sort()).toEqual([...catalog.skills.keys()].sort());
    expect(Object.keys(data.agents).sort()).toEqual([...catalog.agents.keys()].sort());
    expect(Object.keys(data.rules).sort()).toEqual([...catalog.rules.keys()].sort());
    expect(Object.keys(data.bundles).sort()).toEqual([...catalog.bundles.keys()].sort());
    expect(Object.keys(data.profiles).sort()).toEqual([...catalog.profiles.keys()].sort());
    expect(data.counts).toMatchObject({
      rules: catalog.rules.size,
      agents: catalog.agents.size,
      skills: catalog.skills.size,
      bundles: catalog.bundles.size,
      profiles: catalog.profiles.size,
    });
  });

  it('déterministe : deux constructions donnent exactement le même fichier', () => {
    expect(carte.build(repoRoot)).toBe(js);
  });

  it('ADR-0039 — chaque skill et chaque agent a un étage, et hors-bande est vide', () => {
    const catalog = loadCatalog(megaCity);
    const data = buildMapData(catalog, compileGraph(catalog), undefined, loadTaxonomieDoc(megaCity));
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
