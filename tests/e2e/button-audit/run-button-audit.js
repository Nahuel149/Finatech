/* eslint-disable no-console */
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.AUDIT_WEB_URL || 'http://127.0.0.1:3000';
const LOGIN_EMAIL = process.env.AUDIT_EMAIL || 'qa.button.audit@example.com';
const LOGIN_PASSWORD = process.env.AUDIT_PASSWORD || 'QaButton123';

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

const LOGIN_URL = `${BASE_URL}/login`;

const isLikelyVisible = async (locator) => {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
};

const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();
const compactError = (value) => normalizeText(String(value || '').split('\n')[0]);

const describeButton = async (locator, index) => {
  const text = normalizeText(await locator.textContent().catch(() => ''));
  const aria = normalizeText(await locator.getAttribute('aria-label').catch(() => ''));
  const id = normalizeText(await locator.getAttribute('id').catch(() => ''));
  const type = normalizeText(await locator.getAttribute('type').catch(() => ''));
  const tagName = await locator.evaluate((node) => node.tagName.toLowerCase()).catch(() => 'button');

  return {
    index,
    text: text || null,
    aria: aria || null,
    id: id || null,
    type: type || null,
    tagName,
    label: text || aria || id || `${tagName}#${index}`,
  };
};

const login = async (page) => {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input#email', LOGIN_EMAIL);
  await page.fill('input#password', LOGIN_PASSWORD);
  await page.click('button#login-button');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
};

const ensureLoggedIn = async (page) => {
  if (page.url().includes('/login')) {
    await login(page);
  }
};

const waitForStableUi = async (page) => {
  await page.waitForTimeout(600);
};

const collectButtons = (page) =>
  page.locator(
    'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
  );

const safeGoBack = async (page, fallbackRoute) => {
  try {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 4000 });
  } catch {
    await page.goto(`${BASE_URL}${fallbackRoute}`, { waitUntil: 'domcontentloaded' });
  }
};

const auditRoute = async (page, route, state) => {
  const url = `${BASE_URL}${route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page);
  if (!page.url().startsWith(url)) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  await waitForStableUi(page);

  const buttons = collectButtons(page);
  const count = await buttons.count();
  const seenLabels = new Set();

  for (let i = 0; i < count; i += 1) {
    const currentButtons = collectButtons(page);
    const currentCount = await currentButtons.count();
    if (i >= currentCount) {
      break;
    }

    const button = currentButtons.nth(i);
    if (!(await isLikelyVisible(button))) {
      continue;
    }

    const disabled = await button.isDisabled().catch(() => false);
    if (disabled) {
      continue;
    }

    const descriptor = await describeButton(button, i);
    const dedupeKey = `${route}|${descriptor.label}`;
    if (seenLabels.has(dedupeKey)) {
      continue;
    }
    seenLabels.add(dedupeKey);
    state.checked += 1;

    const beforeUrl = page.url();
    const beforeConsoleErrors = state.consoleErrors.length;
    const beforePageErrors = state.pageErrors.length;

    let clickError = null;
    try {
      await button.click({ timeout: 4000 });
      await waitForStableUi(page);
    } catch (error) {
      clickError = error;
    }

    const afterUrl = page.url();
    const newConsoleErrors = state.consoleErrors.slice(beforeConsoleErrors);
    const newPageErrors = state.pageErrors.slice(beforePageErrors);

    if (clickError) {
      state.failures.push({
        route,
        button: descriptor.label,
        issue: `click_failed: ${compactError(clickError.message)}`,
      });
    } else if (newConsoleErrors.length || newPageErrors.length) {
      state.failures.push({
        route,
        button: descriptor.label,
        issue: 'runtime_error_after_click',
        consoleErrors: newConsoleErrors,
        pageErrors: newPageErrors,
      });
    }

    if (afterUrl.includes('/login') && !beforeUrl.includes('/login')) {
      await login(page);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForStableUi(page);
      continue;
    }

    if (afterUrl !== beforeUrl && !afterUrl.startsWith(url)) {
      await safeGoBack(page, route);
      await ensureLoggedIn(page);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForStableUi(page);
    }
  }
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const state = {
    checked: 0,
    failures: [],
    consoleErrors: [],
    pageErrors: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      state.consoleErrors.push({
        url: page.url(),
        message: normalizeText(msg.text()),
      });
    }
  });

  page.on('pageerror', (error) => {
    state.pageErrors.push({
      url: page.url(),
      message: normalizeText(error.message),
    });
  });

  await login(page);

  for (const route of ROUTES) {
    await auditRoute(page, route, state);
  }

  await browser.close();

  const report = {
    baseUrl: BASE_URL,
    checkedButtons: state.checked,
    failedButtons: state.failures.length,
    failures: state.failures,
  };

  console.log('BUTTON_AUDIT_REPORT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('BUTTON_AUDIT_REPORT_END');

  if (state.failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('button_audit_failed', error);
  process.exit(1);
});
