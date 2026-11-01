/**
 * Cœur pur : traduit les deux JSON publiés par la méthode (`board show`, `backlog show`) vers la
 * forme du board. Les tests lisent les exemples rangés par la méthode — jamais un vrai `ezk`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EzkContractError, translatePlan } from './ezkPlanTranslator.js';

// biome-ignore lint/suspicious/noExplicitAny: les tests modifient librement les exemples du contrat
type Json = any;

const contract = (path: string): Json =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../../../../../../mega-city/contracts/${path}`, import.meta.url)),
      'utf8',
    ),
  );
const board = (): Json => contract('board-show/v1/example.json');
const backlog = (): Json => contract('backlog-show/v1/example.json');

describe('translatePlan — mêmes chiffres que le contrat', () => {
  it("l'entonnoir et metrics.done valent les comptes du contrat (les closes ne sont pas des livrées)", () => {
    const { plan } = translatePlan(board(), backlog());
    const c = board().comptes;
    expect(plan.funnel).toEqual({
      idea: c.idees,
      ready: c.pretes,
      wip: c.enCours,
      unversioned: c.sansVersion,
      parked: c.parkees,
    });
    expect(plan.done).toBe(c.livrees);
    expect(plan.done).not.toBe(c.livrees + c.closes);
  });

  it('la version courante vient de versions.courante ; ses totaux excluent les closes', () => {
    const { plan } = translatePlan(board(), backlog());
    expect(plan.versions.current).toEqual({
      ver: 'v1.0.0',
      name: 'v1.0.0',
      done: 1,
      wip: 1,
      ready: 1, // le contrat range aussi la fiche en cours dans `pretes` : elle compte une fois, en wip
      idea: 0,
      total: 3, // 1 livrée + 2 à faire
    });
  });

  it('un lot se découpe sans recouvrement : wip + ready + idea = à faire', () => {
    const { plan } = translatePlan(board(), backlog());
    const v = plan.versions.current;
    expect(v && v.wip + v.ready + v.idea).toBe(2);
  });

  it('les lots étiquetés vont en past, les autres en upcoming, dans l’ordre du contrat', () => {
    const b = board();
    b.versions.lots.push(
      {
        ...b.versions.lots[1],
        version: 'v0.9.0',
        etiquette: 'v0.9.0',
        livrees: ['a', 'b'],
        aFaire: [],
        pretes: [],
      },
      { ...b.versions.lots[1], version: 'v3.0.0', aFaire: ['x'], pretes: [] },
    );
    const { plan } = translatePlan(b, backlog());
    expect(plan.versions.past.map((v) => v.ver)).toEqual(['v0.9.0']);
    expect(plan.versions.past[0]?.date).toBe('taguée');
    expect(plan.versions.upcoming.map((v) => v.ver)).toEqual(['v2.0.0', 'v3.0.0']);
    expect(plan.versions.upcoming[0]?.date).toBeUndefined();
  });

  it('les versions passées vont de la plus récente à la plus ancienne (le contrat les range en croissant)', () => {
    const b = board();
    const tagged = { ...b.versions.lots[1], aFaire: [], pretes: [], livrees: ['a'] };
    b.versions.lots.unshift(
      { ...tagged, version: 'v0.8.0', etiquette: 'v0.8.0' },
      { ...tagged, version: 'v0.9.0', etiquette: 'v0.9.0' },
    );
    const { plan } = translatePlan(b, backlog());
    expect(plan.versions.past.map((v) => v.ver)).toEqual(['v0.9.0', 'v0.8.0']);
  });

  it('sans version courante, current vaut null', () => {
    const b = board();
    b.versions.courante = null;
    expect(translatePlan(b, backlog()).plan.versions.current).toBeNull();
  });
});

describe('translatePlan — même détail', () => {
  it('donne un FicheDetailData par fiche non livrée, avec le vocabulaire du board', () => {
    const b = backlog();
    b.fiches.push({ ...b.fiches[0], id: 'livree', done: true, enCours: false });
    const { fiches } = translatePlan(board(), b);
    expect(fiches.livree).toBeUndefined();
    expect(fiches['20990101000000002']).toEqual({
      id: '20990101000000002',
      title: 'Tour Driver.js : tracking',
      prio: 'P2',
      status: 'idea',
      ver: 'v2.0.0',
      enclair: b.fiches[1].enClair,
      ctx: b.fiches[1].contexte,
      // Le contrat envoie des objets {texte, coche} : la page attend du texte (valeurs de l'exemple, en dur).
      crit: ['Le premier critère est fait', 'Le second critère tient sur deux lignes'],
      verif: b.fiches[1].commentVerifier,
      blocked: '',
    });
  });

  it('une fiche enCours donne status wip ; une fiche prête donne ready', () => {
    const b = backlog();
    b.fiches[1].status = 'ready';
    const { fiches } = translatePlan(board(), b);
    expect(fiches['20990101000000001']?.status).toBe('wip');
    expect(fiches['20990101000000002']?.status).toBe('ready');
  });

  it('une fiche bloquée porte sa raison', () => {
    expect(translatePlan(board(), backlog()).fiches['20990101000000003']?.blocked).toBe('panel');
  });

  it('reporte la PR quand il y en a une', () => {
    const b = backlog();
    b.fiches[1].pr = '#42';
    expect(translatePlan(board(), b).fiches['20990101000000002']?.pr).toBe('#42');
  });
});

describe('translatePlan — format inconnu', () => {
  it('refuse un schema_version différent de 1 dans board show', () => {
    const b = { ...board(), schema_version: 2 };
    expect(() => translatePlan(b, backlog())).toThrow(EzkContractError);
    expect(() => translatePlan(b, backlog())).toThrow(/board show.*schema_version 2/);
  });

  it('refuse un schema_version différent de 1 dans backlog show', () => {
    const l = { ...backlog(), schema_version: 2 };
    expect(() => translatePlan(board(), l)).toThrow(/backlog show.*schema_version 2/);
  });

  it("refuse une réponse qui n'a pas la forme du contrat", () => {
    expect(() => translatePlan({ schema_version: 1 }, backlog())).toThrow(EzkContractError);
    expect(() => translatePlan(null, backlog())).toThrow(EzkContractError);
  });
});
