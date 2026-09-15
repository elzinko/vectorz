/**
 * readField — lecture d'un champ scalaire du front-matter (frontière entrante, ADR-0003).
 *
 * Régression PR #221 : le champ `pr` de la plupart des fiches livrées vaut `"#NN"` (quoté).
 * L'ancienne lecture retirait le commentaire `#…` AVANT les guillemets, donc lisait ces
 * valeurs comme vides → colonne PR du board d'avancement vide pour ~232 fiches livrées.
 * On fige ici les deux régimes (valeur quotée littérale vs commentaire hors guillemets).
 */
import { describe, expect, it } from 'vitest';
import { frontMatter, readField } from '../fiches.js';

describe('readField — valeur quotée lue littéralement', () => {
  it('pr: "#29" → #29 (le # est la valeur, pas un commentaire) [bug PR #221]', () => {
    expect(readField('pr: "#29"', 'pr')).toBe('#29');
  });

  it('id: "0018" → 0018 (les zéros de tête sont préservés)', () => {
    expect(readField('id: "0018"', 'id')).toBe('0018');
  });

  it('un # littéral à l’intérieur des guillemets est préservé', () => {
    expect(readField('pr: "PR #29 (suite de #30)"', 'pr')).toBe('PR #29 (suite de #30)');
  });

  it('un guillemet interne échappé ne tronque pas la valeur [revue Codex #222]', () => {
    // Sans ancrage de fin, la regex non-gourmande couperait à `dis \` ; on garde tout
    // jusqu'au vrai guillemet fermant (le loader ne dé-échappe pas — pas de parseur YAML).
    expect(readField('title: "dis \\"go\\" maintenant"', 'title')).toBe('dis \\"go\\" maintenant');
  });

  it('valeur quotée sans # inchangée', () => {
    expect(readField('pr: "resolved-by 205+206"', 'pr')).toBe('resolved-by 205+206');
  });

  it('un commentaire APRÈS la valeur quotée est ignoré', () => {
    expect(readField('pr: "#29" # mergée le 2026-09-04', 'pr')).toBe('#29');
  });
});

describe('readField — valeur nue : le commentaire # reste retiré', () => {
  it('status: idea # notes → idea', () => {
    expect(readField('status: idea # idea | ready | shipped', 'status')).toBe('idea');
  });

  it('product: # à préciser → "" (# en tête = commentaire, valeur vide)', () => {
    expect(readField('product: # obligatoire dans ce monorepo', 'product')).toBe('');
  });

  it('evidence: none # raison → none', () => {
    expect(readField('evidence: none # pas de preuve visuelle', 'evidence')).toBe('none');
  });

  it('id: 0094 (nu, sans guillemets) → 0094', () => {
    expect(readField('id: 0094', 'id')).toBe('0094');
  });

  it('valeur nue sans # inchangée', () => {
    expect(readField('pr: local (squash-merge)', 'pr')).toBe('local (squash-merge)');
  });
});

describe('readField — bords', () => {
  it('champ absent → ""', () => {
    expect(readField('title: x\nstatus: idea', 'pr')).toBe('');
  });

  it('champ vide → ""', () => {
    expect(readField('pr:\ntype: feature', 'pr')).toBe('');
  });

  it('lit le bon champ au milieu du front-matter (ancrage ^ … $)', () => {
    const fm = 'id: "0180"\ntitle: "Foo"\npr: "#124"\nstatus: shipped';
    expect(readField(fm, 'pr')).toBe('#124');
    expect(readField(fm, 'title')).toBe('Foo');
    expect(readField(fm, 'status')).toBe('shipped');
  });

  it('un scalaire quoté mal formé (texte parasite) n’est pas nettoyé en silence [revue Codex #222]', () => {
    // `status: "idea" typo` ne doit PAS rendre `idea` : la faute reste visible (guillemets
    // compris) pour que le validateur la refuse, au lieu d'avaler le `typo`.
    expect(readField('status: "idea" typo', 'status')).toBe('"idea" typo');
    expect(readField('status: "idea" typo', 'status')).not.toBe('idea');
  });

  it('un commentaire COLLÉ au guillemet (sans blanc) n’est pas traité comme un commentaire [revue Codex #222]', () => {
    // Règle YAML : un `#` de commentaire exige un blanc devant. `"idea"#typo` est donc mal
    // formé → la faute reste visible ; alors que `"idea" # note` (avec blanc) rend `idea`.
    expect(readField('status: "idea"#typo', 'status')).not.toBe('idea');
    expect(readField('status: "idea" # note', 'status')).toBe('idea');
  });
});

describe('readField — champ milestone (ADR-0017 A16 : ordonnancement, remplace l’épic)', () => {
  it('milestone: ② → ② (jalon d’ordonnancement)', () => {
    expect(readField('milestone: ②', 'milestone')).toBe('②');
  });

  it('milestone absent → "" (champ optionnel, comme version)', () => {
    expect(readField('id: "0001"\nstatus: idea', 'milestone')).toBe('');
  });
});

describe('frontMatter — les champs se lisent en tête, pas dans le corps [revue Codex #237]', () => {
  const fiche = [
    '---',
    'id: "0001"',
    'status: idea',
    '---',
    '',
    '## Comment vérifier',
    'milestone: ② (exemple en prose, PAS un champ)',
  ].join('\n');

  it('extrait le bloc entre les deux ---', () => {
    expect(frontMatter(fiche)).toBe('id: "0001"\nstatus: idea');
  });

  it('un `milestone:` présent SEULEMENT dans le corps n’est pas lu depuis le front-matter', () => {
    expect(readField(frontMatter(fiche), 'milestone')).toBe('');
    // Sans le scope, readField capterait le corps — la régression que ce test fige :
    expect(readField(fiche, 'milestone')).toBe('② (exemple en prose, PAS un champ)');
  });

  it('repli sur le texte entier si pas de délimiteur de front-matter', () => {
    expect(frontMatter('pas de front-matter\nx: 1')).toBe('pas de front-matter\nx: 1');
  });
});
