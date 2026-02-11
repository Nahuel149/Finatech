/* eslint-disable no-console */
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { chromium } = require('@playwright/test');

const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { seedLogisticsOperations } = require('../../../src/utils/seedLogisticsOperations');

const AUDIT_USER = {
  fullName: 'QA Button Audit',
  email: 'qa.button.audit@example.com',
  password: 'QaButton123',
  permissions: [
    'view-balances',
    'access-treasury',
    'access-transfers',
    'manage-treasury',
    'manage-market-rates',
    'manage-notifications',
    'access-operations',
    'access-logistics',
    'manage-logistics',
    'treasury:receptions',
    'treasury:receptions:revert',
    'admin:manage-permissions',
  ],
};

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
const ROUTE_TIMEOUT_MS = Number(process.env.BUTTON_AUDIT_ROUTE_TIMEOUT_MS || 120000);
const WAIT_UI_MS = Number(process.env.BUTTON_AUDIT_WAIT_UI_MS || 250);
const TRIAL_CLICK_TIMEOUT_MS = Number(process.env.BUTTON_AUDIT_TRIAL_TIMEOUT_MS || 450);
const ACTION_CLICK_TIMEOUT_MS = Number(process.env.BUTTON_AUDIT_ACTION_TIMEOUT_MS || 2500);

const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();
const compactError = (value) => normalizeText(String(value || '').split('\n')[0]);

const isLikelyVisible = async (locator) => {
  try {
    return await locator.isVisible({ timeout: 0 });
  } catch {
    return false;
  }
};

const isLikelyActionable = async (locator, page) => {
  if (!(await isLikelyVisible(locator))) {
    return false;
  }

  const viewport = page.viewportSize() || { width: 1280, height: 720 };

  try {
    return await locator.evaluate(
      (element, currentViewport) => {
        let current = element;
        while (current) {
          if (current.getAttribute && current.getAttribute('aria-hidden') === 'true') {
            return false;
          }
          current = current.parentElement;
        }

        const style = window.getComputedStyle(element);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.pointerEvents === 'none'
        ) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        if (!rect || !currentViewport) {
          return false;
        }
        if (
          !(
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < currentViewport.height &&
            rect.left < currentViewport.width
          )
        ) {
          return false;
        }

        const centerX = Math.min(
          Math.max(rect.left + rect.width / 2, 0),
          Math.max(currentViewport.width - 1, 0),
        );
        const centerY = Math.min(
          Math.max(rect.top + rect.height / 2, 0),
          Math.max(currentViewport.height - 1, 0),
        );
        const topElement = document.elementFromPoint(centerX, centerY);
        return (
          !!topElement &&
          (topElement === element ||
            element.contains(topElement) ||
            (topElement instanceof HTMLElement && topElement.contains(element))) &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < currentViewport.height &&
          rect.left < currentViewport.width
        );
      },
      viewport,
    );
  } catch {
    return false;
  }
};

const describeButton = async (locator, index) => {
  const text = normalizeText(await locator.textContent({ timeout: 0 }).catch(() => ''));
  const aria = normalizeText(await locator.getAttribute('aria-label', { timeout: 0 }).catch(() => ''));
  const id = normalizeText(await locator.getAttribute('id', { timeout: 0 }).catch(() => ''));
  const type = normalizeText(await locator.getAttribute('type', { timeout: 0 }).catch(() => ''));
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

const collectButtons = (page) =>
  page.locator(
    'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
  );

const waitForStableUi = async (page) => {
  await page.waitForTimeout(WAIT_UI_MS);
};

const ensureAuditUser = async () => {
  const passwordHash = await bcrypt.hash(AUDIT_USER.password, 12);
  await User.findOneAndUpdate(
    { email: AUDIT_USER.email },
    {
      $set: {
        fullName: AUDIT_USER.fullName,
        email: AUDIT_USER.email,
        passwordHash,
        providers: [{ provider: 'local' }],
        isVerified: true,
        permissions: AUDIT_USER.permissions,
        isMessenger: true,
        twoFactor: { enabled: false },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const login = async (page, baseUrl) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input#email', AUDIT_USER.email);
  await page.fill('input#password', AUDIT_USER.password);
  await page.click('button#login-button');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
};

const ensureLoggedIn = async (page, baseUrl) => {
  if (page.url().includes('/login')) {
    await login(page, baseUrl);
  }
};

const safeGoBack = async (page, baseUrl, fallbackRoute) => {
  try {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 4000 });
  } catch {
    await page.goto(`${baseUrl}${fallbackRoute}`, { waitUntil: 'domcontentloaded' });
  }
};

const auditRoute = async (page, baseUrl, route, state) => {
  const url = `${baseUrl}${route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);
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
    await button.scrollIntoViewIfNeeded({ timeout: 250 }).catch(() => undefined);
    if (!(await isLikelyActionable(button, page))) {
      continue;
    }

    const disabled = await button.isDisabled({ timeout: 0 }).catch(() => false);
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
    let trialError = null;
    try {
      await button.click({ timeout: TRIAL_CLICK_TIMEOUT_MS, trial: true });
    } catch (error) {
      trialError = error;
    }

    if (trialError) {
      const msg = String(trialError.message || '');
      if (msg.toLowerCase().includes('intercepts pointer events')) {
        continue;
      }
      state.failures.push({
        route,
        button: descriptor.label,
        issue: `not_interactable: ${compactError(msg)}`,
      });
      continue;
    }

    let clickError = null;
    try {
      await button.click({ timeout: ACTION_CLICK_TIMEOUT_MS });
      await waitForStableUi(page);
    } catch (error) {
      clickError = error;
    }

    const afterUrl = page.url();

    if (clickError) {
      state.failures.push({
        route,
        button: descriptor.label,
        issue: `click_failed: ${compactError(clickError.message)}`,
      });
    }

    if (afterUrl.includes('/login') && !beforeUrl.includes('/login')) {
      await login(page, baseUrl);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForStableUi(page);
      continue;
    }

    if (afterUrl !== beforeUrl && !afterUrl.startsWith(url)) {
      await safeGoBack(page, baseUrl, route);
      await ensureLoggedIn(page, baseUrl);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForStableUi(page);
    }
  }
};

const runAudit = async (baseUrl) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const state = {
    checked: 0,
    failures: [],
  };

  const authPage = await context.newPage();
  await login(authPage, baseUrl);
  await authPage.close();

  for (const route of ROUTES) {
    // eslint-disable-next-line no-console
    console.log(`AUDIT_ROUTE_START ${route}`);
    const page = await context.newPage();
    const checkedBefore = state.checked;
    const failuresBefore = state.failures.length;
    try {
      const routeAudit = auditRoute(page, baseUrl, route, state);
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`route_timeout:${route}`)), ROUTE_TIMEOUT_MS);
      });
      await Promise.race([routeAudit, timeout]);
    } catch (error) {
      state.failures.push({
        route,
        button: '*route*',
        issue: compactError(error.message || 'route_audit_failed'),
      });
    } finally {
      // eslint-disable-next-line no-console
      console.log(
        `AUDIT_ROUTE_END ${route} checked=${state.checked - checkedBefore} failures=${state.failures.length - failuresBefore}`,
      );
      await page.close().catch(() => undefined);
    }
  }

  await browser.close();
  return state;
};

const main = async () => {
  let mongoServer;
  let server;
  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'finatech-button-audit' });
    await seedLogisticsOperations();
    await ensureAuditUser();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const state = await runAudit(baseUrl);

    const report = {
      baseUrl,
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
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect().catch(() => undefined);
    if (mongoServer) {
      await mongoServer.stop().catch(() => undefined);
    }
  }
};

main().catch((error) => {
  console.error('button_audit_failed', error);
  process.exit(1);
});
