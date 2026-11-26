/**
 * Page « Projets » (fiche 20261126170000102) : une carte par projet, rien d'autre.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FleetView } from './FleetView.js';
import type { BoardData, BoardProject } from './types.js';

afterEach(cleanup);

const project = (name: string): BoardProject => ({
  name,
  desc: '',
  live: false,
  funnel: { idea: 0, ready: 2, wip: 0, unversioned: 0, parked: 0 },
  metrics: { done: 10, tokens: '', temps: '', perFiche: '', sprints: '—', runs: 0, retros: '—' },
  versions: { current: null, upcoming: [], past: [] },
  runs: {},
});

const DATA: BoardData = { vectorz: project('vectorz'), muti: project('muti') };

describe('FleetView', () => {
  it('s’intitule « Projets » et montre une carte par projet', () => {
    render(<FleetView projects={DATA} onOpenProject={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Projets' })).toBeTruthy();
    expect(screen.getAllByLabelText('Depuis le début')).toHaveLength(2);
    expect(screen.getAllByRole('group', { name: 'Dernier sprint' })).toHaveLength(2);
  });

  it('le nom d’un projet l’ouvre', async () => {
    const onOpenProject = vi.fn();
    render(<FleetView projects={DATA} onOpenProject={onOpenProject} />);
    await userEvent.click(screen.getByRole('button', { name: 'muti' }));
    expect(onOpenProject).toHaveBeenCalledWith('muti');
  });

  it('ne montre ni session ni ligne « aucune session »', () => {
    const { container } = render(<FleetView projects={DATA} onOpenProject={() => {}} />);
    expect(container.textContent).not.toMatch(/session/i);
  });
});
