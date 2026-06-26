/**
 * expand — DÉTERMINISTE et PUR (ADR-0003, critère #1 de la fiche 0001).
 *
 * Résout `extends` (profiles puis bundles), agrège rules+agents+skills,
 * DÉDUPLIQUE par `id` et TRIE stablement par `id`. Aucun I/O, aucune IA.
 *
 * Une référence (id) non présente dans le catalogue est TOLÉRÉE et simplement
 * ignorée (ex. skill externe `ezk-commits`) : on ne matérialise que ce qui existe.
 */
import type { Catalog } from '../loaders/catalog.js';
import type { Agent, Bundle, Profile, ResolvedProfile, Rule, Skill } from '../domain/model.js';

const byId = (a: { id: string }, b: { id: string }): number => a.id.localeCompare(b.id);

function dedupSorted<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item); // dernier-gagne (ADR-0003)
  return [...map.values()].sort(byId);
}

/** Collecte les ids de règles d'un bundle et de ses ancêtres (`extends`), sans cycle. */
function collectBundleRuleIds(
  bundleId: string,
  bundles: Map<string, Bundle>,
  seen: Set<string>,
  out: string[],
): void {
  if (seen.has(bundleId)) return;
  seen.add(bundleId);
  const bundle = bundles.get(bundleId);
  if (!bundle) return;
  for (const parent of bundle.extends ?? []) {
    collectBundleRuleIds(parent, bundles, seen, out);
  }
  out.push(...bundle.rules);
}

/** Collecte un profil et ses ancêtres (`extends`), sans cycle. */
function collectProfiles(
  profileId: string,
  profiles: Map<string, Profile>,
  seen: Set<string>,
  out: Profile[],
): void {
  if (seen.has(profileId)) return;
  seen.add(profileId);
  const profile = profiles.get(profileId);
  if (!profile) return;
  for (const parent of profile.extends ?? []) {
    collectProfiles(parent, profiles, seen, out);
  }
  out.push(profile);
}

function resolve<T>(ids: string[], catalog: Map<string, T>): T[] {
  return ids.map((id) => catalog.get(id)).filter((entity): entity is T => entity !== undefined);
}

export function expandProfile(profile: Profile, catalog: Catalog): ResolvedProfile {
  const lineage: Profile[] = [];
  collectProfiles(profile.id, catalog.profiles, new Set(), lineage);
  // Le profil passé en argument peut ne pas être dans le catalogue (test/ad hoc).
  if (!catalog.profiles.has(profile.id)) lineage.push(profile);

  const ruleIds: string[] = [];
  const agentIds: string[] = [];
  const skillIds: string[] = [];
  for (const p of lineage) {
    for (const bundleId of p.bundles) {
      collectBundleRuleIds(bundleId, catalog.bundles, new Set(), ruleIds);
    }
    agentIds.push(...p.agents);
    skillIds.push(...p.skills);
  }

  return {
    rules: dedupSorted<Rule>(resolve(ruleIds, catalog.rules)),
    agents: dedupSorted<Agent>(resolve(agentIds, catalog.agents)),
    skills: dedupSorted<Skill>(resolve(skillIds, catalog.skills)),
  };
}
