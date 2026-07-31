import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';

describe('App', () => {
  beforeEach(() => {
    // SupervisionView opens an EventSource + fetches /api/supervision/runs on mount.
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

  it('fiche 0059 — the Monitor is the single live surface', () => {
    render(<App />);
    expect(screen.getByText(/runs supervisés/i)).toBeTruthy();
    expect(screen.getByText(/aucun run surveillé/i)).toBeTruthy();
  });

  it('époque 2 — no BMAD-in-monitor piloting controls in the shell', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rules' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Connexion' })).toBeNull();
    expect(screen.queryByRole('button', { name: /lancer/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });
});
