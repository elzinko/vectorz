import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimelineView } from './TimelineView.js';
import { BOARD_DATA } from './data.js';
import type { BoardProject } from './types.js';

afterEach(cleanup);

const vectorz = BOARD_DATA.vectorz;
// Projet mono-session : même historique, mais sans chantiers → fil unique (fiche 0237).
const flat: BoardProject = { ...vectorz, chantiers: undefined };

describe('TimelineView — fil unique (projet sans chantiers)', () => {
  it('rend une ligne par évènement avec le temps compact', () => {
    render(<TimelineView project={flat} onOpenRun={() => {}} />);
    expect(screen.getByText('Cadrage v0.11 en cours')).toBeTruthy();
    expect(screen.getByText('maintenant')).toBeTruthy();
  });

  it('pagine par lots (« afficher plus »)', async () => {
    render(<TimelineView project={flat} onOpenRun={() => {}} />);
    expect(screen.queryByText('Lot v0.9 figé — 5 fiches')).toBeNull();
    const more = screen.getByRole('button', { name: /Afficher plus/ });
    expect(more.textContent).toContain('8');
    await userEvent.click(more);
    expect(screen.getByText('Lot v0.9 figé — 5 fiches')).toBeTruthy();
    expect(screen.getByText('Création du projet vectorz')).toBeTruthy();
    expect(screen.getByText('↑ début du projet')).toBeTruthy();
  });

  it('filtre par type', async () => {
    render(<TimelineView project={flat} onOpenRun={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'sprint' }));
    expect(screen.getByText('Sprint 3 — Brownfield scout')).toBeTruthy();
    expect(screen.queryByText('Cadrage v0.11 en cours')).toBeNull();
  });

  it('filtre par lot', async () => {
    render(<TimelineView project={flat} onOpenRun={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText('Lot'), 'v0.11.0');
    expect(screen.getByText('Cadrage v0.11 en cours')).toBeTruthy();
    expect(screen.queryByText('Sprint 3 — Brownfield scout')).toBeNull();
  });

  it('cliquer un évènement run/sprint ouvre le run', async () => {
    const onOpenRun = vi.fn();
    render(<TimelineView project={flat} onOpenRun={onOpenRun} />);
    await userEvent.click(screen.getByText('Sprint 3 — Brownfield scout'));
    expect(onOpenRun).toHaveBeenCalledWith('rv10');
  });

  it('un évènement sans cible de run n’est pas cliquable', () => {
    render(<TimelineView project={flat} onOpenRun={() => {}} />);
    const row = screen.getByText('Version v0.10.0 taguée').closest('.tev1');
    expect(row?.getAttribute('role')).toBeNull();
  });
});

describe('TimelineView — 3 niveaux (projet avec chantiers, ADR-079 §D11)', () => {
  it('niveau 1 : liste les chantiers (vue globale)', () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    expect(screen.getByText('Réalisation v0.17')).toBeTruthy();
    expect(screen.getByText('Cadrage v0.18')).toBeTruthy();
    expect(screen.getByText('Réalisation v0.16')).toBeTruthy();
  });

  it('niveau 2 : un chantier montre ses sessions + son fil fusionné étiqueté', async () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    await userEvent.click(screen.getByText('Réalisation v0.17'));
    expect(screen.getByText('◦ Tout le run · 3 sessions')).toBeTruthy();
    expect(screen.getByText('feat/0211 · activité')).toBeTruthy();
    // Chaque évènement du fil fusionné porte le libellé de sa session.
    expect(screen.getByText('⎇ feat/0211')).toBeTruthy();
    // feat/0224 émet deux évènements dans le fil fusionné → deux badges.
    expect(screen.getAllByText('⎇ feat/0224').length).toBeGreaterThan(0);
  });

  it('niveau 3 : une session montre son fil propre, sans étiquette de session', async () => {
    render(<TimelineView project={vectorz} onOpenRun={() => {}} />);
    await userEvent.click(screen.getByText('Réalisation v0.17'));
    await userEvent.click(screen.getByText('feat/0211 · activité'));
    expect(screen.getByText('Revue passée · GO')).toBeTruthy();
    // Le fil propre (niveau 3) ne porte pas de badge de session.
    expect(screen.queryByText('⎇ feat/0224')).toBeNull();
  });
});
