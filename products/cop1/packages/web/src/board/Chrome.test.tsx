import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { latestTaggedVersion } from './Chrome.js';
import { renderBoardOn } from './testing/renderBoard.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardData, BoardProject, VersionLot } from './types.js';

afterEach(cleanup);

const vectorz = BOARD_DATA.vectorz as BoardProject;
const muti = BOARD_DATA.muti as BoardProject;

function lot(version: string, etiquette: string | null): VersionLot {
  return { version, nom: null, milestones: [], etat: 'x', cycleDeVie: 'x', etiquette, dateEtiquette: null, livrees: [], aFaire: [], pretes: [], bloquees: [] };
}

const WITH_LOTS: BoardData = {
  ...BOARD_DATA,
  vectorz: {
    ...vectorz,
    plan: { state: 'ok' },
    versionsPage: {
      lots: [lot('v0.22.0', 'v0.22.0'), lot('v0.23.0', 'v0.23.0'), lot('v0.24.0', null)],
      prochaineCoupe: { derniereEtiquette: 'v0.23.0', livrees: [], nombre: null, gate: null, numeroPropose: null },
    },
  },
};

describe('latestTaggedVersion', () => {
  it('prend la dernière étiquette publiée par la page Versions', () => {
    expect(latestTaggedVersion(WITH_LOTS.vectorz as BoardProject)).toBe('v0.23.0');
  });
  it('sans page Versions, prend la version passée la plus récente', () => {
    expect(latestTaggedVersion({ ...muti, versionsPage: undefined })).toBe('v1.7.0');
  });
  it('dit « aucune version » sans version étiquetée', () => {
    const none = { ...muti, versionsPage: undefined, versions: { ...muti.versions, past: [] } };
    expect(latestTaggedVersion(none)).toBe('aucune version');
  });
  it('dit « non publié » quand le plan n’est pas arrivé', () => {
    expect(latestTaggedVersion({ ...muti, plan: { state: 'loading' } })).toBe('non publié');
  });
});

describe('Board — l’habillage commun (fiche 20261126170000101)', () => {
  it('l’en-tête dit « Mission control » et la pastille suit le projet, jamais v0.17.0', async () => {
    await renderBoardOn(WITH_LOTS);
    const top = document.querySelector('.top') as HTMLElement;
    expect(top.textContent).toContain('Mission control');
    expect(top.querySelector('.bv')?.textContent).toBe('v0.23.0');
    expect(screen.queryByText('v0.17.0')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    await userEvent.click(screen.getByRole('button', { name: /muti/ }));
    expect(document.querySelector('.top .bv')?.textContent).toBe('v1.7.0');
  });

  it('pose un fil d’Ariane dont les maillons mènent aux bonnes pages', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Fiches' }));
    const crumb = screen.getByRole('navigation', { name: "Fil d'Ariane" });
    expect(crumb.textContent).toMatch(/Projets\s*›\s*vectorz\s*›\s*Fiches/);
    expect(within(crumb).queryByRole('button', { name: 'Fiches' })).toBeNull();
    await userEvent.click(within(crumb).getByRole('button', { name: 'vectorz' }));
    expect(screen.getByText("Vue d'ensemble — vectorz")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Fiches' }));
    await userEvent.click(within(screen.getByRole('navigation', { name: "Fil d'Ariane" })).getByRole('button', { name: 'Projets' }));
    expect(screen.getByText('Tous les projets')).toBeTruthy();
  });

  it('le dernier maillon du fil est la page où l’on est', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    const crumb = screen.getByRole('navigation', { name: "Fil d'Ariane" });
    expect(crumb.textContent).toMatch(/vectorz\s*›\s*Sessions$/);
  });

  it('pose un « i » à droite du titre et retire les sous-titres longs', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Loi' }));
    const head = screen.getByRole('heading', { name: 'Loi' }).parentElement as HTMLElement;
    const info = within(head).getByRole('button', { name: /Aide/ });
    expect(info.getAttribute('title')).toMatch(/règles de la méthode/);
    expect(screen.queryByText('les règles de la méthode, et celles que personne ne lit')).toBeNull();
  });

  it('ferme chaque page sur « mega-city · Documentation », sans lien inventé', async () => {
    await renderBoardOn();
    const nav = screen.getByRole('navigation', { name: 'Navigation du board' });
    for (const label of ['Projets', 'Fiches']) {
      await userEvent.click(within(nav).getByRole('button', { name: label }));
      const foot = screen.getByRole('contentinfo');
      expect(foot.textContent).toBe('mega-city · Documentation');
      expect(within(foot).queryByRole('link')).toBeNull();
    }
  });
});
