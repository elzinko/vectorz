/**
 * Validateur de conformité de fiche (front-matter) — ADR-0040 D2 : « rapporte avant de
 * bloquer ». PUR (ADR-0003) : ne lit rien sur disque, prend le texte déjà lu par le bord
 * I/O (bin/check-fiches.ts). Absorbe la fiche 281 et promeut en vrai validateur les
 * warnings d'intégrité déjà émis par regen-backlog.sh (id dupliqué, etc. — inchangés ici).
 *
 * Enums réutilisées, pas dupliquées : STATUTS/PRIOS/TYPES viennent de
 * `../core/avancement-data.js` (déjà la source pour le board d'avancement).
 * Lecture de champ réutilisée : `readField` vient de `../loaders/fiches.js`.
 *
 * Mode WARNING seulement : produit une liste d'anomalies, ne lance jamais, ne bloque
 * jamais. La bascule bloquante (exit ≠ 0, préflight/CI) est hors périmètre (D2).
 */
import { EVIDENCE, PRIOS, STATUTS, TYPES } from '../core/avancement-data.js';
import { readField } from '../loaders/fiches.js';

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
