import React from 'react';

interface InlineItemProps {
  label: string;
  value: React.ReactNode;
}

const InlineItem: React.FC<InlineItemProps> = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="font-medium text-text-primary text-base">{value}</div>
  </div>
);

interface SummaryCardProps {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, subTitle, children, onEdit }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {subTitle && <p className="text-sm text-gray-500">{subTitle}</p>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-primary hover:text-blue-700 text-sm flex items-center"
        >
          <i className="fa-solid fa-pen-to-square mr-1" />
          Editar
        </button>
      )}
    </div>
    <div>{children}</div>
  </div>
);

interface OperationSummaryProps {
  clientName: string;
  clientDocument?: string | null;
  contact?: string | null;
  type: 'buy' | 'sell';
  incomingAssetLabel: string;
  outgoingAssetLabel: string;
  incomingAmount: number;
  outgoingAmount: number;
  incomingCurrency: string;
  outgoingCurrency: string;
  apr: number;
  marketApr: number;
  marginPercentage: number;
  clientLastMargin?: number | null;
  settlementMode: 'simple' | 'compound';
  settlementSimpleMethod?: string | null;
  settlementLines: Array<{
    method: string;
    allocationType: 'percentage' | 'amount';
    value: number;
    computedPercentage: number;
  }>;
  lastUpdated?: string;
  onEditStep1?: () => void;
  onEditStep2?: () => void;
}

const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatCurrency = (value: number, currency: string) => {
  if (!Number.isFinite(value)) {
    return `0 ${currency}`;
  }
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
};

const formatDate = (iso?: string) => {
  if (!iso) {
    return '—';
  }
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
};

const marginToneClasses = (value: number) => {
  if (value > 0) {
    return 'text-success';
  }
  if (value < 0) {
    return 'text-danger';
  }
  return 'text-gray-600';
};

const SettlementSimple: React.FC<{ method?: string | null; amountLabel: string }> = ({
  method,
  amountLabel,
}) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-blue-800">
          Método de liquidación
        </div>
        <div className="text-lg font-semibold text-blue-900">
          {method || '—'}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-blue-800">Monto</div>
        <div className="text-lg font-semibold text-blue-900">{amountLabel}</div>
      </div>
    </div>
  </div>
);

const SettlementCompound: React.FC<{
  lines: OperationSummaryProps['settlementLines'];
  amountLabel: string;
}> = ({ lines, amountLabel }) => (
  <div className="space-y-4">
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">Método</div>
          <div className="col-span-3">Asignación</div>
          <div className="col-span-3">Valor</div>
          <div className="col-span-2">Equivalente</div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {lines.map((line) => (
          <div key={`${line.method}-${line.value}-${line.computedPercentage}`} className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-sm text-gray-700">
              <div className="col-span-4 font-medium text-text-primary">{line.method}</div>
              <div className="col-span-3">
                {line.allocationType === 'percentage'
                  ? `${line.value.toFixed(1)}%`
                  : `Monto fijo (${line.value.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })})`}
              </div>
              <div className="col-span-3">{line.value.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</div>
              <div className="col-span-2 font-semibold text-text-primary">
                {line.computedPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-center justify-between">
      <div className="flex items-center">
        <i className="fa-solid fa-info-circle mr-2" />
        <span>La liquidación alcanza el 100% del monto acordado.</span>
      </div>
      <div className="font-semibold text-blue-900">{amountLabel}</div>
    </div>
  </div>
);

export const WizardCompleteSummary: React.FC<OperationSummaryProps> = ({
  clientName,
  clientDocument,
  contact,
  type,
  clientLastMargin,
  incomingAssetLabel,
  outgoingAssetLabel,
  incomingAmount,
  outgoingAmount,
  incomingCurrency,
  outgoingCurrency,
  apr,
  marketApr,
  marginPercentage,
  settlementMode,
  settlementSimpleMethod,
  settlementLines,
  lastUpdated,
  onEditStep1,
  onEditStep2,
}) => {
  const incomingLabel = formatCurrency(incomingAmount, incomingCurrency);
  const outgoingLabel = formatCurrency(outgoingAmount, outgoingCurrency);

  const summaryTypeLabel = type === 'buy' ? 'Compra' : 'Venta';
  const lastMarginLabel =
    typeof clientLastMargin === 'number' && Number.isFinite(clientLastMargin)
      ? formatPercentage(clientLastMargin)
      : '—';

  return (
    <div id="summary-cards" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <SummaryCard
        title="Datos de la operación"
        subTitle={`Última actualización: ${formatDate(lastUpdated)}`}
        onEdit={onEditStep1}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InlineItem label="Cliente" value={clientName} />
          {clientDocument && <InlineItem label="Documento" value={clientDocument} />}
          <InlineItem label="Contacto" value={contact || '—'} />
          <InlineItem label="Tipo" value={summaryTypeLabel} />
          <InlineItem label="Último margen (cliente)" value={lastMarginLabel} />
          <InlineItem
            label={type === 'buy' ? 'Entra' : 'Sale'}
            value={`${incomingLabel} (${incomingAssetLabel})`}
          />
          <InlineItem
            label={type === 'buy' ? 'Sale' : 'Entra'}
            value={`${outgoingLabel} (${outgoingAssetLabel})`}
          />
          <InlineItem
            label="TC Operación / Mercado"
            value={`${apr.toFixed(2)} / ${marketApr.toFixed(2)}`}
          />
          <InlineItem
            label="Margen"
            value={
              <span className={`font-semibold ${marginToneClasses(marginPercentage)}`}>
                {formatPercentage(marginPercentage)}
              </span>
            }
          />
        </div>
      </SummaryCard>

      <SummaryCard
        title="Liquidación"
        subTitle={`Modalidad ${settlementMode === 'simple' ? 'simple' : 'transferencias en pesos'}`}
        onEdit={onEditStep2}
      >
        {settlementMode === 'simple' ? (
          <SettlementSimple method={settlementSimpleMethod} amountLabel={incomingLabel} />
        ) : (
          <SettlementCompound lines={settlementLines} amountLabel={incomingLabel} />
        )}
      </SummaryCard>

      <SummaryCard
        title="Resumen financiero"
        subTitle="Balance de la operación"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-xs uppercase tracking-wide mb-2">
              <i className="fa-solid fa-arrow-down mr-2" />
              Entra
            </div>
            <div className="text-lg font-semibold text-text-primary">{incomingLabel}</div>
            <div className="text-xs text-gray-500">{incomingAssetLabel}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-xs uppercase tracking-wide mb-2">
              <i className="fa-solid fa-arrow-up mr-2" />
              Sale
            </div>
            <div className="text-lg font-semibold text-text-primary">{outgoingLabel}</div>
            <div className="text-xs text-gray-500">{outgoingAssetLabel}</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center">
            <i className="fa-solid fa-circle-info mr-2" />
            Recordá compensar la operación en Tesorería una vez acreditados los fondos.
          </div>
        </div>
      </SummaryCard>

      <SummaryCard
        title="Documentación y seguimiento"
        subTitle="Checklist previo a confirmar"
      >
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start">
            <i className="fa-solid fa-circle-check text-success mr-2 mt-1" />
            <span>Documentación del cliente verificada y vigente.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-circle-check text-success mr-2 mt-1" />
            <span>Margen dentro del rango permitido para el operador.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-circle-check text-success mr-2 mt-1" />
            <span>Liquidación totaliza el 100% del monto de la operación.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-circle-check text-success mr-2 mt-1" />
            <span>Cliente sin incidencias pendientes en Tesorería.</span>
          </li>
        </ul>
      </SummaryCard>
    </div>
  );
};
