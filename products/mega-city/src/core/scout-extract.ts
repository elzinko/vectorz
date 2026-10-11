/**
 * scout-extract — le cœur PUR de l'amorçage brownfield (fiche 20261007151859473).
 *
 * Quand on démarre la méthode sur un projet qui EXISTE déjà, ses conventions sont implicites dans
 * le code. Ce module LIT des signaux statiques (déjà extraits par le bord `bin/ezk-scout-extract.ts`)
 * et PROPOSE des règles candidates — **jamais appliquées** (invariant FIND-ONLY d'ezk-scout, et
 * ADR-0001 « le LLM ne range pas » : c'est le PO qui arbitre). Aucune I/O ici (ADR-0003).
 *
 * POC borné : signaux déterministes et sûrs (présence d'outils, convention de commits). Il ne
 * « devine » pas des conventions floues — il remonte ce qui est OBSERVABLE sans ambiguïté, et le
 * présente comme candidat à valider, avec sa preuve. L'inférence plus riche viendra après.
 */

/** Signaux statiques lus dans le repo cible (par le bord ; ici on ne reçoit que des données). */
export interface RepoSignals {
  /** Noms des dépendances (deps + devDeps) du package.json racine. */
  readonly deps: readonly string[];
  /** Fichiers de config présents à la racine (ex. `biome.json`, `tsconfig.json`, `.eslintrc.json`). */
  readonly configFiles: readonly string[];
  /** Sujets des derniers commits (pour détecter une convention de messages). */
  readonly commitSubjects: readonly string[];
}

/** Une règle CANDIDATE proposée au PO — jamais écrite tant qu'il n'a pas tranché. */
export interface RuleCandidate {
  /** Id proposé `catégorie/slug` (le PO peut le renommer). */
  readonly id: string;
  /** Catégorie = bundle cible si validée. */
  readonly category: string;
  readonly level: 'MUST' | 'SHOULD';
  readonly title: string;
  /** La PREUVE observée qui motive le candidat (pas une supposition). */
  readonly evidence: string;
}

const CONVENTIONAL =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: /;

function hasDep(deps: readonly string[], ...names: string[]): string | null {
  for (const n of names) if (deps.includes(n)) return n;
  return null;
}

/**
 * Des signaux vers une liste de règles candidates, triée par id (stable, reproductible). Chaque
 * candidat porte sa preuve. Une catégorie de signal absente ne produit rien (jamais de candidat
 * sans preuve).
 */
export function extractCandidates(signals: RepoSignals): RuleCandidate[] {
  const out: RuleCandidate[] = [];

  // 1. Formatage / lint.
  const biome =
    signals.configFiles.includes('biome.json') || hasDep(signals.deps, '@biomejs/biome');
  if (biome) {
    out.push({
      id: 'code-style/biome-format',
      category: 'code-style',
      level: 'SHOULD',
      title: 'Formater et linter avec Biome',
      evidence: signals.configFiles.includes('biome.json')
        ? 'biome.json présent'
        : '@biomejs/biome en dépendance',
    });
  } else {
    const eslint =
      signals.configFiles.find((f) => f.startsWith('.eslintrc')) ?? hasDep(signals.deps, 'eslint');
    if (eslint) {
      out.push({
        id: 'code-style/eslint',
        category: 'code-style',
        level: 'SHOULD',
        title: 'Linter avec ESLint',
        evidence:
          typeof eslint === 'string' && eslint.startsWith('.eslintrc')
            ? `${eslint} présent`
            : 'eslint en dépendance',
      });
    }
  }

  // 2. Tests.
  const testFw = hasDep(signals.deps, 'vitest', 'jest', 'mocha', 'ava');
  if (testFw) {
    out.push({
      id: 'testing/framework',
      category: 'testing',
      level: 'SHOULD',
      title: `Écrire les tests avec ${testFw}`,
      evidence: `${testFw} en dépendance`,
    });
  }

  // 3. Typage strict.
  if (signals.configFiles.includes('tsconfig.json')) {
    out.push({
      id: 'typing/typescript',
      category: 'typing',
      level: 'SHOULD',
      title: 'Typer en TypeScript (vérifié au build)',
      evidence: 'tsconfig.json présent',
    });
  }

  // 4. Convention de messages de commit (si une MAJORITÉ nette la suit).
  const subjects = signals.commitSubjects;
  if (subjects.length >= 5) {
    const ok = subjects.filter((s) => CONVENTIONAL.test(s)).length;
    if (ok / subjects.length >= 0.7) {
      out.push({
        id: 'conventional-commits/format',
        category: 'conventional-commits',
        level: 'MUST',
        title: 'Messages de commit en Conventional Commits',
        evidence: `${ok}/${subjects.length} des derniers commits suivent déjà le format`,
      });
    }
  }

  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** Rendu lisible des candidats (le bord l'imprime) — un bloc par candidat, avec sa preuve. */
export function renderCandidates(candidates: readonly RuleCandidate[]): string {
  if (candidates.length === 0) {
    return 'Aucune règle candidate déduite des signaux statiques (rien d’observable sans ambiguïté).';
  }
  const lines = [
    `${candidates.length} règle(s) candidate(s) — À ARBITRER par le PO (rien n’est écrit) :`,
    '',
  ];
  for (const c of candidates) {
    lines.push(`- \`${c.id}\` [${c.level}] — ${c.title}`);
    lines.push(`    preuve : ${c.evidence} · bundle cible : ${c.category}`);
  }
  return lines.join('\n');
}
