const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const {
  createTransactionDraft,
  getTransactionDraft,
  buildWizardDraftResponse,
  updateTransactionDraft,
  updateTransactionSettlement,
  advanceTransactionStep,
  finalizeTransaction,
  voidTransaction,
} = require('../services/transaction.service');

const createDraft = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const context = {
      userId: req.user?._id || req.user?.id || null,
    };

    const transaction = await createTransactionDraft(req.body, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

const getDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      throw new AppError('Autenticación requerida', 401);
    }

    const permissions = Array.isArray(req.user?.permissions)
      ? req.user.permissions.map((perm) => (typeof perm === 'string' ? perm.toLowerCase() : perm))
      : [];
    const canViewAll = permissions.some((perm) => ['manage-operations', 'manage-treasury'].includes(perm));

    const transaction = await getTransactionDraft(id, userId, { bypassOwnership: canViewAll });
    if (!transaction) {
      throw new AppError('Transacción no encontrada', 404);
    }
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const updateDraftData = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const context = {
      userId: req.user?._id || req.user?.id || null,
    };
    const transaction = await updateTransactionDraft(id, req.body, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const updateSettlement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = {
      userId: req.user?._id || req.user?.id || null,
    };
    const transaction = await updateTransactionSettlement(id, req.body, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const advanceDraftStep = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { step } = req.body;
    const context = {
      userId: req.user?._id || req.user?.id || null,
    };
    const transaction = await advanceTransactionStep(id, step, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const finalizeDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = {
      userId: req.user?._id || req.user?.id || null,
    };
    const transaction = await finalizeTransaction(id, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const voidDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const context = {
      userId: req.user?._id || req.user?.id || null,
    };
    const transaction = await voidTransaction(id, reason, context);
    const payload = await buildWizardDraftResponse(transaction);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDraft,
  getDraft,
  updateDraftData,
  updateSettlement,
  advanceDraftStep,
  finalizeDraft,
  voidDraft,
};
