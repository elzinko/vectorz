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
      card('0094', 'mega-city', 'ready', true),
      card('0062', 'vectorz', 'idea', false),
      card('0041', 'vectorz', 'ready', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0094', 'mega-city', 'ready', true));
    expect(r.blockedAhead).toEqual([]);
  });

  it('signale les cartes `idea` (pas prêtes) qui précèdent la tête — à groomer', () => {
    // Depuis le retrait de `todo` (2026-09-04) : une carte du plan qui précède la tête et
    // n'est pas `ready` est une `idea` à groomer. Toutes sont signalées, dans l'ordre du plan.
    const planIds = ['0094', '0062', '0041'];
    const index = indexOf(
      card('0094', 'mega-city', 'idea', false), // dans le plan avant la tête, pas prête
      card('0062', 'vectorz', 'idea', false), // idem — à groomer pour respecter l'ordre du plan
      card('0041', 'vectorz', 'ready', true), // la tête tirable
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0041', 'vectorz', 'ready', true));
    expect(r.blockedAhead).toEqual([
      card('0094', 'mega-city', 'idea', false),
      card('0062', 'vectorz', 'idea', false),
    ]);
  });

  it('résout mc- vers la liste méthode et un nombre seul vers la liste produit', () => {
    const planIds = ['0090', '0060'];
    const index = indexOf(
      card('0090', 'mega-city', 'idea', false),
      card('0060', 'vectorz', 'ready', true),
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
      card('0094', 'mega-city', 'ready', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0094', 'mega-city', 'ready', true));
    expect(r.blockedAhead).toEqual([]);
    expect(r.unresolved).toEqual([]);
  });

  it('signale (unresolved) un id du plan absent des deux listes, sans throw', () => {
    const planIds = ['9999', '0062'];
    const index = indexOf(card('0062', 'vectorz', 'ready', true));
    const r = crossBacklogHead(planIds, index);
    expect(r.unresolved).toEqual(['9999']);
    expect(r.head).toEqual(card('0062', 'vectorz', 'ready', true));
  });

  it('aucune tirable → head null, mais têtes bloquées et introuvables remontées', () => {
    const planIds = ['0094', '8888'];
    const index = indexOf(card('0094', 'mega-city', 'idea', false));
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toBeNull();
    expect(r.blockedAhead).toEqual([card('0094', 'mega-city', 'idea', false)]);
    expect(r.unresolved).toEqual(['8888']);
  });

  it('signale un introuvable même APRÈS la tête (scan complet — revue Codex #53)', () => {
    const planIds = ['0062', '9999'];
    const index = indexOf(card('0062', 'vectorz', 'ready', true));
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0062', 'vectorz', 'ready', true));
    expect(r.unresolved).toEqual(['9999']); // pas omis malgré la tête trouvée avant
  });

  it('n’élit jamais un épic comme tête, même todo+ready (revue Codex #53)', () => {
    const planIds = ['0155', '0041'];
    const index = indexOf(
      card('0155', 'mega-city', 'ready', true, 'epic'), // épic tirable en apparence
      card('0041', 'vectorz', 'ready', true), // la vraie tirable
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('0041', 'vectorz', 'ready', true));
    expect(r.blockedAhead).toEqual([]); // l'épic n'est pas non plus un blocage
  });

  it('renvoie head null et listes vides sur un plan vide', () => {
    const r = crossBacklogHead([], new Map());
    expect(r).toEqual({ head: null, blockedAhead: [], unresolved: [] });
  });

  it('traite un id HORODATÉ (17 chiffres, fiche 0180) comme une tête normale, aux côtés du legacy', () => {
    const planIds = ['20260810143052123', '0041'];
    const index = indexOf(
      card('20260810143052123', 'vectorz', 'ready', true),
      card('0041', 'vectorz', 'ready', true),
    );
    const r = crossBacklogHead(planIds, index);
    expect(r.head).toEqual(card('20260810143052123', 'vectorz', 'ready', true));
    expect(r.unresolved).toEqual([]);
  });
});
