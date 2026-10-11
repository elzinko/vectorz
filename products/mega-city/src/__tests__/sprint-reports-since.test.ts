/**
 * sprint-reports-since — les comptes rendus à relire à la rétro (fiche 20261008072306360, ADR-0068) :
 * ceux écrits depuis la dernière capture, toutes sessions confondues. Cœur PUR : noms injectés.
 */
import { describe, expect, it } from 'vitest';
import { latestCaptureDate, reportsSince } from '../core/sprint-reports-since.js';

const R = (d: string, slug: string) => `${d}-sprint-${slug}.md`;
const C = (d: string, slug: string) => `${d}-retro-${slug}.md`;

describe('latestCaptureDate', () => {
  it('rend la date de la capture la plus récente', () => {
    expect(latestCaptureDate([C('2026-10-01', 'a'), C('2026-10-08', 'b'), C('2026-10-03', 'c')])).toBe('2026-10-08');
  });
  it('rend undefined sans capture (ou noms non conformes)', () => {
    expect(latestCaptureDate([])).toBeUndefined();
    expect(latestCaptureDate(['notes.md', 'README.md'])).toBeUndefined();
  });
});

describe('reportsSince', () => {
  it('sans capture : rend TOUS les comptes rendus, triés', () => {
    const reports = [R('2026-10-05', 'b'), R('2026-10-02', 'a')];
    expect(reportsSince([], reports)).toEqual([R('2026-10-02', 'a'), R('2026-10-05', 'b')]);
  });

  it('avec une capture : garde les comptes rendus ≥ sa date, écarte les plus anciens', () => {
    const captures = [C('2026-10-07', 'r')];
    const reports = [R('2026-10-05', 'vieux'), R('2026-10-08', 'neuf'), R('2026-10-07', 'meme-jour')];
    // le même jour que la capture est GARDÉ (granularité au jour) ; le plus ancien est écarté.
    expect(reportsSince(captures, reports)).toEqual([R('2026-10-07', 'meme-jour'), R('2026-10-08', 'neuf')]);
  });

  it('plusieurs captures : la borne est la PLUS RÉCENTE', () => {
    const captures = [C('2026-10-01', 'a'), C('2026-10-09', 'b')];
    const reports = [R('2026-10-05', 'x'), R('2026-10-10', 'y')];
    expect(reportsSince(captures, reports)).toEqual([R('2026-10-10', 'y')]);
  });

  it('deux sessions différentes le même jour : les DEUX comptes rendus sont listés (cas de la fiche)', () => {
    const captures = [C('2026-10-07', 'r')];
    const s1 = R('2026-10-08', 'session-un-garde-fou');
    const s2 = R('2026-10-08', 'session-deux-autre-sujet');
    expect(reportsSince(captures, [s1, s2])).toEqual([s1, s2].sort());
  });

  it('ignore les noms qui ne sont pas des comptes rendus', () => {
    const reports = [R('2026-10-08', 'ok'), 'README.md', '2026-10-08-retro-x.md', 'docs.md'];
    expect(reportsSince([], reports)).toEqual([R('2026-10-08', 'ok')]);
  });
});
