/**
 * Le plan vient de la méthode (ADR-086). Quand il n'est pas là, la page le dit — avec la raison —
 * et n'affiche JAMAIS les chiffres d'exemple. Une fiche bloquée porte la mention « bloquée » et sa
 * raison dans sa fenêtre de détail.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
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
    const since = screen.getByLabelText('Depuis le début');
    expect(since.textContent).toMatch(/—\s*livrées/);
    expect(since.textContent).not.toMatch(/\b0\b/);
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

describe('la page suit la méthode sans qu’on la recharge', () => {
  /** Un plan reçu, avec ce compte de fiches livrées et cet état. */
  function withDone(done: number, plan: NonNullable<BoardProject['plan']>): BoardData {
    const base = withoutPlan({ state: 'ok' }).mon_projet as BoardProject;
    return { mon_projet: { ...base, plan, metrics: { ...base.metrics, done } } };
  }
  const answer = (data: BoardData): Response =>
    ({ ok: true, json: () => Promise.resolve(data) }) as Response;

  afterEach(() => {
    vi.useRealTimers();
  });

  it('le serveur relit la méthode → la page redemande vite et montre le chiffre à jour', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer(withDone(327, { state: 'ok', refreshing: true })))
      .mockResolvedValue(answer(withDone(328, { state: 'ok' })));
    vi.stubGlobal('fetch', fetchMock);
    render(<Board />);
    expect(await screen.findByText('327')).toBeTruthy();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await screen.findByText('328')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('page laissée ouverte → elle redemande toutes les 15 s et suit la méthode', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer(withDone(327, { state: 'ok' })))
      .mockResolvedValue(answer(withDone(328, { state: 'ok' })));
    vi.stubGlobal('fetch', fetchMock);
    render(<Board />);
    expect(await screen.findByText('327')).toBeTruthy();
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1); // rien ne se relit : pas de demande rapide
    await vi.advanceTimersByTimeAsync(13_000);
    expect(await screen.findByText('328')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('une fiche livrée entre deux relectures → sa fenêtre ouverte reste ouverte', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const [opened] = Object.values(vectorzSample.fiches ?? {});
    if (!opened) throw new Error('l’échantillon doit porter au moins une fiche');
    const { [opened.id]: _livree, ...others } = vectorzSample.fiches ?? {};
    const before: BoardData = { vectorz: { ...vectorzSample, plan: { state: 'ok' } } };
    const after: BoardData = { vectorz: { ...vectorzSample, plan: { state: 'ok' }, fiches: others } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer(before))
      .mockResolvedValue(answer(after));
    vi.stubGlobal('fetch', fetchMock);
    render(<Board />);
    await user.click(await screen.findByRole('button', { name: 'Fiches' }));
    await user.click(screen.getByText(opened.title));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(within(screen.getByRole('dialog')).getByText(opened.title)).toBeTruthy();
  });

  it('serveur injoignable puis revenu → la page le dit, puis montre le board sans recharger', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('connexion refusée'))
      .mockResolvedValue(answer(withDone(328, { state: 'ok' })));
    vi.stubGlobal('fetch', fetchMock);
    render(<Board />);
    expect(await screen.findByText(/injoignable/)).toBeTruthy();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await screen.findByText('328')).toBeTruthy();
    expect(screen.queryByText(/injoignable/)).toBeNull();
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
