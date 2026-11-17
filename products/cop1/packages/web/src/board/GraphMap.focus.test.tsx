/**
 * Le cadrage de la carte de la méthode (fiches 20261117154145517 et 20261117154848444) : jsdom ne
 * déplace aucune caméra, on observe donc les demandes de cadrage faites à React Flow.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GraphMap } from './GraphMap.js';
import { stubFlowBrowserApis } from './testing/flowStubs.js';
import { graphCheckExample } from './testing/graphCheckExample.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

const fitView = vi.fn(async () => true);
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  useReactFlow: () => ({ fitView }),
}));

beforeAll(stubFlowBrowserApis);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const project = { ...(BOARD_DATA.vectorz as BoardProject), name: 'vectorz' };
const framed = (): string[] =>
  fitView.mock.calls.map((call) => ((call as unknown[])[0] as { nodes: { id: string }[] }).nodes[0]!.id);

async function open(): Promise<HTMLElement> {
  vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => ({ state: 'ok', graph: graphCheckExample() }) })));
  render(<GraphMap project={project} initialLevel={2} />);
  await screen.findByText('ezk forge integrate');
  return screen.getByRole('complementary', { name: 'Voisins de la brique' });
}

describe('GraphMap — cadrage de la brique choisie', () => {
  it('la recherche cadre la brique choisie', async () => {
    await open();
    fireEvent.change(screen.getByRole('searchbox', { name: 'chercher une brique' }), { target: { value: 'sprint' } });
    fireEvent.submit(screen.getByRole('searchbox', { name: 'chercher une brique' }));
    expect(framed()).toEqual(['skill:ezk-sprint']);
  });

  it('un clic sur un voisin du panneau le choisit et cadre la carte dessus', async () => {
    const panel = await open();
    fireEvent.change(screen.getByRole('searchbox', { name: 'chercher une brique' }), { target: { value: 'sprint' } });
    fireEvent.submit(screen.getByRole('searchbox', { name: 'chercher une brique' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'ezk forge integrate' }));
    expect(within(panel).getByRole('heading', { level: 4 }).textContent).toBe('ezk forge integrate');
    expect(framed()).toEqual(['skill:ezk-sprint', 'command:ezk forge integrate']);
  });

  it('un clic sur une brique de la carte ne cadre rien', async () => {
    await open();
    fireEvent.click(screen.getByText('ezk help', { selector: '.gm-brique-nom' }));
    expect(fitView).not.toHaveBeenCalled();
  });
});
