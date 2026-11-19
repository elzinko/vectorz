/**
 * La carte « Dernier sprint » de la Vue d'ensemble (fiche 20261104090517904) : les chiffres publiés par
 * la méthode, et « non mesuré » en mots quand le compte rendu ne mesure pas, jamais un faux zéro.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OverviewView, fmtDuree, fmtTokens } from './OverviewView.js';
import type { BoardProject, SprintSummary } from './types.js';

afterEach(cleanup);

const sprint = (slug: string, over: Partial<SprintSummary> = {}): SprintSummary => ({
  slug,
  fichier: `docs/sprints/2026-11-03-sprint-${slug}.md`,
  jour: '2026-11-03',
  fin: '2026-11-03T21:10:58.725Z',
  dureeMs: 2_878_825,
  tokens: 142_236_333,
  livrees: [{ id: '1', title: 'La fenêtre ne déborde plus' }],
  blocages: 0,
  ...over,
});

const project = (over: Partial<BoardProject>): BoardProject =>
  ({
    name: 'vectorz',
    desc: '',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: { current: null, upcoming: [], past: [] },
    runs: {},
    ...over,
  }) as BoardProject;

const show = (over: Partial<BoardProject>) =>
  render(<OverviewView project={project(over)} onLaunch={() => {}} onViewRun={() => {}} />);
const card = () => screen.getByRole('region', { name: 'Dernier sprint' });

describe('Vue d’ensemble — le dernier sprint', () => {
  it('montre l’objectif, la date, les quatre indicateurs et les fiches livrées par leur titre', () => {
    show({ lastSprints: [sprint('mission-control-se-lit-sans-deviner')] });
    const c = within(card());
    expect(c.getByText('mission control se lit sans deviner')).toBeTruthy();
    // Le titre est le but du sprint, et l'écran le nomme ainsi (fiche 20261114131616818).
    expect(c.getByText('But du sprint')).toBeTruthy();
    expect(c.getByText('2026-11-03')).toBeTruthy();
    expect(c.getByText('48 min')).toBeTruthy();
    expect(c.getByText('142,2 M')).toBeTruthy();
    expect(c.getByText('La fenêtre ne déborde plus')).toBeTruthy();
  });

  it('une valeur non mesurée est dite en mots, jamais zéro', () => {
    show({ lastSprints: [sprint('x', { dureeMs: null, tokens: null, blocages: null, livrees: [] })] });
    const c = within(card());
    expect(c.getByText('non mesurée')).toBeTruthy();
    expect(c.getByText('non mesurés')).toBeTruthy();
    expect(c.getByText('non dit')).toBeTruthy();
  });

  it('les sprints précédents tiennent en une ligne chacun', () => {
    show({ lastSprints: [sprint('a'), sprint('b'), sprint('c', { tokens: null })] });
    const rows = within(screen.getByLabelText('Sprints précédents')).getAllByText(/livrée\(s\)/);
    expect(rows).toHaveLength(2);
  });

  it('sans compte rendu publié, la carte le dit au lieu de disparaître', () => {
    show({ lastSprints: [] });
    expect(within(card()).getByText('aucun sprint publié par la méthode')).toBeTruthy();
    cleanup();
    show({});
    expect(within(card()).getByText('aucun sprint publié par la méthode')).toBeTruthy();
  });

  it('plan pas encore reçu : pas de carte (rien de faux à montrer)', () => {
    show({ plan: { state: 'loading' }, lastSprints: [sprint('a')] });
    expect(screen.queryByRole('region', { name: 'Dernier sprint' })).toBeNull();
  });
});

describe('formats', () => {
  it('durée et jetons', () => {
    expect(fmtDuree(2_878_825)).toBe('48 min');
    expect(fmtDuree(5_400_000)).toBe('1 h 30');
    expect(fmtTokens(28_240_940)).toBe('28,2 M');
    expect(fmtTokens(12_400)).toBe('12 k');
  });
});
