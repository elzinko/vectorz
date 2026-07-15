import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';

describe('App', () => {
  beforeEach(() => {
    // Default tab is Run → OrchestratorRunView opens an EventSource on mount.
    // Stub it so the tab render stays inert in jsdom.
    vi.stubGlobal(
      'EventSource',
      vi.fn().mockImplementation(() => ({ onmessage: null, close: vi.fn() })),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders only the live tabs — no dead Projects/Agents/Tasks (fiche 0022)', () => {
    render(<App />);

    // Live surfaces remain.
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rules' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connexion' })).toBeTruthy();

    // The tabs that fetched non-existent /api/{projects,agents,tasks} are gone.
    expect(screen.queryByRole('button', { name: 'Projects' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Agents' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tasks' })).toBeNull();
  });

  it('defaults to the Run (mission-control) tab', () => {
    render(<App />);
    // The run launcher form (epic input) is what the Run tab shows when idle.
    expect(screen.getByLabelText(/epic/i)).toBeTruthy();
  });

  it('fiche 0031 — offers a "moniteur" tab that renders SupervisionView', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /moniteur/i }));

    expect(await screen.findByText(/classe B.*best-effort/i)).toBeTruthy();
  });
});
