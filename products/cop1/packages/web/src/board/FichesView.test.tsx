/**
 * La page Fiches : une liste filtrable (fiche 20261126170000103). Le kanban reste sous l'icône « Colonnes ».
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FichesView } from './FichesView.js';
import type { BoardProject, FicheDetail, FicheStatus } from './types.js';

afterEach(cleanup);

const fd = (id: string, title: string, status: FicheStatus, extra: Partial<FicheDetail> = {}): FicheDetail => ({
  id,
  title,
  prio: 'P2',
  status,
  ver: '',
  enclair: '',
  ctx: '',
  crit: [],
  verif: '',
  ...extra,
});

function makeProject(): BoardProject {
  return {
    name: 'p',
    desc: '',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: { current: null, upcoming: [], past: [] },
    runs: {},
    fiches: {
      a: fd('a', 'Idée libre', 'idea', { prio: 'P1' }),
      b: fd('b', 'Idée bloquée', 'idea', { blocked: 'attend la décision du PO' }),
      c: fd('c', 'Prête à tirer', 'ready'),
      d: fd('d', 'En revue maintenant', 'wip'),
      e: fd('e', 'Livrée avec avis', 'done', { ver: 'v1.0.0', verdict: 'up' }),
      f: fd('f', 'Livrée sans avis', 'done', { ver: 'v1.0.0' }),
      g: fd('g', 'Idée parkée', 'parked'),
    },
    objectifs: [
      { slug: 'carte', nom: 'La carte', status: 'active', total: 2, shipped: 0, counts: {}, aFaire: ['b', 'c'], livrees: [], versions: [] },
    ],
    process: {
      github: true,
      reviewUnknown: false,
      stages: [
        { stage: 'en-revue', label: 'En revue', total: 1, fiches: [{ id: 'd', title: 'En revue maintenant', priority: 'P2', version: '', branch: null, pr: null, session: null }] },
      ],
    },
  } as BoardProject;
}

const setup = (over: Partial<Parameters<typeof FichesView>[0]> = {}) =>
  render(<FichesView project={makeProject()} onOpenFiche={() => {}} {...over} />);

const list = () => screen.getByRole('table', { name: 'Fiches' });
const titles = () => within(list()).getAllByRole('button', { name: /^(Idée|Prête|En revue|Livrée)/ }).map((b) => b.textContent);

describe('FichesView — la liste', () => {
  it('la colonne Objectif montre l\'identifiant en pastille, le nom au survol, et rien pour une fiche libre', () => {
    setup();
    const pills = screen.getAllByText('carte');
    expect(pills.length).toBeGreaterThan(0);
    expect(pills[0].getAttribute('title')).toBe('La carte');
    expect(screen.queryByText('La carte')).toBeNull();
    expect(screen.queryByText('libre')).toBeNull();
  });

  it('trie par étape dans l’ordre du travail, puis par priorité', () => {
    setup();
    expect(titles()).toEqual([
      'Idée libre', // idée P1
      'Idée bloquée', // idée P2
      'Prête à tirer',
      'En revue maintenant',
      'Livrée avec avis',
      'Livrée sans avis',
    ]);
  });

  it('montre « N résultats » près des filtres et le compteur dans l’en-tête de la carte « Fiches »', () => {
    setup();
    expect(screen.getByText('6 résultats')).toBeTruthy();
    const head = screen.getByRole('heading', { level: 3, name: /^Fiches/ }).parentElement as HTMLElement;
    expect(within(head).getByText('6 affichées sur 7')).toBeTruthy();
  });

  it('ouvre en liste, parkées masquées, avec le compteur « N affichées sur M »', () => {
    setup();
    expect(titles()).toHaveLength(6);
    expect(screen.queryByText('Idée parkée')).toBeNull();
    expect(screen.getByText('6 affichées sur 7')).toBeTruthy();
    expect(screen.getByText('parkée : masquée')).toBeTruthy();
  });

  it('retirer la puce « parkée » révèle les parkées', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Retirer le filtre parkée : masquée' }));
    expect(screen.getByText('Idée parkée')).toBeTruthy();
    expect(screen.getByText('7 affichées sur 7')).toBeTruthy();
  });

  it('place chaque fiche sur son étape (process publié, sinon statut)', () => {
    setup();
    const row = (t: string) => screen.getByRole('button', { name: t }).closest('tr') as HTMLElement;
    expect(within(row('En revue maintenant')).getByText('en revue')).toBeTruthy();
    expect(within(row('Prête à tirer')).getByText('prête')).toBeTruthy();
    expect(within(row('Livrée avec avis')).getByText('livrée')).toBeTruthy();
  });

  it('filtre Étape : réduit la liste et le compteur, avec une puce', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Étape' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'idée' }));
    expect(titles()).toEqual(['Idée libre', 'Idée bloquée']);
    expect(screen.getByText('2 affichées sur 7')).toBeTruthy();
    expect(screen.getByText('Étape : idée')).toBeTruthy();
  });

  it('filtre Objectif : ne garde que les fiches de l’objectif', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Objectif' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'carte' }));
    expect(titles()).toEqual(['Idée bloquée', 'Prête à tirer']);
    expect(screen.getByText('2 affichées sur 7')).toBeTruthy();
  });

  it('filtre Drapeau « bloquée » et motif affiché dans la colonne Bloquée', async () => {
    setup();
    expect(screen.getByText('attend la décision du PO')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Drapeau' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'bloquée' }));
    expect(titles()).toEqual(['Idée bloquée']);
  });

  it('filtre Priorité', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Priorité' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'P1' }));
    expect(titles()).toEqual(['Idée libre']);
  });

  it('la recherche filtre par titre, la recherche globale aussi', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une fiche' }), 'prête');
    expect(titles()).toEqual(['Prête à tirer']);
    cleanup();
    setup({ query: 'livrée' });
    expect(titles()).toEqual(['Livrée avec avis', 'Livrée sans avis']);
  });

  it('« Tout effacer » retire toutes les puces', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Étape' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'livrée' }));
    expect(titles()).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(screen.queryByRole('button', { name: 'Tout effacer' })).toBeNull();
    expect(screen.getByText('Idée parkée')).toBeTruthy();
    expect(screen.getByText('7 affichées sur 7')).toBeTruthy();
  });

  it('« Groomer » seulement sur une idée libre non bloquée, commande en infobulle', () => {
    setup();
    const groomers = screen.getAllByRole('button', { name: 'Groomer' });
    expect(groomers).toHaveLength(1);
    expect(groomers[0].closest('tr')?.textContent).toContain('Idée libre');
    expect(groomers[0].getAttribute('title')).toContain('ezk backlog groom');
  });

  it('avis : pouce publié sur une livrée, « avis non publié » sinon, rien ailleurs', () => {
    setup();
    const row = (t: string) => screen.getByRole('button', { name: t }).closest('tr') as HTMLElement;
    expect(within(row('Livrée avec avis')).getByLabelText('pouce levé')).toBeTruthy();
    expect(within(row('Livrée sans avis')).getByTitle('avis non publié').textContent).toBe('—');
    expect(within(row('Prête à tirer')).queryByTitle('avis non publié')).toBeNull();
  });

  it('le menu « ⋯ » ouvre la fiche', async () => {
    const onOpenFiche = vi.fn();
    setup({ onOpenFiche });
    const row = screen.getByRole('button', { name: 'Prête à tirer' }).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Actions de la fiche' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ouvrir la fiche' }));
    expect(onOpenFiche).toHaveBeenCalledWith('c');
  });

  it('l’icône « Colonnes » bascule vers le kanban, « Liste » revient', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Colonnes' }));
    expect(screen.getByRole('heading', { level: 4, name: /^Idées/ })).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'Fiches' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Liste' }));
    expect(screen.getByRole('table', { name: 'Fiches' })).toBeTruthy();
  });
});
