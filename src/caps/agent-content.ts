/**
 * Contenu d'un fichier agent natif Claude Code (fiche 0043) — DÉTERMINISTE et PUR.
 *
 * Sans model/effort/isolation : comportement historique inchangé (rôle brut, sans
 * frontmatter). Avec au moins un des trois : reconstruit le frontmatter YAML natif
 * (name + réglages) via gray-matter — la même lib que le loader utilise pour le
 * parser (src/loaders/catalog.ts) — pour rester symétrique et éviter d'échapper le
 * YAML à la main.
 */
import matter from 'gray-matter';
import type { Agent } from '../domain/model.js';

export function agentContent(agent: Agent): string {
  const settings: Record<string, string> = {};
  if (agent.model) settings.model = agent.model;
  if (agent.effort) settings.effort = agent.effort;
  if (agent.isolation) settings.isolation = agent.isolation;

  const role = `${agent.role.trim()}\n`;
  if (Object.keys(settings).length === 0) return role;
  return matter.stringify(role, { name: agent.id, ...settings });
}
