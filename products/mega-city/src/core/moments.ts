/**
 * Le catalogue des moments de la méthode — cœur pur (schéma + validation).
 *
 * Les DONNÉES vivent dans moments.yml (racine du produit) ; le CHARGEMENT dans
 * src/loaders/moments.ts. Ici, seulement la forme et les invariants, sans I/O.
 * Contrat : ADR-0065 (le bus des moments), fiche 20261004101755756.
 */
import { z } from 'zod';

/** Les trois sortes d'échange du bus (ADR-0061). */
export const SORTES = ['evenement', 'commande', 'avis'] as const;
export type Sorte = (typeof SORTES)[number];

export const MomentSchema = z.object({
  /** Nom unique du moment, ex. « run.started », « integrate ». */
  nom: z.string().min(1),
  /** Sa sorte d'échange. */
  sorte: z.enum(SORTES),
  /** L'étape de la méthode qui l'émet. */
  etape: z.string().min(1),
  /** Ce qu'il transporte (la charge utile), en clair. */
  transporte: z.string().min(1),
  /** Les clients d'aujourd'hui. Vide = déclaré au contrat, pas encore branché. */
  clients: z.array(z.string()),
});
export type Moment = z.infer<typeof MomentSchema>;

export const MomentsDocSchema = z.object({
  moments: z.array(MomentSchema).min(1),
});
export type MomentsDoc = z.infer<typeof MomentsDocSchema>;

/**
 * Valide la FORME (schéma) ET l'UNICITÉ des noms. Jette si le catalogue est malformé :
 * un nom en double ou une sorte inconnue fait échouer la validation (ADR-0065).
 */
export function validateMomentsDoc(raw: unknown): MomentsDoc {
  const doc = MomentsDocSchema.parse(raw);
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const m of doc.moments) {
    if (seen.has(m.nom)) dups.add(m.nom);
    seen.add(m.nom);
  }
  if (dups.size > 0) {
    throw new Error(`moments : noms en double — ${[...dups].join(', ')}`);
  }
  return doc;
}
