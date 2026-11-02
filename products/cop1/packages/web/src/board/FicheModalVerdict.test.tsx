/**
 * Le pouce de revue dans la fenêtre d'une fiche (fiche 20261102151630248). La fenêtre montre le pouce
 * publié par la méthode et le pose par le daemon, qui lance `ezk review verdict` : elle n'écrit rien.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Board from './Board.js';
import { FicheModal } from './FicheModal.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardData, BoardProject, FicheDetail } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const fiche: FicheDetail = {
  id: '20261102123552181',
  title: 'Une fiche à juger',
  prio: 'P2',
  status: 'ready',
  ver: '',
  enclair: 'En clair',
  ctx: 'ctx',
  crit: [],
  verif: 'v',
};

function open(over: Partial<FicheDetail> = {}, onVerdict?: (id: string, p: 'up' | 'down' | 'none') => Promise<string | null>) {
  render(<FicheModal fiche={{ ...fiche, ...over }} onClose={() => {}} onOpenPage={() => {}} onVerdict={onVerdict} />);
}

describe('FicheModal — le pouce de revue', () => {
  it('montre le pouce publié par la méthode', () => {
    open({ verdict: 'up' });
    expect(screen.getByLabelText('pouce posé : up').textContent).toBe('👍');
  });

  it('une fiche sans pouce n’en affiche aucun', () => {
    open();
    expect(screen.queryByLabelText(/pouce posé/)).toBeNull();
  });

  it('un clic pose le pouce par onVerdict, et « Retirer » le retire', async () => {
    const onVerdict = vi.fn(async () => null);
    open({ verdict: 'up' }, onVerdict);
    await userEvent.click(screen.getByRole('button', { name: '👎' }));
    expect(onVerdict).toHaveBeenCalledWith('20261102123552181', 'down');
    await userEvent.click(screen.getByRole('button', { name: 'Retirer' }));
    expect(onVerdict).toHaveBeenCalledWith('20261102123552181', 'none');
  });

  it('un refus de la méthode s’affiche, mot pour mot', async () => {
    open({}, async () => 'refusé : fiche inconnue');
    await userEvent.click(screen.getByRole('button', { name: '👍' }));
    expect((await screen.findByRole('alert')).textContent).toBe('refusé : fiche inconnue');
  });

  it('sans onVerdict, la fenêtre reste en lecture : aucun bouton de pouce', () => {
    open({ verdict: 'down' });
    expect(screen.queryByRole('button', { name: '👍' })).toBeNull();
  });
});

describe('Board — le pouce passe par le daemon, puis le board est relu', () => {
  it('un clic envoie POST /api/verdict { projet, id, pouce } et redemande le board', async () => {
    const vectorz = BOARD_DATA.vectorz as BoardProject;
    const [target] = Object.values(vectorz.fiches ?? {});
    if (!target) throw new Error('l’échantillon doit porter au moins une fiche');
    const data: BoardData = { vectorz: { ...vectorz, plan: { state: 'ok' } } };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url === '/api/verdict') return { ok: true, json: async () => ({ ok: true }) } as Response;
        return { ok: true, json: async () => data } as Response;
      }),
    );
    render(<Board />);
    await userEvent.click(await screen.findByRole('button', { name: 'Fiches' }));
    await userEvent.click(screen.getByText(target.title));
    const boardReads = () => calls.filter((c) => c.url === '/api/board').length;
    const before = boardReads();
    await userEvent.click(screen.getByRole('button', { name: '👍' }));
    const post = calls.find((c) => c.url === '/api/verdict');
    expect(post?.init?.method).toBe('POST');
    expect(JSON.parse(String(post?.init?.body))).toEqual({ projet: 'vectorz', id: target.id, pouce: 'up' });
    await vi.waitFor(() => expect(boardReads()).toBeGreaterThan(before));
  });
});
