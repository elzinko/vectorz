/**
 * run report — livraison LOCALE `local (<sha>)` (fiche 20261011113632532, absorbe 20261010235330118).
 * Le flux github:false livre par squash local : le bilan doit accepter ces réfs et les vérifier
 * contre le main local, sans GitHub.
 */
import { describe, expect, it } from 'vitest';
import { type FicheLine, checkLocalRefs, crossCheck, localRefSha, parseFicheArg } from '../core/run-report.js';

const line = (pr: string, state = 'mergée'): FicheLine =>
  parseFicheArg(`20260101000000001|${state}|${pr}|verte|GO|locale verte|-`).line as FicheLine;

describe('run report — livraison locale (fiche 20261011113632532)', () => {
  it('parseFicheArg accepte une fiche mergée avec local (<sha>)', () => {
    const r = parseFicheArg('20260101000000001|mergée|local (abc1234)|verte|GO|locale verte|-');
    expect(r.error).toBeUndefined();
    expect(r.line?.pr).toBe('local (abc1234)');
  });

  it('accepte toujours le #<numéro> GitHub (mode inchangé)', () => {
    expect(parseFicheArg('20260101000000001|mergée|#42|verte|GO|verte|-').error).toBeUndefined();
  });

  it('refuse toujours une mergée SANS pr ni local (<sha>)', () => {
    expect(parseFicheArg('20260101000000001|mergée|-|verte|GO|verte|-').error).toMatch(/PR attendue/);
    expect(parseFicheArg('20260101000000001|mergée|nimportequoi|verte|GO|verte|-').error).toMatch(/local \(<sha>\)/);
  });

  it('localRefSha extrait le sha, et rien pour un #numéro', () => {
    expect(localRefSha('local (abc1234)')).toBe('abc1234');
    expect(localRefSha('#42')).toBeNull();
    expect(localRefSha(null)).toBeNull();
  });

  it('checkLocalRefs : sha sur main → aucun écart ; sha absent → écart mismatch nommé', () => {
    const lines = [line('local (abc1234)')];
    expect(checkLocalRefs(lines, () => true)).toEqual([]);
    const ko = checkLocalRefs(lines, () => false);
    expect(ko).toHaveLength(1);
    expect(ko[0]?.severity).toBe('mismatch');
    expect(ko[0]?.message).toContain('abc1234');
  });

  it('crossCheck IGNORE les réfs locales (jamais « non vérifiée » via GitHub)', () => {
    const lines = [line('local (abc1234)')];
    expect(crossCheck(lines, new Map())).toEqual([]);
  });
});
