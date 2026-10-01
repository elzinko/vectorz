/**
 * La revue locale est le plancher (ADR-0059, fiche 20260905134937885) : ce test garde les engagements
 * ÉCRITS — les quatre angles morts mesurés dans l'agent `ezk-reviewer`, le renvoi du skill `ezk-sprint`
 * vers l'ADR, et l'ADR lui-même. Il ne juge jamais la qualité d'une revue (c'est le travail du relecteur) :
 * il empêche seulement qu'un engagement disparaisse en silence au fil des éditions.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ADR = join(megaCity, 'docs', 'adr', '0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md');
const read = (...parts: string[]): string => readFileSync(join(megaCity, ...parts), 'utf8');

describe('ezk-reviewer — les angles morts mesurés (D2)', () => {
  const agent = read('agents', 'ezk-reviewer.md');

  it('porte la section « Angles morts mesurés » et cite l’ADR-0059', () => {
    expect(agent).toContain('## Angles morts mesurés (ADR-0059)');
    expect(agent).toContain('ADR-0059');
  });

  it('nomme les quatre familles relevées par la baseline et par le run', () => {
    const section = agent.split('## Angles morts mesurés')[1]?.split('\n## ')[0] ?? '';
    for (const famille of [
      'Erreurs silencieuses et chemins d’erreur',
      'Rétro-compatibilité et contrats',
      'Commande citée qui ne résout pas',
      'Contrats entre skills qui se doublonnent',
    ]) {
      expect(section.replace(/'/g, '’'), famille).toContain(famille);
    }
  });

  it('demande, dans le format de sortie, si les quatre familles ont été passées en revue', () => {
    expect(agent).toMatch(/Angles morts \(4 familles\) :/);
  });

  it('se présente comme le plancher de la revue, pas comme un simple remplaçant de Codex', () => {
    expect(agent).toMatch(/PLANCHER/);
    expect(agent).not.toMatch(/il REMPLACE la revue Codex/);
  });
});

describe('ezk-sprint — la revue locale est le plancher (D1) et la PR suit la config (D3)', () => {
  const sprint = read('skills', 'ezk-sprint', 'SKILL.md');

  it('renvoie vers l’ADR-0059 et dit que Codex n’est jamais une condition de merge', () => {
    expect(sprint).toContain('0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md');
    expect(sprint).toMatch(/jamais une condition de merge/);
  });

  it('ne dit plus que le relecteur local « remplace Codex » (ancienne doctrine, relevée en revue)', () => {
    expect(sprint).not.toMatch(/remplace Codex/);
  });

  it('précise l’invariant : une PR quand `github.pr` est actif', () => {
    expect(sprint).toMatch(/1 PR quand `github\.pr` est actif/);
  });
});

describe('ADR-0059', () => {
  const adr = existsSync(ADR) ? readFileSync(ADR, 'utf8') : '';

  it('existe, ouvre par « En clair » et porte la ratification du PO (Accepté le 2026-10-01)', () => {
    expect(adr).not.toBe('');
    expect(adr).toMatch(/^- Statut : \*\*Accepté\*\* \(ratifié par le PO le 2026-10-01\)/m);
    expect(adr.indexOf('## En clair')).toBeGreaterThan(-1);
    expect(adr.indexOf('## En clair')).toBeLessThan(adr.indexOf('## Contexte'));
  });

  it('sépare les deux grains : revue (D1) et merge (D3), et porte le protocole de re-mesure (D5)', () => {
    for (const titre of ['### D1 — Revue', '### D3 — Merge', '### D5 — Le protocole de re-mesure']) {
      expect(adr, titre).toContain(titre);
    }
  });

  it('cite les données du run avec leur source (#284, #286, 107 à 162 mille jetons) sans les refaire', () => {
    for (const fait of ['#284', '#286', '107 à 162 mille jetons', '9 défauts sur 17']) {
      expect(adr, fait).toContain(fait);
    }
  });

  it('ADR-037 porte la note de précision qui renvoie vers lui', () => {
    const adr037 = readFileSync(join(megaCity, '..', '..', 'docs', 'adr', 'ADR-037-grain-merge-separable-du-grain-revue.md'), 'utf8');
    expect(adr037).toContain('Précisé le 2026-10-01 par [ADR-0059]');
  });
});
