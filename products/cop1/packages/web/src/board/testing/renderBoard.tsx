/**
 * Aide de test : monte le board sur une source `/api/board` simulée, et attend qu'il ait reçu ses
 * données (le board ne montre plus d'échantillon de lui-même).
 */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Board from '../Board.js';
import type { BoardData } from '../types.js';
import { BOARD_DATA } from './sampleBoard.js';

export async function renderBoardOn(data: BoardData = BOARD_DATA): Promise<void> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) } as Response));
  render(<Board />);
  await screen.findByRole('button', { name: 'Fiches' });
}
