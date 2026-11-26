/**
 * Les pages Sprints et Un sprint (fiche 20261126170000104) : la liste (titre « Sprint N — but », badge,
 * rétro, session), ses filtres et « Afficher plus », la page d'un sprint et ses cinq blocs, et « non
 * publié » / « non mesuré » à la place de ce que la méthode ne publie pas.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SprintsView, type SprintsViewProps } from './SprintsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail, SprintSummary } from './types.js';

afterEach(cleanup);

const sprint = (slug: string, jour: string, extra: Partial<SprintSummary> = {}): SprintSummary => ({
  slug,
  fichier: `docs/sprints/${jour}-sprint-${slug}.md`,
  jour,
  fin: `${jour}T17:50:00.000Z`,
  dureeMs: 1_980_000,
  tokens: null,
  livrees: [{ id: 'f1', title: 'Une fiche livrée' }],
  blocages: 0,
  ...extra,
});

const base = BOARD_DATA.vectorz as BoardProject;
const project: BoardProject = {
  ...base,
  plan: { state: 'ok' },
  metrics: { ...base.metrics, sprints: 55 },
  lastSprints: [
    sprint('pages-objectifs', '2026-11-24'),
    sprint('menu-par-portee', '2026-11-19', { blocages: 2 }),
    sprint('vieux', '2026-10-01', { blocages: null }),
  ],
  fiches: {
    f1: { id: 'f1', title: 'Une fiche livrée', prio: 'P1', status: 'done', ver: '', enclair: '', ctx: '', crit: [], verif: '', blocked: '' } as FicheDetail,
  },
};
const now = new Date('2026-11-24T21:00:00Z');

const renderView = (p: BoardProject = project, extra: Partial<SprintsViewProps> = {}) =>
  render(<SprintsView project={p} onOpenFiche={() => {}} now={now} {...extra} />);

const rows = (): HTMLElement[] => within(screen.getByRole('list', { name: 'Sprints' })).getAllByRole('listitem');
const titles = (): string[] => rows().map((r) => within(r).getAllByRole('button')[0]?.textContent ?? '');

describe('SprintsView — la liste', () => {
  it('liste les sprints dans l’ordre publié : titre, jour, durée, fiches, session, badge et rétro', () => {
    renderView();
    expect(titles()).toEqual(['pages-objectifs', 'menu-par-portee', 'vieux']);
    const row = rows()[0] as HTMLElement;
    expect(row.textContent).toContain('2026-11-24');
    expect(row.textContent).toContain('17:50');
    expect(row.textContent).toContain('33 min');
    expect(row.textContent).toContain('1 fiche');
    expect(within(row).getByText('ok')).toBeTruthy();
    expect(within(row).getByText('rétro : non publié')).toBeTruthy();
    expect(within(row).getByText('session non publiée')).toBeTruthy();
  });

  it('un sprint avec blocages porte le badge attention ; blocages non mesurés : ni ok ni attention', () => {
    renderView();
    expect(within(rows()[1] as HTMLElement).getByText('attention')).toBeTruthy();
    expect(within(rows()[2] as HTMLElement).getByText('non mesuré')).toBeTruthy();
  });

  it('affiche « Sprint N — but » quand le but est publié, et la session en lien', async () => {
    const onOpenSession = vi.fn();
    const p = { ...project, lastSprints: [sprint('s61', '2026-11-24', { numero: 61, but: 'Pages Sprints', branche: 'main' })] };
    renderView(p, { onOpenSession });
    expect(titles()).toEqual(['Sprint 61 — Pages Sprints']);
    await userEvent.click(screen.getByRole('button', { name: 'session main' }));
    expect(onOpenSession).toHaveBeenCalledWith('main');
  });

  it('le filtre d’état réduit la liste', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: 'attention' }));
    expect(titles()).toEqual(['menu-par-portee']);
    await userEvent.click(screen.getByRole('button', { name: 'ok' }));
    expect(titles()).toEqual(['pages-objectifs']);
    await userEvent.click(screen.getByRole('button', { name: 'tous' }));
    expect(titles()).toHaveLength(3);
  });

  it('le filtre de période réduit la liste (aujourd’hui, 7 jours, tout)', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: '7 jours' }));
    expect(titles()).toEqual(['pages-objectifs', 'menu-par-portee']);
    await userEvent.click(screen.getByRole('button', { name: 'aujourd’hui' }));
    expect(titles()).toEqual(['pages-objectifs']);
    await userEvent.click(screen.getByRole('button', { name: 'tout' }));
    expect(titles()).toHaveLength(3);
  });

  it('la recherche réduit la liste sur le titre', async () => {
    renderView();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un sprint' }), 'vieux');
    expect(titles()).toEqual(['vieux']);
  });

  it('« Afficher plus » ajoute des lignes ; le compteur à droite dit combien sur combien', async () => {
    const many = Array.from({ length: 12 }, (_, i) => sprint(`s${i}`, '2026-11-24'));
    renderView({ ...project, lastSprints: many });
    expect(titles()).toHaveLength(10);
    expect(screen.getByRole('status').textContent).toBe('10 sur 12 sprints');
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(titles()).toHaveLength(12);
    expect(screen.getByRole('status').textContent).toBe('12 sur 12 sprints');
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
  });

  it('dit que la méthode ne publie que les derniers sprints, tant que la liste est tronquée', () => {
    renderView();
    expect(screen.getByRole('note').textContent).toBe('La méthode ne publie que les 3 derniers sprints sur 55.');
  });

  it('n’affiche aucune commande ezk ni le mot « run »', () => {
    const { container } = renderView();
    expect(container.textContent).not.toMatch(/\/ezk-|ezk |\brun\b/);
  });
});

describe('SprintsView — la page d’un sprint', () => {
  const open = async (name: string, p: BoardProject = project, extra: Partial<SprintsViewProps> = {}): Promise<void> => {
    renderView(p, extra);
    await userEvent.click(screen.getByRole('button', { name }));
  };

  it('s’ouvre au clic, le dit à la page parente (fil d’Ariane) et montre les cinq blocs dans l’ordre de la maquette', async () => {
    const onFocusChange = vi.fn();
    await open('pages-objectifs', project, { onFocusChange });
    expect(onFocusChange).toHaveBeenCalledWith('pages-objectifs');
    expect(screen.queryByRole('navigation')).toBeNull();
    const blocs = screen.getAllByRole('heading', { level: 3 }).map((h) => (h.textContent ?? '').replace(/i$/, ''));
    expect(blocs).toEqual(['Fiches livrées', 'Session', 'Compte rendu', 'Dans le journal', 'Rétro']);
  });

  it('l’en-tête tient en une ligne : dates, durée, lot, incrément, session, blocages, jetons, objectif', async () => {
    await open('pages-objectifs');
    const head = screen.getByLabelText('Résumé du sprint');
    expect(head.textContent).toContain('2026-11-24');
    expect(head.textContent).toContain('33 min');
    expect(head.textContent).toContain('lot d’une fiche');
    expect(head.textContent).toContain('incrément : non publié');
    expect(head.textContent).toContain('0 blocage');
    expect(head.textContent).toContain('jetons : non mesuré');
    expect(head.textContent).toContain('objectif : non publié');
  });

  it('Fiches livrées : titre cliquable, priorité, étape livrée', async () => {
    const onOpenFiche = vi.fn();
    await open('pages-objectifs', project, { onOpenFiche });
    await userEvent.click(screen.getByRole('button', { name: 'Une fiche livrée' }));
    expect(onOpenFiche).toHaveBeenCalledWith('f1');
    expect(screen.getByText('P1')).toBeTruthy();
    expect(screen.getByText(/^livrée/)).toBeTruthy();
  });

  it('Compte rendu : lot scellé, jetons non mesurés (jamais 0), fichier ; « Ouvrir » seulement si un geste existe', async () => {
    await open('pages-objectifs');
    expect(screen.getByText('docs/sprints/2026-11-24-sprint-pages-objectifs.md')).toBeTruthy();
    expect(screen.getByText('1 fiche livrée')).toBeTruthy();
    expect(screen.getAllByText('non mesuré').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Ouvrir' })).toBeNull();
  });

  it('un sprint sans but, sans session et sans rétro : « non publié » partout, « Lancer une rétro » absent', async () => {
    await open('pages-objectifs');
    const session = screen.getByRole('heading', { name: /^Session/ }).closest('section') as HTMLElement;
    expect(session.textContent).toContain('non publié');
    const retro = screen.getByRole('heading', { name: /^Rétro/ }).closest('section') as HTMLElement;
    expect(retro.textContent).toContain('non publié');
    expect(screen.queryByRole('button', { name: 'Lancer une rétro' })).toBeNull();
    const journal = screen.getByRole('heading', { name: /^Dans le journal/ }).closest('section') as HTMLElement;
    expect(journal.textContent).toContain('non publié');
  });

  it('un sprint avec session : lien vers la page de la session et « récit pas encore écrit »', async () => {
    const onOpenSession = vi.fn();
    const p = { ...project, lastSprints: [sprint('s61', '2026-11-24', { numero: 61, but: 'Pages Sprints', branche: 'main' })] };
    await open('Sprint 61 — Pages Sprints', p, { onOpenSession });
    const bloc = screen.getByRole('heading', { name: /^Session/ }).closest('section') as HTMLElement;
    expect(bloc.textContent).toContain('récit pas encore écrit');
    await userEvent.click(within(bloc).getByRole('button', { name: 'main' }));
    expect(onOpenSession).toHaveBeenCalledWith('main');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Sprint 61 — Pages Sprints');
  });

  it('durée non publiée : « non mesurée », jamais 0', async () => {
    const p = { ...project, lastSprints: [sprint('x', '2026-11-24', { dureeMs: null })] };
    await open('x', p);
    expect(screen.getAllByText('non mesurée').length).toBeGreaterThan(0);
  });

  it('s’ouvre d’entrée sur le sprint demandé par une autre page', () => {
    renderView(project, { initialOpen: 'vieux' });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('vieux');
  });
});

describe('SprintsView — jamais de faux chiffre', () => {
  it('sans sprints publiés, la page dit pourquoi', () => {
    const { lastSprints: _l, ...without } = project;
    render(<SprintsView project={without} onOpenFiche={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('sprints indisponible');
  });
});
