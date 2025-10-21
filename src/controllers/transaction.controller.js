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
    const transaction = await getTransactionDraft(id);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
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

module.exports = {
  createDraft,
  getDraft,
  updateDraftData,
  updateSettlement,
  advanceDraftStep,
  finalizeDraft,
};
