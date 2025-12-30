import React from 'react';

interface Props {
  arsRate: string;
  onArsRateChange: (value: string) => void;
  arsMarketRate: string;
  onArsMarketRateChange: (value: string) => void;
  assetRate: string;
  onAssetRateChange: (value: string) => void;
  assetMarketRate: string;
  onAssetMarketRateChange: (value: string) => void;
  assetLabel: string;
  showSecondaryRates?: boolean;
  disabled?: boolean;
  disableMarketRates?: boolean;
  disablePrimaryRates?: boolean;
}

export const ExchangeRatesSection: React.FC<Props> = ({
  arsRate,
  onArsRateChange,
  arsMarketRate,
  onArsMarketRateChange,
  assetRate,
  onAssetRateChange,
  assetMarketRate,
  onAssetMarketRateChange,
  assetLabel,
  showSecondaryRates = true,
  disabled = false,
  disableMarketRates = false,
  disablePrimaryRates = false,
}) => (
  <div id="exchange-rates" className="mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <span className="break-words leading-tight block">TC operacion USD a ARS</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={arsRate}
          onChange={(event) => onArsRateChange(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled || disablePrimaryRates}
          autoComplete="off"
          placeholder="0,00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <span className="break-words leading-tight block">TC mercado USD a ARS</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={arsMarketRate}
          onChange={(event) => onArsMarketRateChange(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled || disablePrimaryRates || disableMarketRates}
          autoComplete="off"
          placeholder="0,00"
        />
      </div>
    </div>
    {showSecondaryRates && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="leading-tight">TC operacion {assetLabel} a USD</span>
              <i
                className="fa-solid fa-info-circle text-gray-400 cursor-help shrink-0"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel} a USD y USD a ARS mercado.`}
              />
            </div>
          </label>
          <div className="flex items-start gap-2 mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={assetRate}
              onChange={(event) => onAssetRateChange(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={disabled}
              autoComplete="off"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="leading-tight">TC mercado {assetLabel} a USD</span>
              <i
                className="fa-solid fa-info-circle text-gray-400 cursor-help shrink-0"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel} a USD y USD a ARS mercado.`}
              />
            </div>
          </label>
          <div className="flex items-start gap-2 mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={assetMarketRate}
              onChange={(event) => onAssetMarketRateChange(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={disabled || disableMarketRates}
              autoComplete="off"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
    )}
  </div>
);
