/**
 * Le détail d'un lancement (fiche 20261012231419211). Il s'ouvre désormais depuis la page d'une
 * session et depuis « Voir le run » de la vue d'ensemble (fiche 20261124111116126).
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RunDetailView } from './RunDetailView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, BoardRun } from './types.js';

afterEach(cleanup);

const vectorz = BOARD_DATA.vectorz as BoardProject;
const run = vectorz.runs.r1 as BoardRun;

describe('RunDetailView', () => {
  it('une fiche dont le détail est absent du projet n’est pas cliquable (pas de clic mort)', () => {
    render(<RunDetailView project={{ ...vectorz, fiches: {} }} run={run} onBack={() => {}} onOpenFiche={() => {}} />);
    // Hors boutons « i » d'aide, seul le bouton « retour » est un bouton ; aucune ligne de fiche cliquable.
    expect(screen.getAllByRole('button').filter((b) => !b.classList.contains('ibtn'))).toHaveLength(1);
  });
});
