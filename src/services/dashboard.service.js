const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransferOperation = require('../models/TransferOperation');
const Client = require('../models/Client');
const { getLatestMarketRate } = require('./marketRate.service');

const TYPE_BADGE_CLASS = {
  Compra:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success bg-opacity-10 text-success',
  Venta:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary bg-opacity-10 text-primary',
  Liquidación:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800',
  Transferencia:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
};

const STATUS_MAP = {
  confirmed: {
    label: 'Completada',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
  },
  completed: {
    label: 'Completada',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
  },
  registered: {
    label: 'Registrada',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
  },
  pending: {
    label: 'Pendiente',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700',
  },
  cancelled: {
    label: 'Cancelada',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700',
  },
  voided: {
    label: 'Cancelada',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700',
  },
  draft: {
    label: 'Borrador',
    className:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600',
  },
};

const DEFAULT_STATUS = {
  label: 'Registrada',
  className:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700',
};

const formatCurrencyLabel = (amount, currencyInput) => {
  if (!Number.isFinite(Number(amount))) {
    return '—';
  }

  const currency = String(currencyInput || 'ARS').toUpperCase();
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formatted = formatter.format(Math.abs(Number(amount)));
  if (currency === 'ARS' || currency === 'AR$') {
    formatted = formatted.replace(/\s+/g, '').replace('AR$', '$').replace('ARS', '$');
  } else if (currency === 'USD') {
    formatted = formatted.replace('US$', 'USD').replace(/\s+/g, ' ');
    if (!formatted.startsWith('USD')) {
      formatted = `USD ${formatted.trim()}`;
    }
  }

  return formatted;
};

const formatRateLabel = (rate) => {
  const numericRate = Number(rate);
  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    return '—';
  }

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numericRate).replace(/\s+/g, '').replace('AR$', '$');
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const absolute = Math.abs(value);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(absolute);
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatted}%`;
};

const formatMarginLabel = (percentage) => {
  if (!Number.isFinite(Number(percentage))) {
    return {
      label: '—',
      className: 'text-gray-600',
    };
  }

  const numeric = Number(percentage);
  const label = formatPercentage(numeric);
  let className = 'text-gray-600';
  if (numeric > 0.0001) {
    className = 'text-success font-medium';
  } else if (numeric < -0.0001) {
    className = 'text-danger font-medium';
  }

  return { label, className };
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getInitials = (name) => {
  if (!name) {
    return 'FT';
  }
  const parts = String(name)
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) {
    return 'FT';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const sumByMethod = (lines) =>
  (Array.isArray(lines) ? lines : []).reduce((acc, line) => {
    const method = (line?.method || '').toUpperCase();
    const amount = Math.abs(Number(line?.amount || 0));
    if (!method) {
      return acc;
    }
    acc[method] = (acc[method] || 0) + amount;
    return acc;
  }, {});

const computeTransferFinancials = (operation, marketRate) => {
  const totals = sumByMethod(operation?.distributionLines || []);
  const baseCurrency = String(operation?.currency || 'ARS').toUpperCase();
  const totalAmount = Math.abs(Number(operation?.totalAmount || 0));

  if (baseCurrency && !totals[baseCurrency]) {
    totals[baseCurrency] = (totals[baseCurrency] || 0) + totalAmount;
  }

  const arsAmount = totals.ARS ?? (baseCurrency === 'ARS' ? totalAmount : 0);
  const usdAmount = totals.USD ?? (baseCurrency === 'USD' ? totalAmount : 0);

  let receivesCurrency;
  let paysCurrency;
  let receivesAmount = 0;
  let paysAmount = 0;

  const typeLabel = getTransferTypeLabel(operation);

  if (typeLabel === 'Venta') {
    receivesCurrency = 'ARS';
    paysCurrency = 'USD';
    receivesAmount = arsAmount || (usdAmount && marketRate ? usdAmount * marketRate : totalAmount);
    paysAmount = usdAmount || (receivesAmount && marketRate ? receivesAmount / marketRate : 0);
  } else {
    receivesCurrency = 'USD';
    paysCurrency = 'ARS';
    paysAmount = arsAmount || (usdAmount && marketRate ? usdAmount * marketRate : totalAmount);
    receivesAmount = usdAmount || (paysAmount && marketRate ? paysAmount / marketRate : 0);
  }

  const effectiveRate =
    paysCurrency === 'ARS' && receivesCurrency === 'USD' && receivesAmount
      ? paysAmount / receivesAmount
      : receivesCurrency === 'ARS' && paysCurrency === 'USD' && paysAmount
      ? receivesAmount / paysAmount
      : marketRate || null;

  return {
    receivesText: formatCurrencyLabel(receivesAmount, receivesCurrency),
    paysText: formatCurrencyLabel(paysAmount, paysCurrency),
    effectiveRate: Number.isFinite(effectiveRate) ? effectiveRate : null,
  };
};

const calculateMargin = (effectiveRate, marketRate, typeLabel) => {
  if (!effectiveRate || !marketRate || Number.isNaN(effectiveRate) || effectiveRate <= 0) {
    return {
      marginLabel: '—',
      marginClassName: 'text-gray-600',
    };
  }

  const rawMargin = (marketRate - effectiveRate) / marketRate;
  const adjustedMargin = typeLabel === 'Compra' ? rawMargin : -rawMargin;
  const { label, className } = formatMarginLabel(adjustedMargin * 100);
  return {
    marginLabel: label,
    marginClassName: className,
  };
};

const getTransferTypeLabel = (operation) => {
  if (operation?.operationCode && operation.operationCode.includes('LIQ')) {
    return 'Liquidación';
  }
  return String(operation?.direction || '').toLowerCase() === 'incoming' ? 'Compra' : 'Venta';
};

const buildTransferClientIdentifier = (operation) => {
  if (operation?.operationCode) {
    return `Operación ${operation.operationCode}`;
  }
  return 'CUIT: —';
};

const pickTransactionDate = (transaction) =>
  transaction?.completedAt || transaction?.updatedAt || transaction?.createdAt || new Date();

const pickTransferDate = (operation) => operation?.confirmedAt || operation?.createdAt || new Date();

const mapTransactionOperation = (transaction, clientMap) => {
  const clientId = transaction?.client ? transaction.client.toString() : null;
  const clientDoc = clientId ? clientMap.get(clientId) : null;
  const clientName = clientDoc?.shortName || clientDoc?.fullName || 'Cliente sin nombre';
  const clientIdentifier = transaction?.operationCode
    ? `Operación ${transaction.operationCode}`
    : clientDoc?.cuit
    ? `CUIT: ${clientDoc.cuit}`
    : 'CUIT: —';

  const typeLabel = transaction?.type === 'sell' ? 'Venta' : 'Compra';
  const typeClassName = TYPE_BADGE_CLASS[typeLabel] || TYPE_BADGE_CLASS.Compra;

  const receivesText = formatCurrencyLabel(transaction?.incomingAmount, transaction?.incomingAsset?.code);
  const paysText = formatCurrencyLabel(transaction?.outgoingAmount, transaction?.outgoingAsset?.code);

  const rateLabel = formatRateLabel(transaction?.apr);
  const { label: marginLabel, className: marginClassName } = formatMarginLabel(
    Number.isFinite(Number(transaction?.marginPercentage))
      ? Number(transaction.marginPercentage)
      : null
  );

  const statusNormalized = String(transaction?.status || '').toLowerCase();
  const statusInfo = STATUS_MAP[statusNormalized] || DEFAULT_STATUS;
  const isEditable = statusNormalized === 'draft' || statusNormalized === 'pending';

  const draftTypeParam = typeLabel === 'Venta' ? 'venta' : 'compra';

  const createdAt = pickTransactionDate(transaction);

  return {
    id: transaction?._id ? transaction._id.toString() : null,
    source: 'transaction',
    createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    dateLabel: formatDateTime(createdAt),
    clientName,
    clientIdentifier,
    clientInitials: getInitials(clientName),
    typeLabel,
    typeClassName,
    receivesText,
    paysText,
    rateLabel,
    marginLabel,
    marginClassName,
    statusLabel: statusInfo.label,
    statusClassName: statusInfo.className,
    detailPath: transaction?._id ? `/dashboard/operaciones/detalle/${transaction._id.toString()}` : null,
    editPath:
      isEditable && transaction?._id
        ? `/dashboard/operaciones/nueva?draftId=${transaction._id.toString()}&tipo=${draftTypeParam}`
        : null,
    isEditable,
  };
};

const mapTransferOperation = (operation, clientMap, marketRate) => {
  const typeLabel = getTransferTypeLabel(operation);
  const typeClassName = TYPE_BADGE_CLASS[typeLabel] || TYPE_BADGE_CLASS.Transferencia;

  const contactNames = (operation?.distributionLines || []).map((line) => {
    const contactId = line?.contact?._id || line?.contact || line?.contactId;
    if (!contactId) {
      return null;
    }
    const key = mongoose.Types.ObjectId.isValid(contactId)
      ? new mongoose.Types.ObjectId(contactId).toString()
      : String(contactId);
    const contactDoc = clientMap.get(key);
    return contactDoc?.shortName || contactDoc?.fullName || null;
  });

  const filteredNames = contactNames.filter((name) => Boolean(name));
  let clientName = 'Cliente sin asignar';
  if (filteredNames.length === 1) {
    clientName = filteredNames[0];
  } else if (filteredNames.length > 1) {
    clientName = `${filteredNames[0]} y ${filteredNames.length - 1} más`;
  }

  const { receivesText, paysText, effectiveRate } = computeTransferFinancials(operation, marketRate);
  const { marginLabel, marginClassName } = calculateMargin(effectiveRate, marketRate, typeLabel);

  const statusNormalized = String(operation?.status || '').toLowerCase();
  const statusInfo = STATUS_MAP[statusNormalized] || DEFAULT_STATUS;
  const isEditable = !['confirmed', 'completed', 'voided', 'cancelled'].includes(statusNormalized);

  const createdAt = pickTransferDate(operation);

  return {
    id: operation?._id ? operation._id.toString() : null,
    source: 'transfer',
    createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    dateLabel: formatDateTime(createdAt),
    clientName,
    clientIdentifier: buildTransferClientIdentifier(operation),
    clientInitials: getInitials(clientName),
    typeLabel,
    typeClassName,
    receivesText,
    paysText,
    rateLabel: formatRateLabel(effectiveRate),
    marginLabel,
    marginClassName,
    statusLabel: statusInfo.label,
    statusClassName: statusInfo.className,
    detailPath: operation?._id
      ? `/dashboard/operaciones/transfer-pesos/detalle/${operation._id.toString()}`
      : null,
    editPath: null,
    isEditable: Boolean(isEditable && operation?._id),
  };
};

const listRecentOperations = async ({ limit } = {}) => {
  const numericLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const fetchLimit = numericLimit * 2;

  const [transactions, transfers, latestRate] = await Promise.all([
    Transaction.find({ status: { $nin: ['draft'] } })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(fetchLimit)
      .select({
        client: 1,
        type: 1,
        status: 1,
        incomingAsset: 1,
        outgoingAsset: 1,
        incomingAmount: 1,
        outgoingAmount: 1,
        marginPercentage: 1,
        apr: 1,
        operationCode: 1,
        completedAt: 1,
        updatedAt: 1,
        createdAt: 1,
      })
      .lean(),
    TransferOperation.find({})
      .sort({ confirmedAt: -1, createdAt: -1 })
      .limit(fetchLimit)
      .select({
        operationCode: 1,
        movementType: 1,
        direction: 1,
        currency: 1,
        totalAmount: 1,
        distributionLines: 1,
        status: 1,
        confirmedAt: 1,
        createdAt: 1,
      })
      .lean(),
    getLatestMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' }).catch(() => null),
  ]);

  const clientIds = new Set();

  transactions.forEach((tx) => {
    if (tx?.client && mongoose.Types.ObjectId.isValid(tx.client)) {
      clientIds.add(tx.client.toString());
    }
  });

  transfers.forEach((op) => {
    (op?.distributionLines || []).forEach((line) => {
      const contactId = line?.contact?._id || line?.contact || line?.contactId;
      if (contactId && mongoose.Types.ObjectId.isValid(contactId)) {
        clientIds.add(new mongoose.Types.ObjectId(contactId).toString());
      }
    });
  });

  const clients = clientIds.size
    ? await Client.find({ _id: { $in: Array.from(clientIds) } })
        .select({ fullName: 1, shortName: 1, contactType: 1, cuit: 1 })
        .lean()
    : [];

  const clientMap = new Map(clients.map((client) => [client._id.toString(), client]));
  const marketRate = Number(latestRate?.rate) || null;

  const normalizedTransactions = transactions.map((tx) => mapTransactionOperation(tx, clientMap));
  const normalizedTransfers = transfers.map((op) => mapTransferOperation(op, clientMap, marketRate));

  const merged = [...normalizedTransactions, ...normalizedTransfers]
    .filter((entry) => entry?.id)
    .sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, numericLimit);

  return merged;
};

module.exports = {
  listRecentOperations,
};

