import { describe, expect, it } from 'vitest';
import { type PlanCard, crossBacklogHead } from '../plan-head.js';

function card(
  id: string,
  product: string,
  status: string,
  ready: boolean,
  type = 'feature',
): PlanCard {
  return { id, product, type, status, ready };
}

function indexOf(...cards: PlanCard[]): Map<string, PlanCard> {
  return new Map(cards.map((c) => [c.id, c]));
}

describe('crossBacklogHead (fiche 0097)', () => {
  it('renvoie la 1re carte todo+ready dans l’ordre du plan, tous backlogs confondus', () => {
    const planIds = ['0094', '0062', '0041'];
    const index = indexOf(
      card('0094', 'mega-city', 'todo', true),
      card('0062', 'vectorz', 'todo', false),
      card('0041', 'vectorz', 'todo', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0094', 'mega-city', 'todo', true));
    expect(r.blockedAhead).toEqual([]);
  });

  it('signale les têtes bloquées (todo sans ready) qui précèdent la tête', () => {
    const planIds = ['0094', '0062', '0041'];
    const index = indexOf(
      card('0094', 'mega-city', 'todo', false), // en tête du plan, pas ready
      card('0062', 'vectorz', 'idea', false), // idea → hors signal
      card('0041', 'vectorz', 'todo', true), // tirable, mais 0094 le précède
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0041', 'vectorz', 'todo', true));
    expect(r.blockedAhead).toEqual([card('0094', 'mega-city', 'todo', false)]);
  });

  it('résout mc- vers la liste méthode et un nombre seul vers la liste produit', () => {
    const planIds = ['0090', '0060'];
    const index = indexOf(
      card('0090', 'mega-city', 'todo', false),
      card('0060', 'vectorz', 'todo', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head?.product).toBe('vectorz');
    expect(r.blockedAhead[0]?.product).toBe('mega-city');
  });

  it('ignore les cartes shipped / in-progress / blocked (ni tête ni blocage)', () => {
    const planIds = ['0059', '0030', '0143', '0094'];
    const index = indexOf(
      card('0059', 'vectorz', 'shipped', true),
      card('0030', 'vectorz', 'in-progress', false),
      card('0143', 'mega-city', 'blocked', false),
      card('0094', 'mega-city', 'todo', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0094', 'mega-city', 'todo', true));
    expect(r.blockedAhead).toEqual([]);
    expect(r.unresolved).toEqual([]);
  });

  it('signale (unresolved) un id du plan absent des deux listes, sans throw', () => {
    const planIds = ['9999', '0062'];
    const index = indexOf(card('0062', 'vectorz', 'todo', true));
    const r = crossBacklogHead(planIds, index);
    expect(r.unresolved).toEqual(['9999']);
    expect(r.head).toEqual(card('0062', 'vectorz', 'todo', true));
  });

  it('aucune tirable → head null, mais têtes bloquées et introuvables remontées', () => {
    const planIds = ['0094', '8888'];
    const index = indexOf(card('0094', 'mega-city', 'todo', false));
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toBeNull();
    expect(r.blockedAhead).toEqual([card('0094', 'mega-city', 'todo', false)]);
    expect(r.unresolved).toEqual(['8888']);
  });

  it('signale un introuvable même APRÈS la tête (scan complet — revue Codex #53)', () => {
    const planIds = ['0062', '9999'];
    const index = indexOf(card('0062', 'vectorz', 'todo', true));
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0062', 'vectorz', 'todo', true));
    expect(r.unresolved).toEqual(['9999']); // pas omis malgré la tête trouvée avant
  });

  it('n’élit jamais un épic comme tête, même todo+ready (revue Codex #53)', () => {
    const planIds = ['0155', '0041'];
    const index = indexOf(
      card('0155', 'mega-city', 'todo', true, 'epic'), // épic tirable en apparence
      card('0041', 'vectorz', 'todo', true), // la vraie tirable
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0041', 'vectorz', 'todo', true));
    expect(r.blockedAhead).toEqual([]); // l'épic n'est pas non plus un blocage
  });

  it('renvoie head null et listes vides sur un plan vide', () => {
    const r = crossBacklogHead([], new Map());
    expect(r).toEqual({ head: null, blockedAhead: [], unresolved: [] });
  });

  it('traite un id HORODATÉ (17 chiffres, fiche 0180) comme une tête normale, aux côtés du legacy', () => {
    const planIds = ['20260810143052123', '0041'];
    const index = indexOf(
      card('20260810143052123', 'vectorz', 'todo', true),
      card('0041', 'vectorz', 'todo', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('20260810143052123', 'vectorz', 'todo', true));
    expect(r.unresolved).toEqual([]);
  });
});
