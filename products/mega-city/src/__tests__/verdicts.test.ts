/**
 * verdicts — le pouce 👍/👎 posé sur une fiche (fiche 20260826072532622).
 *
 * Ici on tient le cœur PUR : le format du fichier de verdict, et les contrôles de fond que
 * `ezk review verdict` applique avant d'écrire. Chaque refus a son test : un refus qui ne rougirait
 * pas si on le retirait ne protège rien.
 */
import { describe, expect, it } from 'vitest';
import { VERDICTS_DIR, checkVerdictValues, parseVerdict, serializeVerdict, verdictFile } from '../core/verdicts.js';

const FICHES = new Set(['20260826072532622', '20260826072532623', '0094']);
const KNOWN = (id: string): boolean => FICHES.has(id);

describe('format du fichier de verdict', () => {
  it('un fichier par fiche, rangé sous features/reviews/verdicts/<id>.json', () => {
    expect(VERDICTS_DIR).toBe('features/reviews/verdicts');
    expect(verdictFile('20260826072532622')).toBe('features/reviews/verdicts/20260826072532622.json');
  });

  it('s’écrit et se relit à l’identique (JSON stable, une ligne finale)', () => {
    const text = serializeVerdict({ verdict: 'down', date: '2026-10-01' });
    expect(text).toBe('{\n  "verdict": "down",\n  "date": "2026-10-01"\n}\n');
    expect(parseVerdict(text)).toEqual({ ok: true, record: { verdict: 'down', date: '2026-10-01' } });
  });

  it.each([
    ['du JSON cassé (marqueurs de conflit git)', '<<<<<<< HEAD\n{"verdict":"up"}\n>>>>>>> x'],
    ['un verdict inconnu', '{"verdict":"maybe","date":"2026-10-01"}'],
    ['une date qui n’en est pas une', '{"verdict":"up","date":"hier"}'],
    ['un tableau', '[]'],
    ['un fichier vide', ''],
  ])('refuse %s : jamais ignoré en silence', (_cas, text) => {
    const parsed = parseVerdict(text);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason.length).toBeGreaterThan(0);
  });
});

describe('contrôles de fond d’un pouce (ezk review verdict)', () => {
  it('accepte un pouce, « none » (retirer) et l’ancien format d’id à 4 chiffres', () => {
    expect(checkVerdictValues('20260826072532622', 'up', KNOWN)).toEqual({
      ok: true,
      request: { id: '20260826072532622', verdict: 'up' },
    });
    expect(checkVerdictValues('0094', 'none', KNOWN).ok).toBe(true);
  });

  it.each([
    ['un id qui est un chemin', '../../etc/passwd', 'up', 400],
    ['un id qui n’est pas une chaîne', 42, 'up', 400],
    ['une fiche qui n’existe pas', '20990101000000000', 'up', 404],
    ['une valeur inconnue', '20260826072532622', 'bof', 400],
  ])('refuse %s, avec son code', (_cas, id, verdict, status) => {
    const check = checkVerdictValues(id, verdict, KNOWN);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.status).toBe(status);
  });
});
