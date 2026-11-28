/**
 * La page Annuaire de la méthode (fiche 20261128093846629) : six onglets, ce que la méthode publie,
 * « non publié » pour le reste. Chaque critère d'acceptation de la fiche a son test.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnnuaireView } from './AnnuaireView.js';
import type { HelpCommand, HelpData } from './annuaireModel.js';
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
  categorie: id.split('/')[0] ?? '',
  fichier: `r/${id}.md`,
  bundles: [],
  profils: [],
  appliqueePar: [],
  verifieePar: [],
  portee,
  ...over,
});
const regles: LawRule[] = [
  rule('clean-code/no-dead-code', 'partout', { niveau: 'MUST', titre: 'Pas de code mort', bundles: ['base'], verifieePar: ['agent:ezk-reviewer'] }),
  rule('testing/philosophy', 'demarrage', { titre: 'Testing Philosophy', bundles: ['dod'], appliqueePar: ['agent:ezk-dev', 'skill:ezk-sprint'] }),
  rule('docs/rangee', 'rangee', { titre: 'Une règle rangée', bundles: ['docs'] }),
  rule('docs/orpheline', 'orpheline', { titre: 'Une règle orpheline' }),
];
const law: LawData = {
  comptes: { total: 4, partout: 1, projet: 0, demarrage: 1, citee: 0, rangee: 1, orpheline: 1 },
  regles,
  objets: [
    { id: 'skill:ezk-sprint', type: 'skill', litSesRegles: true, regles: ['testing/philosophy', 'clean-code/no-dead-code'] },
    { id: 'skill:ezk-bug', type: 'skill', litSesRegles: false, regles: [] },
    { id: 'agent:ezk-dev', type: 'agent', litSesRegles: true, regles: ['testing/philosophy'] },
    { id: 'agent:ezk-chef', type: 'agent', litSesRegles: false, regles: [] },
    { id: 'profile:cop1-target', type: 'profile', litSesRegles: false, regles: ['clean-code/no-dead-code', 'docs/rangee'] },
    { id: 'profile:base', type: 'profile', litSesRegles: false, regles: [] },
  ],
};

const cmd = (domaine: string, verbe: string | null, over: Partial<HelpCommand> = {}): HelpCommand => ({
  domaine,
  verbe,
  enClair: `Résumé de ${domaine} ${verbe ?? ''}`.trim(),
  script: `bin/${domaine}.ts`,
  ecritLeProjet: false,
  deprecie: null,
  ...over,
});
const help: HelpData = {
  skills: [
    { id: 'ezk-sprint', description: 'Chef d’atelier d’un sprint.' },
    { id: 'ezk-bug', description: 'Cadre un bug en fiche.' },
    { id: 'ezk-chef', description: 'Hub des recettes.' },
  ],
  agents: [
    { id: 'ezk-dev', description: 'Implémente le cœur en TDD.' },
    { id: 'ezk-chef', description: 'Gardien des recettes.' },
  ],
  commandes: [
    cmd('law', 'show', { enClair: 'Qui applique chaque règle.', script: 'bin/law-show.ts', ecritLeProjet: true }),
    cmd('law', 'status'),
    cmd('backlog', 'regen', { ecritLeProjet: true }),
    cmd('pr', null, { deprecie: 'forge integrate' }),
  ],
};

interface Served {
  help?: unknown;
  law?: unknown;
}
function serve({ help: h = { state: 'ok', help }, law: l = { state: 'ok', law } }: Served = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const body = url.startsWith('/api/help/') ? h : url.startsWith('/api/law/') ? l : {};
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const renderAnnuaire = async (served: Served = {}, props: { onOpenGraph?: () => void; onOpenLaw?: () => void } = {}) => {
  const fetchMock = serve(served);
  render(<AnnuaireView project={project} onOpenGraph={props.onOpenGraph ?? (() => {})} onOpenLaw={props.onOpenLaw ?? (() => {})} />);
  await screen.findByRole('tab', { name: /^Compétences/ });
  return fetchMock;
};
const openTab = async (name: RegExp) => {
  await userEvent.click(screen.getByRole('tab', { name }));
};
const bodyRows = (table: HTMLElement): string[][] =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((r) => [...r.querySelectorAll('td')].map((c) => (c.textContent ?? '').trim()));

describe('AnnuaireView — les six onglets', () => {
  it('lit l’aide et la loi du projet, titre « Annuaire de la méthode mega-city »', async () => {
    const fetchMock = await renderAnnuaire();
    expect(screen.getByRole('heading', { name: 'Annuaire de la méthode mega-city' })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`/api/help/${project.name}`);
    expect(fetchMock).toHaveBeenCalledWith(`/api/law/${project.name}`);
  });

  it('six onglets avec leur compte quand la méthode le publie, Compétences ouvert par défaut', async () => {
    await renderAnnuaire();
    await screen.findByRole('tab', { name: 'Règles · 4' });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Compétences · 3',
      'Agents · 2',
      'Règles · 4',
      'Profils · 2',
      'Commandes · 4',
      'Glossaire',
    ]);
    expect(screen.getByRole('tab', { name: /^Compétences/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('table', { name: 'Compétences' })).toBeTruthy();
  });
});

describe('AnnuaireView — Compétences', () => {
  it('les colonnes de la maquette, avec « aussi un agent » et les règles lues au démarrage', async () => {
    await renderAnnuaire();
    const table = await screen.findByRole('table', { name: 'Compétences' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Compétence (dans Claude Code : /commande)',
      "Ce qu'elle fait",
      'Lit ses règles au démarrage',
      'Règles appliquées',
    ]);
    expect(bodyRows(table)).toEqual([
      ['/ezk-sprint', 'Chef d’atelier d’un sprint.', 'oui', '2'],
      ['/ezk-bug', 'Cadre un bug en fiche.', 'non', '—'],
      ['/ezk-chef aussi un agent', 'Hub des recettes.', 'non publié', 'non publié'],
    ]);
  });

  it('la recherche réduit la liste', async () => {
    await renderAnnuaire();
    await userEvent.type(screen.getByLabelText('Rechercher une compétence'), 'bug');
    expect(bodyRows(screen.getByRole('table', { name: 'Compétences' }))).toHaveLength(1);
    expect(screen.getByText('1 affichées sur 3')).toBeTruthy();
  });

  it('sans la loi, les colonnes de règles disent « non publié », jamais 0', async () => {
    await renderAnnuaire({ law: { state: 'unavailable', reason: 'ezk introuvable' } });
    const rows = bodyRows(screen.getByRole('table', { name: 'Compétences' }));
    expect(rows.every((r) => r[2] === 'non publié' && r[3] === 'non publié')).toBe(true);
    expect(screen.getByRole('tab', { name: 'Compétences · 3' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Règles' })).toBeTruthy();
  });
});

describe('AnnuaireView — Agents', () => {
  it('Agent, Rôle, Lit ses règles, Convoqué par (non publié)', async () => {
    await renderAnnuaire();
    await openTab(/^Agents/);
    const table = screen.getByRole('table', { name: 'Agents' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Agent', 'Rôle', 'Lit ses règles', 'Convoqué par']);
    expect(bodyRows(table)).toEqual([
      ['ezk-dev', 'Implémente le cœur en TDD.', 'oui · 1 règle', 'non publié'],
      ['ezk-chef aussi un skill', 'Gardien des recettes.', 'non', 'non publié'],
    ]);
  });
});

describe('AnnuaireView — Règles', () => {
  const openRules = async (props: Parameters<typeof renderAnnuaire>[1] = {}) => {
    await renderAnnuaire({}, props);
    await screen.findByRole('tab', { name: 'Règles · 4' });
    await openTab(/^Règles/);
    return screen.getByRole('table', { name: 'Règles de la méthode' });
  };

  it('titre, comptes, colonnes et effet de chaque règle', async () => {
    const table = await openRules();
    expect(screen.getByRole('heading', { name: /Toutes les règles de la méthode/ })).toBeTruthy();
    const counts = screen.getByLabelText('Comptes des règles').textContent;
    expect(counts).toContain('4 au catalogue');
    expect(counts).toContain(`2 s'appliquent à ${project.name} → sa page Loi`);
    expect(counts).toContain("2 ne s'appliquent nulle part");
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Règle',
      'Niveau',
      'Catégorie',
      "Effet aujourd'hui",
      'Paquets',
      'Appliquée par',
      'Vérifiée par',
    ]);
    expect(bodyRows(table)).toEqual([
      ['Pas de code mort', 'MUST', 'clean-code', 'lue partout', 'base', '—', 'ezk-reviewer'],
      ['Testing Philosophy', 'SHOULD', 'testing', 'au démarrage', 'dod', '2', '—'],
      ['Une règle rangée', 'SHOULD', 'docs', 'sans effet', 'docs', '—', '—'],
      ['Une règle orpheline', 'SHOULD', 'docs', 'orpheline', '—', '—', '—'],
    ]);
  });

  it('le lien « sa page Loi » ouvre la page Loi du projet', async () => {
    const onOpenLaw = vi.fn();
    await openRules({ onOpenLaw });
    await userEvent.click(screen.getByRole('button', { name: /sa page Loi/ }));
    expect(onOpenLaw).toHaveBeenCalledTimes(1);
  });

  it('les filtres par effet portent les comptes publiés et réduisent la liste', async () => {
    const table = await openRules();
    expect(screen.getByRole('button', { name: 'lues partout · 1' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'sans effet · 1' }));
    expect(bodyRows(table).map((r) => r[0])).toEqual(['Une règle rangée']);
    await userEvent.click(screen.getByRole('button', { name: 'orphelines · 1' }));
    expect(bodyRows(table).map((r) => r[0])).toEqual(['Une règle orpheline']);
    await userEvent.click(screen.getByRole('button', { name: /^toutes/ }));
    expect(bodyRows(table)).toHaveLength(4);
  });

  it('les filtres par paquet, par catégorie et la recherche réduisent la liste', async () => {
    const table = await openRules();
    await userEvent.selectOptions(screen.getByLabelText('Paquet'), 'dod');
    expect(bodyRows(table).map((r) => r[0])).toEqual(['Testing Philosophy']);
    await userEvent.selectOptions(screen.getByLabelText('Paquet'), '');
    await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'docs');
    expect(bodyRows(table)).toHaveLength(2);
    await userEvent.type(screen.getByLabelText('Rechercher une règle'), 'orph');
    expect(bodyRows(table).map((r) => r[0])).toEqual(['Une règle orpheline']);
  });

  it('« Afficher plus » charge les règles suivantes', async () => {
    const many: LawData = {
      ...law,
      comptes: { ...law.comptes, total: 45, demarrage: 42 },
      regles: Array.from({ length: 45 }, (_, i) => rule(`cat/r${i}`, 'demarrage')),
    };
    await renderAnnuaire({ law: { state: 'ok', law: many } });
    await screen.findByRole('tab', { name: 'Règles · 45' });
    await openTab(/^Règles/);
    const table = screen.getByRole('table', { name: 'Règles de la méthode' });
    expect(bodyRows(table)).toHaveLength(20);
    expect(screen.getByText('20 règles affichées sur 45')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(bodyRows(table)).toHaveLength(40);
  });
});

describe('AnnuaireView — Profils et Glossaire', () => {
  it('un profil publié montre son nombre de règles ; hôte, contenu et lien disent « non publié »', async () => {
    await renderAnnuaire();
    await screen.findByRole('tab', { name: 'Profils · 2' });
    await openTab(/^Profils/);
    const table = screen.getByRole('table', { name: 'Profils' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Profil',
      'Hôte cible',
      'Règles',
      'Paquets · agents · skills',
      'Lié à',
    ]);
    expect(bodyRows(table)).toEqual([
      ['cop1-target', 'non publié', '2', 'non publié', 'non publié'],
      ['base', 'non publié', '0', 'non publié', 'non publié'],
    ]);
  });

  it('le glossaire n’est pas publié : l’onglet le dit, sans compte', async () => {
    await renderAnnuaire();
    await openTab(/^Glossaire/);
    expect(screen.getByRole('status').textContent).toContain('non publié');
    expect(screen.getByRole('tab', { name: 'Glossaire' })).toBeTruthy();
  });
});

describe('AnnuaireView — Commandes', () => {
  const openCommands = async () => {
    await renderAnnuaire();
    await screen.findByRole('tab', { name: 'Commandes · 4' });
    await openTab(/^Commandes/);
    return screen.getByRole('table', { name: 'Commandes de la méthode' });
  };

  it('colonnes de la maquette, filtre par domaine et recherche', async () => {
    const table = await openCommands();
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Commande', "Ce qu'elle fait", 'Écrit le projet', 'Script']);
    expect(bodyRows(table)[0]).toEqual(['law show', 'Qui applique chaque règle.', 'oui', 'bin/law-show.ts']);
    expect(bodyRows(table).map((r) => r[0])).toEqual(['law show', 'law status', 'backlog regen', 'pr']);
    await userEvent.selectOptions(screen.getByLabelText('Domaine'), 'law');
    expect(bodyRows(table)).toHaveLength(2);
    await userEvent.type(screen.getByLabelText('Rechercher une commande'), 'status');
    expect(bodyRows(table).map((r) => r[0])).toEqual(['law status']);
  });

  it('un clic ouvre le détail : domaine et verbe, ce qu’elle fait, script, écrit le projet ; Échap ferme', async () => {
    await openCommands();
    await userEvent.click(screen.getByRole('button', { name: 'law show' }));
    const dialog = screen.getByRole('dialog', { name: 'ezk law show' });
    const text = dialog.textContent ?? '';
    expect(text).toContain('law · show');
    expect(text).toContain('Qui applique chaque règle.');
    expect(text).toContain('bin/law-show.ts');
    expect(text).toMatch(/Écrit le projet\s*oui/);
    expect(text).toMatch(/Citée par\s*non publié/);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('une commande qui est un ancien nom dit son nouveau nom', async () => {
    await openCommands();
    await userEvent.click(screen.getByRole('button', { name: 'pr' }));
    const dialog = screen.getByRole('dialog', { name: 'ezk pr' });
    expect(dialog.textContent).toContain('forge integrate');
    await userEvent.click(within(dialog).getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('« Afficher plus » charge les commandes suivantes', async () => {
    const many: HelpData = { ...help, commandes: Array.from({ length: 20 }, (_, i) => cmd('d', `v${i}`)) };
    await renderAnnuaire({ help: { state: 'ok', help: many } });
    await screen.findByRole('tab', { name: 'Commandes · 20' });
    await openTab(/^Commandes/);
    const table = screen.getByRole('table', { name: 'Commandes de la méthode' });
    expect(bodyRows(table)).toHaveLength(15);
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(bodyRows(table)).toHaveLength(20);
  });
});

describe('AnnuaireView — santé de la méthode', () => {
  it('la pastille compte les avertissements et ouvre leur liste', async () => {
    await renderAnnuaire();
    const pill = await screen.findByRole('button', { name: '1 avertissement' });
    await userEvent.click(pill);
    const dialog = screen.getByRole('dialog', { name: 'Santé de la méthode' });
    expect(dialog.textContent).toContain('2 règles sur 4 sans effet : 1 rangée dans un paquet que rien ne lit, 1 orpheline');
    expect(dialog.textContent).toMatch(/ezk graph check\) : non publié/);
  });

  it('un clic sur l’avertissement mène à l’onglet Règles', async () => {
    await renderAnnuaire();
    await userEvent.click(await screen.findByRole('button', { name: '1 avertissement' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /sans effet/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('tab', { name: /^Règles/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('sans avertissement, pas de pastille', async () => {
    const clean: LawData = { ...law, comptes: { ...law.comptes, rangee: 0, orpheline: 0 } };
    await renderAnnuaire({ law: { state: 'ok', law: clean } });
    await screen.findByRole('tab', { name: 'Règles · 4' });
    expect(screen.queryByRole('button', { name: /avertissement/ })).toBeNull();
  });

  it('sans la loi, rien n’est inventé : pas de pastille', async () => {
    await renderAnnuaire({ law: { state: 'unavailable', reason: 'x' } });
    expect(screen.queryByRole('button', { name: /avertissement/ })).toBeNull();
  });
});

describe('AnnuaireView — la carte de la méthode et les données absentes', () => {
  it('le lien « Carte de la méthode » ouvre la carte zoomable', async () => {
    const onOpenGraph = vi.fn();
    await renderAnnuaire({}, { onOpenGraph });
    await userEvent.click(screen.getByRole('button', { name: 'Carte de la méthode' }));
    expect(onOpenGraph).toHaveBeenCalledTimes(1);
  });

  it('une aide non publiée : l’onglet le dit avec la raison, sans compte ni zéro', async () => {
    await renderAnnuaire({ help: { state: 'unavailable', reason: 'commande ezk introuvable' } });
    const status = await screen.findByText(/Compétences : non publié \(commande ezk introuvable\)/);
    expect(status).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Compétences' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Commandes' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Règles · 4' })).toBeTruthy();
  });
});
