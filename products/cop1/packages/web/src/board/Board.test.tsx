import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderBoardOn } from './testing/renderBoard.js';

afterEach(cleanup);

describe('Board — la coque', () => {
  it("affiche la marque et la version du board", async () => {
    await renderBoardOn();
    expect(screen.getByText('v0.17.0')).toBeTruthy();
  });

  it('ouvre sur la vue d’ensemble du projet par défaut (vectorz)', async () => {
    await renderBoardOn();
    expect(screen.getByText("Vue d'ensemble — vectorz")).toBeTruthy();
    const overviewNav = screen.getByRole('button', { name: "Vue d'ensemble" });
    expect(overviewNav.getAttribute('aria-current')).toBe('page');
  });

  it('range le menu par portée : Global, puis Projet · nom du projet (fiche 20261114131616818)', async () => {
    await renderBoardOn();
    const nav = screen.getByRole('navigation', { name: 'Navigation du board' });
    expect([...nav.querySelectorAll('.grp')].map((g) => g.textContent)).toEqual(['Global', 'Projet · vectorz', 'Archives']);
    const entries = [...nav.querySelectorAll('button .lbl')].map((l) => l.textContent);
    expect(entries).toEqual([
      'Projets',
      'Carte de la méthode',
      'Annuaire de la méthode',
      "Vue d'ensemble",
      'Objectifs',
      'Pilotage',
      'Cadrage',
      'Développement',
      'Fiches',
      'Sprints',
      'Sessions',
      'Versions',
      'Chronologie',
      'Process',
      'Loi',
      'Recettes',
      'Cartes',
      'Configuration',
    ]);
    // Le menu ne nomme pas la méthode : ni groupe « Méthode », ni « mega-city ».
    expect(nav.textContent).not.toMatch(/Méthode\b(?! de)|mega-city/);
  });

  it('l’Annuaire de la méthode est grisé, et son « i » dit ce que la méthode doit publier', async () => {
    await renderBoardOn();
    const annuaire = screen.getByRole('button', { name: /Annuaire de la méthode/ }) as HTMLButtonElement;
    expect(annuaire.disabled).toBe(true);
    expect(annuaire.title).toMatch(/graphe .*contrat compilé/);
  });

  it('route vers les pages Objectifs et Versions (fiches 20261124111115865, 20261124111115783)', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(screen.getByRole('heading', { name: 'Objectifs' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Versions' }));
    expect(screen.getByRole('heading', { name: 'Versions' })).toBeTruthy();
  });

  it('route vers la vue Process : plus de coquille « tranche à venir » (fiche 20261102123552183)', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Process' }));
    expect(screen.getByRole('heading', { name: 'Process' })).toBeTruthy();
    expect(screen.queryByText('tranche à venir')).toBeNull();
  });

  it('route vers la Carte de la méthode, dans le groupe Global (fiches 20261117114544792, 20261114131616818)', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Carte de la méthode' }));
    expect(screen.getByRole('heading', { name: /^Carte de la méthode — / })).toBeTruthy();
  });

  it('le bouton ⚙ ouvre la configuration de l’outil', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: "Configuration de l'outil" }));
    expect(screen.getByText("Configuration de l'outil")).toBeTruthy();
  });

  it('change de projet par le sélecteur et met à jour la vue d’ensemble', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    expect(screen.getByRole('dialog', { name: 'Choisir un projet' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /muti/ }));
    expect(screen.getByText("Vue d'ensemble — muti")).toBeTruthy();
    // La modale s'est refermée.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ferme le sélecteur de projet avec Échap', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Cadrage montre l’activité, et on descend run → fiche (modale)', async () => {
    await renderBoardOn();
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
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Cadrage' }));
    await userEvent.click(screen.getByText('Cadrage & lotissement du backlog'));
    await userEvent.click(screen.getByText('Release-gate (skill ezk-release)'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Vue d'ensemble" }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('retour depuis le détail d’un run revient à l’activité', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Développement' }));
    await userEvent.click(screen.getByText('Réalisation v0.10 — portabilité multi-IDE'));
    expect(screen.getByText('Étapes du run')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /retour/ }));
    // De retour sur la table d'activité dev.
    expect(screen.getByText('Lancements de développement')).toBeTruthy();
  });

  it('« Voir le run » de la vue d’ensemble ouvre le détail du run', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Voir le run' }));
    expect(screen.getByText('Étapes du run')).toBeTruthy();
  });
});
