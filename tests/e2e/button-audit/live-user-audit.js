/* eslint-disable no-console */
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

const { chromium } = require('@playwright/test');

const BASE_URL = process.env.LIVE_AUDIT_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.LIVE_AUDIT_EMAIL;
const PASSWORD = process.env.LIVE_AUDIT_PASSWORD;

const ROUTES = [
  '/dashboard',
  '/dashboard/notificaciones',
  '/dashboard/logistica',
  '/dashboard/logistica/resumen-general',
  '/dashboard/ubicaciones',
  '/dashboard/tesoreria',
  '/dashboard/tesoreria/saldos',
  '/dashboard/tesoreria/saldos/vinculados',
  '/dashboard/tesoreria/recepciones',
  '/dashboard/perfil',
  '/dashboard/configuracion',
  '/dashboard/operaciones/nueva',
  '/dashboard/operaciones/transfer-pesos',
];

const ROUTE_TIMEOUT_MS = Number(process.env.LIVE_AUDIT_ROUTE_TIMEOUT_MS || 90000);

const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toSameOriginRoute = (absoluteUrl) => {
  try {
    const base = new URL(BASE_URL);
    const parsed = new URL(absoluteUrl);
    if (parsed.origin !== base.origin) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
};

const isVisible = async (locator) => {
  try {
    return await locator.isVisible({ timeout: 0 });
  } catch {
    return false;
  }
};

const clickIfVisible = async (locator) => {
  if (!(await isVisible(locator))) {
    return false;
  }
  await locator.click({ timeout: 8000 }).catch(async () => {
    await locator.click({ timeout: 8000, force: true });
  });
  return true;
};

const collectAuthOrLoadErrors = async (page) => {
  const bodyText = normalizeText(await page.locator('body').innerText().catch(() => ''));
  const findings = [];

  if (bodyText.includes('Authentication required')) {
    findings.push('authentication_required');
  }
  if (bodyText.includes('No pudimos cargar')) {
    findings.push('load_failed_banner');
  }
  if (bodyText.includes('Reintentar') && bodyText.includes('No pudimos')) {
    findings.push('retry_visible');
  }
  if (bodyText.includes('Iniciar sesión') && page.url().includes('/login')) {
    findings.push('redirected_to_login');
  }

  return findings;
};

const setupPageInstrumentation = (page) => {
  const result = {
    pageErrors: [],
    consoleErrors: [],
    requestFailures: [],
    apiHttpErrors: [],
  };

  const onPageError = (error) => {
    result.pageErrors.push(normalizeText(error?.message || String(error)));
  };

  const onConsole = (msg) => {
    if (msg.type() !== 'error') {
      return;
    }
    const text = normalizeText(msg.text());
    // Keep GSI errors but tag them so they don't hide real app issues.
    const isGsi =
      text.includes('[GSI_LOGGER]') ||
      text.toLowerCase().includes('google') ||
      text.toLowerCase().includes('gsi');

    const isExternalInfra =
      text.toLowerCase().includes('openstreetmap') ||
      text.toLowerCase().includes('tile.') ||
      text.toLowerCase().includes('unpkg.com') ||
      text.toLowerCase().includes('leaflet');

    result.consoleErrors.push({ text, tag: isGsi ? 'gsi' : isExternalInfra ? 'external' : 'app' });
  };

  const onRequestFailed = (request) => {
    const failure = request.failure();
    const url = request.url();
    const errorText = normalizeText(failure?.errorText || '');
    const tag = url.startsWith(BASE_URL) ? 'internal' : 'external';

    result.requestFailures.push({
      url,
      method: request.method(),
      errorText,
      tag,
    });
  };

  const onResponse = (response) => {
    const url = response.url();
    if (!url.startsWith(BASE_URL) || !url.includes('/api/')) {
      return;
    }
    const status = response.status();
    if (status < 400) {
      return;
    }
    result.apiHttpErrors.push({
      url,
      status,
      statusText: normalizeText(response.statusText()),
    });
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  const dispose = () => {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('requestfailed', onRequestFailed);
    page.off('response', onResponse);
  };

  return { result, dispose };
};

const login = async (page) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await page.locator('input#email').fill(EMAIL);
  await page.locator('input#password').fill(PASSWORD);
  await page.locator('button#login-button').click();

  // Login can redirect to dashboard or stay with error.
  await page.waitForURL(/\/dashboard/, { timeout: ROUTE_TIMEOUT_MS }).catch(() => undefined);
  if (page.url().includes('/login')) {
    const err = normalizeText(await page.locator('body').innerText().catch(() => ''));
    throw new Error(`Login failed (still on /login). Visible text: ${err.slice(0, 240)}`);
  }
};

const gotoForDiscovery = async (page, route) => {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: ROUTE_TIMEOUT_MS }).catch(() => undefined);
};

const discoverOperationsDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard');

  const container = page.locator('#recent-operations');
  await container.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);
  const viewDetailButton = container.getByRole('button', { name: /Ver detalle|Ver$/i }).first();

  await viewDetailButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
  if (!(await isVisible(viewDetailButton))) {
    return null;
  }

  await viewDetailButton.click({ timeout: 8000 }).catch(async () => {
    await viewDetailButton.click({ timeout: 8000, force: true });
  });

  await page.waitForURL(/\/dashboard\/operaciones\/detalle\//, { timeout: 20000 }).catch(() => undefined);
  const current = page.url();
  if (!current.includes('/dashboard/operaciones/detalle/')) {
    return null;
  }
  return toSameOriginRoute(current);
};

const discoverTreasuryMovementDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard/tesoreria');

  const firstRow = page.locator('#movements-table-section #table-body tr').first();
  await firstRow.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);
  if (!(await isVisible(firstRow))) {
    return null;
  }

  await firstRow.click({ timeout: 8000 }).catch(async () => {
    await firstRow.click({ timeout: 8000, force: true });
  });

  await page.waitForURL(/\/dashboard\/tesoreria\/movimientos\//, { timeout: 20000 }).catch(() => undefined);
  const current = page.url();
  if (!current.includes('/dashboard/tesoreria/movimientos/')) {
    return null;
  }
  return toSameOriginRoute(current);
};

const discoverTreasuryContactDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard/tesoreria/saldos');

  const rows = page.locator('#balance-table #table-body tr');
  await rows.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);
  const count = await rows.count().catch(() => 0);
  const limit = Math.min(count, 8);

  for (let index = 0; index < limit; index += 1) {
    const row = rows.nth(index);
    const rowText = normalizeText(await row.innerText().catch(() => ''));
    if (rowText.toLowerCase().includes('saldo general')) {
      continue;
    }

    await row.click({ timeout: 8000 }).catch(async () => {
      await row.click({ timeout: 8000, force: true });
    });

    await page.waitForURL(/\/dashboard\/tesoreria\/saldos\/contacto\//, { timeout: 10000 }).catch(() => undefined);
    const current = page.url();
    if (current.includes('/dashboard/tesoreria/saldos/contacto/')) {
      return toSameOriginRoute(current);
    }
  }

  return null;
};

const discoverLogisticsMovementDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard/logistica/resumen-general');

  const viewMovementBtn = page.locator('button[title="Ver detalles"]').first();
  await viewMovementBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);
  if (!(await isVisible(viewMovementBtn))) {
    return null;
  }

  await viewMovementBtn.click({ timeout: 8000 }).catch(async () => {
    await viewMovementBtn.click({ timeout: 8000, force: true });
  });

  const fullDetailBtn = page.getByRole('button', { name: /Ver detalle completo/i }).first();
  if (!(await isVisible(fullDetailBtn))) {
    // Side panel may take a moment to mount.
    await fullDetailBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
  }

  if (!(await isVisible(fullDetailBtn))) {
    return null;
  }

  await fullDetailBtn.click({ timeout: 8000 }).catch(async () => {
    await fullDetailBtn.click({ timeout: 8000, force: true });
  });

  await page.waitForURL(/\/dashboard\/logistica\/movimiento\//, { timeout: 20000 }).catch(() => undefined);
  const current = page.url();
  if (!current.includes('/dashboard/logistica/movimiento/')) {
    return null;
  }
  return toSameOriginRoute(current);
};

const discoverLogisticsIncidentDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard/logistica/resumen-general');

  const incidentBtn = page.locator('button[title="Ver incidencia"]').first();
  await incidentBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
  if (await isVisible(incidentBtn)) {
    await incidentBtn.click({ timeout: 8000 }).catch(async () => {
      await incidentBtn.click({ timeout: 8000, force: true });
    });
    await page.waitForURL(/\/dashboard\/logistica\/incidencia/, { timeout: 20000 }).catch(() => undefined);
    const current = page.url();
    if (current.includes('/dashboard/logistica/incidencia')) {
      return toSameOriginRoute(current);
    }
  }

  const incidentsSection = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /Incidencias Activas/i }) })
    .first();
  const firstCard = incidentsSection.locator('div.cursor-pointer').first();
  await firstCard.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
  if (!(await isVisible(firstCard))) {
    return null;
  }

  await firstCard.click({ timeout: 8000 }).catch(async () => {
    await firstCard.click({ timeout: 8000, force: true });
  });

  await page.waitForURL(/\/dashboard\/logistica\/incidencia/, { timeout: 20000 }).catch(() => undefined);
  const current = page.url();
  if (!current.includes('/dashboard/logistica/incidencia')) {
    return null;
  }
  return toSameOriginRoute(current);
};

const discoverLogisticsOrderDetailRoute = async (page) => {
  await gotoForDiscovery(page, '/dashboard/logistica');

  const myOrdersTab = page.getByRole('button', { name: /Mis Ã³rdenes|Mis órdenes/i }).first();
  if (!(await isVisible(myOrdersTab))) {
    return null;
  }

  await myOrdersTab.click({ timeout: 8000 }).catch(async () => {
    await myOrdersTab.click({ timeout: 8000, force: true });
  });

  // Wait for MyLogisticsOrdersPage header to appear.
  await page.getByRole('heading', { name: /Mis Ã³rdenes activas|Mis órdenes activas/i }).first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);

  const viewDetail = page.getByRole('button', { name: /Ver detalle/i }).first();
  await viewDetail.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);
  if (!(await isVisible(viewDetail))) {
    return null;
  }

  await viewDetail.click({ timeout: 8000 }).catch(async () => {
    await viewDetail.click({ timeout: 8000, force: true });
  });

  await page.waitForURL(/\/dashboard\/logistica\/orden\//, { timeout: 20000 }).catch(() => undefined);
  const current = page.url();
  if (!current.includes('/dashboard/logistica/orden/')) {
    return null;
  }
  return toSameOriginRoute(current);
};

const discoverDynamicRoutes = async (page) => {
  const discovered = [];
  const attempts = [
    { label: 'operations_detail', fn: discoverOperationsDetailRoute },
    { label: 'treasury_movement_detail', fn: discoverTreasuryMovementDetailRoute },
    { label: 'treasury_contact_balance_detail', fn: discoverTreasuryContactDetailRoute },
    { label: 'logistics_movement_detail', fn: discoverLogisticsMovementDetailRoute },
    { label: 'logistics_incident_detail', fn: discoverLogisticsIncidentDetailRoute },
    { label: 'logistics_order_detail', fn: discoverLogisticsOrderDetailRoute },
  ];

  for (const attempt of attempts) {
    try {
      const route = await attempt.fn(page);
      discovered.push({ label: attempt.label, route: route || null });
    } catch (error) {
      discovered.push({ label: attempt.label, route: null, error: normalizeText(error?.message || String(error)) });
    }
  }

  return discovered;
};

const runTreasuryInteractions = async (page) => {
  const registerButton = page.getByRole('button', { name: /Registrar movimiento/i }).first();
  if (await clickIfVisible(registerButton)) {
    const modal = page.locator('.modal-overlay').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
    await clickIfVisible(modal.getByRole('button', { name: /Cancelar/i }).first());
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }

  const reconciliationButton = page.getByRole('button', { name: /Conciliar operaciones/i }).first();
  if (await clickIfVisible(reconciliationButton)) {
    const cancel = page.getByRole('button', { name: /^Cancelar$/i }).first();
    // Wait a beat for the modal to mount.
    await wait(250);
    await clickIfVisible(cancel);
  }

  const firstRow = page.locator('#table-body tr').first();
  if (await isVisible(firstRow)) {
    await firstRow.click().catch(() => undefined);
    const detailPanel = page.locator('.detail-panel').first();
    if (await isVisible(detailPanel)) {
      await clickIfVisible(detailPanel.getByRole('button', { name: /Cerrar/i }).first());
    }
  }
};

const runLogisticsInteractions = async (page) => {
  // Best-effort: open any visible "Nuevo" action modal and close it.
  const newMovement = page.getByRole('button', { name: /Registrar nuevo movimiento/i }).first();
  await clickIfVisible(newMovement);
  const modal = page.locator('.modal-overlay').first();
  if (await isVisible(modal)) {
    await clickIfVisible(modal.getByRole('button', { name: /Cancelar|Cerrar/i }).first());
  }
};

const runRoute = async (page, route) => {
  const { result: instrumentation, dispose } = setupPageInstrumentation(page);

  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
    await page.waitForLoadState('networkidle', { timeout: ROUTE_TIMEOUT_MS }).catch(() => undefined);

    const authFindings = await collectAuthOrLoadErrors(page);

    if (route === '/dashboard/tesoreria') {
      await runTreasuryInteractions(page);
    }

    if (route === '/dashboard/logistica') {
      await runLogisticsInteractions(page);
    }

    // Re-check after interactions.
    const postFindings = await collectAuthOrLoadErrors(page);

    return {
      route,
      finalUrl: page.url(),
      findings: Array.from(new Set([...authFindings, ...postFindings])),
      ...instrumentation,
    };
  } finally {
    dispose();
  }
};

const main = async () => {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Missing LIVE_AUDIT_EMAIL or LIVE_AUDIT_PASSWORD env vars.');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'es-AR',
  });
  const page = await context.newPage();

  const report = {
    baseUrl: BASE_URL,
    startedAt: new Date().toISOString(),
    routes: [],
    failedRoutes: 0,
    discoveredRoutes: [],
  };

  try {
    await login(page);

    const testedRoutes = new Set();

    for (const route of ROUTES) {
      const entry = await runRoute(page, route);
      testedRoutes.add(route);

      const hasAuthError = entry.findings.includes('authentication_required') || entry.findings.includes('redirected_to_login');
      const hasApi401 = entry.apiHttpErrors.some((err) => err.status === 401);
      const hasApi500 = entry.apiHttpErrors.some((err) => err.status >= 500);
      const hasPageError = entry.pageErrors.length > 0;
      const hasRequestFailures = entry.requestFailures.some(
        (req) =>
          req.tag === 'internal' &&
          req.errorText &&
          !req.errorText.includes('net::ERR_ABORTED'),
      );
      const hasAppConsoleErrors = entry.consoleErrors.some((err) => err.tag === 'app');

      const status = hasAuthError || hasApi401 || hasApi500 || hasPageError || hasRequestFailures || hasAppConsoleErrors
        ? 'failed'
        : 'passed';

      if (status === 'failed') {
        report.failedRoutes += 1;
      }

      report.routes.push({
        route: entry.route,
        finalUrl: entry.finalUrl,
        status,
        findings: entry.findings,
        apiHttpErrors: entry.apiHttpErrors,
        requestFailures: entry.requestFailures,
        pageErrors: entry.pageErrors,
        consoleErrors: entry.consoleErrors,
      });
    }

    report.discoveredRoutes = await discoverDynamicRoutes(page);
    const extraRoutes = report.discoveredRoutes
      .map((item) => item.route)
      .filter(Boolean)
      .filter((route) => !testedRoutes.has(route));

    for (const route of extraRoutes) {
      const entry = await runRoute(page, route);

      const hasAuthError = entry.findings.includes('authentication_required') || entry.findings.includes('redirected_to_login');
      const hasApi401 = entry.apiHttpErrors.some((err) => err.status === 401);
      const hasApi500 = entry.apiHttpErrors.some((err) => err.status >= 500);
      const hasPageError = entry.pageErrors.length > 0;
      const hasRequestFailures = entry.requestFailures.some(
        (req) =>
          req.tag === 'internal' &&
          req.errorText &&
          !req.errorText.includes('net::ERR_ABORTED'),
      );
      const hasAppConsoleErrors = entry.consoleErrors.some((err) => err.tag === 'app');

      const status = hasAuthError || hasApi401 || hasApi500 || hasPageError || hasRequestFailures || hasAppConsoleErrors
        ? 'failed'
        : 'passed';

      if (status === 'failed') {
        report.failedRoutes += 1;
      }

      report.routes.push({
        route: entry.route,
        finalUrl: entry.finalUrl,
        status,
        findings: entry.findings,
        apiHttpErrors: entry.apiHttpErrors,
        requestFailures: entry.requestFailures,
        pageErrors: entry.pageErrors,
        consoleErrors: entry.consoleErrors,
      });
    }
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  console.log('LIVE_USER_AUDIT_REPORT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('LIVE_USER_AUDIT_REPORT_END');

  if (report.failedRoutes > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('LIVE_USER_AUDIT_FAILED', normalizeText(error?.message || String(error)));
  process.exitCode = 1;
});
