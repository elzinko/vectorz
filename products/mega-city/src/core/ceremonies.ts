/**
 * ceremonies — la carte TOTALE de la méthode scrum, VALIDÉE contre le catalogue.
 * DÉTERMINISTE et PUR (ADR-0003) — la lecture du YAML vit dans src/loaders/method.ts.
 *
 * POURQUOI (lot 1 du plan « trois étages », PO 2026-08-23) : la carte doit montrer
 * TOUTES les cérémonies scrum — implémentées et à implémenter — sans que cette liste
 * puisse mentir. Garde-fou du panel adverse : chaque `implemente_par` est vérifié
 * contre le catalogue réel — skill inexistant, sous-commande absente de
 * l'`argument-hint`, agent inconnu ⇒ on JETTE (la régénération échoue, la CI rougit).
 *
 * Grammaire des références : `humain` · `agent:<id>` · `<skill>` · `<skill>:<sous-commande>`.
 */
import type { Catalog } from '../loaders/catalog.js';

export type MethodEtat = 'fidele' | 'adapte' | 'assume' | 'a-implementer';
export type MethodType = 'ceremonie' | 'artefact' | 'role';

export interface MethodElement {
  id: string;
  type: MethodType;
  nom: string;
  scrum?: string; // le nom côté Scrum Guide (ou « — » pour un cran maison)
  etat: MethodEtat;
  implemente_par: string[];
  note?: string;
}

export interface MethodDoc {
  elements: MethodElement[];
}

const ETATS: readonly MethodEtat[] = ['fidele', 'adapte', 'assume', 'a-implementer'];
const TYPES: readonly MethodType[] = ['ceremonie', 'artefact', 'role'];

/**
 * Sous-commandes d'un skill, lues depuis son `argument-hint` : le premier groupe
 * `[a|b|c]` s'il est une liste propre, sinon rien. MÊME règle que le parseur de la
 * carte (les deux affichent/valident le même vocabulaire).
 */
export function subCommandsOf(argumentHint: string | undefined): string[] {
  const m = /^\s*\[([^\]]+)\]/.exec(argumentHint ?? '');
  if (!m) return [];
  const parts = m[1].split('|').map((x) => x.trim());
  return parts.length >= 2 && parts.every((x) => /^[a-z?][\w?-]*$/i.test(x)) ? parts : [];
}

function assertRef(catalog: Catalog, elementId: string, ref: string): void {
  const where = `ceremonies.yml → « ${elementId} » → implemente_par « ${ref} »`;
  if (ref === 'humain') return; // l'opérateur PO — pas (encore) un objet du modèle
  if (ref.startsWith('agent:')) {
    const id = ref.slice('agent:'.length);
    if (!catalog.agents.has(id)) throw new Error(`${where} : agent inconnu du catalogue`);
    return;
  }
  const [skillId, sub, extra] = ref.split(':');
  if (extra !== undefined) throw new Error(`${where} : référence mal formée (deux ':' maximum)`);
  const skill = catalog.skills.get(skillId);
  if (!skill) throw new Error(`${where} : skill inconnu du catalogue`);
  if (sub !== undefined) {
    const subs = subCommandsOf(skill.argumentHint);
    if (subs.length === 0) {
      throw new Error(
        `${where} : ${skillId} n'expose pas de liste de sous-commandes (argument-hint)`,
      );
    }
    if (!subs.includes(sub)) {
      throw new Error(`${where} : sous-commande absente de l'argument-hint (${subs.join('|')})`);
    }
  }
}

/**
 * Valide le document contre le catalogue et le renvoie normalisé (listes posées).
 * JETTE à la première incohérence — c'est le contrat : cette liste ne peut pas mentir.
 */
export function validateMethod(catalog: Catalog, doc: MethodDoc): MethodDoc {
  if (!doc || !Array.isArray(doc.elements) || doc.elements.length === 0) {
    throw new Error('ceremonies.yml : `elements` absent ou vide');
  }
  const seen = new Set<string>();
  const elements = doc.elements.map((raw) => {
    const id = raw?.id;
    if (typeof id !== 'string' || id.length === 0)
      throw new Error('ceremonies.yml : élément sans id');
    if (seen.has(id)) throw new Error(`ceremonies.yml : id en double « ${id} »`);
    seen.add(id);
    if (!TYPES.includes(raw.type)) {
      throw new Error(`ceremonies.yml → « ${id} » : type invalide (${TYPES.join('|')})`);
    }
    if (!ETATS.includes(raw.etat)) {
      throw new Error(`ceremonies.yml → « ${id} » : etat invalide (${ETATS.join('|')})`);
    }
    if (typeof raw.nom !== 'string' || raw.nom.length === 0) {
      throw new Error(`ceremonies.yml → « ${id} » : nom manquant`);
    }
    const refs = raw.implemente_par ?? [];
    if (!Array.isArray(refs) || !refs.every((r: unknown) => typeof r === 'string')) {
      throw new Error(`ceremonies.yml → « ${id} » : implemente_par doit être une liste de chaînes`);
    }
    if (refs.length === 0 && (raw.etat === 'fidele' || raw.etat === 'adapte')) {
      throw new Error(`ceremonies.yml → « ${id} » : état « ${raw.etat} » sans implémenteur`);
    }
    for (const ref of refs) assertRef(catalog, id, ref);
    return {
      id,
      type: raw.type,
      nom: raw.nom,
      ...(typeof raw.scrum === 'string' ? { scrum: raw.scrum } : {}),
      etat: raw.etat,
      implemente_par: [...refs],
      ...(typeof raw.note === 'string' ? { note: raw.note.trim() } : {}),
    };
  });
  return { elements };
}
