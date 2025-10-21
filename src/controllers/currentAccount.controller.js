const {
  getCurrentAccountSummary,
  listCurrentAccountMovements,
  listContactBalancesDetailed,
  getContactBalanceDetail,
} = require('../services/currentAccount.service');

const summary = async (req, res, next) => {
  try {
    const { topContacts } = req.query;
    const data = await getCurrentAccountSummary({ topContacts });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const movements = async (req, res, next) => {
  try {
    const { ledger, currency, limit, skip } = req.query;
    const data = await listCurrentAccountMovements({ ledger, currency, limit, skip });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const listContacts = async (req, res, next) => {
  try {
    const {
      currency,
      contactType,
      status,
      balance,
      sortBy,
      sortDirection,
      page,
      limit,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const data = await listContactBalancesDetailed({
      currency,
      contactType,
      status,
      balanceSign: balance,
      sortBy,
      sortDirection,
      page,
      limit,
      search,
      dateFrom,
      dateTo,
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const contactDetail = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const {
      currency,
      type,
      state,
      operationSource,
      sortBy,
      sortDirection,
      page,
      limit,
      dateFrom,
      dateTo,
    } = req.query;

    const data = await getContactBalanceDetail({
      contactId,
      currency,
      operationType: type,
      operationSource,
      state,
      sortBy,
      sortDirection,
      page,
      limit,
      dateFrom,
      dateTo,
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summary,
  movements,
  listContacts,
  contactDetail,
};
