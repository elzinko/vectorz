/**
 * bind — DÉTERMINISTE et PUR (ADR-0003, fiche 0001).
 *
 * load (catalogue) → expand (profil résolu) → cap.materialize → WritePlan.
 * Aucun I/O, aucune horloge, aucune IA dans ce chemin. La coquille I/O
 * (src/io/apply.ts) consomme le plan. Mêmes entrées ⇒ même plan, byte-for-byte.
 */
import { loadCatalog } from '../loaders/catalog.js';
import { expandProfile } from './expand.js';
import { capFor } from '../caps/registry.js';
import type { HostId } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';

/**
 * Calcule le plan d'écriture d'un profil pour un hôte.
 * @param projectDir cible logique (transmise au cap, non lue ici : reste pur).
 * @param rootDir racine du catalogue (repo).
 */
export function bind(
  profileId: string,
  projectDir: string,
  host: HostId,
  rootDir: string,
): WritePlan {
  const catalog = loadCatalog(rootDir);
  const profile = catalog.profiles.get(profileId);
  if (!profile) {
    throw new Error(`Profil inconnu: '${profileId}' (catalogue: ${rootDir}).`);
  }
  const resolved = expandProfile(profile, catalog);
  return capFor(host).materialize(resolved, projectDir);
}
