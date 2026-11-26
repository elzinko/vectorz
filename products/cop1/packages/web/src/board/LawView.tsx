/**
 * Board unifié cop1 — vue Loi (fiches 20260826222044335 et 20261126170000109).
 *
 * « Ce qui s'applique ici » : quatre compteurs, les règles en vigueur sur le projet avec leurs filtres,
 * puis les paquets et leur état. La page LIT : aucun geste d'écriture, une règle change par une rétro.
 * La vue n'invente rien : sans la méthode elle dit pourquoi, un champ non publié se dit
 * « non publié », jamais 0.
 */
import { useEffect, useState } from 'react';
import { InfoButton, PageHead } from './Chrome.js';
import {
  type EnVigueurRow,
  type LawData,
  type Origine,
  ORIGINE_LABEL,
  appliqueurs,
  enVigueur,
  loiProjetInstallee,
  paquets,
  reglePar,
  shortName,
  titreClair,
} from './lawModel.js';
import type { BoardProject } from './types.js';

type LawState = { kind: 'loading' } | { kind: 'unavailable'; reason: string } | { kind: 'ok'; law: LawData };

/** Délai avant de redemander la loi quand le daemon la lit encore. */
const LOADING_RETRY_MS = 2000;
const ORIGINES: Origine[] = ['installee', 'demarrage', 'projet'];
const NIVEAUX = ['MUST', 'SHOULD'] as const;
const NON_PUBLIE = 'non publié';

const LOI_INFO =
  "Les règles de la méthode. La loi globale du poste est lue dans toutes les sessions. Cette page ne montre que ce qui s'applique à ce projet : la loi installée dans son dépôt, les règles que ses skills et agents lisent au démarrage, et ce que le projet ajoute. Rien ne se règle ici : une règle change par une rétro.";
const SOURCE_INFO = 'Source : ezk law show --json. Les titres anglais de la méthode sont affichés tels que publiés.';
const PAQUETS_INFO =
  "Un paquet est un groupe de règles. Son état se déduit des règles : installé par la loi, lu au démarrage par des skills et agents, en partie, ou disponible (aucune règle en vigueur).";
const PROFIL_INFO = "Ni la commande qui installe la loi ni le fichier compilé n'enregistrent le profil utilisé : à publier par la méthode.";

const dOu = (row: EnVigueurRow): string => {
  if (row.origine === 'installee') return 'installée';
  if (row.origine === 'projet') return 'propre au projet';
  const lecteurs = appliqueurs(row.rule);
  return lecteurs.length ? `lue au démarrage par ${lecteurs.join(', ')}` : 'lue au démarrage';
};

/** Un compteur de l'en-tête : « — » quand la loi ne publie aucune règle, jamais un faux zéro. */
function Cell({ value, label, title }: { value: number | null; label: string; title?: string }): JSX.Element {
  const shown = value === null ? '—' : String(value);
  return (
    <div className="mcell" title={title} aria-label={`${label} : ${shown}`}>
      <div className="mv">{shown}</div>
      <div className="mk">{label}</div>
    </div>
  );
}

export function LawView({ project }: { project: BoardProject }): JSX.Element {
  const [state, setState] = useState<LawState>({ kind: 'loading' });
  const [origine, setOrigine] = useState<Origine | null>(null);
  const [paquet, setPaquet] = useState('');
  const [niveau, setNiveau] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (): void => {
      fetch(`/api/law/${encodeURIComponent(project.name)}`)
        .then(async (res) => {
          const body = (await res.json()) as { state?: string; law?: LawData; reason?: string; error?: string };
          if (!alive) return;
          if (body.state === 'ok' && body.law) setState({ kind: 'ok', law: body.law });
          else if (body.state === 'loading') {
            setState({ kind: 'loading' });
            timer = setTimeout(load, LOADING_RETRY_MS);
          } else setState({ kind: 'unavailable', reason: body.reason ?? body.error ?? `réponse ${res.status}` });
        })
        .catch(() => {
          if (alive) setState({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
        });
    };
    setState({ kind: 'loading' });
    setOpened(null);
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [project.name]);

  const law = state.kind === 'ok' ? state.law : null;
  if (!law) {
    return (
      <>
        <PageHead title="Loi" info={LOI_INFO} />
        <section className="card">
          <div className="row">
            <span className="ttl" role="status">
              {state.kind === 'unavailable' ? `loi indisponible : ${state.reason}` : 'loi en cours de lecture'}
            </span>
          </div>
        </section>
      </>
    );
  }

  const inForce = enVigueur(law);
  const published = law.regles.length > 0;
  const count = (o: Origine): number => inForce.filter((r) => r.origine === o).length;
  const packs = paquets(law);
  const q = query.trim().toLowerCase();
  const shown = inForce.filter(
    ({ rule, origine: o }) =>
      (origine === null || o === origine) &&
      (paquet === '' || rule.bundles.includes(paquet)) &&
      (niveau === null || rule.niveau === niveau) &&
      (q === '' || titreClair(rule).toLowerCase().includes(q) || rule.id.toLowerCase().includes(q)),
  );
  const packOptions = [...new Set(inForce.flatMap((r) => r.rule.bundles))].sort();
  const num = (n: number): number | null => (published ? n : null);
  const filterBtn = (on: boolean, label: string, onClick: () => void, key?: string): JSX.Element => (
    <button type="button" key={key ?? label} className={on ? 'tgl on' : 'tgl'} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <>
      <PageHead title="Loi" info={LOI_INFO} />

      <section className="card" aria-label="Ce qui s'applique ici">
        <h3>
          Ce qui s'applique ici <InfoButton text={SOURCE_INFO} />
        </h3>
        <div className="mgrid">
          <Cell value={num(inForce.length)} label="règles en vigueur" />
          <Cell value={num(count('installee'))} label="installées" title={`Règles installées par le profil lié, lues partout sur ce poste. Loi du projet : ${loiProjetInstallee(law)}`} />
          <Cell value={num(count('projet'))} label="propres au projet" />
          <Cell value={num(packs.filter((p) => p.enVigueur > 0).length)} label="paquets en vigueur" title="Paquets dont au moins une règle s'applique ici" />
        </div>
        <div className="law-facts">
          <span>
            <b>Contrat du projet</b> <span className="tag idea">{NON_PUBLIE}</span>
          </span>
          <span>loi du projet : {loiProjetInstallee(law)}</span>
          <span>
            <b>Déployée par</b> profil non publié <InfoButton text={PROFIL_INFO} />
          </span>
        </div>
      </section>

      <section className="card" aria-label="Règles en vigueur sur ce projet">
        <h3>
          Règles — en vigueur sur ce projet
          <span className="law-count">
            {shown.length === inForce.length ? `${inForce.length} ici` : `${shown.length} sur ${inForce.length} ici`} · {law.regles.length} au catalogue
          </span>
          <InfoButton text={SOURCE_INFO} />
        </h3>
        <div className="law-filters">
          <span>D'où :</span>
          {filterBtn(origine === null, `toutes · ${inForce.length}`, () => setOrigine(null))}
          {ORIGINES.map((o) => filterBtn(origine === o, `${ORIGINE_LABEL[o]} · ${count(o)}`, () => setOrigine(origine === o ? null : o), o))}
          <span>·</span>
          <label>
            Paquet :{' '}
            <select aria-label="Paquet" value={paquet} onChange={(e) => setPaquet(e.target.value)}>
              <option value="">tous</option>
              {packOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <span>·</span>
          <span>Niveau :</span>
          {filterBtn(niveau === null, 'tous', () => setNiveau(null), 'niveau-tous')}
          {NIVEAUX.map((n) => filterBtn(niveau === n, n, () => setNiveau(niveau === n ? null : n)))}
          <div className="search">
            <input type="search" aria-label="Rechercher une règle" placeholder="Rechercher une règle…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="tblwrap">
          <table className="tbl law-rules" aria-label="Règles en vigueur">
            <thead>
              <tr>
                <th>Règle</th>
                <th>Niveau</th>
                <th>Réglé par</th>
                <th>D'où</th>
                <th>Paquet</th>
                <th>Garantie</th>
                <th>Vérifiée par</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.rule.id}>
                  <td title={row.rule.id}>{titreClair(row.rule)}</td>
                  <td>
                    <span className={row.rule.niveau === 'MUST' ? 'tag must' : 'tag idea'}>{row.rule.niveau}</span>
                  </td>
                  <td title={row.origine === 'installee' ? 'La loi installée vient du profil lié au projet ; la méthode ne publie pas encore son nom' : undefined}>
                    {reglePar(row.origine)}
                  </td>
                  <td className="faint">{dOu(row)}</td>
                  <td>
                    {row.rule.bundles.map((b) => (
                      <span key={b} className="tag obj">
                        {b}
                      </span>
                    ))}
                  </td>
                  <td title="Règle de la méthode : elle se change par une rétro, pas ici">{row.origine === 'projet' ? NON_PUBLIE : 'méthode'}</td>
                  <td>{row.rule.verifieePar.map(shortName).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint law-foot">Une règle de la méthode ne se modifie pas ici : elle change par une rétro.</p>
      </section>

      <section className="card" aria-label="Paquets de la loi">
        <h3>
          Paquets — leur état sur ce projet <span className="law-count">{packs.length}</span>
          <InfoButton text={PAQUETS_INFO} />
        </h3>
        <div className="tblwrap">
          <table className="tbl" aria-label="Paquets">
            <thead>
              <tr>
                <th>Paquet</th>
                <th>Règles</th>
                <th>Réglé par</th>
                <th>État ici</th>
                <th aria-label="Détail" />
              </tr>
            </thead>
            <tbody>
              {packs.flatMap((p) => {
                const isOpen = opened === p.nom;
                const row = (
                  <tr key={p.nom}>
                    <td>
                      <span className="tag obj">{p.nom}</span>
                    </td>
                    <td>{p.total}</td>
                    <td>{p.par}</td>
                    <td>
                      <span className={p.etat.kind === 'installe' ? 'tag ok' : p.etat.kind === 'disponible' ? 'tag idea' : 'tag warn'}>{p.etat.texte}</span>
                    </td>
                    <td className="law-act">
                      {p.total > 0 && (
                        <button type="button" className="btn ghost sm" aria-expanded={isOpen} onClick={() => setOpened(isOpen ? null : p.nom)}>
                          {isOpen ? 'Fermer' : 'Ouvrir'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
                if (!isOpen) return [row];
                const detail = (
                  <tr key={`${p.nom}-detail`} className="law-detail">
                    <td colSpan={5}>
                      <table className="tbl" aria-label={`Règles du paquet ${p.nom}`}>
                        <tbody>
                          {p.regles.map((r) => (
                            <tr key={r.id}>
                              <td title={r.id}>{titreClair(r)}</td>
                              <td>{r.niveau}</td>
                              <td className="faint">{enVigueur({ ...law, regles: [r] }).length ? 'en vigueur' : 'sans effet ici'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
                return [row, detail];
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
