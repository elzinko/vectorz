/**
 * taxonomie — les TROIS ÉTAGES du catalogue, VALIDÉS en complétude (ADR-0039, lot 2).
 * DÉTERMINISTE et PUR (ADR-0003) — la lecture du YAML vit dans src/loaders/taxonomie.ts.
 *
 * Contrat : `taxonomie.yml` est LE fichier de classification (jamais de frontmatter —
 * verdict du panel adverse du 2026-08-23). La validation exige la COMPLÉTUDE : chaque
 * skill et chaque agent du catalogue a exactement UN étage ; un oubli, un id inconnu,
 * un doublon, ou une bande citant un skill hors-méthode ⇒ on JETTE (régénération en
 * échec, CI rouge). NB : c'est la COMPLÉTUDE qui est testée (aucune brique sans étage),
 * pas la JUSTESSE du placement — ranger ezk-ci en « techno » reste un arbitrage éditorial.
 */
import type { Catalog } from '../loaders/catalog.js';

export type Etage = 'methode' | 'modules' | 'librairie';
export type Famille = 'hote-llm' | 'github' | 'observabilite' | 'techno' | 'overlay';
export type BandeMethode = 'ceremonies' | 'artefacts';

export interface Placement {
  etage: Etage;
  famille?: Famille; // seulement pour l'étage modules
}

/** Forme brute du YAML (avant validation). */
export interface TaxonomieDoc {
  etages: {
    methode?: { skills?: string[]; agents?: string[] };
    modules?: { familles?: Record<string, { skills?: string[]; agents?: string[] }> };
    librairie?: { skills?: string[]; agents?: string[] };
  };
  bandes?: Record<string, string[]>;
}

/** Forme normalisée, prête pour le compilateur de carte. */
export interface Taxonomie {
  skills: Record<string, Placement>;
  agents: Record<string, Placement>;
  bandes: Record<BandeMethode, string[]>;
}

const FAMILLES: readonly Famille[] = ['hote-llm', 'github', 'observabilite', 'techno', 'overlay'];
const BANDES_METHODE: readonly BandeMethode[] = ['ceremonies', 'artefacts'];

export function validateTaxonomie(catalog: Catalog, doc: TaxonomieDoc): Taxonomie {
  if (!doc || typeof doc !== 'object' || !doc.etages) {
    throw new Error('taxonomie.yml : bloc `etages` absent');
  }
  const skills: Record<string, Placement> = {};
  const agents: Record<string, Placement> = {};

  const place = (
    kind: 'skill' | 'agent',
    id: string,
    placement: Placement,
    where: string,
  ): void => {
    const store = kind === 'skill' ? skills : agents;
    const exists = kind === 'skill' ? catalog.skills.has(id) : catalog.agents.has(id);
    if (!exists) throw new Error(`taxonomie.yml → ${where} : ${kind} inconnu « ${id} »`);
    if (store[id]) throw new Error(`taxonomie.yml : ${kind} « ${id} » rangé deux fois`);
    store[id] = placement;
  };

  const simple = (etage: Etage, bloc?: { skills?: string[]; agents?: string[] }): void => {
    for (const id of bloc?.skills ?? []) place('skill', id, { etage }, etage);
    for (const id of bloc?.agents ?? []) place('agent', id, { etage }, etage);
  };
  simple('methode', doc.etages.methode);
  simple('librairie', doc.etages.librairie);

  const familles = doc.etages.modules?.familles ?? {};
  for (const [famille, bloc] of Object.entries(familles)) {
    if (!FAMILLES.includes(famille as Famille)) {
      throw new Error(`taxonomie.yml : famille inconnue « ${famille} » (${FAMILLES.join('|')})`);
    }
    const placement: Placement = { etage: 'modules', famille: famille as Famille };
    for (const id of bloc?.skills ?? []) place('skill', id, placement, `modules/${famille}`);
    for (const id of bloc?.agents ?? []) place('agent', id, placement, `modules/${famille}`);
  }

  // COMPLÉTUDE : tout le catalogue est rangé — c'est le « tu verras » du lot 2.
  for (const id of catalog.skills.keys()) {
    if (!skills[id]) throw new Error(`taxonomie.yml : skill « ${id} » sans étage`);
  }
  for (const id of catalog.agents.keys()) {
    if (!agents[id]) throw new Error(`taxonomie.yml : agent « ${id} » sans étage`);
  }

  // Bandes : internes à l'étage méthode, ordre du document préservé (= ordre du flux).
  const bandes: Record<BandeMethode, string[]> = { ceremonies: [], artefacts: [] };
  for (const [bande, ids] of Object.entries(doc.bandes ?? {})) {
    if (!BANDES_METHODE.includes(bande as BandeMethode)) {
      throw new Error(`taxonomie.yml : bande inconnue « ${bande} » (${BANDES_METHODE.join('|')})`);
    }
    for (const id of ids) {
      if (skills[id]?.etage !== 'methode') {
        throw new Error(
          `taxonomie.yml → bandes/${bande} : « ${id} » n'est pas un skill de l'étage méthode`,
        );
      }
    }
    bandes[bande as BandeMethode] = [...ids];
  }

  return { skills, agents, bandes };
}
