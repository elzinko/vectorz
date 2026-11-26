/**
 * Board unifié cop1 — vue Loi (fiche 20260826222044335).
 *
 * Les règles de la méthode, telles que `ezk law show --json` les publie : cinq comptes en tête, les
 * skills et agents à gauche, les règles à droite. Sélectionner un côté met l'autre en avant et trace
 * un trait vers chaque lien ; les traits ne sont dessinés que pour la sélection. La vue ne recompte
 * rien : sans la méthode, elle dit pourquoi, jamais des compteurs à zéro.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type LawData, PORTEES, PORTEE_LABEL, type Portee, porteeText, shortName } from './lawModel.js';
import type { BoardProject } from './types.js';
import { PageHead } from './Chrome.js';

type LawState = { kind: 'loading' } | { kind: 'unavailable'; reason: string } | { kind: 'ok'; law: LawData };
type Selection = { kind: 'objet' | 'regle'; id: string } | null;
interface Line {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Délai avant de redemander la loi quand le daemon la lit encore. */
const LOADING_RETRY_MS = 2000;

export function LawView({ project }: { project: BoardProject }): JSX.Element {
  const [state, setState] = useState<LawState>({ kind: 'loading' });
  const [filter, setFilter] = useState<Portee | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const objEls = useRef(new Map<string, HTMLElement>());
  const ruleEls = useRef(new Map<string, HTMLElement>());

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
    setSelection(null);
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [project.name]);

  const law = state.kind === 'ok' ? state.law : null;
  const shownRules = law ? law.regles.filter((r) => filter === null || r.portee === filter) : [];
  const shownIds = new Set(shownRules.map((r) => r.id));
  // Les liens de la sélection : [objet, règle], seulement vers ce qui est affiché.
  const links: Array<[string, string]> = !law || !selection
    ? []
    : selection.kind === 'objet'
      ? (law.objets.find((o) => o.id === selection.id)?.regles ?? []).filter((id) => shownIds.has(id)).map((id) => [selection.id, id])
      : (law.regles.find((r) => r.id === selection.id)?.appliqueePar ?? [])
          .filter((o) => law.objets.some((x) => x.id === o))
          .map((o) => [o, selection.id]);
  const linkedObjs = new Set(links.map(([o]) => o));
  const linkedRules = new Set(links.map(([, r]) => r));
  const linksKey = links.map(([o, r]) => `${o}>${r}`).join('|');

  // Les traits se mesurent après le rendu : chaque lien va du bord droit d'un objet au bord gauche d'une règle.
  useLayoutEffect(() => {
    const container = box.current;
    if (!container || linksKey === '') {
      setLines([]);
      return;
    }
    const c = container.getBoundingClientRect();
    const next: Line[] = [];
    for (const pair of linksKey.split('|')) {
      const [o, r] = pair.split('>') as [string, string];
      const a = objEls.current.get(o)?.getBoundingClientRect();
      const b = ruleEls.current.get(r)?.getBoundingClientRect();
      if (!a || !b) continue;
      next.push({
        key: pair,
        x1: a.right - c.left,
        y1: a.top + a.height / 2 - c.top,
        x2: b.left - c.left,
        y2: b.top + b.height / 2 - c.top,
      });
    }
    setLines(next);
  }, [linksKey]);

  const selectedRule = law && selection?.kind === 'regle' ? law.regles.find((r) => r.id === selection.id) : undefined;
  const toggle = (kind: 'objet' | 'regle', id: string): void =>
    setSelection((s) => (s?.kind === kind && s.id === id ? null : { kind, id }));

  return (
    <>
      <PageHead title="Loi" info="Les règles de la méthode, et celles que personne ne lit." />
      {!law ? (
        <section className="card">
          <div className="row">
            <span className="ttl" role="status">
              {state.kind === 'unavailable' ? `loi indisponible : ${state.reason}` : 'loi en cours de lecture'}
            </span>
          </div>
        </section>
      ) : (
        <>
          <section className="lawcounts">
            {PORTEES.map((p) => (
              <button
                type="button"
                key={p}
                className={filter === p ? 'lawcount on' : 'lawcount'}
                aria-pressed={filter === p}
                aria-label={`${PORTEE_LABEL[p]} : ${law.comptes[p]}`}
                onClick={() => setFilter((f) => (f === p ? null : p))}
              >
                <b>{law.comptes[p]}</b> {PORTEE_LABEL[p]}
              </button>
            ))}
          </section>
          <div className="lawcols" ref={box}>
            <section className="card">
              <h3>Compétences et agents — {law.objets.length}</h3>
              {law.objets.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  ref={(el) => {
                    if (el) objEls.current.set(o.id, el);
                    else objEls.current.delete(o.id);
                  }}
                  className={`lawitem${selection?.kind === 'objet' && selection.id === o.id ? ' on' : ''}${linkedObjs.has(o.id) ? ' hl' : ''}`}
                  aria-pressed={selection?.kind === 'objet' && selection.id === o.id}
                  onClick={() => toggle('objet', o.id)}
                >
                  <span className="ttl">{shortName(o.id)}</span>
                  <span className="meta">{o.type}</span>
                </button>
              ))}
            </section>
            <section className="card">
              <h3>
                {/* Le total vient de la liste rendue, jamais d'un compte publié à côté : « X / Y » ne ment pas. */}
                Règles — {filter === null ? law.regles.length : `${shownRules.length} / ${law.regles.length}`}
              </h3>
              {shownRules.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  ref={(el) => {
                    if (el) ruleEls.current.set(r.id, el);
                    else ruleEls.current.delete(r.id);
                  }}
                  className={`lawitem${selection?.kind === 'regle' && selection.id === r.id ? ' on' : ''}${linkedRules.has(r.id) ? ' hl' : ''}`}
                  aria-pressed={selection?.kind === 'regle' && selection.id === r.id}
                  onClick={() => toggle('regle', r.id)}
                >
                  <span className="ttl">{r.id}</span>
                  <span className="meta">{r.niveau}</span>
                </button>
              ))}
            </section>
            <svg className="lawlinks" aria-hidden="true" data-links={lines.length}>
              {lines.map((l) => (
                <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </svg>
          </div>
          {selectedRule && (
            <section className="card lawdetail" aria-label={`détail de ${selectedRule.id}`}>
              <h3>{selectedRule.titre}</h3>
              <dl>
                <dt>Niveau</dt>
                <dd>{selectedRule.niveau}</dd>
                <dt>Portée</dt>
                <dd>{porteeText(selectedRule)}</dd>
                <dt>Bundles</dt>
                <dd>{selectedRule.bundles.join(', ') || 'aucun'}</dd>
                <dt>Profils</dt>
                <dd>{selectedRule.profils.join(', ') || 'aucun'}</dd>
                <dt>Appliquée par</dt>
                <dd>{selectedRule.appliqueePar.map(shortName).join(', ') || 'personne'}</dd>
                <dt>Vérifiée par</dt>
                <dd>{selectedRule.verifieePar.map(shortName).join(', ') || 'personne'}</dd>
                <dt>Fichier</dt>
                <dd>
                  <code>{selectedRule.fichier}</code>
                </dd>
              </dl>
            </section>
          )}
        </>
      )}
    </>
  );
}
