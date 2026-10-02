import { describe, expect, it } from 'vitest';
import { type LotCard, formatLot, selectLot } from '../plan-lot.js';

function card(id: string, status: string, priority = 'P2', extra: Partial<LotCard> = {}): LotCard {
  return { id, product: 'mega-city', type: 'feature', status, priority, title: `Fiche ${id}`, blocked: '', done: false, ...extra };
}
const ids = (cards: { id: string }[]): string[] => cards.map((c) => c.id);

describe('selectLot — le lot du sprint (fiche 20260930194219046)', () => {
  it('suit l’ordre du PLAN, pas la priorité', () => {
    const lot = selectLot(['0003', '0001'], [card('0001', 'ready', 'P0'), card('0003', 'ready', 'P3')], 2);
    expect(ids(lot.stories)).toEqual(['0003', '0001']);
  });

  it('signale la tête bloquée : chaque idea qui précède une fiche retenue', () => {
    const cards = [card('0001', 'idea'), card('0002', 'ready'), card('0003', 'idea'), card('0004', 'ready')];
    const lot = selectLot(['0001', '0002', '0003', '0004'], cards, 2);
    expect(ids(lot.stories)).toEqual(['0002', '0004']);
    expect(ids(lot.blockedAhead)).toEqual(['0001', '0003']);
  });

  it('lot plein : une idea placée après la dernière fiche retenue n’est pas une tête bloquée', () => {
    const cards = [card('0001', 'ready'), card('0002', 'idea'), card('0003', 'ready')];
    const lot = selectLot(['0001', '0002', '0003'], cards, 1);
    expect(ids(lot.stories)).toEqual(['0001']);
    expect(lot.blockedAhead).toEqual([]);
  });

  it('N plus grand que le stock prêt : lot incomplet, et toutes les idea du plan sont signalées', () => {
    const cards = [card('0001', 'ready'), card('0002', 'idea'), card('0003', 'ready'), card('0004', 'idea')];
    const lot = selectLot(['0001', '0002', '0003', '0004'], cards, 5);
    expect(lot.requested).toBe(5);
    expect(ids(lot.stories)).toEqual(['0001', '0003']);
    expect(ids(lot.blockedAhead)).toEqual(['0002', '0004']);
  });

  it('aucune fiche prête sautée en silence : un drapeau blocked: ou un épic est écarté, avec sa raison', () => {
    const cards = [
      card('0001', 'ready', 'P1', { blocked: 'attend la fiche 0009' }),
      card('0002', 'ready', 'P1', { type: 'epic' }),
      card('0003', 'in-progress'),
      card('0004', 'shipped'),
      card('0005', 'ready'),
    ];
    const lot = selectLot(['0001', '0002', '0003', '0004', '0005'], cards, 1);
    expect(ids(lot.stories)).toEqual(['0005']);
    expect(lot.skipped.map((s) => [s.card.id, s.reason])).toEqual([
      ['0001', 'drapeau blocked: attend la fiche 0009'],
      ['0002', 'épic : jamais tirable'],
    ]);
    expect(lot.blockedAhead).toEqual([]); // in-progress et shipped ne sont pas des têtes bloquées
  });

  it('sans PLAN : P0→P3 puis id, une fiche sans priorité en dernier, les fiches de done/ ignorées', () => {
    const cards = [
      card('0004', 'ready', ''),
      card('0003', 'ready', 'P1'),
      card('0001', 'ready', 'P1'),
      card('0002', 'ready', 'P0'),
      card('0005', 'ready', 'P0', { done: true }),
    ];
    const lot = selectLot(null, cards, 10);
    expect(ids(lot.stories)).toEqual(['0002', '0001', '0003', '0004']);
    expect(lot.outsidePlan).toEqual([]);
    expect(lot.unresolved).toEqual([]);
  });

  it('sans PLAN : une idea P0 avant une fiche prête P1 est une tête bloquée', () => {
    const lot = selectLot(null, [card('0002', 'ready', 'P1'), card('0001', 'idea', 'P0')], 1);
    expect(ids(lot.stories)).toEqual(['0002']);
    expect(ids(lot.blockedAhead)).toEqual(['0001']);
  });

  it('avec PLAN : une fiche prête hors du plan est signalée, jamais retenue', () => {
    const cards = [
      card('0001', 'ready', 'P2'),
      card('0007', 'ready', 'P1'),
      card('0006', 'ready', 'P0'),
      card('0008', 'ready', 'P0', { blocked: 'secret absent' }),
      card('0009', 'idea', 'P0'),
    ];
    const lot = selectLot(['0001'], cards, 3);
    expect(ids(lot.stories)).toEqual(['0001']);
    expect(ids(lot.outsidePlan)).toEqual(['0006', '0007']);
  });

  it('un id du plan absent de features/ est introuvable, même placé après un lot plein', () => {
    const lot = selectLot(['0001', '9999'], [card('0001', 'ready')], 1);
    expect(lot.unresolved).toEqual(['9999']);
  });

  it('refuse une taille de lot qui n’est pas un entier ≥ 1', () => {
    for (const size of [0, -1, 1.5, Number.NaN]) {
      expect(() => selectLot(null, [], size)).toThrow(RangeError);
    }
  });
});

describe('formatLot — la sortie lue par l’humain et par ezk-sprint', () => {
  const sprint = 'products/mega-city/skills/ezk-sprint/scripts/sprint.sh';

  it('liste le lot dans l’ordre et tend la ligne `start --lot` prête à copier', () => {
    const lot = selectLot(['0002', '0001'], [card('0001', 'ready', 'P0'), card('0002', 'ready', 'P1')], 2);
    const out = formatLot(lot, { planned: true, sprintScript: sprint }).join('\n');
    expect(out).toContain('lot : 2 fiche(s) prête(s) sur 2 demandée(s) — ordre du PLAN');
    expect(out).toMatch(/1\. 0002 \(mega-city · P1\) — Fiche 0002\n {2}2\. 0001 \(mega-city · P0\) — Fiche 0001/);
    expect(out).toContain(`bash ${sprint} start --lot 0002,0001`);
    expect(out).not.toContain('incomplet');
  });

  it('dit qu’un lot est incomplet et nomme ce qui manque, sans masquer aucun signal', () => {
    const cards = [
      card('0001', 'idea'),
      card('0002', 'ready', 'P2', { blocked: 'attend 0009' }),
      card('0003', 'ready'),
      card('0006', 'ready', 'P0'),
    ];
    const lot = selectLot(['0001', '0002', '0003', '4242'], cards, 3);
    const out = formatLot(lot, { planned: true, sprintScript: sprint }).join('\n');
    expect(out).toContain('lot incomplet : 1 sur 3');
    expect(out).toContain('tête bloquée');
    expect(out).toContain('0001 (mega-city · P2) — Fiche 0001');
    expect(out).toContain('0002 (mega-city · P2) — Fiche 0002 — drapeau blocked: attend 0009');
    expect(out).toContain('hors plan');
    expect(out).toContain('0006 (mega-city · P0)');
    expect(out).toContain('introuvables (dans le plan, absentes de features/) : 4242');
    expect(out).toContain(`start --lot 0003`);
  });

  it('lot vide : aucune ligne `start`, et la suite proposée est le groom de la tête', () => {
    const lot = selectLot(null, [card('0001', 'idea', 'P0')], 2);
    const out = formatLot(lot, { planned: false, sprintScript: sprint }).join('\n');
    expect(out).toContain('lot : aucune fiche prête (status: ready) sur 2 demandée(s) — ordre P0→P3 puis id (pas de PLAN.md)');
    expect(out).not.toContain('start --lot');
    expect(out).toContain('rien à ouvrir');
  });
});
