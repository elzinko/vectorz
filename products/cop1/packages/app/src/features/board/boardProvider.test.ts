/**
 * Sœur « tuyau/plan » du board (endpoint `/api/board`) : le cœur pur `shapeProject` met le plan
 * reçu de la méthode à la forme d'un `BoardProject`. Sans plan (chargement, indisponible), il ne
 * montre JAMAIS de chiffre : entonnoir, versions et fiches restent vides et `plan` dit pourquoi.
 */
import { describe, expect, it } from 'vitest';
import { composeBoardData, shapeProject } from './boardProvider.js';
import { EzkConfigSource } from './ezkConfigSource.js';
import type { ProjectConfigData } from './ezkConfigTranslator.js';
import { EzkPlanSource, type PlanSnapshot } from './ezkPlanSource.js';
import { EzkProcessSource } from './ezkProcessSource.js';
import type { FicheDetailData, PlanData } from './planTypes.js';

const plan: PlanData = {
  funnel: { idea: 3, ready: 2, wip: 1, unversioned: 1, parked: 4 },
  versions: {
    current: { ver: 'v0.2.0', name: 'v0.2.0', done: 0, wip: 1, ready: 2, idea: 1, total: 4 },
    upcoming: [{ ver: 'v0.3.0', name: 'v0.3.0', done: 0, wip: 0, ready: 1, idea: 0, total: 1 }],
    past: [
      {
        ver: 'v0.1.0',
        name: 'v0.1.0',
        done: 3,
        wip: 0,
        ready: 0,
        idea: 0,
        total: 3,
        date: 'taguée',
      },
    ],
  },
  done: 42,
};
const fiche: FicheDetailData = {
  id: 'f1',
  title: 'Une fiche',
  prio: 'P1',
  status: 'ready',
  ver: 'v0.2.0',
  enclair: 'x',
  ctx: 'y',
  crit: [],
  verif: 'z',
  blocked: 'panel',
};
const ok: PlanSnapshot = { state: 'ok', at: 1, plan, fiches: { f1: fiche } };

describe('shapeProject — met le plan à la forme BoardProject', () => {
  it('passe funnel, versions et fiches tels quels et reporte le compte livré dans metrics.done', () => {
    const p = shapeProject('vectorz', 'le projet', ok);
    expect(p.name).toBe('vectorz');
    expect(p.desc).toBe('le projet');
    expect(p.plan).toEqual({ state: 'ok' });
    expect(p.funnel).toEqual(plan.funnel);
    expect(p.versions).toEqual(plan.versions);
    expect(p.fiches).toEqual({ f1: fiche });
    expect(p.metrics.done).toBe(42);
  });

  it('laisse les runs VIDES (pas de faux run) et met des placeholders honnêtes, pas de faux zéro déguisé', () => {
    const p = shapeProject('vectorz', '', ok);
    expect(p.runs).toEqual({});
    expect(p.live).toBe(false);
    // Plan reçu : le temps et les jetons sont dits « non mesuré » (fiche 20261102104443762).
    expect(p.metrics.tokens).toBe('non mesuré');
    expect(p.metrics.temps).toBe('non mesuré');
    expect(p.metrics.perFiche).toBe('non mesuré');
    expect(p.metrics.sprints).toBe('—');
    expect(p.metrics.runs).toBe('—');
    expect(p.metrics.retros).toBe('—');
  });

  it('plan en chargement : tout est vide, plan.state dit « loading »', () => {
    const p = shapeProject('vectorz', '', { state: 'loading' });
    expect(p.plan).toEqual({ state: 'loading' });
    expect(p.funnel).toEqual({ idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 });
    expect(p.versions).toEqual({ current: null, upcoming: [], past: [] });
    expect(p.fiches).toEqual({});
  });

  it('plan indisponible : tout est vide, la raison est portée par plan', () => {
    const p = shapeProject('vectorz', '', {
      state: 'unavailable',
      reason: 'commande ezk introuvable',
    });
    expect(p.plan).toEqual({ state: 'unavailable', reason: 'commande ezk introuvable' });
    expect(p.funnel.idea).toBe(0);
    expect(p.versions.current).toBeNull();
    expect(p.fiches).toEqual({});
  });

  it('les runs restent affichés quand le plan est indisponible', () => {
    const live = { runs: { r1: { live: true } as never }, chantiers: [] };
    const p = shapeProject('vectorz', '', { state: 'unavailable', reason: 'x' }, live);
    expect(Object.keys(p.runs)).toEqual(['r1']);
    expect(p.live).toBe(true);
  });
});

const config: ProjectConfigData = {
  file: '.vectorz/config.yml',
  github: 'coupé (100 % local)',
  integration: 'local-squash',
  releaseGate: true,
  root: '/p',
  agents: [
    { agent: 'ezk-dev', tier: 'middle', model: 'sonnet', effort: 'medium', source: 'defaut' },
  ],
};
const noLive = { runs: {}, chantiers: [] };

describe('shapeProject — les tuiles « depuis le début » (fiche 20261102104443762)', () => {
  const withHistory = (sprints: number, retros: number): PlanSnapshot => ({
    ...ok,
    plan: { ...plan, history: { sprints, retros } },
  });

  it('sprints et rétros viennent de l’historique publié par la méthode', () => {
    const p = shapeProject('vectorz', '', withHistory(29, 19));
    expect(p.metrics.sprints).toBe(29);
    expect(p.metrics.retros).toBe(19);
  });

  it('un vrai zéro reste 0 : la méthode a compté', () => {
    const p = shapeProject('vectorz', '', withHistory(0, 0));
    expect(p.metrics.sprints).toBe(0);
    expect(p.metrics.retros).toBe(0);
  });

  it('le temps et les jetons disent « non mesuré », avec leur raison en une phrase', () => {
    const p = shapeProject('vectorz', '', withHistory(29, 19));
    expect([p.metrics.tokens, p.metrics.temps, p.metrics.perFiche]).toEqual([
      'non mesuré',
      'non mesuré',
      'non mesuré',
    ]);
    expect(p.metrics.notes.join(' ')).toMatch(/ne les mesurent pas encore/);
  });

  it('méthode plus ancienne, sans historique : « — » et la raison, jamais 0', () => {
    const p = shapeProject('vectorz', '', ok);
    expect(p.metrics.sprints).toBe('—');
    expect(p.metrics.retros).toBe('—');
    expect(p.metrics.notes.join(' ')).toMatch(/ne publie pas encore/);
  });

  it('plan pas encore reçu : tout reste « — », sans note', () => {
    const p = shapeProject('vectorz', '', { state: 'loading' });
    expect([p.metrics.tokens, p.metrics.sprints, p.metrics.retros]).toEqual(['—', '—', '—']);
    expect(p.metrics.notes).toEqual([]);
  });
});

describe('shapeProject — la config du projet, lue par ezk (ADR-086)', () => {
  it('config reçue : elle passe telle quelle, et configState dit « ok »', () => {
    const p = shapeProject('vectorz', '', ok, noLive, { state: 'ok', at: 1, config });
    expect(p.configState).toEqual({ state: 'ok' });
    expect(p.config).toEqual(config);
  });

  it('config en chargement : pas de config, configState dit « loading »', () => {
    const p = shapeProject('vectorz', '', ok, noLive, { state: 'loading' });
    expect(p.configState).toEqual({ state: 'loading' });
    expect(p.config).toBeUndefined();
  });

  it('config indisponible : la raison est portée, le plan arrive quand même', () => {
    const p = shapeProject('vectorz', '', ok, noLive, {
      state: 'unavailable',
      reason: 'YAML malformé',
    });
    expect(p.configState).toEqual({ state: 'unavailable', reason: 'YAML malformé' });
    expect(p.config).toBeUndefined();
    expect(p.plan).toEqual({ state: 'ok' });
  });
});

describe('shapeProject — une relecture en cours se voit, pour que la page redemande vite', () => {
  it('plan et config relus en arrière-plan → `refreshing: true` dans leur état', () => {
    const p = shapeProject('vectorz', '', { ...ok, refreshing: true }, noLive, {
      state: 'ok',
      at: 1,
      config,
      refreshing: true,
    });
    expect(p.plan).toEqual({ state: 'ok', refreshing: true });
    expect(p.configState).toEqual({ state: 'ok', refreshing: true });
  });

  it('indisponible et relu → la raison, et `refreshing: true`', () => {
    const p = shapeProject('vectorz', '', {
      state: 'unavailable',
      reason: 'ezk en erreur',
      refreshing: true,
    });
    expect(p.plan).toEqual({ state: 'unavailable', reason: 'ezk en erreur', refreshing: true });
  });

  it('rien ne se relit → l’état ne porte pas `refreshing`', () => {
    const p = shapeProject('vectorz', '', { ...ok, refreshing: false });
    expect(p.plan).toEqual({ state: 'ok' });
  });
});

describe('composeBoardData — synchrone, lit l’état des sources', () => {
  it('rend tout de suite « loading » pour un ezk lent, sans attendre', () => {
    const never = new Promise<string>(() => {});
    const sources = {
      plan: new EzkPlanSource({ command: ['ezk'], run: () => never }),
      config: new EzkConfigSource({ command: ['ezk'], run: () => never }),
      process: new EzkProcessSource({ command: ['ezk'], run: () => never }),
    };
    const t0 = performance.now();
    const data = composeBoardData([{ name: 'p', root: '/introuvable' }], sources);
    expect(performance.now() - t0).toBeLessThan(100);
    expect(data.p?.plan).toEqual({ state: 'loading' });
    expect(data.p?.configState).toEqual({ state: 'loading' });
    expect(data.p?.processState).toEqual({ state: 'loading' });
  });
});

describe('shapeProject — le pilotage (fiche 20261102123552182)', () => {
  const pilotage = {
    milestones: [{ name: 'board', status: 'en-cours', total: 10, shipped: 6 }],
    sessions: [
      {
        date: '2026-11-02',
        title: 'Run autonome',
        file: 'docs/sessions/x.md',
        fiches: ['1'],
        prs: [],
      },
    ],
  };

  it('passe tel quel le pilotage publié par la méthode', () => {
    const p = shapeProject('vectorz', '', { ...ok, plan: { ...plan, pilotage } }, noLive);
    expect(p.pilotage).toEqual(pilotage);
  });

  it('plan reçu sans pilotage, ou plan pas encore là : aucun pilotage', () => {
    expect(shapeProject('vectorz', '', ok, noLive).pilotage).toBeUndefined();
    expect(shapeProject('vectorz', '', { state: 'loading' }, noLive).pilotage).toBeUndefined();
  });
});

describe('shapeProject — le process (fiche 20261102123552183)', () => {
  const process = { github: false, reviewUnknown: true, stages: [] };

  it('passe tel quel le process publié par la méthode', () => {
    const p = shapeProject('vectorz', '', ok, noLive, undefined, { state: 'ok', at: 1, process });
    expect(p.processState).toEqual({ state: 'ok' });
    expect(p.process).toEqual(process);
  });

  it('un process indisponible garde sa raison, et rien d’autre', () => {
    const p = shapeProject('vectorz', '', ok, noLive, undefined, {
      state: 'unavailable',
      reason: 'ezk a échoué (code 2)',
    });
    expect(p.processState).toEqual({ state: 'unavailable', reason: 'ezk a échoué (code 2)' });
    expect(p.process).toBeUndefined();
  });
});
