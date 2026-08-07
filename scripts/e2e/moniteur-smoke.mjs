#!/usr/bin/env node
/**
 * Smoke Playwright Pareto — Moniteur (fiche 0041).
 * Usage : node scripts/e2e/moniteur-smoke.mjs <baseUrl>
 * Exit 0 = vert ; 1 = régression ; 2 = skip/indispo.
 *
 * Dépendance navigateur : `npx -y -p playwright …` (comme dogfood-screenshot).
 */
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(15_000);

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 20_000 });

  // Parcours critique 1 — shell Moniteur
  const title = page.getByRole('heading', { level: 1, name: /cop1 · Moniteur/i });
  await title.waitFor({ state: 'visible' });

  const projets = page.getByRole('button', { name: 'Projets' });
  const activite = page.getByRole('button', { name: 'Activité' });
  await projets.waitFor({ state: 'visible' });
  await activite.waitFor({ state: 'visible' });

  // Parcours critique 2 — bascule d'onglets
  await activite.click();
  await page
    .getByRole('heading', { level: 2, name: /Activité|Runs|supervision/i })
    .waitFor({
      state: 'visible',
    })
    .catch(async () => {
      // Titre Activité peut varier — au minimum le nav marque l'onglet courant
      await page
        .locator('button.tab.active', { hasText: 'Activité' })
        .waitFor({ state: 'visible' });
    });

  await projets.click();
  await page.getByRole('heading', { level: 2, name: /Projets/i }).waitFor({ state: 'visible' });

  // Parcours critique 3 — API reachable via proxy (seed attendu en CI)
  const runsRes = await page.request.get(new URL('/api/supervision/runs', baseUrl).href);
  if (!runsRes.ok()) {
    throw new Error(`GET /api/supervision/runs → ${runsRes.status()}`);
  }
  const runs = await runsRes.json();
  if (!Array.isArray(runs)) {
    throw new Error('GET /api/supervision/runs : corps non-tableau');
  }
  if (runs.length < 1) {
    throw new Error(
      'GET /api/supervision/runs : aucun run — seed cobaye manquant (watch_roots / fixtures)',
    );
  }

  // Vue Activité : cartes live et/ou historique (fiche 0022)
  await activite.click();
  await page.getByRole('heading', { level: 2, name: /Runs supervisés/i }).waitFor({
    state: 'visible',
  });

  const countEl = page.locator('.mon__count-n');
  const historyItems = page.locator('.mon-history__item');
  await page.waitForTimeout(800);
  const countVisible = (await countEl.count()) > 0;
  const n = countVisible ? Number.parseInt((await countEl.first().textContent()) || '0', 10) : 0;
  const historyN = await historyItems.count();
  if (n < 1 && historyN < 1) {
    throw new Error(
      `Activité sans carte ni historique (count=${n}, history=${historyN}, apiRuns=${runs.length})`,
    );
  }

  console.log(
    `moniteur-smoke OK — ${baseUrl} (apiRuns=${runs.length}, ui=${n}, history=${historyN})`,
  );
} catch (err) {
  console.error(`moniteur-smoke KO: ${err?.message || err}`);
  process.exit(1);
} finally {
  await browser?.close().catch(() => {});
}
