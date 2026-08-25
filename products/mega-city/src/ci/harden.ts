import { parseDocument, isMap, isSeq, type Document, type YAMLMap } from 'yaml';

/**
 * Durcissement de frugalité d'un workflow GitHub Actions (fiche 20260812134515706).
 *
 * Frontière ADR-0001 : ce module fait le **déterministe** — détecter un pattern manquant,
 * l'appliquer en **fusionnant** (jamais d'écrasement d'une config existante). Le **jugement**
 * (quels patterns proposer à tel repo) reste au LLM, côté skill `ezk-ci`.
 *
 * POC : un seul pattern, `skip-docs` (`paths-ignore` sur `pull_request`), le plus agnostique
 * à la stack. La structure (liste de patterns) accueille d'autres patterns sans changer l'API.
 */

/** Globs de fichiers docs qu'une CI n'a pas besoin de re-tester. */
const DOCS_PATTERNS = ['**.md', 'docs/**'];

/** Rendu : limite la normalisation de style (pas de padding `[ a ]` → `[a]`). */
const STRINGIFY_OPTS = { flowCollectionPadding: false } as const;

export interface PatternCheck {
  /** Identifiant du pattern (ex. `skip-docs`). */
  id: string;
  /** Le pattern est-il déjà présent/couvert ? */
  present: boolean;
  /** Le POC sait-il l'appliquer automatiquement sur ce workflow ? */
  autoApplicable: boolean;
  /** Explication lisible du verdict. */
  reason: string;
}

export interface AuditResult {
  /** Patterns pertinents pour ce workflow, avec leur état. */
  patterns: PatternCheck[];
  /** Ids des patterns manquants ET auto-applicables (ce qu'`applyHardening` posera). */
  missing: string[];
}

export interface ApplyResult {
  /** Texte du workflow après durcissement (inchangé si rien à faire). */
  text: string;
  /** Ids des patterns effectivement appliqués. */
  applied: string[];
}

function onNode(doc: Document) {
  return doc.get('on', true);
}

/** `on.pull_request` s'il est une map (forme configurable), sinon `undefined`. */
function pullRequestMap(doc: Document): YAMLMap | undefined {
  const on = onNode(doc);
  if (!isMap(on)) return undefined;
  const pr = on.get('pull_request', true);
  return isMap(pr) ? pr : undefined;
}

/** `pull_request` déclenché en forme liste (`on: [push, pull_request]`) ? */
function pullRequestInList(doc: Document): boolean {
  const on = onNode(doc);
  if (!isSeq(on)) return false;
  return (on.toJSON() as unknown[]).some((entry) => String(entry) === 'pull_request');
}

/** Entrées `paths-ignore` déjà présentes sur `pull_request`. */
function existingPathsIgnore(pr: YAMLMap): string[] {
  const pathsIgnore = pr.get('paths-ignore', true);
  if (!isSeq(pathsIgnore)) return [];
  return (pathsIgnore.toJSON() as unknown[]).map((entry) => String(entry));
}

/** Globs docs pas encore couverts par le `paths-ignore` de `pull_request`. */
function missingDocGlobs(pr: YAMLMap): string[] {
  const existing = new Set(existingPathsIgnore(pr));
  return DOCS_PATTERNS.filter((glob) => !existing.has(glob));
}

/** Parse un workflow ; lève tôt (avant toute écriture) si le YAML est invalide. */
function parseWorkflow(text: string): Document {
  const doc = parseDocument(text);
  if (doc.errors.length > 0) {
    throw new Error(doc.errors[0]?.message ?? 'YAML invalide');
  }
  return doc;
}

/**
 * Audite un workflow (lecture seule) : quels patterns de frugalité manquent.
 * Ne modifie jamais le texte fourni.
 */
export function auditWorkflow(text: string): AuditResult {
  const doc = parseWorkflow(text);
  const pr = pullRequestMap(doc);
  const patterns: PatternCheck[] = [];

  if (pr) {
    const missing = missingDocGlobs(pr);
    const present = missing.length === 0;
    patterns.push({
      id: 'skip-docs',
      present,
      autoApplicable: true,
      reason: present
        ? 'paths-ignore couvre déjà les docs sur pull_request'
        : `couverture docs incomplète sur pull_request (manque ${missing.join(', ')}) : la CI se déclenche sur des changements docs-only`,
    });
  } else if (pullRequestInList(doc)) {
    // pull_request existe mais en forme liste : pas de place pour paths-ignore sans
    // convertir `on` en map — hors périmètre du POC. On le signale sans prétendre l'appliquer.
    patterns.push({
      id: 'skip-docs',
      present: false,
      autoApplicable: false,
      reason: 'pull_request déclaré en liste (on: [...]) : passe `on` en map pour poser paths-ignore (hors périmètre du POC)',
    });
  }

  return {
    patterns,
    missing: patterns.filter((p) => !p.present && p.autoApplicable).map((p) => p.id),
  };
}

/**
 * Applique les patterns de frugalité manquants, en **fusionnant** avec la config
 * existante (jamais d'écrasement). Idempotent : un workflow déjà frugal (ou un second
 * passage) ressort **strictement inchangé** (même texte, `applied` vide).
 */
export function applyHardening(text: string): ApplyResult {
  const doc = parseWorkflow(text);
  const applied: string[] = [];

  const pr = pullRequestMap(doc);
  if (pr) {
    const missing = missingDocGlobs(pr);
    if (missing.length > 0) {
      const pathsIgnore = pr.get('paths-ignore', true);
      if (isSeq(pathsIgnore)) {
        // Fusion : on AJOUTE les globs manquants, sans toucher aux entrées existantes.
        for (const glob of missing) pathsIgnore.add(glob);
      } else {
        pr.set('paths-ignore', doc.createNode([...existingPathsIgnore(pr), ...missing]));
      }
      applied.push('skip-docs');
    }
  }

  return applied.length === 0 ? { text, applied } : { text: doc.toString(STRINGIFY_OPTS), applied };
}
