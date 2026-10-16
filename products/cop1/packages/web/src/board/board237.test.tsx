import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimelineView } from './TimelineView.js';
import { BOARD_DATA } from './data.js';

afterEach(cleanup);

const vectorz = BOARD_DATA.vectorz;

describe('TimelineView', () => {
  it('rend une ligne par évènement avec le temps compact', () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    expect(screen.getByText('Cadrage v0.11 en cours')).toBeTruthy();
    expect(screen.getByText('maintenant')).toBeTruthy();
  });

  it('pagine par lots (« afficher plus »)', async () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    // Le 10e évènement est masqué au départ (BATCH = 9).
    expect(screen.queryByText('Lot v0.9 figé — 5 fiches')).toBeNull();
    const more = screen.getByRole('button', { name: /Afficher plus/ });
    expect(more.textContent).toContain('8');
    await userEvent.click(more);
    expect(screen.getByText('Lot v0.9 figé — 5 fiches')).toBeTruthy();
    expect(screen.getByText('Création du projet vectorz')).toBeTruthy();
    expect(screen.getByText('↑ début du projet')).toBeTruthy();
  });

  it('filtre par type', async () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'sprint' }));
    expect(screen.getByText('Sprint 3 — Brownfield scout')).toBeTruthy();
    expect(screen.queryByText('Cadrage v0.11 en cours')).toBeNull(); // lancement, filtré
  });

  it('filtre par lot', async () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText('Lot'), 'v0.11.0');
    expect(screen.getByText('Cadrage v0.11 en cours')).toBeTruthy();
    expect(screen.queryByText('Sprint 3 — Brownfield scout')).toBeNull(); // v0.10, filtré
  });

  it('cliquer un évènement run/sprint ouvre le run', async () => {
    const onOpenRun = vi.fn();
    render(<TimelineView project={vectorz} onOpenRun={onOpenRun} />);
    await userEvent.click(screen.getByText('Sprint 3 — Brownfield scout'));
    expect(onOpenRun).toHaveBeenCalledWith('rv10');
  });

  it('un évènement sans cible de run n’est pas cliquable', () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    // « Version v0.10.0 taguée » pointe vers une version (pas un run) → pas un bouton.
    const row = screen.getByText('Version v0.10.0 taguée').closest('.tev1');
    expect(row?.getAttribute('role')).toBeNull();
  });
});
