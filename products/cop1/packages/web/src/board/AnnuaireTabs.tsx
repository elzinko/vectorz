/**
 * Les onglets de l'Annuaire de la méthode (fiche 20261128093846629) : compétences, agents, règles,
 * profils, commandes. Chaque onglet LIT ce que la méthode publie ; une colonne sans donnée dit
 * « non publié », jamais 0 ni un texte inventé.
 */
import { useState } from 'react';
import { InfoButton } from './Chrome.js';
import {
  EFFET_FILTERS,
  EFFET_LABEL,
  type EffetFilterId,
  type HelpCommand,
  type HelpData,
  NON_PUBLIE,
  agentRows,
  appliqueePar,
  categoriesDe,
  commandDomains,
  commandName,
  ecritTexte,
  filterCommands,
  filterRules,
  litSesReglesTexte,
  paquetsDe,
  profileRows,
  ruleCounts,
  skillRows,
  verifieePar,
} from './annuaireModel.js';
import { type LawData, titreClair } from './lawModel.js';

const RULES_PAGE = 20;
const COMMANDS_PAGE = 15;

const SOURCE_COMPETENCES =
  "Source : ezk help --json (skills[].description) et ezk law show --json (objets[] : litSesRegles, regles[]). Non publié : le détail d'une compétence.";
const SOURCE_AGENTS =
  'Source : ezk help --json (agents[].description) et ezk law show --json (objets[type = agent]). Non publié par la méthode : qui convoque l’agent.';
const SOURCE_REGLES =
  "Le catalogue de la méthode, pas la Loi du projet : la Loi ne montre que les règles qui s'appliquent à ce projet. Source : ezk law show --json.";
const SOURCE_PROFILS =
  'Un profil est l’ensemble skills + agents + paquets déployé sur un hôte. Source : ezk law show --json (objets[type = profile]). Non publié par la méthode : l’hôte cible, le contenu et le lien au projet.';
const SOURCE_COMMANDES =
  'Les commandes de terminal ezk <domaine> <verbe>. Source : ezk help --json (commandes[]). Non publié par la méthode : les scripts internes et qui cite chaque commande.';

const Tag = ({ children, kind = 'idea' }: { children: string; kind?: string }): JSX.Element => <span className={`tag ${kind}`}>{children}</span>;

/** Le pied de liste commun : « Afficher plus » et le compte affiché sur le compte total. */
function MoreFoot({ shown, total, onMore, noun }: { shown: number; total: number; onMore: () => void; noun: string }): JSX.Element {
  return (
    <div className="sessions-foot">
      <span />
      {total > shown ? (
        <button type="button" className="chip" onClick={onMore}>
          Afficher plus
        </button>
      ) : (
        <span />
      )}
      <span className="meta">{total > shown ? `${shown} ${noun} affichées sur ${total}` : `${total} ${noun}`}</span>
    </div>
  );
}

export function SkillsTab({ help, law }: { help: HelpData; law: LawData | null }): JSX.Element {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = skillRows(help, law).filter((r) => q === '' || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  return (
    <section className="card" aria-label="Compétences">
      <h3>
        Compétences <span className="law-count">{help.skills.length} commandes de chat</span>
        <InfoButton text={SOURCE_COMPETENCES} />
      </h3>
      <div className="law-filters">
        <div className="search">
          <input type="search" aria-label="Rechercher une compétence" placeholder="Rechercher une compétence…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <span>
          {rows.length} affichées sur {help.skills.length}
        </span>
      </div>
      <div className="tblwrap">
        <table className="tbl" aria-label="Compétences">
          <thead>
            <tr>
              <th>Compétence (dans Claude Code : /commande)</th>
              <th>Ce qu'elle fait</th>
              <th>Lit ses règles au démarrage</th>
              <th>Règles appliquées</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="cmd">/{r.id}</span> {r.aussiAgent && <Tag>aussi un agent</Tag>}
                </td>
                <td><span className="clamp2" title={r.description}>{r.description}</span></td>
                <td>{r.litSesRegles === null ? NON_PUBLIE : r.litSesRegles ? 'oui' : 'non'}</td>
                <td>{r.nbRegles === null ? NON_PUBLIE : r.nbRegles || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AgentsTab({ help, law }: { help: HelpData; law: LawData | null }): JSX.Element {
  const rows = agentRows(help, law);
  return (
    <section className="card" aria-label="Agents">
      <h3>
        Agents <span className="law-count">{rows.length}</span>
        <InfoButton text={SOURCE_AGENTS} />
      </h3>
      <div className="tblwrap">
        <table className="tbl" aria-label="Agents">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Rôle</th>
              <th>Lit ses règles</th>
              <th>Convoqué par</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="cmd">{r.id}</span> {r.aussiSkill && <Tag>aussi un skill</Tag>}
                </td>
                <td><span className="clamp2" title={r.description}>{r.description}</span></td>
                <td>{litSesReglesTexte(r.litSesRegles, r.nbRegles)}</td>
                <td>{NON_PUBLIE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RulesTab({ law, projectName, onOpenLaw }: { law: LawData; projectName: string; onOpenLaw: () => void }): JSX.Element {
  const [effet, setEffet] = useState<EffetFilterId | null>(null);
  const [paquet, setPaquet] = useState('');
  const [categorie, setCategorie] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(RULES_PAGE);
  const counts = ruleCounts(law);
  const rules = filterRules(law.regles, { effet, paquet, categorie, query });
  const shown = rules.slice(0, limit);
  const reset = (apply: () => void): void => {
    apply();
    setLimit(RULES_PAGE);
  };
  return (
    <section className="card" aria-label="Règles">
      <h3>
        Toutes les règles de la méthode
        <span className="law-count" aria-label="Comptes des règles">
          {counts.total} au catalogue ·{' '}
          <button type="button" className="doclink linkbtn" onClick={onOpenLaw}>
            {counts.appliquees} s'appliquent à {projectName} → sa page Loi
          </button>{' '}
          · {counts.nullePart} ne s'appliquent nulle part
          {counts.citees > 0 && ` · ${counts.citees} citées sans être installées`}
        </span>
        <InfoButton text={SOURCE_REGLES} />
      </h3>
      <div className="law-filters">
        <span>Filtres :</span>
        <button type="button" className={effet === null ? 'tgl on' : 'tgl'} aria-pressed={effet === null} onClick={() => reset(() => setEffet(null))}>
          toutes · {counts.total}
        </button>
        {EFFET_FILTERS.map((f) => {
          const on = effet === f.id;
          return (
            <button key={f.id} type="button" className={on ? 'tgl on' : 'tgl'} aria-pressed={on} onClick={() => reset(() => setEffet(on ? null : f.id))}>
              {f.label} · {law.comptes[f.portee]}
            </button>
          );
        })}
        <span>·</span>
        <label>
          Paquet :{' '}
          <select aria-label="Paquet" value={paquet} onChange={(e) => reset(() => setPaquet(e.target.value))}>
            <option value="">tous</option>
            {paquetsDe(law.regles).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Catégorie :{' '}
          <select aria-label="Catégorie" value={categorie} onChange={(e) => reset(() => setCategorie(e.target.value))}>
            <option value="">toutes</option>
            {categoriesDe(law.regles).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="search">
          <input type="search" aria-label="Rechercher une règle" placeholder="Rechercher une règle…" value={query} onChange={(e) => reset(() => setQuery(e.target.value))} />
        </div>
      </div>
      <div className="tblwrap">
        <table className="tbl law-rules" aria-label="Règles de la méthode">
          <thead>
            <tr>
              <th>Règle</th>
              <th>Niveau</th>
              <th>Catégorie</th>
              <th>Effet aujourd'hui</th>
              <th>Paquets</th>
              <th>Appliquée par</th>
              <th>Vérifiée par</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const par = appliqueePar(r);
              return (
                <tr key={r.id}>
                  <td title={r.id}>{titreClair(r)}</td>
                  <td>
                    <span className={r.niveau === 'MUST' ? 'tag must' : 'tag idea'}>{r.niveau}</span>
                  </td>
                  <td>{r.categorie}</td>
                  <td>{EFFET_LABEL[r.portee]}</td>
                  <td>
                    {r.bundles.length === 0
                      ? '—'
                      : r.bundles.map((b) => (
                          <span key={b} className="tag obj">
                            {b}
                          </span>
                        ))}
                  </td>
                  <td title={par.join(', ') || undefined}>{par.length || '—'}</td>
                  <td>{verifieePar(r).join(', ') || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MoreFoot shown={shown.length} total={rules.length} onMore={() => setLimit(limit + RULES_PAGE)} noun="règles" />
    </section>
  );
}

export function ProfilesTab({ law }: { law: LawData }): JSX.Element {
  const rows = profileRows(law);
  return (
    <section className="card" aria-label="Profils">
      <h3>
        Profils <span className="law-count">{rows.length}</span>
        <InfoButton text={SOURCE_PROFILS} />
      </h3>
      <div className="tblwrap">
        <table className="tbl" aria-label="Profils">
          <thead>
            <tr>
              <th>Profil</th>
              <th>Hôte cible</th>
              <th>Règles</th>
              <th>Paquets · agents · skills</th>
              <th>Lié à</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.nom}>
                <td>
                  <span className="tag obj">{r.nom}</span>
                </td>
                <td>{NON_PUBLIE}</td>
                <td>{r.nbRegles}</td>
                <td>{NON_PUBLIE}</td>
                <td>{NON_PUBLIE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CommandsTab({ help, onOpen }: { help: HelpData; onOpen: (c: HelpCommand) => void }): JSX.Element {
  const [domaine, setDomaine] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(COMMANDS_PAGE);
  const cmds = filterCommands(help.commandes, domaine, query);
  const shown = cmds.slice(0, limit);
  return (
    <section className="card" aria-label="Commandes">
      <h3>
        Commandes <span className="law-count">un clic sur une commande ouvre son détail</span>
        <InfoButton text={SOURCE_COMMANDES} />
      </h3>
      <div className="law-filters">
        <label>
          Domaine :{' '}
          <select
            aria-label="Domaine"
            value={domaine}
            onChange={(e) => {
              setDomaine(e.target.value);
              setLimit(COMMANDS_PAGE);
            }}
          >
            <option value="">tous</option>
            {commandDomains(help.commandes).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="search">
          <input
            type="search"
            aria-label="Rechercher une commande"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(COMMANDS_PAGE);
            }}
          />
        </div>
      </div>
      <div className="tblwrap">
        <table className="tbl" aria-label="Commandes de la méthode">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Ce qu'elle fait</th>
              <th>Écrit le projet</th>
              <th>Script</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={`${commandName(c)} ${c.script}`}>
                <td>
                  <button type="button" className="doclink linkbtn" title="Ouvre le détail de la commande" onClick={() => onOpen(c)}>
                    {commandName(c)}
                  </button>
                </td>
                <td>{c.enClair}</td>
                <td>{ecritTexte(c)}</td>
                <td className="faint">{c.script}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MoreFoot shown={shown.length} total={cmds.length} onMore={() => setLimit(limit + COMMANDS_PAGE)} noun="commandes" />
    </section>
  );
}

export function GlossaryTab(): JSX.Element {
  return (
    <section className="card" aria-label="Glossaire">
      <h3>
        Glossaire <InfoButton text="La méthode ne publie pas encore son glossaire. À publier : le champ enClair de chaque objet." />
      </h3>
      <div className="row">
        <span className="meta" role="status">
          Glossaire : {NON_PUBLIE} par la méthode.
        </span>
      </div>
    </section>
  );
}
