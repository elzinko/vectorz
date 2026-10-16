import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityTable } from './ActivityTable.js';
import { RunDetailView } from './RunDetailView.js';
import { FicheModal } from './FicheModal.js';
import { BOARD_DATA } from './data.js';
import type { FicheDetail } from './types.js';

afterEach(cleanup);

const vectorz = BOARD_DATA.vectorz;

describe('ActivityTable', () => {
  it('liste les runs de la lentille cadrage avec nom réel + pastilles réelles', () => {
    render(<ActivityTable project={vectorz} lens="cadrage" onOpenRun={() => {}} />);
    expect(screen.getByText('Cadrage & lotissement du backlog')).toBeTruthy();
    expect(screen.getByText('groom')).toBeTruthy();
    // Le run de dev ne doit pas apparaître dans la lentille cadrage.
    expect(screen.queryByText('Réalisation v0.10 — portabilité multi-IDE')).toBeNull();
  });

  it('lentille dev montre les sprints, pas le run de cadrage', () => {
    render(<ActivityTable project={vectorz} lens="dev" onOpenRun={() => {}} />);
    expect(screen.getByText('Réalisation v0.10 — portabilité multi-IDE')).toBeTruthy();
    expect(screen.getByText('S1')).toBeTruthy();
    expect(screen.queryByText('Cadrage & lotissement du backlog')).toBeNull();
  });

  it('cliquer une ligne ouvre le run', async () => {
    const onOpenRun = vi.fn();
    render(<ActivityTable project={vectorz} lens="cadrage" onOpenRun={onOpenRun} />);
    await userEvent.click(screen.getByText('Cadrage & lotissement du backlog'));
    expect(onOpenRun).toHaveBeenCalledWith('r1');
  });
});

describe('RunDetailView', () => {
  it('descend run → moments → fiches avec transition', () => {
    render(
      <RunDetailView project={vectorz} run={vectorz.runs.r1} onBack={() => {}} onOpenFiche={() => {}} />,
    );
    expect(screen.getByText('Grooming du lot v0.11')).toBeTruthy();
    // titre de fiche réel (depuis project.fiches), pas l'id
    expect(screen.getByText('Release-gate (skill ezk-release)')).toBeTruthy();
    expect(screen.getAllByText('idea → ready').length).toBeGreaterThan(0);
  });

  it('cliquer une fiche ouvre sa modale', async () => {
    const onOpenFiche = vi.fn();
    render(
      <RunDetailView project={vectorz} run={vectorz.runs.r1} onBack={() => {}} onOpenFiche={onOpenFiche} />,
    );
    await userEvent.click(screen.getByText('Release-gate (skill ezk-release)'));
    expect(onOpenFiche).toHaveBeenCalledWith('20260922175954296');
  });

  it('le bouton retour revient en arrière', async () => {
    const onBack = vi.fn();
    render(
      <RunDetailView project={vectorz} run={vectorz.runs.r1} onBack={onBack} onOpenFiche={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /retour/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('une fiche dont le détail est absent du projet n’est pas cliquable (pas de clic mort)', () => {
    // Même run, mais aucune fiche détaillée : les lignes ne résolvent rien.
    const project = { ...vectorz, fiches: {} };
    render(
      <RunDetailView project={project} run={vectorz.runs.r1} onBack={() => {}} onOpenFiche={() => {}} />,
    );
    // Seul le bouton « retour » est un bouton ; aucune ligne de fiche cliquable.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

const FICHE: FicheDetail = {
  id: 'f1',
  title: 'Une fiche de test',
  prio: 'P1',
  status: 'ready',
  ver: 'v1.0.0',
  enclair: "L'essentiel en une phrase.",
  ctx: 'Le contexte.',
  crit: ['Critère A', 'Critère B'],
  verif: 'pnpm test',
};

describe('FicheModal', () => {
  it('montre le résumé de la fiche et un lien vers sa page', () => {
    render(<FicheModal fiche={FICHE} onClose={() => {}} onOpenPage={() => {}} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Une fiche de test')).toBeTruthy();
    expect(screen.getByText("L'essentiel en une phrase.")).toBeTruthy();
    expect(screen.getByText('Critère A')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voir la page de la fiche/ })).toBeTruthy();
  });

  it('ferme par Échap et par le bouton', async () => {
    const onClose = vi.fn();
    render(<FicheModal fiche={FICHE} onClose={onClose} onOpenPage={() => {}} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer ✕' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('« Voir la page » déclenche onOpenPage avec l’id', async () => {
    const onOpenPage = vi.fn();
    render(<FicheModal fiche={FICHE} onClose={() => {}} onOpenPage={onOpenPage} />);
    await userEvent.click(screen.getByRole('button', { name: /Voir la page de la fiche/ }));
    expect(onOpenPage).toHaveBeenCalledWith('f1');
  });
});
