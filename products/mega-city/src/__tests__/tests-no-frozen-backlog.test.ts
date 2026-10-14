/**
 * Garde-fou : un test ne FIGE pas l'état réel du backlog (fiche 20261003201035080).
 *
 * En clair : deux tests ont cassé le 2026-10-01 sur des gestes NORMAUX — une fiche écrite en dur
 * partie dans `done/` quand on l'a livrée (PR #314), et un statut d'ADR figé quand on l'a ratifié
 * (PR #315). On teste une RÈGLE (« une fiche active existe »), pas une VALEUR. Ce garde-fou refuse
 * les deux formes qui cassent : citer le CHEMIN `features/<id>_…md` d'une fiche RÉELLEMENT active, ou
 * figer le libellé d'un statut d'ADR. Les fixtures synthétiques (ids inventés absents du vrai backlog)
 * passent : leur id n'est pas une fiche active.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const MC = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // products/mega-city
const REPO = join(MC, '..', '..'); // racine vectorz

/** Les ids des fiches ACTIVES du vrai dépôt (features/ sans done/). Un ship les déplace vers done/. */
function activeFicheIds(): Set<string> {
  const ids = new Set<string>();
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(join(REPO, 'features'), { withFileTypes: true });
  } catch {
    return ids; // pas de features/ sous ce dépôt — rien à garder
  }
  for (const e of entries) {
    if (!e.isFile()) continue; // done/ est un dossier : écarté, ses fiches sont stables
    const m = /^(\d{4,})_.*\.md$/.exec(e.name);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/** Tous les fichiers `*.test.ts` sous `src/`. */
function testFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...testFiles(p));
    else if (e.name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

const ADR_STATUS = /toBe\(\s*['"`](Accepté|Proposé|Ratifié|Rejeté|Superseded|Accepted|Proposed)['"`]\s*\)/;
const ACTIVE_PATH = /features\/(\d{4,})_[^'"`\s)]+\.md/g;

describe('un test ne fige pas l’état réel du backlog (fiche 20261003201035080)', () => {
  const active = activeFicheIds();
  const files = testFiles(join(MC, 'src')).map((p) => ({ rel: relative(REPO, p), text: readFileSync(p, 'utf8') }));

  it('le dépôt a bien des fiches actives (sinon le garde-fou ne garderait rien)', () => {
    expect(active.size).toBeGreaterThan(0);
  });

  it('aucun test ne cite le CHEMIN features/<id>_…md d’une fiche RÉELLEMENT active', () => {
    const offenders: string[] = [];
    for (const { rel, text } of files) {
      for (const m of text.matchAll(ACTIVE_PATH)) {
        if (active.has(m[1])) offenders.push(`${rel} → ${m[0]} (fiche active : un ship la déplace dans done/)`);
      }
    }
    expect(offenders, `Chemins de fiches actives figés :\n${offenders.join('\n')}`).toEqual([]);
  });

  it('aucun test ne fige le libellé d’un statut d’ADR (toBe(\'Accepté\'…))', () => {
    const offenders = files.filter((f) => ADR_STATUS.test(f.text)).map((f) => f.rel);
    expect(offenders, `Statuts d’ADR figés :\n${offenders.join('\n')}`).toEqual([]);
  });
});
