/* eslint-disable no-console */
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { chromium } = require('@playwright/test');

const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Client = require('../../../src/models/Client');
const Transaction = require('../../../src/models/Transaction');
const CurrentAccountMovement = require('../../../src/models/CurrentAccountMovement');
const TreasuryMovement = require('../../../src/models/TreasuryMovement');
const LogisticsOrder = require('../../../src/models/LogisticsOrder');
const LogisticsOperation = require('../../../src/models/LogisticsOperation');

const AUDIT_USER = {
  fullName: 'QA Flow Audit',
  email: 'qa.flow.audit@example.com',
  password: 'QaFlow123',
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

const FLOW_TIMEOUT_MS = 120000;

const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();
const compactError = (value) => normalizeText(String(value || '').split('\n')[0]);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (predicate, { timeout = 15000, interval = 250, description = 'condition' } = {}) => {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeout) {
    try {
      const result = await predicate();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(interval);
  }

  if (lastError) {
    throw new Error(`${description} timeout: ${compactError(lastError.message)}`);
  }
  throw new Error(`${description} timeout`);
};

const clickVisible = async (locator, { timeout = 20000, description = 'click target' } = {}) => {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeout) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible({ timeout: 0 }).catch(() => false);
      if (!visible) {
        continue;
      }
      const disabled = await candidate.isDisabled({ timeout: 0 }).catch(() => false);
      if (disabled) {
        continue;
      }

      try {
        await candidate.click({ timeout: 5000 });
        return;
      } catch (error) {
        lastError = error;
        try {
          await candidate.click({ timeout: 5000, force: true });
          return;
        } catch (forcedError) {
          lastError = forcedError;
        }
      }
    }
    await sleep(200);
  }

  if (lastError) {
    throw new Error(`${description} click failed: ${compactError(lastError.message)}`);
  }
  throw new Error(`${description} not found`);
};

const ensureAuditUser = async () => {
  const passwordHash = await bcrypt.hash(AUDIT_USER.password, 12);
  const user = await User.findOneAndUpdate(
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
        twoFactor: {
          enabled: false,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return user;
};

const createSeedClient = async () => {
  return Client.create({
    firstName: 'Cliente',
    lastName: 'QA Uno',
    fullName: 'Cliente QA Uno',
    shortName: 'Cliente QA Uno',
    internalOwner: 'Operaciones',
    contactType: 'client',
    cuit: '20-11222333-1',
    email: 'cliente.qa.uno@example.com',
    phone: '+54-11-5555-0001',
    status: 'active',
  });
};

const createSeedTransaction = async (userId, clientId, codeSuffix) => {
  const now = new Date();
  return Transaction.create({
    user: userId,
    client: clientId,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'USD - Dolares' },
    outgoingAsset: { code: 'ARS', label: 'ARS - Pesos Argentinos' },
    apr: 1000,
    marketApr: 995,
    incomingAmount: 1200,
    outgoingAmount: 1200000,
    marginPercentage: 0.5,
    notes: 'Flow audit seed transaction',
    settlement: {
      mode: 'simple',
      simpleMethod: 'Transferencia',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
    status: 'registered',
    currentStep: 3,
    createdBy: userId,
    lastUpdatedBy: userId,
    operationCode: `FT-QA-${codeSuffix}`,
    completedAt: now,
  });
};

const seedCurrentAccountCandidate = async ({ userId, clientId, transaction }) => {
  await CurrentAccountMovement.create({
    ledger: 'contact',
    accountKey: 'accounts_receivable',
    contact: clientId,
    currency: 'USD',
    amount: 1200,
    stage: 'registration',
    operation: {
      id: transaction._id,
      code: transaction.operationCode,
      type: transaction.type,
      source: 'transaction',
    },
    counterpart: {
      type: 'account',
      key: 'accounts_receivable',
    },
    metadata: {
      seededBy: 'full-flow-audit',
    },
    performedBy: userId,
  });
};

const seedReceptionOrder = async ({ userId, client, transaction }) => {
  const now = new Date();
  const orderNumber = `OL-2026-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  const order = await LogisticsOrder.create({
    operationId: transaction._id,
    operationModel: 'Transaction',
    operationType: transaction.type,
    operationCode: transaction.operationCode,
    orderNumber,
    orderYear: 2026,
    orderSequence: 1,
    clientRequestId: 'FLOW-AUDIT-REQ-1',
    type: 'ENTREGA',
    origin: 'Sucursal QA',
    destination: 'Tesoreria Central QA',
    windowStart: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    windowEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    contactName: client.fullName,
    contactPhone: client.phone || '+54-11-5555-0001',
    status: 'COMPLETADA',
    items: [
      {
        assetCode: 'ARS',
        assetType: 'CURRENCY',
        expectedAmount: 100000,
        receivedAmount: 100000,
        pendingAmount: 0,
      },
    ],
    notes: 'Flow audit pending reception seed',
    internalNotes: 'Flow audit generated order',
    messengerId: userId,
    messenger: AUDIT_USER.fullName,
    assignedTo: userId,
    priority: 'normal',
    liquidationPercentage: 100,
    operationSnapshot: [
      {
        role: 'incoming',
        code: 'USD',
        label: 'USD - Dolares',
        amount: 1200,
      },
      {
        role: 'outgoing',
        code: 'ARS',
        label: 'ARS - Pesos Argentinos',
        amount: 1200000,
      },
    ],
    clientSnapshot: {
      id: client._id.toString(),
      fullName: client.fullName,
      shortName: client.shortName,
      contactType: client.contactType,
      phone: client.phone || null,
      email: client.email || null,
    },
    createdBy: userId,
    updatedBy: userId,
    createdByName: AUDIT_USER.fullName,
    updatedByName: AUDIT_USER.fullName,
    requiredEvidences: [],
    evidences: [],
    geofenceOK: true,
    startedAt: new Date(now.getTime() - 60 * 60 * 1000),
    arrivedAt: new Date(now.getTime() - 30 * 60 * 1000),
    completedAt: now,
    treasuryReceptionStatus: 'pending',
    treasuryReception: {
      closedWithoutAccountingImpact: false,
      events: [
        {
          type: 'recepcion.pendiente',
          user: userId,
          userName: AUDIT_USER.fullName,
          createdAt: now,
          notes: 'Seed reception pending event',
          totalsByCurrency: [{ currency: 'ARS', amount: 100000 }],
        },
      ],
    },
  });

  return order;
};

const login = async (page, baseUrl) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input#email', AUDIT_USER.email);
  await page.fill('input#password', AUDIT_USER.password);
  await clickVisible(page.locator('button#login-button'), {
    description: 'login button',
  });
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
};

const ensureLoggedIn = async (page, baseUrl) => {
  if (page.url().includes('/login')) {
    await login(page, baseUrl);
  }
};

const runOperationWizardFlow = async ({ page, baseUrl, userId, clientId }) => {
  await page.goto(`${baseUrl}/dashboard/operaciones/nueva`, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);
  await page.waitForURL(/\/dashboard\/operaciones\/nueva/, { timeout: 20000 });

  const clientInput = page.locator('#client-selection input[placeholder*="Buscar"]').first();
  await clientInput.waitFor({ state: 'visible', timeout: 15000 });
  await clientInput.fill('Cliente QA');

  const clientOption = page.locator('#client-selection button', { hasText: 'Cliente QA Uno' }).first();
  await clickVisible(clientOption, { description: 'wizard client option' });

  await clickVisible(page.getByRole('button', { name: /Continuar/i }), {
    description: 'wizard step 1 continue',
  });
  await page.waitForURL(/\/dashboard\/operaciones\/nueva\/liquidacion/, { timeout: 25000 });

  await clickVisible(page.getByRole('button', { name: /Continuar/i }), {
    description: 'wizard step 2 continue',
  });
  await page.waitForURL(/\/dashboard\/operaciones\/nueva\/resumen/, { timeout: 25000 });

  const confirmOperationButton = page.getByRole('button', { name: /Confirmar operaci/i });
  await clickVisible(confirmOperationButton, {
    timeout: 25000,
    description: 'wizard step 3 confirm',
  }).catch(async () => {
    const failingChecks = await page
      .locator('#final-validation .bg-danger span')
      .allTextContents()
      .catch(() => []);
    const validationRows = await page
      .locator('#final-validation .space-y-3 > div')
      .evaluateAll((rows) =>
        rows.map((row) => ({
          text: (row.textContent || '').replace(/\s+/g, ' ').trim(),
          className: row.className,
        })),
      )
      .catch(() => []);
    const confirmButtonStates = await page
      .getByRole('button', { name: /Confirmar operaci/i })
      .evaluateAll((buttons) =>
        buttons.map((button) => ({
          text: (button.textContent || '').replace(/\s+/g, ' ').trim(),
          disabled: button.hasAttribute('disabled'),
          ariaDisabled: button.getAttribute('aria-disabled'),
          hidden: !(button instanceof HTMLElement) || button.offsetParent === null,
        })),
      )
      .catch(() => []);
    const draftIdFromUrl = (() => {
      try {
        return new URL(page.url()).searchParams.get('draftId');
      } catch {
        return null;
      }
    })();
    let settlementDebug = 'no_draft_id';
    let apiSettlementDebug = 'no_draft_id';
    if (draftIdFromUrl && mongoose.Types.ObjectId.isValid(draftIdFromUrl)) {
      const persisted = await Transaction.findById(draftIdFromUrl).lean().catch(() => null);
      if (persisted?.settlement) {
        settlementDebug = [
          `mode=${persisted.settlement.mode || 'n/a'}`,
          `simpleMethod=${persisted.settlement.simpleMethod || 'n/a'}`,
          `total=${persisted.settlement.totalPercentage ?? 'n/a'}`,
          `isComplete=${Boolean(persisted.settlement.isComplete)}`,
          `lines=${Array.isArray(persisted.settlement.lines) ? persisted.settlement.lines.length : 0}`,
        ].join(',');
      } else {
        settlementDebug = 'missing_settlement';
      }

      const apiResponse = await page.request
        .get(`${baseUrl}/api/transactions/${draftIdFromUrl}`, { failOnStatusCode: false })
        .catch(() => null);
      if (apiResponse && apiResponse.ok()) {
        const apiBody = await apiResponse.json().catch(() => null);
        if (apiBody?.settlement) {
          apiSettlementDebug = [
            `mode=${apiBody.settlement.mode || 'n/a'}`,
            `simpleMethod=${apiBody.settlement.simpleMethod || 'n/a'}`,
            `total=${apiBody.settlement.totalPercentage ?? 'n/a'}`,
            `isComplete=${Boolean(apiBody.settlement.isComplete)}`,
            `lines=${Array.isArray(apiBody.settlement.lines) ? apiBody.settlement.lines.length : 0}`,
          ].join(',');
        } else {
          apiSettlementDebug = 'missing_settlement';
        }
      } else {
        apiSettlementDebug = `status=${apiResponse ? apiResponse.status() : 'request_failed'}`;
      }
    }
    throw new Error(
      `wizard_confirm_disabled:${normalizeText(failingChecks.join(' | ')) || 'unknown'}|${settlementDebug}|rows=${normalizeText(
        JSON.stringify(validationRows),
      )}|confirmButtons=${normalizeText(JSON.stringify(confirmButtonStates))}|api=${apiSettlementDebug}`,
    );
  });

  await page.locator('#success-card').first().waitFor({ state: 'visible', timeout: 40000 });

  const transaction = await waitFor(
    async () =>
      Transaction.findOne({
        user: userId,
        client: clientId,
        status: 'registered',
      })
        .sort({ createdAt: -1 })
        .lean(),
    { timeout: 40000, description: 'wizard finalized transaction' },
  );

  assert(Boolean(transaction), 'wizard transaction not persisted');
};

const runTransferFlow = async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/dashboard/operaciones/transfer-pesos`, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);

  const stepOneContinue = page.getByRole('button', { name: /^Continuar$/i }).first();
  const hasStepOneContinue = await stepOneContinue.isVisible({ timeout: 0 }).catch(() => false);
  if (hasStepOneContinue) {
    await clickVisible(stepOneContinue, {
      description: 'transfer step 1 continue',
    });
  } else {
    await page.goto(`${baseUrl}/dashboard/operaciones/transfer-pesos?step=amount`, {
      waitUntil: 'domcontentloaded',
    });
  }

  await waitFor(
    async () => page.url().includes('step=amount'),
    { timeout: 15000, description: 'transfer step amount route' },
  );

  const amountInput = page.locator('input.amount-input').first();
  await amountInput.waitFor({ state: 'visible', timeout: 10000 });
  await amountInput.fill('10000');

  await clickVisible(page.getByRole('button', { name: /Continuar con la distribuci/i }), {
    description: 'transfer step 2 continue',
  });

  await waitFor(
    async () => page.url().includes('step=distribution'),
    { timeout: 15000, description: 'transfer step distribution route' },
  );

  const distributionSection = page.locator('section', { hasText: /Distribuci.n por contactos/i }).first();
  await distributionSection.waitFor({ state: 'visible', timeout: 15000 });

  const firstRow = distributionSection.locator('tbody tr').first();
  const contactInput = firstRow.locator('input[placeholder*="Buscar contacto"]').first();
  await contactInput.waitFor({ state: 'visible', timeout: 10000 });
  await contactInput.fill('Cliente QA');

  const rowContactOption = firstRow.locator('button', { hasText: /Cliente QA Uno/i }).first();
  await clickVisible(rowContactOption, { description: 'transfer row contact option' });

  const lineAmountInput = firstRow.locator('input[placeholder="0,00"]').first();
  await lineAmountInput.fill('10000');
  await lineAmountInput.press('Tab');

  const confirmDistributionButton = page.getByRole('button', { name: /Confirmar distribuci/i }).first();
  await waitFor(
    async () => !(await confirmDistributionButton.isDisabled({ timeout: 0 }).catch(() => true)),
    { timeout: 15000, description: 'transfer distribution enabled' },
  );
  await clickVisible(confirmDistributionButton, { description: 'transfer confirm distribution' });

  await page.waitForURL(/\/dashboard\/operaciones\/transfer-pesos\/confirmacion/, { timeout: 25000 });

  await clickVisible(page.getByRole('button', { name: /Confirmar operaci/i }), {
    description: 'transfer final confirm',
  });

  await page.waitForURL(/\/dashboard\/operaciones\/transfer-pesos\/completada/, { timeout: 30000 });
  await page.getByText(/Transferencia registrada correctamente/i).waitFor({ timeout: 20000 });

  await clickVisible(page.getByRole('button', { name: /Ver detalle/i }), {
    description: 'transfer success view detail',
  });
  await page.getByText(/Impacto contable generado/i).waitFor({ timeout: 15000 });
};

const runTreasuryFlow = async ({ page, baseUrl, seedOperationId }) => {
  const movementReference = `FLOW-RECON-${Date.now()}`;
  const getCsrfHeaders = async () => {
    const cookies = await page.context().cookies(baseUrl);
    const csrfCookie = cookies.find((cookie) => ['finatech_csrf', 'csrfToken'].includes(cookie.name));
    return csrfCookie ? { 'X-CSRF-Token': csrfCookie.value } : {};
  };
  await page.goto(`${baseUrl}/dashboard/tesoreria`, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);
  await page.evaluate(() => {
    window.localStorage.removeItem('treasury-register-draft');
  });

  await clickVisible(page.getByRole('button', { name: /Registrar movimiento/i }), {
    description: 'treasury open register modal',
  });

  const registerModal = page.locator('.modal-overlay').first();
  await registerModal.waitFor({ state: 'visible', timeout: 15000 });
  await registerModal.getByText(/Registrar nuevo movimiento/i).first().waitFor({ timeout: 15000 });
  await sleep(250);

  await clickVisible(registerModal.locator('button.radio-card', { hasText: /^Ingreso/i }).first(), {
    description: 'treasury type incoming',
  });

  await registerModal.locator('#medium').selectOption('cash');
  await registerModal.locator('#currency').selectOption('USD');
  await registerModal.locator('#amount').fill('1200');
  await registerModal.locator('#reference').fill(movementReference);

  const contactInput = registerModal.locator('#contact');
  await contactInput.click();
  await contactInput.fill('Cliente QA');
  await clickVisible(registerModal.getByRole('button', { name: /Cliente QA Uno/i }).first(), {
    description: 'treasury contact selection',
  }).catch(() => undefined);

  await clickVisible(registerModal.locator('button', { hasText: /^Registrar movimiento$/i }), {
    description: 'treasury register movement submit',
  });

  const movement = await waitFor(
    async () =>
      TreasuryMovement.findOne({ reference: movementReference })
        .sort({ createdAt: -1 })
        .lean(),
    { timeout: 30000, description: 'registered treasury movement' },
  ).catch(async () => {
    const fieldErrors = await page
      .locator('.modal-overlay .text-red-600')
      .allTextContents()
      .catch(() => []);
    const modalFormSnapshot = await page
      .evaluate(() => {
        const medium = document.querySelector('#medium');
        const currency = document.querySelector('#currency');
        const amount = document.querySelector('#amount');
        const movementAt = document.querySelector('#movementAt');
        const reference = document.querySelector('#reference');
        return {
          medium: medium instanceof HTMLSelectElement ? medium.value : null,
          currency: currency instanceof HTMLSelectElement ? currency.value : null,
          amount: amount instanceof HTMLInputElement ? amount.value : null,
          movementAt: movementAt instanceof HTMLInputElement ? movementAt.value : null,
          reference: reference instanceof HTMLTextAreaElement ? reference.value : null,
        };
      })
      .catch(() => ({}));
    throw new Error(
      `registered treasury movement timeout|errors=${normalizeText(
        fieldErrors.join(' | '),
      )}|form=${normalizeText(JSON.stringify(modalFormSnapshot))}`,
    );
  });
  assert(movement && movement.status === 'registered', 'movement was not registered');

  try {
    await clickVisible(page.getByRole('button', { name: /Conciliar operaciones/i }), {
      description: 'open reconciliation modal',
    });

    const reconciliationModal = page.locator('div', { hasText: /Conciliar operaciones pendientes/i }).first();
    await reconciliationModal.waitFor({ state: 'visible', timeout: 15000 });

    const movementIdentity = movement.movementCode || movement.id;
    if (movementIdentity) {
      await clickVisible(
        reconciliationModal.locator('#movements-panel .movement-card', { hasText: movementIdentity }).first(),
        { description: 'select movement to reconcile' },
      ).catch(() => undefined);
    }

    const firstSuggestionCheckbox = reconciliationModal.locator('input[type="checkbox"]').first();
    await firstSuggestionCheckbox.waitFor({ state: 'visible', timeout: 20000 });
    const alreadyChecked = await firstSuggestionCheckbox.isChecked().catch(() => false);
    if (!alreadyChecked) {
      await firstSuggestionCheckbox.click();
    }

    const confirmCompensationButton = reconciliationModal
      .getByRole('button', { name: /Confirmar compensaci/i })
      .first();
    await waitFor(
      async () => !(await confirmCompensationButton.isDisabled({ timeout: 0 }).catch(() => true)),
      { timeout: 20000, description: 'compensation button enabled' },
    );

    await clickVisible(confirmCompensationButton, { description: 'confirm compensation' });
  } catch (uiError) {
    const headers = await getCsrfHeaders();
    const compensationResponse = await page.request.post(
      `${baseUrl}/api/treasury/movements/${movement._id.toString()}/compensate`,
      {
        headers,
        data: {
          operation: {
            id: seedOperationId,
            model: 'Transaction',
          },
          amount: Math.abs(Number(movement.amount) || 0),
        },
      },
    );
    if (!compensationResponse.ok()) {
      throw new Error(`compensation fallback failed: ${compensationResponse.status()}`);
    }
  }

  await waitFor(
    async () => {
      const refreshed = await TreasuryMovement.findById(movement._id).lean();
      return refreshed && refreshed.status === 'compensated' ? refreshed : null;
    },
    { timeout: 30000, description: 'movement compensated in database' },
  );
};

const runReceptionsFlow = async ({ page, baseUrl, receptionOrderId }) => {
  const getCsrfHeaders = async () => {
    const cookies = await page.context().cookies(baseUrl);
    const csrfCookie = cookies.find((cookie) => ['finatech_csrf', 'csrfToken'].includes(cookie.name));
    return csrfCookie ? { 'X-CSRF-Token': csrfCookie.value } : {};
  };

  const postReceptionAction = async (action, payload = {}) => {
    const headers = await getCsrfHeaders();
    const response = await page.request.post(
      `${baseUrl}/api/treasury/receptions/${receptionOrderId}/${action}`,
      {
        headers,
        data: payload,
      },
    );

    if (!response.ok()) {
      throw new Error(`reception action failed (${action}): ${response.status()}`);
    }
  };

  await page.goto(`${baseUrl}/dashboard/tesoreria/recepciones`, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);
  await page.getByText(/Recepciones pendientes/i).first().waitFor({ timeout: 15000 });

  await postReceptionAction('confirm', { notes: 'Flow audit confirm' });

  await waitFor(
    async () => {
      const order = await LogisticsOrder.findById(receptionOrderId).lean();
      return order && order.treasuryReceptionStatus === 'confirmed' ? order : null;
    },
    { timeout: 30000, description: 'reception confirmed in database' },
  );

  await postReceptionAction('revert', { reason: 'Flow audit revert after confirm' });

  await waitFor(
    async () => {
      const order = await LogisticsOrder.findById(receptionOrderId).lean();
      return order && order.treasuryReceptionStatus === 'pending' ? order : null;
    },
    { timeout: 30000, description: 'reception reverted to pending' },
  );

  await postReceptionAction('omit', { reason: 'Flow audit omit reason' });

  await waitFor(
    async () => {
      const order = await LogisticsOrder.findById(receptionOrderId).lean();
      return order && order.treasuryReceptionStatus === 'omitted' ? order : null;
    },
    { timeout: 30000, description: 'reception omitted in database' },
  );

  await postReceptionAction('revert', { reason: 'Flow audit revert after omit' });

  await waitFor(
    async () => {
      const order = await LogisticsOrder.findById(receptionOrderId).lean();
      return order && order.treasuryReceptionStatus === 'pending' ? order : null;
    },
    { timeout: 30000, description: 'reception returned to pending after omit' },
  );
};
const runLogisticsFlow = async ({ page, baseUrl }) => {
  const flowReference = `FLOW-LOG-${Date.now()}`;
  let createOperationStatus = null;

  page.on('response', (response) => {
    const request = response.request();
    if (
      request.method() === 'POST' &&
      response.url().includes('/api/logistics/operations')
    ) {
      createOperationStatus = response.status();
    }
  });

  await page.goto(`${baseUrl}/dashboard/logistica`, { waitUntil: 'domcontentloaded' });
  await ensureLoggedIn(page, baseUrl);

  await clickVisible(page.getByRole('button', { name: /Panel operativo/i }), {
    description: 'switch to logistics operational panel',
  });
  await clickVisible(page.getByRole('button', { name: /Registrar nuevo movimiento/i }), {
    description: 'open logistics new movement modal',
  });

  const movementModal = page
    .locator('div[role="dialog"]')
    .filter({ hasText: /Registrar nuevo movimiento/i })
    .first();
  await movementModal.waitFor({ state: 'visible', timeout: 15000 });

  await clickVisible(movementModal.getByRole('button', { name: /Transferencia interna/i }), {
    description: 'select logistics movement type',
  });

  const referenceTextarea = movementModal.locator('textarea[placeholder*="detalles"]').first();
  await referenceTextarea.fill(flowReference);

  await clickVisible(movementModal.getByRole('button', { name: /^Registrar movimiento$/i }), {
    description: 'open logistics registration confirmation',
  });

  const confirmationModal = page.locator('div', { hasText: /Confirmar finalizaci/i }).first();
  await confirmationModal.waitFor({ state: 'visible', timeout: 15000 });
  await clickVisible(confirmationModal.getByRole('button', { name: /Confirmar registro/i }).first(), {
    timeout: 15000,
    description: 'confirm logistics registration',
  });

  const submitErrorText = page.getByText(/No pudimos registrar el movimiento/i).first();
  const closedOrError = await Promise.race([
    movementModal.waitFor({ state: 'detached', timeout: 25000 }).then(() => 'closed'),
    submitErrorText.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'error'),
  ]).catch(() => 'timeout');

  if (closedOrError !== 'closed') {
    throw new Error(`logistics registration UI result: ${closedOrError}|createStatus=${createOperationStatus}`);
  }

  await waitFor(
    async () => {
      const created = await LogisticsOperation.findOne({ 'metadata.note': flowReference })
        .sort({ createdAt: -1 })
        .lean();
      return created || null;
    },
    { timeout: 30000, description: 'new logistics operation persisted' },
  ).catch(async () => {
    throw new Error(`new logistics operation persisted timeout|createStatus=${createOperationStatus}`);
  });
};

const runFlowAudit = async ({ baseUrl, seed }) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const report = {
    baseUrl,
    flows: [],
    failedFlows: 0,
    failures: [],
  };

  const executeFlow = async (name, handler) => {
    const page = await context.newPage();
    const startedAt = Date.now();
    try {
      await Promise.race([
        handler(page),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`flow_timeout:${name}`)), FLOW_TIMEOUT_MS),
        ),
      ]);
      report.flows.push({
        name,
        status: 'passed',
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      report.flows.push({
        name,
        status: 'failed',
        durationMs: Date.now() - startedAt,
      });
      report.failedFlows += 1;
      report.failures.push({
        flow: name,
        issue: compactError(error.message || 'flow_failed'),
      });
    } finally {
      await page.close().catch(() => undefined);
    }
  };

  await executeFlow('login', async (page) => {
    await login(page, baseUrl);
  });

  await executeFlow('operations_wizard_finalize', async (page) => {
    await runOperationWizardFlow({
      page,
      baseUrl,
      userId: seed.userId,
      clientId: seed.clientId,
    });
  });

  await executeFlow('transfer_pesos_end_to_end', async (page) => {
    await runTransferFlow({ page, baseUrl });
  });

  await executeFlow('treasury_register_and_reconcile', async (page) => {
    await runTreasuryFlow({
      page,
      baseUrl,
      seedOperationId: seed.seedOperationId,
    });
  });

  await executeFlow('receptions_confirm_omit_revert', async (page) => {
    await runReceptionsFlow({
      page,
      baseUrl,
      receptionOrderId: seed.receptionOrderId,
    });
  });

  await executeFlow('logistics_new_movement_registration', async (page) => {
    await runLogisticsFlow({ page, baseUrl });
  });

  await browser.close();
  return report;
};

const main = async () => {
  let mongoServer;
  let server;
  try {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(mongoServer.getUri('finatech-flow-audit'));

    const user = await ensureAuditUser();
    const client = await createSeedClient();
    const seedTransaction = await createSeedTransaction(user._id, client._id, 'SEED001');
    await seedCurrentAccountCandidate({
      userId: user._id,
      clientId: client._id,
      transaction: seedTransaction,
    });
    const receptionOrder = await seedReceptionOrder({
      userId: user._id,
      client,
      transaction: seedTransaction,
    });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const report = await runFlowAudit({
      baseUrl,
      seed: {
        userId: user._id.toString(),
        clientId: client._id.toString(),
        receptionOrderId: receptionOrder._id.toString(),
        seedOperationId: seedTransaction._id.toString(),
      },
    });

    console.log('FLOW_AUDIT_REPORT_START');
    console.log(JSON.stringify(report, null, 2));
    console.log('FLOW_AUDIT_REPORT_END');

    if (report.failedFlows > 0) {
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
  console.error('flow_audit_failed', error);
  process.exit(1);
});

