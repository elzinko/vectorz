/**
 * La loi compilée du cap global (fiche 20260903134909124, ADR-0056) : le texte du fichier
 * `~/.claude/rules/iamthelaw.md`, et la façon de reconnaître qu'il est à lawgiver.
 */
import { describe, expect, it } from 'vitest';
import { compileRule, globalLawContent } from '../caps/law-content.js';
import { GLOBAL_LAW_PATH, LAW_MARKER, isManagedLaw } from '../domain/law-file.js';
import type { Rule } from '../domain/model.js';

const noDead: Rule = {
  id: 'clean-code/no-dead-code',
  kind: 'disposition',
  level: 'MUST',
  content: '  Pas de code mort.\n\nPas de TODO masqué.  ',
};
const commits: Rule = {
  id: 'conventional-commits/format',
  kind: 'disposition',
  level: 'SHOULD',
  content: 'Messages en Conventional Commits.',
};

describe('compileRule', () => {
  it('rend un titre « id [NIVEAU] » puis le corps, sans blancs aux bords', () => {
    expect(compileRule(noDead)).toBe(
      '## clean-code/no-dead-code  `[MUST]`\n\nPas de code mort.\n\nPas de TODO masqué.\n',
    );
  });
});

describe('globalLawContent', () => {
  const text = globalLawContent([noDead, commits]);

  it('s’ouvre sur l’en-tête qui marque le fichier comme généré par lawgiver', () => {
    expect(text.startsWith(`---\n${LAW_MARKER}\n---\n`)).toBe(true);
    expect(text).toContain('# I AM THE LAW');
  });

  it('porte chaque règle, dans l’ordre reçu', () => {
    const first = text.indexOf('## clean-code/no-dead-code');
    const second = text.indexOf('## conventional-commits/format');
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    expect(text).toContain('Pas de TODO masqué.');
    expect(text).toContain('`[SHOULD]`');
  });

  it('est déterministe, et fini par un seul retour à la ligne', () => {
    expect(globalLawContent([noDead, commits])).toBe(text);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });
});

describe('isManagedLaw — ce fichier est-il à nous ?', () => {
  it('reconnaît le fichier que globalLawContent écrit', () => {
    expect(isManagedLaw(globalLawContent([noDead]))).toBe(true);
  });

  it('refuse un fichier de l’utilisateur, vide, ou qui cite le marqueur ailleurs qu’en tête', () => {
    expect(isManagedLaw('')).toBe(false);
    expect(isManagedLaw('# Mes règles perso\n')).toBe(false);
    expect(isManagedLaw(`# Mes notes\n${LAW_MARKER}\n`)).toBe(false);
    expect(isManagedLaw(`---\npaths:\n  - "src/**"\n---\n${LAW_MARKER}\n`)).toBe(false);
  });
});

describe('GLOBAL_LAW_PATH', () => {
  it('vise le dossier des règles personnelles de Claude Code, chargé dans chaque session', () => {
    expect(GLOBAL_LAW_PATH).toBe('rules/iamthelaw.md');
  });
});
