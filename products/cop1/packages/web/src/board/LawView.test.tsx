/**
 * La vue Loi (fiche 20261126170000109) : « ce qui s'applique ici » — quatre compteurs, les règles en
 * vigueur avec leurs filtres, les paquets et leur état. Page en lecture ; jamais de faux zéro.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LawView } from './LawView.js';
import type { LawData, LawRule } from './lawModel.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = BOARD_DATA.vectorz as BoardProject;
const rule = (id: string, portee: LawRule['portee'], over: Partial<LawRule> = {}): LawRule => ({
  id,
  titre: id,
  niveau: 'SHOULD',
  fichier: `products/mega-city/rules/${id}.md`,
  bundles: [],
  profils: [],
  appliqueePar: [],
  verifieePar: [],
  portee,
  ...over,
});
const regles: LawRule[] = [
  rule('clean-code/no-dead-code', 'partout', { niveau: 'MUST', bundles: ['base', 'dod'], verifieePar: ['ezk-reviewer'] }),
  rule('agent-ops/pipe-garde-le-code-de-sortie', 'partout', { titre: 'Une commande dont le code compte garde son statut', bundles: ['base'] }),
  rule('testing/philosophy', 'demarrage', {
    niveau: 'MUST',
    titre: 'Testing Philosophy',
    bundles: ['dod'],
    appliqueePar: ['agent:ezk-dev', 'agent:ezk-reviewer'],
  }),
  rule('docs/une-regle-rangee', 'rangee', { bundles: ['docs'] }),
  rule('docs/une-orpheline', 'orpheline'),
];
const objets: LawData['objets'] = ['base', 'dod', 'docs'].map((n) => ({
  id: `bundle:${n}`,
  type: 'bundle' as const,
  regles: regles.filter((r) => r.bundles.includes(n)).map((r) => r.id),
}));
const law: LawData = {
  lois: { projet: { chemin: '.iamthelaw/ENTRY.md', installee: true } },
  comptes: { total: 5, partout: 2, projet: 0, demarrage: 1, citee: 0, rangee: 1, orpheline: 1 },
  regles,
  objets: [...objets, { id: 'skill:ezk-sprint', type: 'skill', regles: [] }],
};

function serve(body: unknown) {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => body }) as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const renderLaw = async (data: LawData = law) => {
  const fetchMock = serve({ state: 'ok', law: data });
  render(<LawView project={project} />);
  await screen.findByRole('table', { name: 'Règles en vigueur' });
  return fetchMock;
};
const rulesTable = () => screen.getByRole('table', { name: 'Règles en vigueur' });
const titles = () => within(rulesTable()).getAllByRole('row').slice(1).map((r) => r.querySelector('td')?.textContent);

describe('LawView — ce qui s’applique ici', () => {
  it('quatre compteurs tirés de la loi publiée, et le contrat du projet non publié', async () => {
    const fetchMock = await renderLaw();
    expect(fetchMock).toHaveBeenCalledWith(`/api/law/${project.name}`);
    const box = screen.getByLabelText("Ce qui s'applique ici");
    expect(within(box).getByLabelText('règles en vigueur : 3')).toBeTruthy();
    expect(within(box).getByLabelText('installées : 2')).toBeTruthy();
    expect(within(box).getByLabelText('propres au projet : 0')).toBeTruthy();
    expect(within(box).getByLabelText('paquets en vigueur : 2')).toBeTruthy();
    expect(within(box).getByText(/loi du projet : oui/)).toBeTruthy();
    expect(within(box).getByText(/profil non publié/)).toBeTruthy();
    expect(within(box).getByText(/Contrat du projet/).parentElement?.textContent).toContain('non publié');
  });

  it('une loi sans aucune règle publiée affiche « — », jamais 0', async () => {
    serve({ state: 'ok', law: { ...law, regles: [], objets: [] } });
    render(<LawView project={project} />);
    const box = await screen.findByLabelText("Ce qui s'applique ici");
    expect(within(box).getByLabelText('règles en vigueur : —')).toBeTruthy();
    expect(within(box).getByLabelText('installées : —')).toBeTruthy();
    expect(within(box).getByLabelText('paquets en vigueur : —')).toBeTruthy();
  });
});

describe('LawView — les règles en vigueur', () => {
  it('liste seulement les règles en vigueur, titre en clair, et dit « N ici · M au catalogue »', async () => {
    await renderLaw();
    expect(titles()).toEqual(['no dead code', 'Une commande dont le code compte garde son statut', 'Testing Philosophy']);
    expect(screen.getByText('3 ici · 5 au catalogue')).toBeTruthy();
  });

  it('chaque ligne dit niveau, réglé par, d’où, paquets et vérificateur', async () => {
    await renderLaw();
    const row = within(rulesTable()).getAllByRole('row')[3] as HTMLElement;
    const cells = [...row.querySelectorAll('td')].map((c) => c.textContent);
    expect(cells).toEqual(['Testing Philosophy', 'MUST', 'méthode', 'lue au démarrage par ezk-dev, ezk-reviewer', 'dod', 'méthode', '—']);
    const first = [...(within(rulesTable()).getAllByRole('row')[1] as HTMLElement).querySelectorAll('td')].map((c) => c.textContent);
    expect(first).toEqual(['no dead code', 'MUST', 'profil lié', 'installée', 'basedod', 'méthode', 'ezk-reviewer']);
  });

  it('aucun bouton Appliquer, Contrôler ou Ajouter : la page lit', async () => {
    await renderLaw();
    expect(screen.queryByRole('button', { name: /appliquer|contrôler|ajouter/i })).toBeNull();
  });

  it('le filtre « d’où » réduit la liste et le compteur dit « X sur N ici »', async () => {
    await renderLaw();
    await userEvent.click(screen.getByRole('button', { name: /^lues au démarrage · 1/ }));
    expect(titles()).toEqual(['Testing Philosophy']);
    expect(screen.getByText('1 sur 3 ici · 5 au catalogue')).toBeTruthy();
  });

  it('le filtre de niveau garde les MUST', async () => {
    await renderLaw();
    await userEvent.click(screen.getByRole('button', { name: 'MUST' }));
    expect(titles()).toEqual(['no dead code', 'Testing Philosophy']);
  });

  it('le filtre de paquet garde les règles du paquet', async () => {
    await renderLaw();
    await userEvent.selectOptions(screen.getByLabelText('Paquet'), 'dod');
    expect(titles()).toEqual(['no dead code', 'Testing Philosophy']);
  });

  it('la recherche filtre sur le titre', async () => {
    await renderLaw();
    await userEvent.type(screen.getByLabelText('Rechercher une règle'), 'commande');
    expect(titles()).toEqual(['Une commande dont le code compte garde son statut']);
  });

  it('aucun lien vers l’Annuaire : sa page n’existe pas', async () => {
    await renderLaw();
    expect(screen.queryByRole('link', { name: /Annuaire/ })).toBeNull();
  });
});

describe('LawView — les paquets', () => {
  it('une ligne par paquet avec son état ici', async () => {
    await renderLaw();
    const table = screen.getByRole('table', { name: 'Paquets' });
    const rows = within(table).getAllByRole('row').slice(1).map((r) => [...r.querySelectorAll('td')].slice(0, 4).map((c) => c.textContent));
    expect(rows).toEqual([
      ['base', '2', 'profil lié', 'installé par la loi'],
      ['dod', '2', 'méthode', '2 règles sur 2 en vigueur'],
      ['docs', '1', '—', 'disponible'],
    ]);
  });

  it('« Ouvrir » déplie les règles du paquet sur place', async () => {
    await renderLaw();
    const table = screen.getByRole('table', { name: 'Paquets' });
    expect(within(table).queryByText('docs/une-regle-rangee')).toBeNull();
    await userEvent.click(within(table).getAllByRole('button', { name: 'Ouvrir' })[0] as HTMLElement);
    expect(within(table).getByText('no dead code', { selector: 'td' })).toBeTruthy();
  });
});

describe('LawView — jamais de faux chiffre', () => {
  it('la méthode ne répond pas : la raison, et aucun compteur', async () => {
    serve({ state: 'unavailable', reason: 'ezk a échoué (code 127)' });
    render(<LawView project={project} />);
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toBe('loi indisponible : ezk a échoué (code 127)'));
    expect(screen.queryByLabelText(/règles en vigueur/)).toBeNull();
  });
});
