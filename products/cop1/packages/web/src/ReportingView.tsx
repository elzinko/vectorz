import type { ReviewCard } from './reviewPack.js';

/** Libellé + tonalité (classe CSS `badge--*`) par statut de review. */
const STATUS_LOOK: Record<string, { label: string; tone: string }> = {
  'ready-for-review': { label: 'À revoir', tone: 'wait' },
  'changes-requested': { label: 'Changements demandés', tone: 'stop' },
  approved: { label: 'Approuvé', tone: 'done' },
};

/** Sections mises en avant façon PR (fiche 0184 AC2 : résumé + rendus + à-tester). */
const CARD_SECTIONS = ['Résumé', 'Rendus', 'Matrice de validation', 'À tester'];

interface ReportingViewProps {
  /** Packs lus du dépôt (injectés en test ; câblés depuis `reviewPacks` dans App). */
  packs: ReviewCard[];
}

/**
 * Vue Reporting (fiche 0184, lot 1) — restitue ce qu'un run a **livré**, à partir des
 * packs `REVIEW.md` markdown-first (SoT, fiche 0183). STRICTEMENT lecture seule :
 * aucune écriture d'artefact, aucune nouvelle collecte. Distincte du Moniteur : ici
 * « qu'a livré ce run ? », pas « est-ce vivant maintenant ? ».
 */
export function ReportingView({ packs }: ReportingViewProps) {
  return (
    <div className="rep">
      <div className="rep__head">
        <h2 className="rep__title">Reporting — ce que le run a livré</h2>
        <p className="rep__sub">
          Lecture seule des packs de review <code>REVIEW.md</code> (contrat method-review, fiche
          0183). Distinct du Moniteur : « qu'a livré ce run ? », pas « est-ce vivant ? ».
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="rep__empty">
          <p className="rep__empty-title">Aucun pack de review trouvé</p>
          <p className="rep__empty-hint">
            Un sprint qui produit un <code>features/reviews/&lt;id&gt;/REVIEW.md</code> apparaîtra
            ici en carte façon PR.
          </p>
        </div>
      ) : (
        packs.map((pack) => <ReviewPackCard key={pack.path || pack.fiche} pack={pack} />)
      )}
    </div>
  );
}

function ReviewPackCard({ pack }: { pack: ReviewCard }) {
  const look = STATUS_LOOK[pack.status] ?? {
    label: pack.status || 'statut inconnu',
    tone: 'idle',
  };
  const shown = CARD_SECTIONS.filter((heading) => pack.sections[heading]);

  return (
    <div className={`rep-card rep-card--${look.tone}`}>
      <div className="rep-card__head">
        <span className="rep-card__fiche">Fiche {pack.fiche || '—'}</span>
        <span className={`badge badge--${look.tone}`}>{look.label}</span>
      </div>

      <div className="rep-card__meta">
        {pack.branch && (
          <span>
            <i className="rep-card__k">branche</i> <code>{pack.branch}</code>
          </span>
        )}
        {pack.product && (
          <span>
            <i className="rep-card__k">produit</i> {pack.product}
          </span>
        )}
        {pack.method && (
          <span>
            <i className="rep-card__k">méthode</i> {pack.method}
          </span>
        )}
        {pack.created && (
          <span>
            <i className="rep-card__k">créé</i> {pack.created}
          </span>
        )}
      </div>

      {shown.map((heading) => (
        <div key={heading} className="rep-card__section">
          <h4 className="rep-card__section-title">{heading}</h4>
          <p className="rep-card__section-body">{pack.sections[heading]}</p>
        </div>
      ))}
    </div>
  );
}
