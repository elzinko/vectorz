/**
 * process-show — les ÉTAPES FINES de chaque skill, vérifiées puis publiées (fiche 20261110191135802).
 * DÉTERMINISTE et PUR (ADR-0003) — la lecture du YAML vit dans src/loaders/method.ts, l'assemblage
 * avec la config d'un projet dans src/io/process-show.ts.
 *
 * En clair : `method/etapes.yml` liste, pour chaque skill, ses pas dans l'ordre. Ce module refuse
 * une déclaration qui mentirait, puis en tire le contrat de `ezk process show --json` que mission
 * control affiche (ADR-086). Trois refus, chacun jette à la première erreur :
 *   - une référence `joue_par` hors catalogue (même grammaire que `ceremonies.yml`) ;
 *   - une étape dont l'`ancre` ne figure plus, mot pour mot, dans le SKILL.md de son skill ;
 *   - un réglage que `ezk config show` ne connaît pas.
 *
 * Le format est décrit UNE fois, ici, en zod ; `contracts/process-show/v1/` en est tiré
 * (`pnpm board:contract --write`). `schema_version` monte quand un champ disparaît, change de nom
 * ou de sens ; un champ ajouté le laisse tel quel.
 */
import { z } from 'zod';
import type { Catalog } from '../loaders/catalog.js';
import { assertRef } from './ceremonies.js';
import type { ConfigShow } from './config-contract.js';
import type { GroomingTechniques } from './grooming-config.js';

/** Une étape telle que `method/etapes.yml` la déclare. */
export interface EtapeDecl {
  id: string;
  titre: string;
  en_clair: string;
  /** Qui la réalise : `humain` · `agent:<id>` · `<skill>` · `<skill>:<sous-commande>`. */
  joue_par: string[];
  /** Un passage du SKILL.md du skill, recopié mot pour mot : l'étape y est décrite. */
  ancre: string;
  /** Les réglages du projet qui gouvernent l'étape, par leur clé dans `ezk config show`. */
  reglages?: string[];
}

export interface SkillDecl {
  id: string;
  nom: string;
  en_clair: string;
  etapes: EtapeDecl[];
}

export interface LienDecl {
  de: string;
  vers: string;
  libelle: string;
}

export interface EtapesDoc {
  skills: SkillDecl[];
  liens: LienDecl[];
}

const onOff = (on: boolean): string => (on ? 'on' : 'off');

function groomingValue(g: GroomingTechniques): string {
  if (g.mode === 'error') return `erreur : ${g.error}`;
  if (g.mode === 'selection') return g.ids.length > 0 ? g.ids.join(', ') : '(aucune)';
  return g.mode;
}

/**
 * Les réglages qu'une étape peut citer : chaque clé est une ligne de `ezk config show`, et sa valeur
 * est lue dans la même résolution que `ezk config show --json` (un test lie les deux).
 */
export const REGLAGES: ReadonlyMap<string, (c: ConfigShow) => string> = new Map([
  ['github.pr', (c: ConfigShow) => onOff(c.github.pr)],
  ['github.ci', (c: ConfigShow) => onOff(c.github.ci)],
  ['github.codex-review', (c: ConfigShow) => onOff(c.github.codexReview)],
  ['integration', (c: ConfigShow) => c.integration],
  ['review.adverse', (c: ConfigShow) => c.adverseReview],
  ['grooming.techniques', (c: ConfigShow) => groomingValue(c.groomingTechniques)],
]);

const FILE = 'etapes.yml';

function text(value: unknown, where: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${where} : ${field} manquant`);
  return value.trim();
}

function strings(value: unknown, where: string, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
    throw new Error(`${where} : ${field} doit être une liste de chaînes`);
  }
  return [...value];
}

function validateEtape(catalog: Catalog, skillId: string, content: string, raw: EtapeDecl): EtapeDecl {
  const id = text(raw?.id, `${FILE} → « ${skillId} »`, 'id d’étape');
  const where = `${FILE} → « ${skillId} » → étape « ${id} »`;
  const joue_par = strings(raw.joue_par, where, 'joue_par');
  if (joue_par.length === 0) throw new Error(`${where} : joue_par vide (qui réalise l’étape ?)`);
  for (const ref of joue_par) assertRef(catalog, `${where} → joue_par « ${ref} »`, ref);
  const ancre = text(raw.ancre, where, 'ancre');
  if (!content.includes(ancre)) {
    throw new Error(`${where} : ancre « ${ancre} » introuvable dans skills/${skillId}/SKILL.md (étape renommée ou retirée ?)`);
  }
  const reglages = strings(raw.reglages, where, 'reglages');
  for (const cle of reglages) {
    if (!REGLAGES.has(cle)) {
      throw new Error(`${where} : réglage inconnu « ${cle} » (connus de ezk config show : ${[...REGLAGES.keys()].join(', ')})`);
    }
  }
  return { id, titre: text(raw.titre, where, 'titre'), en_clair: text(raw.en_clair, where, 'en_clair'), joue_par, ancre, reglages };
}

/**
 * Valide la déclaration contre le catalogue et la renvoie normalisée (listes posées, textes rognés).
 * JETTE à la première incohérence : la régénération échoue, la gate rougit.
 */
export function validateEtapes(catalog: Catalog, doc: EtapesDoc): EtapesDoc {
  if (!doc || !Array.isArray(doc.skills) || doc.skills.length === 0) throw new Error(`${FILE} : \`skills\` absent ou vide`);
  const seenSkills = new Set<string>();
  const skills = doc.skills.map((raw) => {
    const id = text(raw?.id, FILE, 'id de skill');
    const where = `${FILE} → « ${id} »`;
    const skill = catalog.skills.get(id);
    if (!skill) throw new Error(`${where} : skill inconnu du catalogue`);
    if (seenSkills.has(id)) throw new Error(`${where} : skill en double`);
    seenSkills.add(id);
    if (!Array.isArray(raw.etapes) || raw.etapes.length === 0) throw new Error(`${where} : \`etapes\` absent ou vide`);
    const seenEtapes = new Set<string>();
    const etapes = raw.etapes.map((e) => {
      const etape = validateEtape(catalog, id, skill.content, e);
      if (seenEtapes.has(etape.id)) throw new Error(`${where} : étape « ${etape.id} » en double`);
      seenEtapes.add(etape.id);
      return etape;
    });
    return { id, nom: text(raw.nom, where, 'nom'), en_clair: text(raw.en_clair, where, 'en_clair'), etapes };
  });
  const liens = (doc.liens ?? []).map((l, i) => {
    const where = `${FILE} → lien n° ${i + 1}`;
    for (const end of [l?.de, l?.vers]) {
      if (typeof end !== 'string' || !seenSkills.has(end)) {
        throw new Error(`${where} : le lien vise « ${String(end)} », qui n’est pas un skill déclaré`);
      }
    }
    return { de: l.de, vers: l.vers, libelle: text(l.libelle, where, 'libelle') };
  });
  return { skills, liens };
}

/** La version du format. Un consommateur qui lit une autre valeur le dit, et n'affiche rien de faux. */
export const PROCESS_SHOW_SCHEMA_VERSION = 1;

const EtapeSchema = z.strictObject({
  id: z.string().describe('L’identifiant de l’étape, unique dans son skill.'),
  num: z.number().int().positive().describe('Le rang de l’étape dans son skill, à partir de 1.'),
  titre: z.string(),
  enClair: z.string().describe('Ce que fait l’étape, en une phrase simple.'),
  joueePar: z
    .array(z.string())
    .describe('Qui la réalise, vérifié contre le catalogue : `humain`, `agent:<id>`, `<skill>` ou `<skill>:<sous-commande>`.'),
  agents: z.array(z.string()).describe('Les agents parmi `joueePar`, par leur id.'),
  commandes: z.array(z.string()).describe('Les skills parmi `joueePar`, écrits comme on les lance (`/ezk-backlog groom`).'),
  regles: z.array(z.string()).describe('Les règles de l’étape. Toujours vide en v1 : aucune règle n’est encore rattachée à une étape.'),
  reglages: z
    .array(z.strictObject({ cle: z.string(), valeur: z.string() }))
    .describe('Les réglages du projet qui gouvernent l’étape : la clé de `ezk config show` et sa valeur pour le projet lu.'),
});

export const ProcessShowSchema = z.strictObject({
  schema_version: z.literal(PROCESS_SHOW_SCHEMA_VERSION),
  skills: z
    .array(
      z.strictObject({
        id: z.string(),
        nom: z.string(),
        enClair: z.string(),
        etapes: z.array(EtapeSchema).describe('Les étapes du skill, dans l’ordre.'),
      }),
    )
    .describe('Les skills de la méthode, dans l’ordre où un travail les traverse.'),
  liens: z
    .array(z.strictObject({ de: z.string(), vers: z.string(), libelle: z.string() }))
    .describe('Les liens entre skills : ce qui passe de l’un à l’autre.'),
});

export type ProcessShow = z.infer<typeof ProcessShowSchema>;

/** La valeur d'un réglage pour le projet lu ; la clé a déjà passé la validation. */
function reglageValue(cle: string, config: ConfigShow): string {
  const read = REGLAGES.get(cle);
  if (!read) throw new Error(`réglage inconnu « ${cle} » : la déclaration n’a pas été validée`);
  return read(config);
}

const asCommand = (ref: string): string => `/${ref.split(':').join(' ')}`;

/** Le contrat, pour une déclaration DÉJÀ validée et la config résolue du projet lu. */
export function buildProcessShow(doc: EtapesDoc, config: ConfigShow): ProcessShow {
  return {
    schema_version: PROCESS_SHOW_SCHEMA_VERSION,
    skills: doc.skills.map((s) => ({
      id: s.id,
      nom: s.nom,
      enClair: s.en_clair,
      etapes: s.etapes.map((e, i) => ({
        id: e.id,
        num: i + 1,
        titre: e.titre,
        enClair: e.en_clair,
        joueePar: [...e.joue_par],
        agents: e.joue_par.filter((r) => r.startsWith('agent:')).map((r) => r.slice('agent:'.length)),
        commandes: e.joue_par.filter((r) => r !== 'humain' && !r.startsWith('agent:')).map(asCommand),
        regles: [],
        reglages: (e.reglages ?? []).map((cle) => ({ cle, valeur: reglageValue(cle, config) })),
      })),
    })),
    liens: doc.liens.map((l) => ({ ...l })),
  };
}
