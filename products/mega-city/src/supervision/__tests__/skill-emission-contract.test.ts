/**
 * Non-récidive fiche 0095 : le template d'émission de supervisabilité (fiche 0050) a
 * été appliqué à `ezk-sprint` puis OUBLIÉ sur `ezk-product-build` pendant des
 * semaines, sans que rien ne le détecte.
 *
 * CE QUE CE TEST COUVRE — et ce qu'il ne couvre pas (revue 2026-07-26, finding B2).
 * Une skill émettrice est déclarée à TROIS endroits qui se contrôlent mutuellement :
 *   1. sa `SKILL.md` (les consignes réelles),
 *   2. la liste `EMITTING_SKILLS` ci-dessous (avec ses invariants),
 *   3. le tableau « Méthodes réelles intégrées » de `src/supervision/README.md`
 *      (la doc que l'humain lit et maintient).
 * Les trois doivent concorder. Faire disparaître une skill émettrice demande donc de
 * mentir aux trois endroits dans le même commit — au lieu d'un seul oubli silencieux.
 *
 * DEUX LIMITES ASSUMÉES, à ne pas se cacher :
 *  a. Le quadrant « n'émet pas ET n'est déclarée nulle part » reste hors de portée —
 *     c'était l'état exact d'`ezk-product-build` du 17 au 26 juillet. Aucune donnée
 *     machine ne dit aujourd'hui « cette skill EST un orchestrateur, donc elle DOIT
 *     émettre ». Un nouvel orchestrateur créé sans émission passerait encore. C'est le
 *     job de la fiche 0068 (règle « method-map à jour ») et de la revue humaine.
 *  b. Compter les occurrences est un PROXY, pas une vérification de directive (finding
 *     Codex P2, PR #55) : retirer une consigne réelle tout en laissant le nom de
 *     l'outil dans la prose environnante garde le test vert. Le seuil ≥2 ne tue que le
 *     cas « il ne reste QUE la phrase de garde ». Vérifier la *structure* des
 *     directives demande un parseur — fiche de suivi.
 * Mieux vaut écrire ces deux trous que laisser croire à une couverture qu'on n'a pas.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { EXPECTED_SUPERVISION_TOOLS } from '../probe.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCityDir = resolve(here, '../../..'); // products/mega-city
const skillsDir = join(megaCityDir, 'skills');
const kitReadmePath = join(megaCityDir, 'src', 'supervision', 'README.md');

interface EmittingSkill {
  id: string;
  /**
   * `true` pour les skills qui ÉNONCENT elles-mêmes la règle d'absorption.
   * `ezk-sprint` l'énonce côté « je peux être absorbé », `ezk-product-build` côté
   * « j'ouvre le run, et voici la symétrie ».
   */
  requiresAbsorptionRule: boolean;
  /**
   * Exemption PORTEUSE : la skill ne réénonce pas la règle parce qu'elle charge la
   * doctrine d'une autre PAR RÉFÉRENCE. La prémisse est testée (voir plus bas) — sans
   * ça, autonomiser la skill ferait disparaître la règle en silence, test au vert.
   */
  doctrineParReference?: { skillId: string; motif: RegExp };
}

/**
 * Skills qui DOIVENT émettre (fiches 0050 §7 + 0095). Liste EXPLICITE : une découverte
 * automatique (« les skills qui contiennent run_start contiennent run_start ») ne
 * prouverait rien. Sa fraîcheur est garantie par les deux contrôles croisés du bas.
 */
const EMITTING_SKILLS: ReadonlyArray<EmittingSkill> = [
  { id: 'ezk-sprint', requiresAbsorptionRule: true },
  { id: 'ezk-product-build', requiresAbsorptionRule: true },
  {
    id: 'vz-product-builder',
    requiresAbsorptionRule: false,
    doctrineParReference: { skillId: 'ezk-product-build', motif: /applique-la intégralement/i },
  },
  // Méthode jouet, à plat : elle ne compose aucun émetteur, donc rien à absorber.
  { id: 'supervision-demo', requiresAbsorptionRule: false },
];

function skillPath(id: string): string {
  return join(skillsDir, id, 'SKILL.md');
}

function skillContent(id: string): string {
  return readFileSync(skillPath(id), 'utf8');
}

/** Compte les occurrences distinctes d'un nom d'outil dans un texte. */
function countOccurrences(content: string, needle: string): number {
  return content.split(needle).length - 1;
}

/** Repère la règle d'absorption sans imposer une formulation mot à mot. */
function mentionsAbsorptionRule(content: string): boolean {
  return /absorb/i.test(content);
}

/** ids des skills listées dans le tableau « Méthodes réelles intégrées » du kit. */
function skillsDocumenteesDansLeKit(): Set<string> {
  const ids = new Set<string>();
  for (const line of readFileSync(kitReadmePath, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*`([a-z0-9][a-z0-9_-]*)`\s*\|/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/** ids de dossiers de skill réels dont la SKILL.md porte au moins un outil du kit. */
function skillsEmettricesSurDisque(): string[] {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(skillPath(entry.name)))
    .map((entry) => entry.name)
    .filter((id) => {
      const content = readFileSync(skillPath(id), 'utf8');
      // N'IMPORTE lequel des 5 : une skill toujours absorbée n'a légitimement pas de
      // `run_start`, et ne chercher que celui-là la rendrait invisible (finding B3).
      return EXPECTED_SUPERVISION_TOOLS.some((tool) => content.includes(tool));
    });
}

describe("contrat d'émission de supervisabilité (fiche 0050) — non-récidive 0095", () => {
  for (const skill of EMITTING_SKILLS) {
    const { id, requiresAbsorptionRule, doctrineParReference } = skill;

    describe(`skill \`${id}\``, () => {
      it('existe sur disque', () => {
        expect(existsSync(skillPath(id)), `\`${id}\`/SKILL.md est déclarée mais absente`).toBe(
          true,
        );
      });

      it.each(EXPECTED_SUPERVISION_TOOLS)(
        "porte de vraies consignes pour `%s`, pas seulement la phrase de garde",
        (tool) => {
          // ≥2 occurrences (finding B1) : toutes ces skills énumèrent les 5 outils dans
          // leur phrase conditionnelle d'ouverture (« si les outils … sont disponibles »).
          // Une seule occurrence est donc satisfaite par cette phrase SEULE — on pourrait
          // supprimer toutes les consignes réelles et rester vert.
          const n = countOccurrences(skillContent(id), tool);
          expect(
            n,
            `\`${id}\`/SKILL.md ne mentionne \`${tool}\` que ${n} fois : la phrase de garde ` +
              'suffirait à passer. Attendu : au moins une consigne réelle en plus.',
          ).toBeGreaterThanOrEqual(2);
        },
      );

      if (requiresAbsorptionRule) {
        it("énonce la règle d'absorption (run déjà ouvert = pas de nouveau run)", () => {
          expect(
            mentionsAbsorptionRule(skillContent(id)),
            `\`${id}\`/SKILL.md ne mentionne pas la règle d'absorption`,
          ).toBe(true);
        });
      }

      if (doctrineParReference) {
        it(`charge bien la doctrine de \`${doctrineParReference.skillId}\` par référence`, () => {
          // La PRÉMISSE de l'exemption (finding B4). Si la skill est un jour autonomisée
          // (doctrine recopiée au lieu d'être référencée), l'exemption devient fausse et
          // la règle d'absorption disparaîtrait du seul mode qu'`ezk-sprint` nomme comme
          // parent absorbant — sans que rien ne rougisse.
          const content = skillContent(id);
          expect(
            doctrineParReference.motif.test(content) &&
              content.includes(doctrineParReference.skillId),
            `\`${id}\` est exemptée de la règle d'absorption au motif qu'elle charge la ` +
              `doctrine de \`${doctrineParReference.skillId}\` par référence — or cette ` +
              "référence n'est plus dans son texte. Passe `requiresAbsorptionRule` à true.",
          ).toBe(true);
        });
      }
    });
  }

  /**
   * Contrôles croisés — sans eux la liste ci-dessus pourrit en silence, et l'oubli de
   * la fiche 0095 se rejoue simplement d'un cran plus loin.
   */
  it('connaît toutes les skills qui émettent réellement sur disque', () => {
    const declarees = new Set(EMITTING_SKILLS.map((s) => s.id));
    const oubliees = skillsEmettricesSurDisque().filter((id) => !declarees.has(id));

    expect(
      oubliees,
      `ces skills émettent mais ne sont pas déclarées dans EMITTING_SKILLS : ${oubliees.join(', ')}\n` +
        '  ajoute-les (avec le bon requiresAbsorptionRule) — le contrat doit rester exhaustif.',
    ).toEqual([]);
  });

  it('concorde avec le tableau « Méthodes réelles intégrées » du README du kit', () => {
    // Le 3e ancrage (finding B2) : la doc que l'humain lit doit dire la même chose que
    // le contrat exécutable. Supprimer une skill émettrice demande alors de mentir ICI
    // aussi — une divergence, pas un silence.
    const documentees = skillsDocumenteesDansLeKit();
    const declarees = EMITTING_SKILLS.map((s) => s.id);

    const absentesDuReadme = declarees.filter((id) => !documentees.has(id));
    const enTropDansLeReadme = [...documentees].filter((id) => !declarees.includes(id));

    expect(
      { absentesDuReadme, enTropDansLeReadme },
      `divergence entre EMITTING_SKILLS et src/supervision/README.md (§ Méthodes réelles intégrées) :\n` +
        `  déclarées mais non documentées : ${absentesDuReadme.join(', ') || '—'}\n` +
        `  documentées mais non déclarées : ${enTropDansLeReadme.join(', ') || '—'}`,
    ).toEqual({ absentesDuReadme: [], enTropDansLeReadme: [] });
  });
});
