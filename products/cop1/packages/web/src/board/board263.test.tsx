import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddProjectModal } from './AddProjectModal.js';
import Board from './Board.js';

afterEach(cleanup);

describe('AddProjectModal (fiche 263)', () => {
  it('propose racine, IDE et config de départ', () => {
    render(<AddProjectModal ides={['Claude Code', 'Cursor']} currentIde="Claude Code" onCreate={() => 'x'} onClose={() => {}} />);
    expect(screen.getByLabelText('Racine du projet')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Outil (IDE)' })).toBeTruthy();
    expect(screen.getByText(/défauts de la méthode/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '▸ Créer (simulé)' })).toBeTruthy();
  });

  it('créer appelle onCreate avec la racine + l’IDE et montre le succès', async () => {
    const onCreate = vi.fn((_root: string, _ide: string) => 'essai');
    render(<AddProjectModal ides={['Claude Code', 'Cursor']} currentIde="Claude Code" onCreate={onCreate} onClose={() => {}} />);
    const input = screen.getByLabelText('Racine du projet');
    await userEvent.clear(input);
    await userEvent.type(input, '~/git/essai');
    await userEvent.click(screen.getByRole('button', { name: 'Cursor' }));
    await userEvent.click(screen.getByRole('button', { name: '▸ Créer (simulé)' }));
    expect(onCreate).toHaveBeenCalledWith('~/git/essai', 'Cursor');
    expect(screen.getByText(/Projet « essai » créé/)).toBeTruthy();
    // Le mapping vient de l'outil choisi (pas redemandé).
    expect(screen.getByText(/vient de l'outil \(Cursor\)/)).toBeTruthy();
  });

  it('ferme par Échap', async () => {
    const onClose = vi.fn();
    render(<AddProjectModal ides={['Claude Code']} currentIde="Claude Code" onCreate={() => 'x'} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Board — ajouter un projet (intégration)', () => {
  it('l’assistant ajoute un projet qui apparaît dans le sélecteur', async () => {
    render(<Board />);
    // Ouvrir le sélecteur de projet, puis l'assistant.
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    await userEvent.click(screen.getByRole('button', { name: /Ajouter un projet/ }));
    expect(screen.getByRole('dialog', { name: 'Ajouter un projet' })).toBeTruthy();
    // Saisir une racine et créer.
    const input = screen.getByLabelText('Racine du projet');
    await userEvent.clear(input);
    await userEvent.type(input, '~/git/mon-essai');
    await userEvent.click(screen.getByRole('button', { name: '▸ Créer (simulé)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    // Le board montre le nouveau projet, sélectionné.
    expect(screen.getByText("Vue d'ensemble — mon-essai")).toBeTruthy();
    // Il est aussi dans le sélecteur.
    await userEvent.click(screen.getByRole('button', { name: /mon-essai/ }));
    const dialog = screen.getByRole('dialog', { name: 'Choisir un projet' });
    expect(dialog).toBeTruthy();
  });

  it('n’écrase pas un projet amorcé en cas de collision de nom', async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole('button', { name: /vectorz/ }));
    await userEvent.click(screen.getByRole('button', { name: /Ajouter un projet/ }));
    const input = screen.getByLabelText('Racine du projet');
    await userEvent.clear(input);
    await userEvent.type(input, '~/git/vectorz');
    await userEvent.click(screen.getByRole('button', { name: '▸ Créer (simulé)' }));
    // Le nom est suffixé pour ne pas écraser le « vectorz » amorcé.
    expect(screen.getByText(/Projet « vectorz-2 » créé/)).toBeTruthy();
  });
});
