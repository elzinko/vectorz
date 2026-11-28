import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderBoardOn } from './testing/renderBoard.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardData, BoardProject } from './types.js';

afterEach(cleanup);

/** Le projet vectorz avec une session en cours dont le lancement est le run « r1 » de l'échantillon. */
const vectorz = BOARD_DATA.vectorz as BoardProject;
const WITH_SESSION: BoardData = {
  ...BOARD_DATA,
  vectorz: {
    ...vectorz,
    plan: { state: 'ok' },
    pilotage: { milestones: [], sessions: [] },
    chantiers: [
      {
        key: 'r1',
        name: 'r1',
        state: 'live',
        age: 'il y a 12 min',
        merged: [],
        sessions: [{ id: 's1', label: 'claude/cadrage', state: 'live', events: [{ when: 'il y a 12 min', kind: 'lancement', title: 'Run démarré' }] }],
      },
    ],
  },
};

describe('Board — la coque', () => {
  it("affiche la marque et la version étiquetée du projet, plus celle du paquet", async () => {
    await renderBoardOn();
    expect(screen.getByText('Mission control')).toBeTruthy();
    expect(screen.queryByText('v0.17.0')).toBeNull();
  });

  it('ouvre sur la vue d’ensemble du projet par défaut (vectorz)', async () => {
    await renderBoardOn();
    expect(screen.getByText("Vue d'ensemble — vectorz")).toBeTruthy();
    const overviewNav = screen.getByRole('button', { name: "Vue d'ensemble" });
    expect(overviewNav.getAttribute('aria-current')).toBe('page');
  });

  it('le menu suit la maquette : Global (Projets, Annuaire de la méthode), puis Projet jusqu’à Recettes (fiche 20261128093846641)', async () => {
    await renderBoardOn();
    const nav = screen.getByRole('navigation', { name: 'Navigation du board' });
    expect([...nav.querySelectorAll('.grp')].map((g) => g.textContent)).toEqual(['Global', 'Projet · vectorz']);
    const entries = [...nav.querySelectorAll('button .lbl')].map((l) => l.textContent);
    expect(entries).toEqual([
      'Projets',
      'Annuaire de la méthode',
      "Vue d'ensemble",
      'Objectifs',
      'Fiches',
      'Sprints',
      'Sessions',
      'Rétros',
      'Versions',
      'Process',
      'Loi',
      'Configuration',
      'Recettes',
    ]);
    // Ni « Cartes », ni bloc « Archives », ni lien « v1 / archives ».
    expect(nav.textContent).not.toMatch(/Cartes|Archives|archives/);
    expect(nav.querySelector('a')).toBeNull();
    // Le menu ne nomme pas la méthode : ni groupe « Méthode », ni « mega-city ».
    expect(nav.textContent).not.toMatch(/Méthode\b(?! de)|mega-city/);
  });

  it('l’entrée « Annuaire de la méthode » est active et ouvre la page (fiche 20261128093846629)', async () => {
    await renderBoardOn();
    const annuaire = screen.getByRole('button', { name: 'Annuaire de la méthode' }) as HTMLButtonElement;
    expect(annuaire.disabled).toBe(false);
    await userEvent.click(annuaire);
    expect(screen.getByRole('heading', { name: 'Annuaire de la méthode mega-city' })).toBeTruthy();
    expect(annuaire.getAttribute('aria-current')).toBe('page');
  });

  it('le lien « Documentation » reste en pied de page', async () => {
    await renderBoardOn();
    expect(screen.getByText('Documentation')).toBeTruthy();
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

  it('la Carte de la méthode s’ouvre depuis l’Annuaire, et son fil d’Ariane y ramène (fiche 20261128093846641)', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Annuaire de la méthode' }));
    await userEvent.click(screen.getByRole('button', { name: 'Carte de la méthode' }));
    expect(screen.getByRole('heading', { name: /^Carte de la méthode — / })).toBeTruthy();
    const crumb = screen.getByRole('navigation', { name: "Fil d'Ariane" });
    expect(crumb.textContent).toBe('Projets › Annuaire de la méthode › Carte de la méthode');
    await userEvent.click(within(crumb).getByRole('button', { name: 'Annuaire de la méthode' }));
    expect(screen.getByRole('heading', { name: 'Annuaire de la méthode mega-city' })).toBeTruthy();
  });

  it('le lien « sa page Loi » de l’Annuaire ouvre la page Loi', async () => {
    await renderBoardOn();
    const law = {
      comptes: { total: 1, partout: 1, projet: 0, demarrage: 0, citee: 0, rangee: 0, orpheline: 0 },
      regles: [{ id: 'a/x', titre: 'Une règle', niveau: 'MUST', categorie: 'a', fichier: 'x.md', bundles: [], profils: [], appliqueePar: [], verifieePar: [], portee: 'partout' }],
      objets: [],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => (url.startsWith('/api/law/') ? { state: 'ok', law } : BOARD_DATA) }) as Response),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Annuaire de la méthode' }));
    await userEvent.click(await screen.findByRole('tab', { name: 'Règles · 1' }));
    await userEvent.click(screen.getByRole('button', { name: /sa page Loi/ }));
    expect(screen.getByRole('heading', { name: 'Loi' })).toBeTruthy();
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

  it('la page Sessions ouvre le détail d’un lancement, puis la fiche (modale) (fiche 20261124111116126)', async () => {
    await renderBoardOn(WITH_SESSION);
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Voir le lancement' }));
    expect(screen.getByText('Grooming du lot v0.11')).toBeTruthy();
    await userEvent.click(screen.getByText('Release-gate (skill ezk-release)'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('naviguer ferme la modale fiche (pas de modale orpheline)', async () => {
    await renderBoardOn(WITH_SESSION);
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Voir le lancement' }));
    await userEvent.click(screen.getByText('Release-gate (skill ezk-release)'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Vue d'ensemble" }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('retour depuis le détail d’un lancement revient à la page Sessions', async () => {
    await renderBoardOn(WITH_SESSION);
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Voir le lancement' }));
    expect(screen.getByText('Étapes du run')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /retour/ }));
    expect(screen.getByText('En cours — 1')).toBeTruthy();
  });

  it('la page d’une session n’a qu’un fil d’Ariane, celui de Board, qui ramène à la liste', async () => {
    const data: BoardData = {
      ...WITH_SESSION,
      vectorz: {
        ...(WITH_SESSION.vectorz as BoardProject),
        pilotage: { milestones: [], sessions: [{ date: '2026-11-04', title: 'Session du 4 novembre', file: 'a.md', fiches: [], prs: [] }] },
      },
    };
    await renderBoardOn(data);
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Session du 4 novembre' }));
    const navs = screen.getAllByRole('navigation', { name: /Fil d'Ariane/ });
    expect(navs).toHaveLength(1);
    expect(navs[0]?.textContent).toBe('Projets › vectorz › Sessions › Session du 4 novembre');
    await userEvent.click(within(navs[0] as HTMLElement).getByRole('button', { name: 'Sessions' }));
    expect(screen.getByText('Closes — 1')).toBeTruthy();
  });

  it('« Tous les objectifs » de la vue d’ensemble ouvre la page Objectifs', async () => {
    const objectifs = [{ slug: 'carte', nom: 'La carte', status: 'in-progress', total: 3, shipped: 1, counts: {}, aFaire: [], livrees: [], versions: [] }];
    await renderBoardOn({ ...BOARD_DATA, vectorz: { ...vectorz, plan: { state: 'ok' }, objectifs } });
    await userEvent.click(screen.getByRole('button', { name: /Tous les objectifs/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Objectifs' })).toBeTruthy();
  });
});
