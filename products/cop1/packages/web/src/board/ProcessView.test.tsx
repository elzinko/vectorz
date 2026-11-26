/**
 * La vue Process (fiches 20261102123552183 et 20261126170000108) : « En clair », cinq tuiles de fiches par
 * statut, le schéma, les étapes de chaque compétence, qui appelle qui, livrer une version, l'équipe.
 * Tout vient de la méthode ; ce qu'elle ne publie pas s'écrit « non publié », jamais un faux zéro.
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessView } from './ProcessView.js';
import type { ProcessShow } from './processShow.js';
import { processShowExample } from './testing/processShowExample.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, ProjectProcess } from './types.js';

// La carte a son propre test (ProcessMap.test.tsx) : ici, un repère suffit.
vi.mock('./ProcessMap.js', () => ({ ProcessMap: () => <div data-testid="process-map" /> }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const base = BOARD_DATA.vectorz as BoardProject;
const example = processShowExample();

const stage = (id: ProjectProcess['stages'][0]['stage'], label: string, total: number) => ({ stage: id, label, fiches: [], total });
const process: ProjectProcess = {
  github: true,
  reviewUnknown: false,
  stages: [
    stage('idee', 'Idée', 20),
    stage('prete', 'Prête', 0),
    stage('en-sprint', 'En sprint', 1),
    stage('en-revue', 'En revue', 2),
    stage('livree', 'Livrée', 336),
  ],
};

const agents: NonNullable<NonNullable<BoardProject['config']>['agents']> = [
  { agent: 'ezk-reviewer', tier: 'high', model: 'claude-opus-4-8', effort: 'high', source: 'defaut' },
  { agent: 'ezk-dev', tier: 'middle', model: 'sonnet', effort: 'medium', source: 'tier-projet' },
  { agent: 'ezk-chef', tier: 'low', model: 'haiku', effort: 'low', source: 'agent' },
  { agent: 'ezk-steward', error: 'Tier inconnu pour ezk-steward : « enorme »' },
];
const config = { ...(base.config as NonNullable<BoardProject['config']>), agents };

const serve = (body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => body })));

const show = async (over: Partial<BoardProject> = {}, contract: ProcessShow | null = example, onOpenConfig = vi.fn()) => {
  if (contract) serve({ state: 'ok', process: contract });
  else serve({ state: 'unavailable', reason: 'ezk trop ancien' });
  render(<ProcessView project={{ ...base, name: 'vectorz', processState: { state: 'ok' }, process, config, ...over }} onOpenConfig={onOpenConfig} />);
  return onOpenConfig;
};
const card = (title: string): HTMLElement =>
  screen.getByRole('heading', { level: 3, name: new RegExp(`^${title}`) }).closest('section') as HTMLElement;
/** La ligne d'un tableau dont l'en-tête de ligne porte ce texte. */
const rowOf = (scope: HTMLElement, name: string): HTMLElement =>
  within(scope)
    .getAllByRole('rowheader')
    .find((h) => h.textContent === name)
    ?.closest('tr') as HTMLElement;
const sections = async (): Promise<void> => {
  await screen.findByRole('button', { name: 'Revue adverse' });
};

describe('ProcessView — En clair et fiches par statut', () => {
  it('ouvre sur « En clair », avec son « i »', async () => {
    await show();
    const clair = card('En clair');
    expect(within(clair).getByText(/Tout part d'une/)).toBeTruthy();
    expect(within(clair).getByRole('button', { name: /^Aide : / })).toBeTruthy();
  });

  it('cinq tuiles dans l’ordre idée · prête · en sprint · en revue · livrée, avec leur compteur', async () => {
    await show();
    const tiles = within(card('Mes fiches par statut')).getAllByRole('group');
    expect(tiles.map((t) => t.getAttribute('aria-label'))).toEqual(['idée', 'prête', 'en sprint', 'en revue', 'livrée']);
    expect(tiles.map((t) => within(t).getByTestId('tile-count').textContent)).toEqual(['20', '0', '1', '2', '336']);
  });

  it('le kanban des fiches a disparu : plus de colonnes, plus de cartes de fiche', async () => {
    await show();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
    expect(document.querySelector('.kanban')).toBeNull();
  });

  it('GitHub coupé : « en revue » est dite inconnue, sans faux chiffre', async () => {
    await show({ process: { ...process, github: false, reviewUnknown: true } });
    expect(screen.getByRole('note').textContent).toMatch(/^Ce projet a coupé GitHub : l'étape « en revue » est inconnue/);
    const revue = within(card('Mes fiches par statut')).getByRole('group', { name: 'en revue' });
    expect(within(revue).getByTestId('tile-count').textContent).toBe('—');
  });

  it('une méthode trop ancienne : les tuiles disent pourquoi, sans compteur', async () => {
    await show({ processState: { state: 'unavailable', reason: 'ezk a échoué (code 2)' }, process: undefined });
    expect(screen.getByRole('status').textContent).toBe('process indisponible : ezk a échoué (code 2)');
    expect(screen.queryAllByRole('group', { name: /idée|prête|livrée/ })).toHaveLength(0);
  });

  it('en lecture : la vue attend', async () => {
    await show({ processState: { state: 'loading' }, process: undefined });
    expect(screen.getByRole('status').textContent).toBe('process indisponible : process en cours de lecture');
  });

  it('montre le schéma en ligne, et les parkées à part, hors flux', async () => {
    await show({ funnel: { ...base.funnel, parked: 85 } });
    expect(screen.getByTestId('process-map')).toBeTruthy();
    expect(screen.getByText(/hors flux/).textContent).toBe('Parkées : 85 — hors flux, en attente du PO');
  });

  it('plan inconnu : pas de faux zéro de parkées', async () => {
    await show({ plan: { state: 'loading' } });
    expect(screen.queryByText(/Parkées/)).toBeNull();
  });
});

describe('ProcessView — les étapes de chaque compétence', () => {
  it('une rangée par compétence, ses étapes dans l’ordre', async () => {
    await show();
    await sections();
    const sprint = within(card('Étapes de chaque compétence')).getByRole('group', { name: 'Étapes de /ezk-sprint' });
    expect(within(sprint).getAllByRole('button').map((b) => b.textContent)).toEqual(
      example.skills.find((s) => s.id === 'ezk-sprint')?.etapes.map((e) => e.titre),
    );
  });

  it('une étape ouvre son détail ; ce que la méthode ne publie pas est dit tel quel', async () => {
    await show();
    await sections();
    await userEvent.click(screen.getByRole('button', { name: 'Revue adverse' }));
    const detail = screen.getByRole('complementary', { name: "Détail de l'étape Revue adverse" });
    expect(within(detail).getByText('ezk-reviewer')).toBeTruthy();
    expect(within(detail).getByText('performant')).toBeTruthy();
    expect(within(detail).getByText('Règles appliquées').nextElementSibling?.textContent).toContain(
      example.skills.find((s) => s.id === 'ezk-sprint')?.etapes.find((e) => e.id === 'revue-adverse')?.regles[0] ?? '?',
    );
    expect(within(detail).getByText('Moment émis').nextElementSibling?.textContent).toBe('non publié');
    expect(within(detail).getByText('Effet sur la fiche').nextElementSibling?.textContent).toBe('non publié');
    expect(within(detail).getByText('Dernier passage observé').nextElementSibling?.textContent).toMatch(/^non tracé/);
  });

  it('le détail se ferme', async () => {
    await show();
    await sections();
    await userEvent.click(screen.getByRole('button', { name: 'Revue adverse' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fermer le détail' }));
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('sans contrat : les blocs tirés du contrat disent pourquoi, jamais de données inventées', async () => {
    await show({}, null);
    await waitFor(() => expect(screen.getByText('étapes indisponibles : ezk trop ancien')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Revue adverse' })).toBeNull();
  });
});

describe('ProcessView — qui appelle qui', () => {
  it('les compétences, les agents par étape et les commandes partagées viennent du contrat', async () => {
    await show();
    await sections();
    const liens = card('Qui appelle qui');
    const appels = within(liens).getByRole('table', { name: 'Une compétence en appelle d’autres' });
    const backlog = rowOf(appels, '/ezk-backlog');
    expect(within(backlog).getByText('/ezk-sprint')).toBeTruthy();
    const archive = rowOf(appels, '/ezk-archive');
    expect(within(archive).getByText('aucune')).toBeTruthy();

    const agentsTable = within(liens).getByRole('table', { name: 'Un agent joue dans plusieurs étapes' });
    const reviewer = rowOf(agentsTable, 'ezk-reviewer');
    expect(within(reviewer).getByText('7 · Revue adverse')).toBeTruthy();

    const commandes = within(liens).getByRole('table', { name: 'Une commande sert à plusieurs compétences' });
    const retro = rowOf(commandes, '/ezk-retro');
    expect(within(retro).getByText('aussi /ezk-backlog')).toBeTruthy();
  });

  it('une commande est du texte, pas un bouton', async () => {
    await show();
    await sections();
    const commandes = within(card('Qui appelle qui')).getByRole('table', { name: 'Une commande sert à plusieurs compétences' });
    expect(within(commandes).queryAllByRole('button')).toHaveLength(0);
  });

  it('un agent connu de la config mais sans étape arrive à zéro, et le dit', async () => {
    await show();
    await sections();
    const agentsTable = within(card('Qui appelle qui')).getByRole('table', { name: 'Un agent joue dans plusieurs étapes' });
    const chef = rowOf(agentsTable, 'ezk-chef');
    expect(within(chef).getByText('0')).toBeTruthy();
  });
});

describe('ProcessView — livrer une version', () => {
  it('liste cinq étapes et renvoie à Configuration', async () => {
    const onOpenConfig = await show();
    const livrer = card('Livrer une version');
    expect(within(livrer).getAllByRole('term')).toHaveLength(5);
    await userEvent.click(within(livrer).getByRole('button', { name: /Réglé dans Configuration/ }));
    expect(onOpenConfig).toHaveBeenCalledTimes(1);
  });

  it('la commande des tests n’est pas publiée : l’écran le dit', async () => {
    await show();
    expect(within(card('Livrer une version')).getByText('non publié')).toBeTruthy();
  });
});

describe('ProcessView — équipe', () => {
  it('un niveau en français par agent, et ce qui le règle', async () => {
    await show();
    await sections();
    const equipe = card('Équipe');
    const row = (agent: string) => rowOf(equipe, agent);
    expect(within(row('ezk-reviewer')).getByText('performant')).toBeTruthy();
    expect(within(row('ezk-reviewer')).getByText('défaut de la méthode')).toBeTruthy();
    expect(within(row('ezk-dev')).getByText('standard')).toBeTruthy();
    expect(within(row('ezk-dev')).getByText('tier du projet')).toBeTruthy();
    expect(within(row('ezk-chef')).getByText('économe')).toBeTruthy();
    expect(within(row('ezk-chef')).getByText('réglé pour cet agent')).toBeTruthy();
  });

  it('un agent mal configuré dit pourquoi', async () => {
    await show();
    await sections();
    const row = rowOf(card('Équipe'), 'ezk-steward');
    expect(within(row).getByText(/Tier inconnu/)).toBeTruthy();
  });

  it('config non publiée : « non publié », pas de ligne inventée', async () => {
    await show({ config: undefined });
    await sections();
    const equipe = card('Équipe');
    expect(within(equipe).getByText('non publié')).toBeTruthy();
    expect(within(equipe).queryAllByRole('row')).toHaveLength(0);
  });
});
