/**
 * La vue Loi (fiche 20260826222044335) : les comptes de la méthode, deux colonnes reliées par la
 * sélection, la portée dite en mots. Sans la méthode, la vue dit pourquoi, jamais des zéros.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LawView } from './LawView.js';
import { type LawData, porteeText } from './lawModel.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = BOARD_DATA.vectorz as BoardProject;
const rule = (id: string, portee: LawData['regles'][0]['portee'], appliqueePar: string[] = []) => ({
  id,
  titre: `Titre de ${id}`,
  niveau: 'SHOULD',
  fichier: `products/mega-city/rules/${id}.md`,
  bundles: ['development'],
  profils: ['cop1-target'],
  appliqueePar,
  verifieePar: [],
  portee,
});
const law: LawData = {
  comptes: { total: 3, partout: 1, projet: 0, citee: 1, rangee: 1, orpheline: 0 },
  regles: [
    rule('clean-code/no-dead-code', 'partout', ['skill:ezk-sprint', 'agent:ezk-reviewer']),
    rule('development/story-dans-un-worktree-dedie', 'citee', ['skill:ezk-sprint']),
    rule('docs/une-regle-rangee', 'rangee'),
  ],
  objets: [
    { id: 'agent:ezk-reviewer', type: 'agent', regles: ['clean-code/no-dead-code'] },
    { id: 'skill:ezk-sprint', type: 'skill', regles: ['clean-code/no-dead-code', 'development/story-dans-un-worktree-dedie'] },
  ],
};

function serve(body: unknown) {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => body }) as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const links = () => document.querySelector('svg.lawlinks')?.querySelectorAll('line').length ?? 0;

describe('LawView — les comptes de la méthode', () => {
  it('les cinq compteurs valent ceux publiés', async () => {
    const fetchMock = serve({ state: 'ok', law });
    render(<LawView project={project} />);
    expect((await screen.findByLabelText('lues partout : 1')).textContent).toBe('1 lues partout');
    expect(screen.getByLabelText('citées sans être installées : 1')).toBeTruthy();
    expect(screen.getByLabelText('orphelines : 0')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`/api/law/${project.name}`);
  });

  it('cliquer un compteur filtre la liste des règles, et le titre dit « X / Y »', async () => {
    serve({ state: 'ok', law });
    render(<LawView project={project} />);
    await userEvent.click(await screen.findByLabelText('citées sans être installées : 1'));
    expect(screen.getByText('Règles — 1 / 3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /docs\/une-regle-rangee/ })).toBeNull();
  });
});

describe('LawView — la sélection reliée', () => {
  it('un skill met ses règles en avant et trace un trait vers chacune', async () => {
    serve({ state: 'ok', law });
    render(<LawView project={project} />);
    await userEvent.click(await screen.findByRole('button', { name: /^ezk-sprint/ }));
    expect(screen.getByRole('button', { name: /story-dans-un-worktree-dedie/ }).className).toContain('hl');
    expect(screen.getByRole('button', { name: /no-dead-code/ }).className).toContain('hl');
    expect(screen.getByRole('button', { name: /une-regle-rangee/ }).className).not.toContain('hl');
    expect(links()).toBe(2);
  });

  it('une règle met en avant qui l’applique, et montre son détail, portée en mots', async () => {
    serve({ state: 'ok', law });
    render(<LawView project={project} />);
    await userEvent.click(await screen.findByRole('button', { name: /story-dans-un-worktree-dedie/ }));
    expect(screen.getByRole('button', { name: /^ezk-sprint/ }).className).toContain('hl');
    expect(screen.getByRole('button', { name: /^ezk-reviewer/ }).className).not.toContain('hl');
    expect(links()).toBe(1);
    const detail = screen.getByLabelText('détail de development/story-dans-un-worktree-dedie');
    expect(within(detail).getByText('citée par ezk-sprint, absente de la loi installée')).toBeTruthy();
    expect(within(detail).getByText('development')).toBeTruthy();
    expect(within(detail).getByText('cop1-target')).toBeTruthy();
  });

  it('sans sélection, aucun trait : jamais toutes les règles reliées d’un coup', async () => {
    serve({ state: 'ok', law });
    render(<LawView project={project} />);
    await screen.findByText('Règles — 3');
    expect(links()).toBe(0);
  });
});

describe('LawView — jamais de faux chiffre', () => {
  it('la méthode ne répond pas : la raison, et aucun compteur', async () => {
    serve({ state: 'unavailable', reason: 'ezk a échoué (code 127)' });
    render(<LawView project={project} />);
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toBe('loi indisponible : ezk a échoué (code 127)'));
    expect(screen.queryByLabelText(/lues partout/)).toBeNull();
  });

  it('chaque portée se dit en une phrase, jamais par un code', () => {
    for (const p of ['partout', 'projet', 'citee', 'rangee', 'orpheline'] as const) {
      const text = porteeText(rule('x', p, ['skill:ezk-sprint']));
      expect(text).not.toBe(p);
      expect(text.length).toBeGreaterThan(15);
    }
  });
});
