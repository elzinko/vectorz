/**
 * Le marqueur « ce fichier est à lawgiver » des COPIES d'agents (fiche 20260813095351680).
 *
 * Un dossier de skill se reconnaît à son contenu (ADR-0027), le fichier de loi à son en-tête (ADR-0056) ;
 * un agent copié est un fichier plat sans rien de tel, d'où le refus de rejouer `bind-global`. Même remède
 * que pour la loi : une clé d'en-tête YAML, que Claude Code ignore sans erreur.
 */
import { describe, expect, it } from 'vitest';
import { LAW_MARKER } from '../domain/law-file.js';
import { MANAGED_MARKER, isManagedFile, markManaged } from '../domain/managed-file.js';

describe('markManaged — poser le marqueur sans toucher au reste', () => {
  it('un contenu avec en-tête YAML : le marqueur OUVRE l’en-tête, le reste est intact', () => {
    const agent = '---\nname: ezk-reviewer\nmodel: claude-opus-4-8\n---\nTu es le reviewer.\n';
    expect(markManaged(agent)).toBe(
      `---\n${MANAGED_MARKER}\nname: ezk-reviewer\nmodel: claude-opus-4-8\n---\nTu es le reviewer.\n`,
    );
  });

  it('un contenu sans en-tête : on en crée un, le texte suit tel quel', () => {
    expect(markManaged('Tu es le reviewer.\n')).toBe(`---\n${MANAGED_MARKER}\n---\nTu es le reviewer.\n`);
  });

  it('est idempotent : marquer un contenu déjà marqué ne change rien', () => {
    const once = markManaged('---\nname: a\n---\ncorps\n');
    expect(markManaged(once)).toBe(once);
  });

  it('partage le marqueur de la loi : une seule façon de dire « généré par lawgiver »', () => {
    expect(MANAGED_MARKER).toBe(LAW_MARKER);
  });
});

describe('isManagedFile — reconnaître SON fichier', () => {
  it('reconnaît un contenu marqué, avec ou sans autres clés d’en-tête', () => {
    expect(isManagedFile(markManaged('---\nname: a\n---\ncorps\n'))).toBe(true);
    expect(isManagedFile(markManaged('corps seul\n'))).toBe(true);
  });

  it('ne reconnaît pas un fichier de l’utilisateur', () => {
    expect(isManagedFile('# Mon agent à moi\n')).toBe(false);
    expect(isManagedFile('---\nname: mon-agent\n---\ncorps\n')).toBe(false);
  });

  it('le marqueur doit OUVRIR l’en-tête : cité plus bas ou dans le corps, il ne prouve rien', () => {
    expect(isManagedFile(`---\nname: a\n${MANAGED_MARKER}\n---\ncorps\n`)).toBe(false);
    expect(isManagedFile(`# Doc\n\n${MANAGED_MARKER}\n`)).toBe(false);
  });
});
