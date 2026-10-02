/**
 * Non-récidive fiche 0079 + ADR-0029 : le corps de PR est le **rendu de la fiche**
 * (En clair + sections + « Comment vérifier » + provenance + matrice Validation) —
 * skill ↔ règle ↔ asset template. PLUS de triade mince Summary/Lien fiche/Comment tester.
 *
 * Leçon 0095 : un oubli de consigne est resté vert neuf jours faute de test sur
 * le *contenu* des SKILL.md. Retirer le contrat « rendu de la fiche » de l'étape PR
 * ou de la DoD d'`ezk-sprint`, de l'asset, ou du cas PR de la règle DOIT faire rougir
 * ce fichier. Réintroduire un `## Summary` parallèle aussi.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { claudeCodeCap } from '../caps/claude-code.js';
import { expandProfile } from '../core/expand.js';
import { loadCatalog } from '../loaders/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCityDir = resolve(here, '../..'); // products/mega-city (from src/__tests__)

const sprintSkill = join(megaCityDir, 'skills', 'ezk-sprint', 'SKILL.md');
const prPilotSkill = join(megaCityDir, 'skills', 'ezk-pr', 'SKILL.md');
const thinTemplate = join(
  megaCityDir,
  'skills',
  'ezk-pr',
  'assets',
  'PULL_REQUEST_TEMPLATE.thin.md',
);
const lisibilityRule = join(
  megaCityDir,
  'rules',
  'documentation-guidelines',
  'human-facing-lisibility.md',
);
const restitutionSkills = [
  join(megaCityDir, 'skills', 'ezk-retro', 'SKILL.md'),
  join(megaCityDir, 'skills', 'ezk-product-build', 'SKILL.md'),
  sprintSkill,
  join(megaCityDir, 'skills', 'ezk-archive', 'SKILL.md'),
  join(megaCityDir, 'skills', 'ezk-backlog', 'SKILL.md'),
  prPilotSkill,
  join(megaCityDir, 'skills', 'ezk-ezk', 'SKILL.md'),
  join(megaCityDir, 'skills', 'ezk-scout', 'SKILL.md'), // le rapport de brouillons est lu par un humain
] as const;

const modelPolicyDoc = join(megaCityDir, 'docs', 'ezk-model-and-lisibility.md');

const archiveHandoffTemplate = join(
  megaCityDir,
  'skills',
  'ezk-archive',
  'references',
  'handoff-template.md',
);

const featureTemplate = join(
  megaCityDir,
  'skills',
  'ezk-backlog',
  'templates',
  'feature-template.md',
);

const newcomerLens = join(megaCityDir, 'docs', 'newcomer-readability-lens.md');

const checkPrBodyScript = join(
  megaCityDir,
  'skills',
  'ezk-pr',
  'scripts',
  'check-pr-body.sh',
);

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('contrat lisibilité artefacts humains (fiche 0079 + ADR-0029)', () => {
  it('la règle MUST porte le cas corps de PR = rendu de la fiche (ADR-0029)', () => {
    expect(existsSync(lisibilityRule), 'règle human-facing-lisibility absente').toBe(true);
    const body = read(lisibilityRule);
    expect(body).toMatch(/level:\s*MUST/);
    expect(body).toMatch(/ezk-reviewer/);
    expect(body).toMatch(/ADR-0029/);
    expect(body).toMatch(/rendu de la fiche/i);
    expect(body).toMatch(/Comment vérifier/);
    expect(body).toMatch(/Validation/);
    // Non-récidive : le Summary mince n'est plus un bloc requis — il est explicitement interdit.
    expect(body).toMatch(/Interdit[\s\S]*?## Summary/);
  });

  it('la règle + ezk-backlog exigent des listes CLIQUABLES, résolues selon le lecteur (transient cwd vs document)', () => {
    // Non-récidive (Thomas 2026-08-28 « je ne m'en sors pas ») + revue Codex #184 : le lien
    // se résout depuis le shell (restitution transitoire) OU depuis le fichier committé
    // (index généré, corps de PR). Retirer l'exigence « cliquable », la distinction de
    // résolution, OU l'obligation faite au générateur d'émettre les liens fait rougir ici.
    const rule = read(lisibilityRule);
    expect(rule).toMatch(/clickable/i);
    // \s+ : la règle markdown peut couper ces phrases sur un retour à la ligne.
    expect(rule).toMatch(/relative to the current\s+working directory/i);
    expect(rule).toMatch(/relative to that file's own\s+directory/i);
    expect(rule).toMatch(/regen-backlog/);
    const backlog = read(join(megaCityDir, 'skills', 'ezk-backlog', 'SKILL.md'));
    expect(backlog).toMatch(/cliquable/i);
    expect(backlog).toMatch(/relatif au cwd/i);
    expect(backlog).toMatch(/relatif à ce fichier/i);
  });

  it("ezk-sprint étape PR + DoD exigent le rendu de la fiche (ADR-0029), pas la triade mince", () => {
    const body = read(sprintSkill);
    expect(body).toMatch(/rendu de la fiche/i);
    expect(body).toMatch(/## Comment vérifier/);
    expect(body).toMatch(/## Validation/);
    expect(body).toMatch(/ADR-0029/);
    expect(body).toMatch(/corps relisable seul/);
    expect(body).toMatch(/human-facing-lisibility/);
    // Non-récidive : plus de `## Summary` parallèle réintroduit comme contrat.
    expect(body).toMatch(/Summary\s+parallèle/);
  });

  it('asset PULL_REQUEST_TEMPLATE.thin.md matérialise le rendu de la fiche (ADR-0029)', () => {
    expect(existsSync(thinTemplate), 'asset thin template absent').toBe(true);
    const body = read(thinTemplate);
    expect(body).toMatch(/Rendu de la fiche/);
    expect(body).toMatch(/En clair/);
    expect(body).toMatch(/^## Comment vérifier/m);
    expect(body).toMatch(/^## Validation/m);
    expect(body).toMatch(/PR_VALIDATION\.md/);
    expect(body).toMatch(/ADR-0029/);
    // Non-récidive : l'ancienne triade mince ne doit plus être le squelette de l'asset.
    expect(body).not.toMatch(/^## Summary/m);
    expect(body).not.toMatch(/^## Lien fiche/m);
  });

  it('ezk-pr init référence le thin asset (plus seulement de la prose)', () => {
    const body = read(prPilotSkill);
    expect(body).toMatch(/PULL_REQUEST_TEMPLATE\.thin\.md/);
  });

  it('ezk-pr documente fallback copy-mode + résolution check-pr-body (Codex P2)', () => {
    const body = read(prPilotSkill);
    // Mode copy ne matérialise que SKILL.md — fallback obligatoire.
    expect(body).toMatch(/Mode copy/);
    expect(body).toMatch(/gabarit inline|fallback inline/i);
    // Gabarit de rendu réellement embarqué (rendu de la fiche + Validation, pas la triade mince).
    expect(body).toMatch(/````markdown[\s\S]*?En clair[\s\S]*?## Comment vérifier[\s\S]*?## Validation[\s\S]*?````/);
    expect(body).toMatch(/\| CI \|/);
    // Résolution hors cwd mega-city.
    expect(body).toMatch(/~\/\.claude\/skills\/ezk-pr\/scripts\/check-pr-body\.sh/);
    expect(body).toMatch(/products\/mega-city\/skills\/ezk-pr\/scripts\/check-pr-body\.sh/);
    expect(body).toMatch(/Fallback inline/);
    // Chemin résolu = fichier .sh (pas …/check-pr-body.sh en suffixe).
    expect(body).toMatch(/bash <chemin-résolu>(?!\/check-pr-body)/);
  });

  it.each(restitutionSkills.map((p) => [p.split('/').slice(-2).join('/'), p] as const))(
    '%s porte la consigne lisibilité à la restitution',
    (_label, path) => {
      const body = read(path);
      expect(body).toMatch(/En clair/);
      expect(body).toMatch(/human-facing-lisibility/);
    },
  );

  it('ezk-archive handoff template ouvre par En clair + baseline Reprendre', () => {
    expect(existsSync(archiveHandoffTemplate), 'handoff-template absent').toBe(true);
    const body = read(archiveHandoffTemplate);
    expect(body).toMatch(/\*\*En clair :\*\*/);
    expect(body).toMatch(/\*\*À faire \(toi\) :\*\*/);
    expect(body).toMatch(/human-facing-lisibility/);
    // Codex #91 P2 : ne pas omettre le démarrage de session suivante.
    expect(body).toMatch(/git switch main && git pull/);
    expect(body).toMatch(/\/ezk-backlog list/);
  });

  it('doc politique modèles 0181 pinne claude-opus-4-8 (pas alias opus / Opus 5)', () => {
    expect(existsSync(modelPolicyDoc), 'ezk-model-and-lisibility.md absent').toBe(true);
    const body = read(modelPolicyDoc);
    expect(body).toMatch(/model_spare/);
    expect(body).toMatch(/claude-opus-4-8/);
    expect(body).toMatch(/En clair/);
    expect(body).toMatch(/éviter Opus 5|jamais.*Opus 5|pas.*Opus 5/i);
    // L'alias nu `opus` ne doit plus être le défaut recommandé comme model:
    expect(body).not.toMatch(/\|\s*`opus`\s*\|/);
  });

  it("template de fiche porte l'onboarding « Si tu arrives frais » + « ## Glossaire » conditionnel (fiche 0191)", () => {
    expect(existsSync(featureTemplate), 'feature-template.md absent').toBe(true);
    const body = read(featureTemplate);
    expect(body).toMatch(/Si tu arrives frais/);
    expect(body).toMatch(/^## Glossaire/m);
    // Le placeholder d'onboarding porte l'ancre que check-pr-body rejette s'il reste non rempli.
    expect(body).toMatch(/vocabulaire projet minimal pour lire/);
  });

  it('la règle référence la lentille « nouveau venu » qui opérationnalise le 3/3 (fiche 0191)', () => {
    expect(existsSync(newcomerLens), 'newcomer-readability-lens.md absent').toBe(true);
    expect(read(lisibilityRule)).toMatch(/newcomer-readability-lens/);
    const lens = read(newcomerLens);
    expect(lens).toMatch(/En clair/); // la lentille est elle-même un artefact humain
    expect(lens).toMatch(/3\/3/);
    expect(lens).toMatch(/Glossaire/);
    expect(lens).toMatch(/NO-GO/);
  });

  it("étape PR (ezk-sprint) + rendu (ezk-pr) exigent l'onboarding quand la fiche le porte (fiche 0191)", () => {
    expect(read(sprintSkill)).toMatch(/Si tu arrives frais/);
    const pilot = read(prPilotSkill);
    expect(pilot).toMatch(/Si tu arrives frais/);
    expect(pilot).toMatch(/## Glossaire/);
    // La garde check-pr-body (script + fallback inline) couvre les placeholders d'onboarding.
    expect(pilot).toMatch(/obligatoire si la fiche emploie du jargon interne/);
  });

  it("la garde onboarding est portée à l'identique par le script ET le fallback inline (0191, revue P2)", () => {
    // Les deux copies de check-pr-body (script exécutable + bloc inline copy-mode dans le SKILL,
    // jamais exécuté) peuvent diverger en silence. Ce contrat exige que chacune porte les DEUX
    // ancres d'onboarding — un dev qui édite l'une sans l'autre fait rougir ce test.
    const scriptSrc = read(checkPrBodyScript);
    const pilotSrc = read(prPilotSkill);
    for (const src of [scriptSrc, pilotSrc]) {
      expect(src).toMatch(/vocabulaire projet minimal pour lire/);
      expect(src).toMatch(/obligatoire si la fiche emploie du jargon interne/);
    }
  });
});

// ─── Clarté partout : câblage, portée chat, canal terminal, titre + lien ────────────────
// Fiche 20260824111001836 (absorbe 20260830113054036). Une règle au catalogue n'est vraie que
// si un levier la porte jusqu'à l'agent : ce bloc fige le câblage (bundle `base`), la preuve
// d'effet (le cap projet la compile) ET le texte qui atteint déjà l'agent (CLAUDE.md, agents,
// skills de restitution). Retirer une clause, ou ajouter un agent sans elle, fait rougir ici.

const RULE_ID = 'documentation-guidelines/human-facing-lisibility';
const claudeMd = resolve(megaCityDir, '..', '..', 'CLAUDE.md'); // racine vectorz
const agentsDir = join(megaCityDir, 'agents');

/** Ancres stables de la clause de canal, communes à la règle, CLAUDE.md, agents et skills. */
const CANAL_ANCHORS = [/Markdown seul/, /`<details>`/, /titre \+ lien/, /\bid nu\b/] as const;

/** La section « Cas sortie de chat » de la règle (jusqu'à la section suivante). */
function chatSection(): string {
  return read(lisibilityRule).match(/### Cas sortie de chat[\s\S]*?(?=\n### |$)/)?.[0] ?? '';
}

describe('clarté partout — câblage et preuve d\'effet (fiche 20260824111001836)', () => {
  it('base porte la règle, et le cap projet la compile dans .iamthelaw/ENTRY.md avec ses clauses de chat', () => {
    const catalog = loadCatalog(megaCityDir);
    const base = catalog.profiles.get('base');
    if (!base) throw new Error('profil base introuvable');
    const resolved = expandProfile(base, catalog);
    expect(resolved.rules.map((r) => r.id)).toContain(RULE_ID);
    const entry = claudeCodeCap
      .materialize(resolved, '/tmp/projet')
      .files.find((f) => f.path === '.iamthelaw/ENTRY.md');
    expect(entry, 'ENTRY.md absent du plan').toBeDefined();
    expect(entry?.content).toMatch(
      /## documentation-guidelines\/human-facing-lisibility\s+`\[MUST\]`/,
    );
    for (const anchor of CANAL_ANCHORS) expect(entry?.content).toMatch(anchor);
  });

  it('un seul texte de règle porte la clarté : aucune seconde règle « lisibilité / clarté »', () => {
    const ids = [...loadCatalog(megaCityDir).rules.keys()].filter((id) =>
      /lisib|clarte|clarity/i.test(id),
    );
    expect(ids).toEqual([RULE_ID]);
  });
});

describe('clarté partout — la règle étend sa portée au chat (fiche 20260824111001836)', () => {
  it('le Scope nomme les sorties de chat : fin de tour, résumé de session', () => {
    const scope = read(lisibilityRule).match(/- Scope:[\s\S]*?\n- Open with/)?.[0] ?? '';
    expect(scope, 'puce Scope introuvable').not.toBe('');
    expect(scope).toMatch(/chat answer/i);
    expect(scope).toMatch(/end-of-turn/i);
    expect(scope).toMatch(/session summary/i);
    // La portée initiale (artefacts écrits) est conservée, pas remplacée.
    expect(scope).toMatch(/every artefact a human reads/);
  });

  it('canal terminal : Markdown seul dans le chat, détail sous un titre, <details> permis dans les .md (absorbe 20260830113054036)', () => {
    const section = chatSection();
    expect(section, 'section « Cas sortie de chat » absente').not.toBe('');
    expect(section).toMatch(/Markdown seul/);
    expect(section).toMatch(/`<details>`/);
    expect(section).toMatch(/`<summary>`/);
    expect(section).toMatch(/HTML brut/);
    expect(section).toMatch(/en texte, balises comprises/); // le défaut observé, nommé
    expect(section).toMatch(/### Détail technique/); // le repli attendu : un titre Markdown, pas un bloc HTML
    expect(section).toMatch(/reste permis/); // usage légitime conservé dans les livrables .md
  });

  it('titre + lien : la fiche ne se cite jamais par son id nu, sans contredire la règle des listes', () => {
    const section = chatSection();
    expect(section).toMatch(/titre \+ lien/);
    expect(section).toMatch(/\bid nu\b/);
    expect(section).toMatch(/jamais le remplacer/);
    // Coexistence : la puce « Lists of file-backed items » (lien sur l'id, titre à côté) reste,
    // et la clause dit expressément qu'elle reste valide pour les listes à titre affiché.
    expect(read(lisibilityRule)).toMatch(/a markdown link on the \*\*id\*\*/);
    expect(section).toMatch(/le lien peut rester sur l'id/);
  });

  it("leviers côté chat : la règle les nomme et avoue qu'aucun contrôle automatique ne couvre le chat", () => {
    const section = chatSection();
    expect(section).toMatch(/aucun contrôle automatique/);
    expect(section).toMatch(/`CLAUDE\.md`/);
    expect(section).toMatch(/Explication claire/);
    expect(section).toMatch(/agents et des skills/);
    expect(section).toMatch(/\.iamthelaw\/ENTRY\.md/);
  });
});

describe('clarté partout — le texte qui atteint déjà l\'agent (fiche 20260824111001836)', () => {
  it('CLAUDE.md (racine vectorz) reprend la clause de chat : Markdown seul, titre + lien', () => {
    expect(existsSync(claudeMd), 'CLAUDE.md absent').toBe(true);
    const body = read(claudeMd);
    for (const anchor of CANAL_ANCHORS) expect(body).toMatch(anchor);
  });

  const agentFiles = readdirSync(agentsDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  it('le glob des agents n\'est pas vide (le test ci-dessous ne doit pas être vacant)', () => {
    expect(agentFiles.length).toBeGreaterThanOrEqual(8);
  });

  it.each(agentFiles)('agents/%s cite la règle et porte la clause de canal', (file) => {
    const body = read(join(agentsDir, file));
    expect(body).toMatch(/human-facing-lisibility/);
    for (const anchor of CANAL_ANCHORS) expect(body).toMatch(anchor);
  });

  it.each(restitutionSkills.map((p) => [p.split('/').slice(-2).join('/'), p] as const))(
    '%s porte la clause de canal (Markdown seul, titre + lien)',
    (_label, path) => {
      const body = read(path);
      for (const anchor of CANAL_ANCHORS) expect(body).toMatch(anchor);
    },
  );
});
