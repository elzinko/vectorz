/**
 * groom-pass — la passe de grooming d'une milestone (fiche 20261015122120198). Cœur PUR : sélection
 * (quelles fiches mûrir, lesquelles arbitrer) et delta (ce que la passe a changé). Aucune I/O.
 */
import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import {
  type FicheSnapshot,
  groomPassDelta,
  renderGroomDelta,
  renderGroomSelection,
  selectMilestone,
} from '../groom-pass.js';

function fiche(o: Partial<Fiche> & { id: string }): Fiche {
  return {
    title: `Fiche ${o.id}`,
    type: 'feature',
    priority: 'P2',
    status: 'idea',
    milestone: 'preparation',
    version: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    depends: [],
    blocked: '',
    done: false,
    file: `features/${o.id}_x.md`,
    ...o,
  };
}

describe('selectMilestone — ne voit qu’une milestone, et classe', () => {
  const fiches = [
    fiche({ id: '0001', milestone: 'preparation', status: 'idea' }), // à groomer
    fiche({ id: '0002', milestone: 'preparation', status: 'ready' }), // déjà prête
    fiche({ id: '0003', milestone: 'preparation', status: 'idea', blocked: 'panel' }), // arbitrage
    fiche({ id: '0004', milestone: 'board', status: 'idea' }), // AUTRE milestone — ignorée
    fiche({ id: '0005', milestone: 'preparation', status: 'idea', done: true }), // done/ — ignorée
  ];

  it('ne retient que les fiches actives de la milestone demandée', () => {
    const ids = selectMilestone(fiches, 'preparation').map((c) => c.id);
    expect(ids).toEqual(['0001', '0002', '0003']); // ni 0004 (board) ni 0005 (done)
  });

  it('classe : idée → groom, ready → build, bloquée → escalate (reste idée)', () => {
    const byId = new Map(selectMilestone(fiches, 'preparation').map((c) => [c.id, c]));
    expect(byId.get('0001')?.disposition).toBe('groom');
    expect(byId.get('0002')?.disposition).toBe('build');
    expect(byId.get('0003')?.disposition).toBe('escalate');
    expect(byId.get('0003')?.reason).toBe('panel');
  });

  it('ignore la borne de version (préparer n’est pas tirer) : une idée d’une version haute reste « à groomer »', () => {
    const haute = [fiche({ id: '0009', milestone: 'preparation', status: 'idea', version: 'v9.9.9' })];
    expect(selectMilestone(haute, 'preparation')[0].disposition).toBe('groom');
  });

  it('exclut les fiches terminales (superseded/merged/split) : closes, ni à mûrir ni à arbitrer', () => {
    const avecTerminale = [
      fiche({ id: '0001', milestone: 'preparation', status: 'idea' }),
      fiche({ id: '0008', milestone: 'preparation', status: 'superseded' }),
    ];
    expect(selectMilestone(avecTerminale, 'preparation').map((c) => c.id)).toEqual(['0001']);
  });
});

describe('groomPassDelta — ce que la passe a changé', () => {
  const before: FicheSnapshot[] = [
    { id: '0001', status: 'idea' },
    { id: '0002', status: 'idea' },
    { id: '0003', status: 'idea' },
  ];

  it('prêtes (idée→ready), toujours idée (+ raison), découpées (nouvelles), exclues (terminales)', () => {
    const after = [
      fiche({ id: '0001', status: 'ready' }), // groomée → prête
      fiche({ id: '0002', status: 'idea', blocked: 'panel' }), // reste idée
      fiche({ id: '0003', status: 'superseded' }), // exclue
      fiche({ id: '0010', status: 'idea' }), // fille ajoutée (découpage)
    ];
    const d = groomPassDelta(before, after, 'preparation');
    expect(d.pretes).toEqual(['0001']);
    expect(d.toujoursIdee).toEqual([{ id: '0002', reason: 'panel' }]);
    expect(d.exclues).toEqual([{ id: '0003', status: 'superseded' }]);
    expect(d.decoupees).toEqual(['0010']);
  });

  it('une idée restée idée sans blocage : raison « reste à arbitrer »', () => {
    const d = groomPassDelta([{ id: '0001', status: 'idea' }], [fiche({ id: '0001', status: 'idea' })], 'preparation');
    expect(d.toujoursIdee).toEqual([{ id: '0001', reason: 'reste à arbitrer' }]);
  });

  it('une découpée doit porter la milestone — une fille d’une AUTRE milestone n’est pas comptée', () => {
    const d = groomPassDelta([{ id: '0001', status: 'idea' }], [
      fiche({ id: '0001', status: 'ready' }),
      fiche({ id: '0010', status: 'idea', milestone: 'board' }),
    ], 'preparation');
    expect(d.decoupees).toEqual([]);
  });
});

describe('rendus — en clair', () => {
  it('la sélection annonce les trois tas et le détail', () => {
    const text = renderGroomSelection('preparation', selectMilestone([
      fiche({ id: '0001', status: 'idea' }),
      fiche({ id: '0003', status: 'idea', blocked: 'panel' }),
    ], 'preparation')).join('\n');
    expect(text).toContain('1 à groomer');
    expect(text).toContain('À groomer');
    expect(text).toContain('Arbitrage humain');
    expect(text).toContain('panel');
  });

  it('le delta nomme chaque catégorie non vide', () => {
    const text = renderGroomDelta('preparation', {
      pretes: ['0001'],
      toujoursIdee: [{ id: '0002', reason: 'panel' }],
      decoupees: ['0010'],
      exclues: [{ id: '0003', status: 'superseded' }],
    }).join('\n');
    expect(text).toContain('1 prête(s)');
    expect(text).toContain('Prêtes');
    expect(text).toContain('Toujours idée');
    expect(text).toContain('Découpées');
    expect(text).toContain('Exclues');
  });
});
