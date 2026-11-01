/**
 * Le plan vient de la méthode (ADR-086). Quand il n'est pas là, la page le dit — avec la raison —
 * et n'affiche JAMAIS les chiffres d'exemple. Une fiche bloquée porte la mention « bloquée » et sa
 * raison dans sa fenêtre de détail.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Board from './Board.js';
import { FicheModal } from './FicheModal.js';
import { renderBoardOn } from './testing/renderBoard.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardData, BoardProject, FicheDetail } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const vectorzSample = BOARD_DATA.vectorz as BoardProject;

/** Un projet dont le plan n'est pas arrivé : tout est vide, comme le serveur le compose. */
function withoutPlan(plan: NonNullable<BoardProject['plan']>): BoardData {
  return {
    mon_projet: {
      ...vectorzSample,
      name: 'mon_projet',
      plan,
      funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
      versions: { current: null, upcoming: [], past: [] },
      metrics: { ...vectorzSample.metrics, done: 0 },
      fiches: {},
    },
  };
}

describe('plan indisponible ou en chargement', () => {
  it('plan indisponible → « plan indisponible : <raison> », sans les chiffres d’exemple', async () => {
    await renderBoardOn(
      withoutPlan({ state: 'unavailable', reason: 'commande ezk introuvable (« ezk »)' }),
    );
    expect(screen.getByText(/plan indisponible : commande ezk introuvable/)).toBeTruthy();
    expect(screen.queryByText(/échantillon/)).toBeNull();
    // Aucun des chiffres de l'échantillon (ex. le compte livré de vectorz) n'apparaît.
    expect(document.body.textContent).not.toContain(` ${vectorzSample.metrics.done} `);
  });

  it('plan en chargement → « plan en cours de chargement »', async () => {
    await renderBoardOn(withoutPlan({ state: 'loading' }));
    expect(screen.getByText(/plan en cours de chargement/)).toBeTruthy();
  });

  it('plan en chargement → la tuile « fiches livrées » montre « — », jamais un faux 0', async () => {
    await renderBoardOn(withoutPlan({ state: 'loading' }));
    const tile = screen.getByText('fiches livrées').parentElement;
    expect(tile?.textContent).toContain('—');
    expect(tile?.textContent).not.toContain('0');
  });

  it('plan en chargement → la page redemande, et montre le plan dès qu’il arrive', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const loading = withoutPlan({ state: 'loading' });
    const base = loading.mon_projet as BoardProject;
    const ready: BoardData = {
      mon_projet: { ...base, plan: { state: 'ok' }, metrics: { ...base.metrics, done: 326 } },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(loading) } as Response)
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(ready) } as Response);
    vi.stubGlobal('fetch', fetchMock);
    render(<Board />);
    await screen.findByText(/plan en cours de chargement/);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await screen.findByText('326')).toBeTruthy();
    expect(screen.queryByText(/plan en cours de chargement/)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('le choix du projet ne montre pas de compteurs à zéro pour un plan absent', async () => {
    await renderBoardOn(withoutPlan({ state: 'unavailable', reason: 'ezk en erreur' }));
    const projbtn = document.querySelector('.projbtn');
    expect(projbtn).toBeTruthy();
    await userEvent.click(projbtn as HTMLElement);
    const card = document.querySelector('.pmcard:not(.pmadd)');
    expect(card?.textContent).toContain('plan indisponible : ezk en erreur');
    expect(card?.textContent).not.toContain('0 prêtes');
  });

  it('plan ok → aucun message de plan', async () => {
    await renderBoardOn(withoutPlan({ state: 'ok' }));
    expect(screen.queryByText(/plan indisponible/)).toBeNull();
    expect(screen.queryByText(/plan en cours de chargement/)).toBeNull();
  });
});

describe('fiche bloquée', () => {
  const fiche: FicheDetail = {
    id: 'f1',
    title: 'Une fiche',
    prio: 'P1',
    status: 'ready',
    ver: 'v1.0.0',
    enclair: 'En clair',
    ctx: 'ctx',
    crit: [],
    verif: 'v',
  };

  it('montre « bloquée » et la raison', () => {
    render(<FicheModal fiche={{ ...fiche, blocked: 'panel' }} onClose={() => {}} onOpenPage={() => {}} />);
    expect(screen.getByText(/bloquée/)).toBeTruthy();
    expect(screen.getByText(/panel/)).toBeTruthy();
  });

  it('ne montre rien de tel pour une fiche non bloquée', () => {
    render(<FicheModal fiche={{ ...fiche, blocked: '' }} onClose={() => {}} onOpenPage={() => {}} />);
    expect(screen.queryByText(/bloquée/)).toBeNull();
  });
});
