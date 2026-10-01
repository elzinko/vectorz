/**
 * skill-refs — ce qu'un skill ou un agent AFFIRME, jugé contre le réel. PUR (ADR-0003).
 * Fiche 0066 (« tester un skill pour de vrai avant de le merger »).
 *
 * En clair : un texte de méthode qui nomme un script doit nommer un script qui existe, et un skill
 * qui déclare une composition doit la mentionner dans son corps. L'audit `ezk-steward` est un
 * jugement d'agent, pas une alarme ; ces deux contrôles-ci sont mécaniques.
 *
 * Deux contrôles :
 *   1. `findDeadScriptRefs` : les scripts cités qui n'existent pas.
 *   2. `findUncitedCompositions` : les `composes:` / `delegates:` jamais cités dans le corps — le
 *      graphe annoncerait une « intégration fantôme » (retour Codex #125).
 *
 * Ce qu'on reconnaît pour les scripts (et rien d'autre : une citation douteuse ne rougit pas) :
 *   - `bin/x.sh`, avec ou sans `./` ou `products/mega-city/` devant ;
 *   - `skills/<skill>/scripts/x`, avec ou sans préfixe de chemin (`~/.claude/…`) ;
 *   - `<skill>/scripts/x` quand `<skill>` est un skill du catalogue ;
 *   - `scripts/x` ou `./scripts/x` nus : dossier du skill (du skill homonyme pour un agent), puis
 *     `scripts/` du produit, puis `scripts/` de la racine du dépôt.
 * Les gabarits (`<skill>/scripts/x`, `$VAR/scripts/x`) et les chemins `../scripts/x` ne disent pas
 * quel dépôt ils visent : ignorés.
 * Angle mort assumé : seules les extensions `.sh`, `.ts`, `.mjs`, `.js` sont reconnues. Un script
 * `.py`, `.rb` ou sans extension n'est pas vu (zéro faux positif plutôt qu'une alarme douteuse).
 * Aucun I/O ici : lire les fichiers = `loaders/skill-refs.ts`.
 */
import type { Skill } from '../domain/model.js';

/** Un texte de méthode à juger : le SKILL.md d'un skill, ou le fichier d'un agent. */
export interface RefDoc {
  kind: 'skill' | 'agent';
  /** L'id du skill (son dossier) ou de l'agent (son fichier sans `.md`). */
  owner: string;
  /** Chemin lisible depuis la racine du produit : `skills/ezk-x/SKILL.md`, `agents/ezk-y.md`. */
  file: string;
  text: string;
}

/** Un script cité par un document. */
export interface ScriptCitation {
  file: string;
  /** Ligne (à partir de 1) de la citation. */
  line: number;
  /** Le texte tel qu'écrit, sans le `./` éventuel. */
  raw: string;
  /** La forme canonique citée : `bin/x.sh`, `skills/s/scripts/x.sh`, `scripts/x.sh`. */
  cited: string;
  /** Où le script peut être, depuis la racine du produit (`../../` = racine du dépôt). Un seul suffit. */
  candidates: string[];
}

/**
 * Un script d'un AUTRE projet, cité par nos skills (ex. `ezk-ci` génère `scripts/ci-local.sh` dans le
 * dépôt qu'il équipe). Listé un par un, avec sa raison : aucun joker.
 */
export interface ProjectScriptException {
  owner: string;
  cited: string;
  reason: string;
}

const EXT = '(?:sh|ts|mjs|js)';
const NAME = `[\\w.-]+\\.${EXT}\\b`;
/** Ce qui précède un chemin ne doit pas en faire un morceau d'un autre chemin ou d'un gabarit. */
const LEFT = '(?<![\\w./~<>$}-])';

const BIN = new RegExp(`${LEFT}(?:\\./)?(?:products/mega-city/)?(bin/${NAME})`, 'g');
const SKILL_QUALIFIED = new RegExp(
  `(?<![\\w.~<>$}-])(?:[\\w./~-]*/)?skills/([\\w-]+)/(scripts/${NAME})`,
  'g',
);
const SKILL_SHORT = new RegExp(`${LEFT}([\\w-]+)/(scripts/${NAME})`, 'g');
const BARE = new RegExp(`${LEFT}(?:\\./)?(scripts/${NAME})`, 'g');

/** Tous les scripts du dépôt cités par `doc`, existants ou non, ligne par ligne. */
export function citedScriptRefs(doc: RefDoc, skillIds: ReadonlySet<string>): ScriptCitation[] {
  const found: ScriptCitation[] = [];
  doc.text.split('\n').forEach((text, index) => {
    const line = index + 1;
    const add = (raw: string, cited: string, candidates: string[]): void => {
      found.push({ file: doc.file, line, raw, cited, candidates });
    };
    for (const m of text.matchAll(BIN)) {
      const path = m[1] as string;
      add(path, path, [path]);
    }
    for (const m of text.matchAll(SKILL_QUALIFIED)) {
      const path = `skills/${m[1]}/${m[2]}`;
      add(path, path, [path]);
    }
    for (const m of text.matchAll(SKILL_SHORT)) {
      if (!skillIds.has(m[1] as string)) continue;
      const path = `skills/${m[1]}/${m[2]}`;
      add(`${m[1]}/${m[2]}`, path, [path]);
    }
    for (const m of text.matchAll(BARE)) {
      const path = m[1] as string;
      add(path, path, [`skills/${doc.owner}/${path}`, path, `../../${path}`]);
    }
  });
  return found;
}

/** Les citations de script dont AUCUN emplacement possible n'existe, hors exceptions explicites. */
export function findDeadScriptRefs(
  docs: readonly RefDoc[],
  skillIds: ReadonlySet<string>,
  exists: (pathFromProductRoot: string) => boolean,
  exceptions: readonly ProjectScriptException[],
): ScriptCitation[] {
  const excused = (doc: RefDoc, c: ScriptCitation): boolean =>
    exceptions.some((e) => e.owner === doc.owner && e.cited === c.cited);
  return docs.flatMap((doc) =>
    citedScriptRefs(doc, skillIds).filter((c) => !c.candidates.some(exists) && !excused(doc, c)),
  );
}

export interface UncitedComposition {
  skill: string;
  link: 'composes' | 'delegates';
  target: string;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `target` figure dans `body` comme un mot entier : `ezk-pr-pilot` ne cite pas `ezk-pr`. */
const cites = (body: string, target: string): boolean =>
  new RegExp(`(?<![\\w-])${escapeRegExp(target)}(?![\\w-])`).test(body);

/**
 * Les `composes:` / `delegates:` que le corps du skill déclarant ne mentionne jamais. Sans cela, le
 * graphe annonce une intégration que le texte n'honore pas. Trié : skill, lien, cible.
 */
export function findUncitedCompositions(
  skills: readonly Pick<Skill, 'id' | 'content' | 'composes' | 'delegates'>[],
): UncitedComposition[] {
  const out: UncitedComposition[] = [];
  for (const skill of skills) {
    for (const link of ['composes', 'delegates'] as const) {
      for (const target of skill[link] ?? []) {
        if (!cites(skill.content, target)) out.push({ skill: skill.id, link, target });
      }
    }
  }
  return out.sort(
    (a, b) =>
      a.skill.localeCompare(b.skill) || a.link.localeCompare(b.link) || a.target.localeCompare(b.target),
  );
}
