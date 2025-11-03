const TreasuryEvent = require('../models/TreasuryEvent');

const buildDistributionSummary = (lines = []) =>
  lines.map((line) => ({
    contact: line.contact,
    method: line.method,
    amount: line.amount,
    amountArs: line.amountArs == null ? line.amount : line.amountArs,
  }));

const createTransferOperationEvents = async (operationDocument, { session } = {}) => {
  if (!operationDocument || !operationDocument._id) {
    return [];
  }

  const baseOperation = {
    id: operationDocument._id,
    code: operationDocument.operationCode,
    movementType: operationDocument.movementType,
    direction: operationDocument.direction,
    currency: operationDocument.currency,
    amount: operationDocument.totalAmount,
    distributionSummary: buildDistributionSummary(operationDocument.distributionLines),
  };

  const events = [
    {
      type: 'current_account_update',
      operation: baseOperation,
      payload: {
        contacts: baseOperation.distributionSummary.map((summary) => ({
          contact: summary.contact,
          method: summary.method,
          amount: summary.amount,
          amountArs: summary.amountArs,
        })),
      },
    },
    {
      type: 'weighted_average_update',
      operation: baseOperation,
      payload: {
        movementType: baseOperation.movementType,
        direction: baseOperation.direction,
        amount: baseOperation.amount,
        currency: baseOperation.currency,
      },
    },
  ];

  const created = await TreasuryEvent.insertMany(events, { session });
  return created.map((event) => event.toObject());
};

module.exports = {
  createTransferOperationEvents,
};
