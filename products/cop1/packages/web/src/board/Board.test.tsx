import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Board from './Board.js';

afterEach(cleanup);

describe('Board — la coque', () => {
  it("affiche la marque et la version du board", () => {
    render(<Board />);
    expect(screen.getByText('v0.17.0')).toBeTruthy();
  });

  it('ouvre sur la vue d’ensemble du projet par défaut (vectorz)', () => {
    render(<Board />);
    expect(screen.getByText("Vue d'ensemble — vectorz")).toBeTruthy();
    const overviewNav = screen.getByRole('button', { name: "Vue d'ensemble" });
    expect(overviewNav.getAttribute('aria-current')).toBe('page');
  });

  it('porte la navigation Projet et Méthode', () => {
    render(<Board />);
    for (const label of ['Vue d\'ensemble', 'Cadrage', 'Développement', 'Fiches', 'Chronologie', 'Configuration', 'Process']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('route vers une vue non encore construite avec son repère', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: 'Process' }));
    expect(screen.getByText('tranche à venir')).toBeTruthy();
    expect(screen.getByText(/20260830110131228/)).toBeTruthy();
  });

  it('le bouton ⚙ ouvre la configuration de l’outil', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: "Configuration de l'outil" }));
    expect(screen.getByText("Configuration de l'outil")).toBeTruthy();
  });

  it('change de projet par le sélecteur et met à jour la vue d’ensemble', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    expect(screen.getByRole('dialog', { name: 'Choisir un projet' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /muti/ }));
    expect(screen.getByText("Vue d'ensemble — muti")).toBeTruthy();
    // La modale s'est refermée.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ferme le sélecteur de projet avec Échap', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Cadrage montre l’activité, et on descend run → fiche (modale)', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: 'Cadrage' }));
    // Table d'activité : un run réel.
    const run = screen.getByText('Cadrage & lotissement du backlog');
    await userEvent.click(run);
    // Détail du run : ses moments et fiches.
    expect(screen.getByText('Grooming du lot v0.11')).toBeTruthy();
    const fiche = screen.getByText('Release-gate (skill ezk-release)');
    await userEvent.click(fiche);
    // Modale fiche ouverte.
    const modal = screen.getByRole('dialog');
    expect(modal).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('naviguer ferme la modale fiche (pas de modale orpheline)', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: 'Cadrage' }));
    await userEvent.click(screen.getByText('Cadrage & lotissement du backlog'));
    await userEvent.click(screen.getByText('Release-gate (skill ezk-release)'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Vue d'ensemble" }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('retour depuis le détail d’un run revient à l’activité', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: 'Développement' }));
    await userEvent.click(screen.getByText('Réalisation v0.10 — portabilité multi-IDE'));
    expect(screen.getByText('Étapes du run')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /retour/ }));
    // De retour sur la table d'activité dev.
    expect(screen.getByText('Runs de développement')).toBeTruthy();
  });

  it('« Voir le run » de la vue d’ensemble ouvre le détail du run', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: 'Voir le run' }));
    expect(screen.getByText('Étapes du run')).toBeTruthy();
  });
});
