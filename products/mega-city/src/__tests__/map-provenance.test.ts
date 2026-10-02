/**
 * map-provenance — chaque élément de la carte montre le fichier d'où il vient, et la carte
 * dit quelle part d'elle-même est PROUVÉE (déclarée dans un fichier) ou DÉDUITE (écrite à la
 * main, sans fichier qui l'appuie). Fiche 20260821163346493.
 *
 * Trois garanties : (1) toute brique du catalogue a une source qui existe ; (2) le ratio
 * compte sans tricher ; (3) ce que l'auteur ajoute à la main ne passe jamais en silence :
 * un id inconnu fait échouer la compilation, un appui manquant ressort « déduit ».
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import type { MethodDoc } from '../core/ceremonies.js';
import { compileGraph } from '../core/compiled-graph.js';
import { CYCLE_DOC, type CycleStepDoc, compileCycle } from '../core/cycle.js';
import { buildMapData, missingSources } from '../core/map-data.js';
import type { Catalog } from '../loaders/catalog.js';
import { catalogSources, loadCatalog } from '../loaders/catalog.js';
import { loadMapSources } from '../loaders/map-sources.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

/** Un mini-catalogue : deux commandes, deux juges, un lien déclaré de chaque côté. */
const tiny = (): Catalog => ({
  rules: new Map(),
  bundles: new Map(),
  profiles: new Map(),
  agents: new Map([
    ['ezk-dev', { id: 'ezk-dev', role: '', competences: ['ezk-sprint'], interactions: [] }],
    ['ezk-pm', { id: 'ezk-pm', role: '', competences: [], interactions: [] }],
  ]),
  skills: new Map([
    [
      'ezk-sprint',
      { id: 'ezk-sprint', content: '', argumentHint: '[run|check]', roles: ['ezk-dev'] },
    ],
    ['ezk-pr', { id: 'ezk-pr', content: '' }],
  ]),
});

const method: MethodDoc = {
  elements: [
    {
      id: 'sprint',
      type: 'ceremonie',
      nom: 'Sprint',
      etat: 'adapte',
      implemente_par: ['ezk-sprint:run', 'agent:ezk-pm'],
    },
    {
      id: 'review',
      type: 'ceremonie',
      nom: 'Revue',
      etat: 'adapte',
      implemente_par: ['ezk-sprint'],
    },
  ],
};

const step = (over: Partial<CycleStepDoc>): CycleStepDoc => ({
  n: 1,
  t: 'Le run',
  scrum: '≈ Sprint',
  p: 'texte',
  ceremonie: 'sprint',
  etape: ['ezk-sprint'],
  acteurs: [],
  humains: [],
  ...over,
});

describe('catalogSources — où vit chaque brique', () => {
  const made: string[] = [];
  afterAll(() => {
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
  });

  it('suit l’id écrit DANS le fichier, pas son nom (bundle et profil en YAML)', () => {
    const root = mkdtempSync(join(tmpdir(), 'ezk-sources-'));
    made.push(root);
    mkdirSync(join(root, 'bundles'));
    mkdirSync(join(root, 'profiles'));
    writeFileSync(join(root, 'bundles', 'nom-de-fichier.yml'), 'id: id-du-bundle\nrules: []\n');
    writeFileSync(join(root, 'profiles', 'p.yml'), 'id: mon-profil\n');

    const sources = catalogSources(root);
    expect(sources.get('bundle:id-du-bundle')).toBe('bundles/nom-de-fichier.yml');
    expect(sources.get('profile:mon-profil')).toBe('profiles/p.yml');
  });

  it('cite le fichier que le catalogue a RETENU quand deux skills portent le même nom', () => {
    const root = mkdtempSync(join(tmpdir(), 'ezk-sources-dup-'));
    made.push(root);
    for (const dir of ['zzz', 'aaa']) {
      mkdirSync(join(root, 'skills', dir), { recursive: true });
      writeFileSync(
        join(root, 'skills', dir, 'SKILL.md'),
        `---\nname: doublon\ndescription: vient-de-${dir}\n---\ncorps\n`,
      );
    }

    const retenu = loadCatalog(root).skills.get('doublon')?.description;
    const source = catalogSources(root).get('skill:doublon') ?? '';
    // le dernier dossier dans l'ordre trié gagne, des deux côtés
    expect(retenu).toBe('vient-de-zzz');
    expect(source).toBe('skills/zzz/SKILL.md');
  });

  it('rend des chemins relatifs à la base demandée, en séparateurs POSIX', () => {
    const sources = catalogSources(megaCity, repoRoot);
    expect(sources.get('skill:ezk-sprint')).toBe('products/mega-city/skills/ezk-sprint/SKILL.md');
    expect(sources.get('agent:ezk-dev')).toBe('products/mega-city/agents/ezk-dev.md');
  });

  it('couvre TOUT le catalogue réel, et chaque fichier cité existe', () => {
    const catalog = loadCatalog(megaCity);
    const sources = loadMapSources(megaCity, repoRoot);
    const kinds = [
      ['rule', catalog.rules],
      ['agent', catalog.agents],
      ['skill', catalog.skills],
      ['bundle', catalog.bundles],
      ['profile', catalog.profiles],
    ] as const;
    for (const [kind, entities] of kinds) {
      for (const id of entities.keys()) {
        const path = sources.get(`${kind}:${id}`);
        expect(path, `${kind} ${id} sans source`).toBeDefined();
        expect(existsSync(join(repoRoot, path ?? '')), `${kind} ${id} → ${path} absent`).toBe(true);
      }
    }
    expect(sources.get('method')).toBe('products/mega-city/method/ceremonies.yml');
    expect(sources.get('taxonomie')).toBe('products/mega-city/taxonomie.yml');
  });
});

describe('missingSources — le contrôle mécanique', () => {
  it('liste chaque source dont le fichier n’existe pas', () => {
    const sources = new Map([
      ['skill:a', 'skills/a/SKILL.md'],
      ['skill:b', 'skills/b/SKILL.md'],
    ]);
    expect(missingSources(sources, (p) => p.includes('/a/'))).toEqual([
      ['skill:b', 'skills/b/SKILL.md'],
    ]);
    expect(missingSources(sources, () => true)).toEqual([]);
  });
});

describe('provenance — prouvé / déduit, sans tricher', () => {
  it('compte déduite une brique sans source, et déduits les liens qu’elle déclare', () => {
    const catalog = tiny();
    const sources = new Map([['skill:ezk-sprint', 'skills/ezk-sprint/SKILL.md']]); // ezk-dev : aucune
    const data = buildMapData(catalog, compileGraph(catalog), undefined, undefined, { sources });

    expect(data.skills['ezk-sprint'].source).toBe('skills/ezk-sprint/SKILL.md');
    expect(data.agents['ezk-dev'].source).toBeUndefined();
    // 4 briques : 1 sourcée (ezk-sprint), 3 non sourcées (ezk-pr, ezk-dev, ezk-pm)
    expect(data.provenance.prouve.briques).toBe(1);
    expect(data.provenance.deduit.briques).toBe(3);
    // 2 liens : roles (déclaré dans ezk-sprint, sourcé) et competences (déclaré dans ezk-dev, non)
    expect(data.provenance.prouve.liens).toBe(1);
    expect(data.provenance.deduit.liens).toBe(1);
  });

  it('compte les cérémonies selon que ceremonies.yml est sourcé ou non', () => {
    const catalog = tiny();
    const graph = compileGraph(catalog);
    const avec = buildMapData(catalog, graph, method, undefined, {
      sources: new Map([['method', 'method/ceremonies.yml']]),
    });
    expect(avec.methodSource).toBe('method/ceremonies.yml');
    expect(avec.provenance.prouve.ceremonies).toBe(2);
    expect(avec.provenance.deduit.ceremonies).toBe(0);

    const sans = buildMapData(catalog, graph, method, undefined, { sources: new Map() });
    expect(sans.provenance.prouve.ceremonies).toBe(0);
    expect(sans.provenance.deduit.ceremonies).toBe(2);
  });

  it('catalogue RÉEL : toute brique et tout lien est prouvé, rien n’est déduit côté fichiers', () => {
    const catalog = loadCatalog(megaCity);
    const graph = compileGraph(catalog);
    const data = buildMapData(catalog, graph, loadMethodDoc(megaCity), loadTaxonomieDoc(megaCity), {
      sources: loadMapSources(megaCity, repoRoot),
      cycle: CYCLE_DOC,
    });
    const briques =
      catalog.rules.size +
      catalog.agents.size +
      catalog.skills.size +
      catalog.bundles.size +
      catalog.profiles.size +
      (catalog.tools?.size ?? 0); // les outils (ADR-0058) : leur fichier existe, ils sont prouvés
    expect(data.provenance.prouve.briques).toBe(briques);
    expect(data.provenance.deduit.briques).toBe(0);
    expect(data.provenance.prouve.liens).toBe(graph.edges.length);
    expect(data.provenance.deduit.liens).toBe(0);
    expect(data.provenance.deduit.ceremonies).toBe(0);
  });
});

describe('cycle — ce que l’auteur écrit à la main ne passe jamais en silence', () => {
  it('jette sur un skill, un agent ou une cérémonie inconnus (la régénération échoue)', () => {
    const catalog = tiny();
    const graph = compileGraph(catalog);
    expect(() => compileCycle(catalog, graph, method, [step({ etape: ['ghost'] })])).toThrow(
      /skill inconnu/,
    );
    expect(() => compileCycle(catalog, graph, method, [step({ acteurs: ['ghost'] })])).toThrow(
      /agent inconnu/,
    );
    expect(() => compileCycle(catalog, graph, method, [step({ ceremonie: 'ghost' })])).toThrow(
      /cérémonie inconnue/,
    );
  });

  it('prouve une étape citée par la cérémonie du temps, avec le fichier qui l’appuie', () => {
    const catalog = tiny();
    const [s] = compileCycle(catalog, compileGraph(catalog), method, [step({})]);
    expect(s.etape).toEqual([{ id: 'ezk-sprint', prouve: true, via: 'ceremonies.yml › sprint' }]);
  });

  it('prouve un acteur convoqué par l’étape (roles:) ou cité par la cérémonie (agent:)', () => {
    const catalog = tiny();
    const [s] = compileCycle(catalog, compileGraph(catalog), method, [
      step({ acteurs: ['ezk-dev', 'ezk-pm'] }),
    ]);
    expect(s.acteurs).toEqual([
      { id: 'ezk-dev', prouve: true, via: 'roles: ezk-sprint' },
      { id: 'ezk-pm', prouve: true, via: 'ceremonies.yml › sprint' },
    ]);
  });

  it('met en DÉDUIT une étape connue que la cérémonie ne cite pas (jamais à égalité)', () => {
    const catalog = tiny();
    const [s] = compileCycle(catalog, compileGraph(catalog), method, [
      step({ ceremonie: 'review', etape: ['ezk-pr'] }),
    ]);
    expect(s.etape).toEqual([{ id: 'ezk-pr', prouve: false }]);
  });

  it('met en DÉDUIT un acteur qu’aucun fichier ne relie à l’étape', () => {
    const catalog = tiny();
    const [s] = compileCycle(catalog, compileGraph(catalog), method, [
      step({ ceremonie: 'review', acteurs: ['ezk-pm'] }),
    ]);
    expect(s.acteurs).toEqual([{ id: 'ezk-pm', prouve: false }]);
  });

  it('sans document de méthode, rien n’est appuyé : tout ressort déduit', () => {
    const catalog = tiny();
    const [s] = compileCycle(catalog, compileGraph(catalog), undefined, [step({})]);
    expect(s.etape[0].prouve).toBe(false);
  });

  it('compte dans le ratio : puces prouvées, puces déduites, humains toujours déduits', () => {
    const catalog = tiny();
    const data = buildMapData(catalog, compileGraph(catalog), method, undefined, {
      sources: new Map(),
      cycle: [
        step({ acteurs: ['ezk-dev'], humains: ['Toi (PO)'] }),
        step({ n: 2, ceremonie: 'review', etape: ['ezk-pr'] }),
      ],
    });
    // prouvées : étape ezk-sprint (cérémonie) + acteur ezk-dev (roles) ; déduites : ezk-pr + l'humain
    expect(data.provenance.prouve.cycle).toBe(2);
    expect(data.provenance.deduit.cycle).toBe(2);
    expect(data.cycle).toHaveLength(2);
  });

  it('le cycle RÉEL compile, et chaque puce dit d’où elle vient ou qu’elle est déduite', () => {
    const catalog = loadCatalog(megaCity);
    const steps = compileCycle(catalog, compileGraph(catalog), loadMethodDoc(megaCity), CYCLE_DOC);
    expect(steps).toHaveLength(CYCLE_DOC.length);
    for (const chip of steps.flatMap((s) => [...s.etape, ...s.acteurs])) {
      expect(Boolean(chip.via), `${chip.id} : via ⇔ prouvé`).toBe(chip.prouve);
    }
    // la carte garde au moins une lecture d'auteur visible tant que le cycle est écrit à la main
    expect(steps.some((s) => s.humains.length > 0)).toBe(true);
  });
});
