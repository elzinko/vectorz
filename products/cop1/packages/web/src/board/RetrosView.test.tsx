/**
 * Les pages Rétros et Une rétro (fiche 20260826072532537) : la liste des rétros capturées, plus récente
 * d'abord, avec leurs propositions et les décisions du PO ; la page d'une rétro ; jamais de faux zéro ;
 * une capture sans proposition s'affiche en mode dégradé ; aucun bouton sans geste côté méthode.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RetrosView } from './RetrosView.js';
import { type RetroAction, type RetroCapture, proposalsPhrase } from './retroCaptures.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = { ...(BOARD_DATA.vectorz as BoardProject), name: 'samplerz' };

const action = (over: Partial<RetroAction> = {}): RetroAction => ({
  proposition: 'Vérifier avant de citer',
  kind: 'regle',
  by: ['architecture'],
  status: '⏳',
  decision: '',
  ...over,
});

const capture = (over: Partial<RetroCapture> = {}): RetroCapture => ({
  file: 'docs/captures/2026-11-04-retro-sprints-29-30.md',
  date: '2026-11-04',
  theme: 'Rétro des sprints 29-30',
  scope: 'Les sprints 29 et 30 du run autonome',
  participants: ['dev', 'po'],
  actions: [
    action({ proposition: 'Reconnaître le dossier jetable', status: '❌', decision: 'Écartée : pas utile', date: '2026-11-05' }),
    action({ proposition: 'Préparer sans coder' }),
    action({ proposition: 'Déclarer un RECIPE.md' }),
  ],
  ...over,
});

const serve = (captures: RetroCapture[], problems: unknown[] = []) => {
  const fetchMock = vi.fn(async () => ({ status: 200, json: async () => ({ state: 'ok', retros: { captures, problems } }) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

/** La vue pilotée comme Board la pilote : la page ouverte vit dans le parent. */
function Harness({ onFocus }: { onFocus?: (f: unknown) => void }): JSX.Element {
  const [open, setOpen] = useState<{ file: string; title: string } | null>(null);
  return (
    <RetrosView
      project={project}
      openFile={open?.file ?? null}
      onOpenChange={(f) => {
        onFocus?.(f);
        setOpen(f);
      }}
    />
  );
}

describe('proposalsPhrase', () => {
  it('compte les propositions par état, sans écrire de zéro', () => {
    const c = capture();
    expect(proposalsPhrase(c.actions)).toBe('3 propositions · 1 écartée par le PO · 2 en attente');
    expect(proposalsPhrase([action({ status: '✅', decision: 'ok', date: '2026-11-05' })])).toBe('1 proposition · 1 adoptée');
    expect(proposalsPhrase([])).toBe('propositions non publiées');
  });
});

describe('RetrosView — la liste', () => {
  it('liste les rétros, la plus récente d’abord, avec date, comptes et décisions du PO', async () => {
    serve([
      capture({ file: 'docs/captures/2026-07-18-retro-a.md', date: '2026-07-18', theme: 'Cinq sprints', actions: [] }),
      capture(),
    ]);
    render(<Harness />);
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0] as HTMLElement).getByText('Rétro des sprints 29-30')).toBeTruthy();
    expect(within(items[0] as HTMLElement).getByText(/2026-11-04/)).toBeTruthy();
    expect(within(items[0] as HTMLElement).getByText(/3 propositions · 1 écartée par le PO · 2 en attente/)).toBeTruthy();
    expect(within(items[0] as HTMLElement).getByText('1 décision PO')).toBeTruthy();
    expect(within(items[0] as HTMLElement).getByText(/sprints non tracés/)).toBeTruthy();
    expect(within(items[1] as HTMLElement).getByText('Cinq sprints')).toBeTruthy();
  });

  it('une rétro sans proposition : mode dégradé, pas de « 0 décision »', async () => {
    serve([capture({ actions: [] })]);
    render(<Harness />);
    const item = (await screen.findAllByRole('listitem'))[0] as HTMLElement;
    expect(within(item).getByText(/propositions non publiées/)).toBeTruthy();
    expect(within(item).queryByText(/décision/)).toBeNull();
  });

  it('« Afficher plus » ajoute des lignes, le compteur dit combien sont montrées', async () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      capture({ file: `docs/captures/2026-10-${String(i + 1).padStart(2, '0')}-retro-x.md`, date: `2026-10-${String(i + 1).padStart(2, '0')}`, theme: `Rétro ${i + 1}` }),
    );
    serve(many);
    render(<Harness />);
    await screen.findAllByRole('listitem');
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
    expect(screen.getByText('20 sur 25 rétros')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(25);
    expect(screen.getByText('25 rétros')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
  });

  it('ne dessine aucun bouton « Lancer une rétro » : aucun geste n’existe côté méthode', async () => {
    serve([capture()]);
    render(<Harness />);
    await screen.findAllByRole('listitem');
    expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();
  });

  it('dit pourquoi quand le daemon ne peut pas lire les rétros', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => ({ state: 'unavailable', reason: 'ezk trop ancien' }) })));
    render(<Harness />);
    expect(await screen.findByText(/rétros indisponible : ezk trop ancien/)).toBeTruthy();
  });
});

describe('RetrosView — la page d’une rétro', () => {
  it('ouvre la page : propositions avec leur état, périmètre, sprints non tracés, fichier de la capture', async () => {
    const onFocus = vi.fn();
    serve([capture()]);
    render(<Harness onFocus={onFocus} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Rétro des sprints 29-30' }));
    expect(onFocus).toHaveBeenCalledWith({ file: 'docs/captures/2026-11-04-retro-sprints-29-30.md', title: 'Rétro des sprints 29-30' });
    expect(screen.getByRole('heading', { name: 'Rétro des sprints 29-30' })).toBeTruthy();
    const props = within(screen.getByRole('region', { name: 'Propositions' }));
    expect(props.getAllByText('écartée')).toHaveLength(1);
    expect(props.getAllByText('en attente')).toHaveLength(2);
    expect(props.getByText(/Écartée : pas utile/)).toBeTruthy();
    expect(screen.getByText('Les sprints 29 et 30 du run autonome')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Sprints relus' })).getByText(/sprints non tracés/)).toBeTruthy();
    expect(screen.getByText('docs/captures/2026-11-04-retro-sprints-29-30.md')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();
  });

  it('« Précédente » mène à la rétro d’avant ; la plus ancienne n’en a pas', async () => {
    serve([capture({ file: 'docs/captures/2026-07-18-retro-a.md', date: '2026-07-18', theme: 'Cinq sprints' }), capture()]);
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Rétro des sprints 29-30' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cinq sprints' }));
    expect(screen.getByRole('heading', { name: 'Cinq sprints' })).toBeTruthy();
    expect(screen.queryByText('Précédente')).toBeNull();
  });

  it('une capture sans proposition : mode dégradé avec le défaut de lisibilité publié', async () => {
    serve([capture({ actions: [] })], [{ file: 'docs/captures/2026-11-04-retro-sprints-29-30.md', where: 'actions', message: 'tableau absent' }]);
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Rétro des sprints 29-30' }));
    const props = within(screen.getByRole('region', { name: 'Propositions' }));
    expect(props.getByText(/aucune proposition publiée/)).toBeTruthy();
    expect(props.getByText(/tableau absent/)).toBeTruthy();
    expect(screen.getByText('docs/captures/2026-11-04-retro-sprints-29-30.md')).toBeTruthy();
  });

  it('un champ vide n’est pas un zéro : périmètre vide = « non publié »', async () => {
    serve([capture({ scope: '' })]);
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Rétro des sprints 29-30' }));
    expect(within(screen.getByRole('region', { name: 'Périmètre' })).getByText('non publié')).toBeTruthy();
  });
});
