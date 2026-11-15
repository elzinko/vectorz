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
 *
 * Les commandes de terminal (`ezk <domaine> <verbe>`) y sont rangées aussi, par domaine, dans la
 * section `commandes` (fiche 20261114131613129) : `placeCommandes` en exige la complétude.
 */
import type { Catalog } from '../loaders/catalog.js';
import { type ManifestEntry, commandLabel } from './ezk-cli.js';

export const ETAGES = ['methode', 'modules', 'librairie'] as const;
export type Etage = (typeof ETAGES)[number];
export const FAMILLES = ['hote-llm', 'github', 'observabilite', 'techno', 'overlay'] as const;
export type Famille = (typeof FAMILLES)[number];
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
  /**
   * Les commandes de terminal : un domaine, ou une commande précise (`<domaine> <verbe>`) qui dévie
   * de son domaine → `methode`, `librairie` ou `modules/<famille>`.
   */
  commandes?: Record<string, string>;
}

/** Forme normalisée, prête pour le compilateur de carte. */
export interface Taxonomie {
  skills: Record<string, Placement>;
  agents: Record<string, Placement>;
  bandes: Record<BandeMethode, string[]>;
}

const BANDES_METHODE: readonly BandeMethode[] = ['ceremonies', 'artefacts'];

function isFamille(value: string): value is Famille {
  return (FAMILLES as readonly string[]).includes(value);
}

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
    if (!isFamille(famille)) {
      throw new Error(`taxonomie.yml : famille inconnue « ${famille} » (${FAMILLES.join('|')})`);
    }
    const placement: Placement = { etage: 'modules', famille };
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

/** `methode`, `librairie` ou `modules/<famille>` → le placement ; toute autre valeur jette. */
function parsePlacement(value: string, where: string): Placement {
  if (value === 'methode' || value === 'librairie') return { etage: value };
  const famille = value.startsWith('modules/') ? value.slice('modules/'.length) : '';
  if (isFamille(famille)) return { etage: 'modules', famille };
  throw new Error(
    `taxonomie.yml → commandes/${where} : étage inconnu « ${value} » (methode | librairie | modules/<${FAMILLES.join('|')}>)`,
  );
}

/**
 * L'étage de chaque commande de terminal, par son nom (`<domaine> <verbe>`). Une commande précise
 * prime sur son domaine. COMPLÉTUDE, comme pour les skills et les agents : une commande sans étage,
 * ou une clé qui ne nomme ni un domaine ni une commande du manifeste, JETTE.
 */
export function placeCommandes(
  commands: readonly Pick<ManifestEntry, 'domain' | 'verb'>[],
  doc: TaxonomieDoc,
): Record<string, Placement> {
  const section = doc.commandes ?? {};
  const known = new Set(commands.flatMap((c) => [c.domain, commandLabel(c)]));
  for (const key of Object.keys(section)) {
    if (!known.has(key)) {
      throw new Error(`taxonomie.yml → commandes : domaine ou commande inconnu « ${key} » (absent du manifeste)`);
    }
  }
  const placed: Record<string, Placement> = {};
  for (const c of commands) {
    const name = commandLabel(c);
    const value = section[name] ?? section[c.domain];
    if (value === undefined) {
      throw new Error(
        `taxonomie.yml : commande « ${name} » sans étage (range son domaine « ${c.domain} » dans la section commandes)`,
      );
    }
    placed[name] = parsePlacement(value, name);
  }
  return placed;
}
