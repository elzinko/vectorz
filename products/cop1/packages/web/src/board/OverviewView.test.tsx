import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OverviewView } from './OverviewView.js';
import type { BoardProject, Version } from './types.js';

afterEach(cleanup);

const V = (ver: string, name: string, over: Partial<Version> = {}): Version => ({
  ver,
  name,
  done: 0,
  wip: 0,
  ready: 0,
  idea: 0,
  total: 0,
  ...over,
});

/** Un projet qui exerce les trois états de ligne : en run, cadré-à-lancer, taguée. */
const PROJECT: BoardProject = {
  name: 'demo',
  desc: 'projet de démonstration',
  live: true,
  funnel: { idea: 10, ready: 4, wip: 1, unversioned: 3, parked: 7 },
  metrics: { done: 42, tokens: '9 M', temps: '~20 h', perFiche: '70 k', sprints: 30, runs: 8, retros: 5 },
  versions: {
    current: V('v2.0.0', 'En run', { ready: 3, total: 3 }),
    upcoming: [V('v2.1.0', 'À lancer', { ready: 2, total: 2 })],
    past: [V('v1.0.0', 'Taguée', { done: 2, total: 2, date: '2026-01-01', tok: '100 k' })],
  },
  runs: {
    r: { id: 'runX', name: 'run vivant', ver: 'v2.0.0', live: true },
  },
};

function renderView(overrides?: { onLaunch?: (v: string) => void; onViewRun?: (id: string) => void }) {
  return render(
    <OverviewView
      project={PROJECT}
      onLaunch={overrides?.onLaunch ?? (() => {})}
      onViewRun={overrides?.onViewRun ?? (() => {})}
    />,
  );
}

describe('OverviewView', () => {
  it('ouvre par le titre et la description du projet', () => {
    renderView();
    expect(screen.getByText("Vue d'ensemble — demo")).toBeTruthy();
    expect(screen.getByText('projet de démonstration')).toBeTruthy();
  });

  it('affiche les métriques « depuis le début »', () => {
    renderView();
    expect(screen.getByText('fiches livrées')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('tokens consommés')).toBeTruthy();
    expect(screen.getByText('9 M')).toBeTruthy();
    // 1 courante + 1 passée = 2 versions comptées.
    expect(screen.getByText('versions')).toBeTruthy();
  });

  it("affiche l'entonnoir avec le ratio prêtes / idées", () => {
    renderView();
    expect(screen.getByText('Entonnoir — le pipeline actif')).toBeTruthy();
    // ratio 4/10 = 0.40
    expect(screen.getByText('0.40')).toBeTruthy();
    expect(screen.getByText(/parkées/)).toBeTruthy();
  });

  it('surligne la version en run et offre « Voir le run »', async () => {
    const onViewRun = vi.fn();
    renderView({ onViewRun });
    expect(screen.getByText('● en run')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Voir le run' });
    await userEvent.click(btn);
    expect(onViewRun).toHaveBeenCalledWith('runX');
  });

  it('offre « ▸ Lancer » pour une version cadrée non livrée sans run', async () => {
    const onLaunch = vi.fn();
    renderView({ onLaunch });
    const btn = screen.getByRole('button', { name: '▸ Lancer' });
    await userEvent.click(btn);
    expect(onLaunch).toHaveBeenCalledWith('v2.1.0');
  });

  it('marque une version taguée et ne lui donne pas de bouton', () => {
    renderView();
    expect(screen.getByText('✓ taguée')).toBeTruthy();
    // Seules deux actions au total : « Voir le run » et « Lancer ».
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('ordonne les versions de la plus récente à la plus ancienne', () => {
    renderView();
    const rows = screen.getAllByText(/^v\d/).map((el) => el.textContent);
    expect(rows).toEqual(['v2.1.0', 'v2.0.0', 'v1.0.0']);
  });

  it('une seule vérité : chaque version apparaît une fois', () => {
    renderView();
    const table = screen.getByText('Versions dans le process').closest('section');
    expect(table).toBeTruthy();
    expect(within(table as HTMLElement).getAllByText('v2.0.0')).toHaveLength(1);
  });

  it('montre la progression de dev d’une version en run encore partiellement groomée (pas « pas cadré »)', () => {
    const p: BoardProject = {
      name: 'x',
      desc: '',
      live: true,
      funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
      metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
      versions: {
        current: V('v9.0.0', 'En cours', { done: 5, wip: 1, ready: 3, idea: 2, total: 20 }),
        upcoming: [],
        past: [],
      },
      runs: { r: { id: 'runY', name: 'en run', ver: 'v9.0.0', live: true } },
    };
    render(<OverviewView project={p} onLaunch={() => {}} onViewRun={() => {}} />);
    expect(screen.getByText('● en run')).toBeTruthy();
    expect(screen.getByText('5/20')).toBeTruthy();
    expect(screen.queryByText('— pas cadré')).toBeNull();
  });

  it('affiche « — pas cadré » seulement quand rien n’est cadré ni commencé', () => {
    const p: BoardProject = {
      name: 'x',
      desc: '',
      live: false,
      funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
      metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
      versions: {
        current: null,
        upcoming: [V('v3.0.0', 'À cadrer', { idea: 5, total: 5 })],
        past: [],
      },
      runs: {},
    };
    render(<OverviewView project={p} onLaunch={() => {}} onViewRun={() => {}} />);
    expect(screen.getByText('— pas cadré')).toBeTruthy();
  });

  it('ne propose jamais « Lancer » sur une version déjà taguée (cadrée, non entièrement livrée)', () => {
    const p: BoardProject = {
      name: 'x',
      desc: '',
      live: false,
      funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
      metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
      versions: {
        current: null,
        upcoming: [],
        // Taguée alors qu'une fiche n'est pas livrée : cadrée (groomed=total), done<total.
        past: [V('v2.0.0', 'Taguée partielle', { done: 1, ready: 1, total: 2, date: '2026-01-01' })],
      },
      runs: {},
    };
    render(<OverviewView project={p} onLaunch={() => {}} onViewRun={() => {}} />);
    expect(screen.getByText('✓ taguée')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '▸ Lancer' })).toBeNull();
  });
});
