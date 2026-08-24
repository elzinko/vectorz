import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCatalog } from '../loaders/catalog.js';

// Garde anti-désync (fiche 0041) : `expand` IGNORE silencieusement une référence
// pendante (cf. src/core/expand.ts) — une coquille dans un profil est droppée sans
// erreur. Ce test vérifie donc EXPLICITEMENT que chaque id référencé par un profil
// existe dans le catalogue. 3+ profils manuels = 3+ occasions de désynchroniser.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const catalog = loadCatalog(repoRoot);
const profiles = [...catalog.profiles.values()];

describe('garde anti-désync profils ↔ catalogue', () => {
  it('charge au moins les profils attendus (base, mobile, global, cop1-target, desktop)', () => {
    const ids = profiles.map((p) => p.id).sort();
    expect(ids).toEqual(
      expect.arrayContaining(['base', 'cop1-target', 'desktop', 'global', 'mobile']),
    );
  });

  it.each(profiles.map((p) => [p.id, p] as const))(
    'profil %s : toutes ses références résolvent dans le catalogue',
    (_id, profile) => {
      expect(profile.bundles.filter((b) => !catalog.bundles.has(b))).toEqual([]);
      expect(profile.agents.filter((a) => !catalog.agents.has(a))).toEqual([]);
      expect(profile.skills.filter((s) => !catalog.skills.has(s))).toEqual([]);
      expect((profile.extends ?? []).filter((e) => !catalog.profiles.has(e))).toEqual([]);
      expect((profile.interactions ?? []).filter((r) => !catalog.rules.has(r))).toEqual([]);
    },
  );
});

describe('profils par hôte (fiche 0041)', () => {
  const cop1 = catalog.profiles.get('cop1-target');
  const desktop = catalog.profiles.get('desktop');

  it("cop1-target : équipe feuille + ezk-pm, AUCUN orchestrateur de dev-loop (cop1 a sa boucle)", () => {
    expect(cop1).toBeDefined();
    expect(cop1?.agents).toEqual(
      expect.arrayContaining(['ezk-architect', 'ezk-dev', 'ezk-qa', 'ezk-reviewer', 'ezk-pm']),
    );
    for (const orch of ['ezk-product-build', 'ezk-sprint', 'ezk-pr', 'ezk-ezk']) {
      expect(cop1?.skills ?? []).not.toContain(orch);
    }
  });

  it("desktop : builder + backlog + ezk-pm, PAS de skills à environnement d'exécution", () => {
    expect(desktop).toBeDefined();
    expect(desktop?.skills).toEqual(expect.arrayContaining(['ezk-product-build', 'ezk-backlog']));
    expect(desktop?.agents ?? []).toContain('ezk-pm');
    for (const env of ['ezk-ci', 'ezk-apk', 'ezk-device']) {
      expect(desktop?.skills ?? []).not.toContain(env);
    }
  });
});
