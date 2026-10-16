/**
 * Loader/writer — la config des MODÈLES d'un projet (`.vectorz/config.yml`).
 * Fiche 20261013132218451 (côté lecture/écriture). Lit les trois clés de config :
 * `roles:` = tier par rôle (portée projet), `modeles:` = mapping tier → modèle +
 * effort (soupape projet), `agents:` = repli direct par agent. Les écrit SANS
 * détruire les commentaires ni les clés voisines (édition de document `yaml`,
 * miroir de `writeGithubConfig`). La validation des valeurs vit dans le résolveur
 * pur (`src/core/model-config.ts`), pas ici : on ne remplace jamais en silence.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Document, isMap, parseDocument } from 'yaml';
import type { ModelConfig } from '../core/model-config.js';
import { PROJECT_CONFIG_DIR, PROJECT_CONFIG_NAMES, loadProjectConfig } from './project-config.js';

/** Lit la config des modèles d'un projet (portées projet + repli agent). */
export function loadModelConfig(projectRoot: string): ModelConfig {
  const raw = loadProjectConfig(projectRoot);
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const config: ModelConfig = {};
  if (obj.roles && typeof obj.roles === 'object') {
    config.roles = obj.roles as ModelConfig['roles'];
  }
  if (obj.modeles && typeof obj.modeles === 'object') {
    config.modeles = obj.modeles as ModelConfig['modeles'];
  }
  if (obj.agents && typeof obj.agents === 'object') {
    config.agents = obj.agents as ModelConfig['agents'];
  }
  return config;
}

/** Fichier config cible : l'existant (`.yml` prioritaire), sinon `config.yml`. */
function targetConfigFile(projectRoot: string): string {
  for (const name of PROJECT_CONFIG_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (existsSync(file)) return file;
  }
  return join(projectRoot, PROJECT_CONFIG_DIR, PROJECT_CONFIG_NAMES[0]);
}

/**
 * Une écriture de la config des modèles :
 *  - `roles` : un rôle → tier abstrait (portée projet) ;
 *  - `modeles` : un tier → modèle concret + effort (soupape projet) ;
 *  - `agents` : un rôle → modèle/effort direct ;
 *  - `unset` : revenir au défaut (retire l'entrée).
 */
export type ModelMutation =
  | { readonly scope: 'roles'; readonly role: string; readonly tier: string }
  | { readonly scope: 'roles'; readonly role: string; readonly unset: true }
  | { readonly scope: 'modeles'; readonly tier: string; readonly model: string; readonly effort?: string }
  | { readonly scope: 'modeles'; readonly tier: string; readonly unset: true }
  | { readonly scope: 'agents'; readonly role: string; readonly model?: string; readonly effort?: string }
  | { readonly scope: 'agents'; readonly role: string; readonly unset: true };

function mutationKey(m: ModelMutation): string {
  return m.scope === 'modeles' ? m.tier : m.role;
}

function applyModelMutation(doc: Document, m: ModelMutation): void {
  const key = mutationKey(m);
  if ('unset' in m) {
    doc.deleteIn([m.scope, key]);
    // Si la section devient vide, on la retire (config revenue au défaut).
    const section = doc.get(m.scope);
    if (isMap(section) && section.items.length === 0) doc.delete(m.scope);
    return;
  }
  // `roles` porte un tier scalaire ; `modeles`/`agents` portent un objet.
  if (m.scope === 'roles') {
    doc.setIn(['roles', key], m.tier);
    return;
  }
  // On ne pose que les champs donnés ; les autres survivent.
  const existing = doc.getIn([m.scope, key]);
  const entry = isMap(existing) ? (existing.toJSON() as Record<string, string>) : {};
  const next: Record<string, string> = { ...entry };
  if (m.scope === 'modeles') {
    next.model = m.model;
    if (m.effort !== undefined) next.effort = m.effort;
  } else {
    if (m.model !== undefined) next.model = m.model;
    if (m.effort !== undefined) next.effort = m.effort;
  }
  doc.setIn([m.scope, key], next);
}

/**
 * Écrit une mutation de config des modèles dans `.vectorz/config.yml`, sans
 * détruire les commentaires ni les clés voisines. Renvoie le chemin écrit.
 */
export function writeModelConfig(projectRoot: string, mutation: ModelMutation): string {
  const file = targetConfigFile(projectRoot);
  let doc: Document;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, 'utf8'));
    if (doc.errors.length > 0) {
      throw new Error(`Config projet illisible (YAML malformé) : ${file}`);
    }
  } else {
    doc = new Document();
  }
  applyModelMutation(doc, mutation);
  if (isMap(doc.contents)) doc.contents.flow = false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, doc.toString(), 'utf8');
  return file;
}
