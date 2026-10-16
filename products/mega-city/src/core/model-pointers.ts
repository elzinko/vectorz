/**
 * Cœur pur — les pointeurs modèle au bind (fiche 20261013132218451, 2e moitié).
 *
 * Quand on bind un projet, un agent dont la config modèles du projet DIFFÈRE du
 * défaut de la méthode ne reçoit pas le rôle recopié : son fichier d'agent devient
 * un POINTEUR MINCE qui porte seulement le modèle et l'effort, et charge le rôle
 * depuis sa source (l'agent installé globalement) — ADR-0048, « contenu mono-source,
 * modèle en surcouche ». Les agents au défaut gardent leur contenu complet.
 *
 * Pur : transforme un WritePlan en WritePlan, sans I/O. La config modèles est lue
 * en amont (côté I/O) et passée ici.
 */
import matter from 'gray-matter';
import type { WritePlan } from '../domain/plan.js';
import { ROLES, type ModelConfig, type Resolved, resolveAgent } from './model-config.js';

const AGENT_PATH = /^\.claude\/agents\/(ezk-[a-z-]+)\.md$/;

function isRole(id: string): boolean {
  return (ROLES as readonly string[]).includes(id);
}

/**
 * Le contenu d'un pointeur mince : on SURCOUCHE le frontmatter du fichier déployé
 * (on préserve `isolation`, `model_spare`, `name`…) en n'écrasant QUE `model` et
 * `effort`, et on remplace le corps par la référence à la source (rôle non recopié).
 */
export function agentPointerContent(id: string, resolved: Resolved, baseContent: string): string {
  const base = matter(baseContent).data as Record<string, unknown>;
  const frontmatter = {
    ...base,
    name: base.name ?? id,
    model: resolved.model,
    effort: resolved.effort,
  };
  const body =
    `Ce fichier ne règle que le **modèle** et l'**effort** de l'agent \`${id}\` pour ce projet.\n\n` +
    `Le rôle \`${id}\` n'est **pas recopié** ici : il vit à sa source (l'agent \`${id}\` installé ` +
    `globalement, \`~/.claude/agents/${id}.md\`). Lis-le pour le rôle ; ce pointeur ne fait que ` +
    `surcharger le modèle et l'effort (ADR-0048).\n`;
  return matter.stringify(body, frontmatter);
}

/**
 * Transforme le plan de bind d'un projet : chaque fichier d'agent dont la config
 * modèles du projet diffère du défaut devient un pointeur mince ; les autres sont
 * laissés tels quels. Pur. Sans config (ou config vide), rien ne change.
 */
export function applyModelPointers(plan: WritePlan, config: ModelConfig): WritePlan {
  const files = plan.files.map((file) => {
    const matched = AGENT_PATH.exec(file.path);
    if (!matched) return file;
    const id = matched[1];
    if (!isRole(id)) return file;
    let resolved: Resolved;
    try {
      resolved = resolveAgent(config, id);
    } catch {
      // Config invalide pour CE rôle (tier/effort fautif saisi à la main) : on garde
      // son rôle complet au lieu de faire tomber TOUS les pointeurs. Les autres agents
      // gardent le leur. Reste pur : le bind n'applique simplement pas de surcouche ici.
      return file;
    }
    const def = resolveAgent({}, id);
    // Au défaut (même modèle ET même effort) : on garde le rôle complet.
    if (resolved.model === def.model && resolved.effort === def.effort) return file;
    return { ...file, content: agentPointerContent(id, resolved, file.content) };
  });
  return { ...plan, files };
}
