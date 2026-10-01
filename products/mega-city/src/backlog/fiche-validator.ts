/**
 * Validateur de conformité de fiche (front-matter) — ADR-0040 D2 : « rapporte avant de
 * bloquer ». PUR (ADR-0003) : ne lit rien sur disque, prend le texte déjà lu par le bord
 * I/O (bin/check-fiches.ts). Absorbe la fiche 281 et promeut en vrai validateur les
 * warnings d'intégrité déjà émis par regen-backlog.sh (id dupliqué, etc. — inchangés ici).
 *
 * Enums réutilisées, pas dupliquées : STATUTS vient du schéma unique `../core/fiche-schema.js`
 * (avec les CHAMPS_RETIRES), PRIOS/TYPES de `../core/avancement-data.js`.
 * Lecture de champ réutilisée : `readField` vient de `../loaders/fiches.js`.
 *
 * Mode WARNING seulement : produit une liste d'anomalies, ne lance jamais, ne bloque
 * jamais. La bascule bloquante (exit ≠ 0, préflight/CI) est hors périmètre (D2).
 */
import { EVIDENCE, PRIOS, TYPES } from '../core/avancement-data.js';
import { CHAMPS_RETIRES, STATUTS } from '../core/fiche-schema.js';
import { frontMatter, readField } from '../loaders/fiches.js';

export interface FicheAnomaly {
  file: string;
  field: string;
  message: string;
}

export interface ValidateOptions {
  /** Monorepo (vectorz) : `product:` devient requis. Backlog mono-produit autonome : non. */
  monorepo: boolean;
}

const REQUIRED_FIELDS = ['id', 'title', 'type', 'priority', 'status'] as const;

const ENUM_FIELDS: ReadonlyArray<{ field: string; values: readonly string[] }> = [
  { field: 'type', values: TYPES },
  { field: 'priority', values: PRIOS },
  { field: 'status', values: STATUTS },
  { field: 'evidence', values: EVIDENCE },
];

/** Valide le front-matter d'UNE fiche. Retourne [] si conforme. */
export function validateFicheFrontMatter(
  file: string,
  text: string,
  opts: ValidateOptions,
): FicheAnomaly[] {
  const anomalies: FicheAnomaly[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (readField(text, field) === '') {
      anomalies.push({ file, field, message: `champ requis absent : ${field}` });
    }
  }

  for (const { field, values } of ENUM_FIELDS) {
    const value = readField(text, field);
    if (value !== '' && !values.includes(value)) {
      anomalies.push({
        file,
        field,
        message: `${field} inconnu : "${value}" (attendu : ${values.join(', ')})`,
      });
    }
  }

  // Champs RETIRÉS (migration Skema, ex. `ready:` depuis la 005) : leur simple présence dans le
  // FRONT-MATTER est une anomalie — jamais dans le corps (un exemple en bloc de code est légitime).
  const frontMatterText = frontMatter(text);
  for (const { field, hint } of CHAMPS_RETIRES) {
    if (new RegExp(`^${field}:`, 'm').test(frontMatterText)) {
      anomalies.push({ file, field, message: `champ retiré : ${field} — ${hint}` });
    }
  }

  // Champ conditionnel (ADR-0040 D2, note 0186/init.sh) : `product:` n'est requis
  // qu'en monorepo. Un backlog mono-produit autonome sans `product:` est VALIDE.
  if (opts.monorepo && readField(text, 'product') === '') {
    anomalies.push({
      file,
      field: 'product',
      message: 'champ requis absent (monorepo) : product',
    });
  }

  return anomalies;
}

/**
 * Détecte les ids en double sur l'ENSEMBLE des fiches (contrôle inter-fichiers, pur).
 * Le fléau historique du dépôt : deux fiches mintées avec le même id. Un id vide est
 * ignoré ici (déjà signalé « champ requis absent » par validateFicheFrontMatter).
 */
export function findDuplicateIds(
  entries: ReadonlyArray<{ file: string; id: string }>,
): FicheAnomaly[] {
  const byId = new Map<string, string[]>();
  for (const { file, id } of entries) {
    if (id === '') continue;
    byId.set(id, [...(byId.get(id) ?? []), file]);
  }
  const anomalies: FicheAnomaly[] = [];
  for (const [id, files] of byId) {
    if (files.length > 1) {
      const sorted = [...files].sort();
      for (const file of sorted) {
        anomalies.push({
          file,
          field: 'id',
          message: `id dupliqué : "${id}" (${sorted.length} fiches : ${sorted.join(', ')})`,
        });
      }
    }
  }
  return anomalies;
}

/**
 * Vérifie l'EXISTENCE de chaque id de provenance référencé par `merged_into:`/`split_into:`
 * (ADR-0040 D5 : pas d'id fantôme — sliver B, fiche 652). Contrôle inter-fichiers, pur :
 * `knownIds` est l'ensemble des ids réellement présents dans le backlog (actives + `done/`).
 * Un champ absent (`''` / `[]`) n'est pas une anomalie — la provenance est optionnelle.
 */
export function findInvalidProvenanceIds(
  entries: ReadonlyArray<{
    file: string;
    mergedInto: string;
    splitInto: readonly string[];
    /** Sens inverse, posé par `backlog:apply` (fiche 20260910231201744) : optionnels. */
    mergedFrom?: readonly string[];
    splitFrom?: string;
  }>,
  knownIds: ReadonlySet<string>,
): FicheAnomaly[] {
  const anomalies: FicheAnomaly[] = [];
  const phantom = (file: string, field: string, id: string): void => {
    if (id !== '' && !knownIds.has(id)) {
      anomalies.push({
        file,
        field,
        message: `id fantôme : "${id}" ne correspond à aucune fiche du backlog`,
      });
    }
  };
  for (const { file, mergedInto, splitInto, mergedFrom = [], splitFrom = '' } of entries) {
    phantom(file, 'merged_into', mergedInto);
    for (const id of splitInto) phantom(file, 'split_into', id);
    for (const id of mergedFrom) phantom(file, 'merged_from', id);
    phantom(file, 'split_from', splitFrom);
  }
  return anomalies;
}

export interface ProvenanceEntry {
  file: string;
  id: string;
  mergedInto: string;
  mergedFrom: readonly string[];
  splitInto: readonly string[];
  splitFrom: string;
}

/**
 * La provenance se lit dans les DEUX sens (fiche 20260910231201744) : si B dit `merged_into: A`, A doit
 * citer B dans `merged_from`, et inversement ; de même `split_into` ↔ `split_from`. Contrôle
 * inter-fichiers, pur. Un id qui n'est pas dans `entries` est ignoré ici : c'est un id fantôme, déjà
 * signalé par `findInvalidProvenanceIds`. Une provenance à sens unique est la trace d'une édition à la
 * main (ou d'un apply interrompu) : elle ment à celui qui la lit dans l'autre sens.
 */
export function findProvenanceMismatches(entries: ReadonlyArray<ProvenanceEntry>): FicheAnomaly[] {
  const byId = new Map(entries.map((e) => [e.id, e] as const));
  const anomalies: FicheAnomaly[] = [];
  const report = (file: string, field: string, message: string): void => {
    anomalies.push({ file, field, message: `provenance non réciproque : ${message}` });
  };
  for (const e of entries) {
    const target = byId.get(e.mergedInto);
    if (target && !target.mergedFrom.includes(e.id)) {
      report(e.file, 'merged_into', `${e.mergedInto} ne cite pas ${e.id} dans merged_from`);
    }
    for (const id of e.mergedFrom) {
      const source = byId.get(id);
      if (source && source.mergedInto !== e.id) {
        report(e.file, 'merged_from', `${id} ne dit pas merged_into: ${e.id}`);
      }
    }
    for (const id of e.splitInto) {
      const child = byId.get(id);
      if (child && child.splitFrom !== e.id) {
        report(e.file, 'split_into', `${id} ne dit pas split_from: ${e.id}`);
      }
    }
    const parent = byId.get(e.splitFrom);
    if (parent && !parent.splitInto.includes(e.id)) {
      report(e.file, 'split_from', `${e.splitFrom} ne cite pas ${e.id} dans split_into`);
    }
  }
  return anomalies;
}
