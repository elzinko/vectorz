/**
 * La cloche d'alertes de l'en-tête (fiche 20261126170000112) : une ligne par alerte publiée par la méthode
 * (`ezk now --json`), le compteur égal au nombre publié, ce que la méthode ne mesure pas, jamais de faux
 * zéro : sans contrat, la cloche dit « non publié ». Aucune alerte n'est calculée côté écran.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertsBell } from './AlertsBell.js';
import type { NowAlert, NowContract } from './nowAlerts.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const alert = (over: Partial<NowAlert> = {}): NowAlert => ({
  type: 'fiche-bloquee',
  id: '20990101000000003',
  titre: 'Bloquée',
  raison: 'panel',
  decision: 'attend un panel adverse',
  fichier: 'features/20990101000000003_bloquee.md',
  date: '2026-11-01',
  ...over,
});

const ficheId = '20990101000000003';
const project = {
  ...(BOARD_DATA.vectorz as BoardProject),
  name: 'samplerz',
  fiches: { [ficheId]: {} as FicheDetail },
};

const serve = (now: NowContract) => {
  const fetchMock = vi.fn(async () => ({ status: 200, json: async () => ({ state: 'ok', now }) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const serveUnavailable = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ status: 200, json: async () => ({ state: 'unavailable', reason: 'ezk trop ancien' }) })),
  );

const NON_MESURE = ['Sprints clos sans rétro : pas encore calculables.'];

describe('AlertsBell', () => {
  it('le compteur égale le nombre d’alertes publiées', async () => {
    serve({
      alertes: [alert(), alert({ type: 'idee-a-groomer', id: '2' }), alert({ type: 'version-a-poser', id: 'v1.5.0' })],
      nonMesure: NON_MESURE,
    });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Alertes' })).toBeTruthy();
  });

  it('une alerte par ligne : type en mots, titre, raison et décision attendue', async () => {
    serve({
      alertes: [
        alert(),
        alert({ type: 'proposition-retro', id: 'docs/captures/x.md#2', titre: 'Nommer chaque lancement', raison: 'proposition de rétro en attente', decision: 'accepter ou refuser', fichier: 'docs/captures/x.md', date: '' }),
      ],
      nonMesure: NON_MESURE,
    });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Alertes' }));
    const panel = screen.getByRole('dialog', { name: 'Alertes' });
    const rows = within(panel).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText(/fiche bloquée/)).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getByText('Bloquée')).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getByText('panel')).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getByText(/attend un panel adverse/)).toBeTruthy();
    expect(within(rows[1] as HTMLElement).getByText(/rétro à décider/)).toBeTruthy();
    expect(within(rows[1] as HTMLElement).getByText('Nommer chaque lancement')).toBeTruthy();
  });

  it('dit en mots ce que la méthode ne mesure pas, sans le compter comme zéro alerte', async () => {
    serve({ alertes: [alert()], nonMesure: NON_MESURE });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Alertes' }));
    const panel = screen.getByRole('dialog', { name: 'Alertes' });
    expect(within(panel).getByText(/Pas mesuré/i)).toBeTruthy();
    expect(within(panel).getByText(NON_MESURE[0] as string)).toBeTruthy();
  });

  it('une alerte qui vise une fiche connue ouvre la fiche ; les autres n’ont pas de lien', async () => {
    serve({
      alertes: [alert({ id: ficheId }), alert({ type: 'version-a-poser', id: 'v1.5.0', titre: 'v1.5.0', fichier: '' })],
      nonMesure: [],
    });
    const onOpenFiche = vi.fn();
    render(<AlertsBell project={project} onOpenFiche={onOpenFiche} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Alertes' }));
    const rows = within(screen.getByRole('dialog', { name: 'Alertes' })).getAllByRole('listitem');
    await userEvent.click(within(rows[0] as HTMLElement).getByRole('button', { name: /Bloquée/ }));
    expect(onOpenFiche).toHaveBeenCalledWith(ficheId);
    expect(screen.queryByRole('dialog', { name: 'Alertes' })).toBeNull();
    expect(within(rows[1] as HTMLElement).queryByRole('button')).toBeNull();
  });

  it('aucun bouton de fermeture : la fermeture est une autre fiche', async () => {
    serve({ alertes: [alert()], nonMesure: [] });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Alertes' }));
    expect(screen.queryByRole('button', { name: /Fermer/ })).toBeNull();
  });

  it('un contrat publié sans alerte : pas de chiffre, le panneau le dit', async () => {
    serve({ alertes: [], nonMesure: [] });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Alertes' }));
    expect(screen.getByText(/aucune alerte publiée/i)).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('sans contrat : « non publié », jamais 0', async () => {
    serveUnavailable();
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    expect(await screen.findByText('non publié')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('demande le contrat du projet au daemon', async () => {
    const fetchMock = serve({ alertes: [], nonMesure: [] });
    render(<AlertsBell project={project} onOpenFiche={() => undefined} />);
    await screen.findByRole('button', { name: 'Alertes' });
    expect(fetchMock).toHaveBeenCalledWith('/api/now/samplerz');
  });
});
